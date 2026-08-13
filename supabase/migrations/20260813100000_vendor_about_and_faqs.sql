-- Add about_business (long-form) and vendor_faqs (JSON array) to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS about_business text,
  ADD COLUMN IF NOT EXISTS vendor_faqs     jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.organizations.about_business IS 'Long-form "About the Business" text shown on the public vendor profile page';
COMMENT ON COLUMN public.organizations.vendor_faqs    IS 'JSON array of {question, answer} pairs – up to 5 vendor-specific FAQs shown on the public vendor profile page';
