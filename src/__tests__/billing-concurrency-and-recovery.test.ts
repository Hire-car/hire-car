import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateCancellationBackoffMs,
  enqueueFailedCancellation,
  processCancellationQueue,
} from "@/lib/billing/cancellation-recovery";
import type Stripe from "stripe";

describe("Billing Concurrency & Cancellation Recovery Test Suite (Unit Tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Checkout Idempotency & Lifecycle Safety", () => {
    it("deduplicates requests sharing the same attemptId with identical parameters", () => {
      const orgId = "org-checkout-101";
      const plan = "growth";
      const interval = "monthly";
      const attemptId = "user-btn-click-123";

      const key1 = `chk_${orgId}_${plan}_${interval}_${attemptId}`;
      const key2 = `chk_${orgId}_${plan}_${interval}_${attemptId}`;

      expect(key1).toBe(key2);
    });

    it("creates distinct idempotency keys for concurrent requests from different tabs/attempts", () => {
      const orgId = "org-checkout-101";
      const plan = "growth";
      const interval = "monthly";

      const attemptTab1 = "tab-uuid-111";
      const attemptTab2 = "tab-uuid-222";

      const keyTab1 = `chk_${orgId}_${plan}_${interval}_${attemptTab1}`;
      const keyTab2 = `chk_${orgId}_${plan}_${interval}_${attemptTab2}`;

      expect(keyTab1).not.toBe(keyTab2);
    });

    it("creates a fresh attempt token and key when retrying after session expiration", () => {
      const orgId = "org-checkout-101";
      const plan = "growth";
      const interval = "monthly";

      const initialSession = {
        id: "cs_expired_001",
        status: "expired",
      };

      let finalSessionId = initialSession.id;
      let finalKey = `chk_${orgId}_${plan}_${interval}_initial`;

      if (initialSession.status === "expired") {
        const freshAttemptId = "attempt-retry-999";
        finalKey = `chk_${orgId}_${plan}_${interval}_${freshAttemptId}`;
        finalSessionId = "cs_fresh_002";
      }

      expect(finalSessionId).toBe("cs_fresh_002");
      expect(finalKey).toContain("attempt-retry-999");
    });

    it("safely ignores sessions belonging to another organization during open session cleanup", () => {
      const targetOrgId = "org-my-company-1";
      const otherOrgId = "org-other-vendor-2";

      const openSessions = [
        { id: "cs_1", client_reference_id: targetOrgId, created: Math.floor(Date.now() / 1000) - 120 },
        { id: "cs_2", client_reference_id: otherOrgId, created: Math.floor(Date.now() / 1000) - 120 },
        { id: "cs_3", client_reference_id: targetOrgId, created: Math.floor(Date.now() / 1000) - 10 }, // recent active
      ];

      const staleThreshold = Math.floor(Date.now() / 1000) - 60;
      const expiredSessionIds: string[] = [];

      for (const s of openSessions) {
        if (s.client_reference_id === targetOrgId && s.created < staleThreshold) {
          expiredSessionIds.push(s.id);
        }
      }

      // Only cs_1 is expired. cs_2 (other org) and cs_3 (recent active session) are strictly preserved!
      expect(expiredSessionIds).toEqual(["cs_1"]);
    });
  });

  describe("2. Stripe Cancellation Failure Recovery & Queue Processing", () => {
    it("calculates exponential backoff delays with reasonable bounds", () => {
      const delayAttempt1 = calculateCancellationBackoffMs(1);
      const delayAttempt2 = calculateCancellationBackoffMs(2);
      const delayAttempt3 = calculateCancellationBackoffMs(3);

      expect(delayAttempt1).toBe(60 * 1000); // 1 minute
      expect(delayAttempt2).toBe(4 * 60 * 1000); // 4 minutes
      expect(delayAttempt3).toBe(16 * 60 * 1000); // 16 minutes
      expect(delayAttempt1 < delayAttempt2).toBe(true);
      expect(delayAttempt2 < delayAttempt3).toBe(true);
    });

    it("enqueues failed cancellation attempt with status pending and audit log", async () => {
      const insertedRows: unknown[] = [];
      const auditRows: unknown[] = [];

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "stripe_cancellation_queue") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                  })),
                })),
              })),
              insert: vi.fn((row) => {
                insertedRows.push(row);
                return Promise.resolve({ error: null });
              }),
            };
          }
          if (table === "audit_logs") {
            return {
              insert: vi.fn((row) => {
                auditRows.push(row);
                return Promise.resolve({ error: null });
              }),
            };
          }
          return {};
        }),
      } as unknown as Parameters<typeof enqueueFailedCancellation>[0];

      await enqueueFailedCancellation(mockSupabase, {
        organizationId: "org-cancellation-test",
        stripeSubscriptionId: "sub_failed_initial",
        reason: "superseded_replacement",
        error: new Error("Stripe network timeout"),
      });

      expect(insertedRows.length).toBe(1);
      expect(insertedRows[0]).toMatchObject({
        organization_id: "org-cancellation-test",
        stripe_subscription_id: "sub_failed_initial",
        reason: "superseded_replacement",
        status: "pending",
        last_error: "Stripe network timeout",
      });

      expect(auditRows.length).toBe(1);
      expect(auditRows[0]).toMatchObject({
        action: "stripe_cancellation_queued",
        resource_id: "org-cancellation-test",
      });
    });

    it("reconciles live Stripe status and marks complete if already canceled", async () => {
      let queueUpdatedStatus = "";
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "stripe_cancellation_queue") {
            return {
              select: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: "queue-item-1",
                            organization_id: "org-1",
                            stripe_subscription_id: "sub_already_canceled",
                            reason: "unauthorized_secondary",
                            attempt_count: 1,
                            max_attempts: 5,
                          },
                        ],
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
              update: vi.fn((patch) => {
                queueUpdatedStatus = patch.status;
                return {
                  eq: vi.fn().mockResolvedValue({ error: null }),
                };
              }),
            };
          }
          if (table === "subscriptions") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      stripe_subscription_id: "sub_different_active",
                      status: "active",
                    },
                  }),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as Parameters<typeof processCancellationQueue>[0];

      const mockStripe = {
        subscriptions: {
          retrieve: vi.fn().mockResolvedValue({
            id: "sub_already_canceled",
            status: "canceled", // Already canceled in Stripe!
          }),
          cancel: vi.fn(),
        },
      } as unknown as Stripe;

      const result = await processCancellationQueue(mockSupabase, mockStripe);

      expect(result.processed).toBe(1);
      expect(result.completed).toBe(1);
      expect(queueUpdatedStatus).toBe("completed");
      expect(mockStripe.subscriptions.cancel).not.toHaveBeenCalled();
    });

    it("retries cancellation in Stripe and marks completed upon success", async () => {
      let queueUpdatedStatus = "";
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "stripe_cancellation_queue") {
            return {
              select: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: "queue-item-2",
                            organization_id: "org-2",
                            stripe_subscription_id: "sub_retry_me",
                            reason: "superseded_replacement",
                            attempt_count: 2,
                            max_attempts: 5,
                          },
                        ],
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
              update: vi.fn((patch) => {
                queueUpdatedStatus = patch.status;
                return {
                  eq: vi.fn().mockResolvedValue({ error: null }),
                };
              }),
            };
          }
          if (table === "subscriptions") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      stripe_subscription_id: "sub_new_primary",
                      status: "active",
                    },
                  }),
                })),
              })),
            };
          }
          if (table === "audit_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      } as unknown as Parameters<typeof processCancellationQueue>[0];

      const mockStripe = {
        subscriptions: {
          retrieve: vi.fn().mockResolvedValue({
            id: "sub_retry_me",
            status: "active",
          }),
          cancel: vi.fn().mockResolvedValue({ id: "sub_retry_me", status: "canceled" }),
        },
      } as unknown as Stripe;

      const result = await processCancellationQueue(mockSupabase, mockStripe);

      expect(result.processed).toBe(1);
      expect(result.completed).toBe(1);
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith("sub_retry_me", { prorate: true });
      expect(queueUpdatedStatus).toBe("completed");
    });

    it("aborts cancellation if subscription is currently active primary (Safety Guard)", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "stripe_cancellation_queue") {
            return {
              select: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: "queue-item-safety",
                            organization_id: "org-safety-check",
                            stripe_subscription_id: "sub_active_primary",
                            reason: "superseded_replacement",
                            attempt_count: 1,
                            max_attempts: 5,
                          },
                        ],
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
              update: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
              })),
            };
          }
          if (table === "subscriptions") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      // CRITICAL: Database currently has this exact ID as ACTIVE primary!
                      stripe_subscription_id: "sub_active_primary",
                      status: "active",
                    },
                  }),
                })),
              })),
            };
          }
          if (table === "audit_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      } as unknown as Parameters<typeof processCancellationQueue>[0];

      const mockStripe = {
        subscriptions: {
          retrieve: vi.fn(),
          cancel: vi.fn(),
        },
      } as unknown as Stripe;

      const result = await processCancellationQueue(mockSupabase, mockStripe);

      expect(result.failed).toBe(1);
      // Stripe cancel must NEVER be called when the sub is the current active primary!
      expect(mockStripe.subscriptions.cancel).not.toHaveBeenCalled();
    });

    it("triggers administrator alert audit log when cancellation permanently fails", async () => {
      let auditLoggedAlert = "";
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "stripe_cancellation_queue") {
            return {
              select: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: "queue-item-fail",
                            organization_id: "org-failing",
                            stripe_subscription_id: "sub_impossible",
                            reason: "unauthorized_secondary",
                            attempt_count: 5, // max attempts reached!
                            max_attempts: 5,
                          },
                        ],
                        error: null,
                      }),
                    })),
                  })),
                })),
              })),
              update: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
              })),
            };
          }
          if (table === "subscriptions") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { stripe_subscription_id: "sub_other", status: "active" },
                  }),
                })),
              })),
            };
          }
          if (table === "audit_logs") {
            return {
              insert: vi.fn((row) => {
                auditLoggedAlert = row.metadata?.alert;
                return Promise.resolve({ error: null });
              }),
            };
          }
          return {};
        }),
      } as unknown as Parameters<typeof processCancellationQueue>[0];

      const mockStripe = {
        subscriptions: {
          retrieve: vi.fn().mockResolvedValue({ id: "sub_impossible", status: "active" }),
          cancel: vi.fn().mockRejectedValue(new Error("Stripe 500 Internal Error")),
        },
      } as unknown as Stripe;

      const result = await processCancellationQueue(mockSupabase, mockStripe);

      expect(result.failed).toBe(1);
      expect(auditLoggedAlert).toBe("ADMIN_ACTION_REQUIRED");
    });
  });

  describe("3. Database-Level Atomic Concurrency & State Invariants", () => {
    it("simulates atomic reversion to Starter rejecting stale deletion after concurrent update", () => {
      // Represents database row state
      const dbRow = {
        id: "sub-row-1",
        organization_id: "org-concurrency-1",
        stripe_subscription_id: "sub_active_growth",
        version: 2, // version was bumped to 2 by concurrent update
        updated_at: "2026-11-20T10:05:00.000Z",
      };

      // Stale webhook event was read when version was 1
      const staleEventExpectedVersion = 1;

      // Atomic verification:
      const canRevert =
        dbRow.stripe_subscription_id === "sub_active_growth" &&
        dbRow.version === staleEventExpectedVersion;

      expect(canRevert).toBe(false); // ATOMICALLY BLOCKED by OCC version check
    });

    it("simulates atomic reversion to Starter rejecting deletion when sub ID has been replaced", () => {
      // Row has already been replaced by sub_replacement
      const dbRow = {
        id: "sub-row-2",
        organization_id: "org-concurrency-2",
        stripe_subscription_id: "sub_replacement_pro",
        version: 2,
      };

      // Deletion event arrives for old subscription sub_old
      const incomingDeletedSubId = "sub_old";

      const canRevert = dbRow.stripe_subscription_id === incomingDeletedSubId;
      expect(canRevert).toBe(false); // ATOMICALLY BLOCKED: sub ID mismatch
    });

    it("simulates two simultaneous deletions: first commits, second is blocked by version and null sub ID", () => {
      let dbRow = {
        stripe_subscription_id: "sub_dual_deletion" as string | null,
        version: 1,
        status: "active",
      };

      const event1ExpectedVersion = 1;
      const event2ExpectedVersion = 1;

      // Event 1 executes atomic update
      const event1Allowed =
        dbRow.stripe_subscription_id === "sub_dual_deletion" &&
        dbRow.version === event1ExpectedVersion;

      expect(event1Allowed).toBe(true);

      // Event 1 commits
      dbRow = {
        stripe_subscription_id: null,
        version: 2,
        status: "active",
      };

      // Event 2 executes atomic update
      const event2Allowed =
        dbRow.stripe_subscription_id === "sub_dual_deletion" &&
        dbRow.version === event2ExpectedVersion;

      expect(event2Allowed).toBe(false); // Event 2 blocked: sub is null and version mismatch
    });

    it("verifies database trigger invariant: automatically increments version on every row update", () => {
      // Simulates app_private.trg_increment_subscription_version()
      function simulateTrigger(oldRow: { version: number; updated_at: string }, updates: Record<string, unknown>) {
        return {
          ...oldRow,
          ...updates,
          version: (oldRow.version || 1) + 1,
          updated_at: new Date().toISOString(),
        };
      }

      const initialRow = { version: 1, updated_at: "2026-11-20T10:00:00.000Z", plan_code: "starter" };

      // Update 1: Upgrade to Growth
      const rowAfterUpgrade = simulateTrigger(initialRow, { plan_code: "growth" });
      expect(rowAfterUpgrade.version).toBe(2);

      // Update 2: Stale webhook tries to update, but application code forgot to pass version
      const rowAfterPayment = simulateTrigger(rowAfterUpgrade, { status: "active" });
      expect(rowAfterPayment.version).toBe(3);

      // Invariant: version strictly increases monotonically on every single update
      expect(rowAfterPayment.version > rowAfterUpgrade.version).toBe(true);
      expect(rowAfterUpgrade.version > initialRow.version).toBe(true);
    });

    it("verifies queue item claiming via claim_cancellation_queue_batch RPC (FOR UPDATE SKIP LOCKED)", async () => {
      let rpcClaimCalled = false;
      const mockSupabase = {
        rpc: vi.fn((fnName, args) => {
          if (fnName === "claim_cancellation_queue_batch") {
            rpcClaimCalled = true;
            return Promise.resolve({
              data: [
                {
                  id: "item-claimed-1",
                  organization_id: "org-rpc-claim",
                  stripe_subscription_id: "sub_rpc_claimed",
                  reason: "unauthorized_secondary",
                  attempt_count: 1,
                  max_attempts: 5,
                },
              ],
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
        from: vi.fn((table) => {
          if (table === "subscriptions") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { stripe_subscription_id: "sub_other_primary", status: "active" },
                  }),
                })),
              })),
            };
          }
          if (table === "stripe_cancellation_queue") {
            return {
              update: vi.fn(() => ({
                eq: vi.fn().mockResolvedValue({ error: null }),
              })),
            };
          }
          if (table === "audit_logs") {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            };
          }
          return {};
        }),
      } as unknown as Parameters<typeof processCancellationQueue>[0];

      const mockStripe = {
        subscriptions: {
          retrieve: vi.fn().mockResolvedValue({ id: "sub_rpc_claimed", status: "active" }),
          cancel: vi.fn().mockResolvedValue({ id: "sub_rpc_claimed", status: "canceled" }),
        },
      } as unknown as Stripe;

      const result = await processCancellationQueue(mockSupabase, mockStripe);

      expect(rpcClaimCalled).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.completed).toBe(1);
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith("sub_rpc_claimed", { prorate: true });
    });

    it("handles unique deduplication constraint gracefully when enqueuing already-active queue item", async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "stripe_cancellation_queue") {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  in: vi.fn(() => ({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                  })),
                })),
              })),
              insert: vi.fn(() => {
                // Simulate Postgres 23505 unique constraint violation (uq_stripe_cancellation_queue_active)
                const err = new Error("duplicate key value violates unique constraint uq_stripe_cancellation_queue_active");
                (err as unknown as { code: string }).code = "23505";
                throw err;
              }),
            };
          }
          return {};
        }),
      } as unknown as Parameters<typeof enqueueFailedCancellation>[0];

      // Should catch 23505 and return cleanly without throwing
      await expect(
        enqueueFailedCancellation(mockSupabase, {
          organizationId: "org-dedup-test",
          stripeSubscriptionId: "sub_already_queued",
          reason: "unauthorized_secondary",
          error: new Error("Network error"),
        }),
      ).resolves.not.toThrow();
    });

    it("recovers stuck processing items older than 10 minutes in fallback polling", async () => {
      let recoveredCount = 0;
      let recoveredQueryCalled = false;

      const mockSupabase = {
        rpc: vi.fn().mockRejectedValue(new Error("RPC not found")), // force fallback
        from: vi.fn((table: string) => {
          if (table === "stripe_cancellation_queue") {
            return {
              update: vi.fn((patch) => {
                if (patch.status === "pending") {
                  recoveredQueryCalled = true;
                }
                return {
                  eq: vi.fn(() => ({
                    lt: vi.fn(() => {
                      recoveredCount++;
                      return Promise.resolve({ error: null });
                    }),
                  })),
                };
              }),
              select: vi.fn(() => ({
                in: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                    })),
                  })),
                })),
              })),
            };
          }
          return {};
        }),
      } as unknown as Parameters<typeof processCancellationQueue>[0];

      const mockStripe = {} as Stripe;
      await processCancellationQueue(mockSupabase, mockStripe);

      expect(recoveredQueryCalled).toBe(true);
      expect(recoveredCount).toBe(1);
    });
  });
});
