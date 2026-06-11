"use client";

import { useState } from "react";
import { updateBookingStatus } from "./actions";
import { toast } from "sonner";

type BookingRow = {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_price_aud: number;
  vehicles?: VehicleSummary | VehicleSummary[] | null;
};

type VehicleSummary = {
    id: string;
    title: string | null;
    make: string | null;
    model: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getVehicleSummary(booking: BookingRow) {
  return Array.isArray(booking.vehicles) ? booking.vehicles[0] : booking.vehicles;
}

export default function BookingsClient({
  organizationId,
  initialBookings,
}: {
  organizationId: string;
  initialBookings: BookingRow[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState<string | null>(null);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus, organizationId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      toast.success(`Booking marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h3 className="text-sm font-semibold text-slate-900">No bookings yet</h3>
        <p className="mt-1 text-sm text-slate-500">
          When customers book your vehicles, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Vehicle</th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Dates</th>
              <th className="px-6 py-4 font-semibold">Total Price</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">
                    {getVehicleSummary(booking)?.title ||
                      `${getVehicleSummary(booking)?.make ?? ""} ${getVehicleSummary(booking)?.model ?? ""}`.trim() ||
                      "Vehicle"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{booking.customer_name}</div>
                  <div className="text-xs text-slate-500">{booking.customer_email}</div>
                  {booking.customer_phone && <div className="text-xs text-slate-500">{booking.customer_phone}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-900 font-medium">
                    {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900">
                  ${booking.total_price_aud}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <select
                    disabled={loading === booking.id}
                    value={booking.status}
                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
