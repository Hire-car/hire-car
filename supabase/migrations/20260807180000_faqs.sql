CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can read FAQs
CREATE POLICY "Public FAQs are viewable by everyone." ON faqs FOR SELECT USING (true);

-- Admins/Service roles can manage FAQs (since service role bypasses RLS, we don't strictly need a policy, but good to be explicit if using user JWTs)
CREATE POLICY "Admins can manage FAQs." ON faqs FOR ALL USING (true);

-- Insert seed data
INSERT INTO faqs (category, question, answer, sort_order) VALUES
('For Customers', 'How does Hire Car work?', 'Hire Car is a marketplace connecting you with verified, independent car rental operators. You browse vehicles, send an enquiry directly to the vendor, and they will coordinate the booking, payment, and pickup details directly with you.', 10),
('For Customers', 'Do I pay on the Hire Car website?', 'No. Hire Car is a discovery platform. You do not pay any booking fees to us. All payments, deposits, and rental agreements are handled directly by the rental operator you choose.', 20),
('For Customers', 'Are the rental companies trustworthy?', 'Yes. Every vendor on our platform must pass our verification process. We check their Australian Business Number (ABN) and business details before they are allowed to list vehicles on the marketplace.', 30),
('For Customers', 'What happens if I need to cancel my booking?', 'Cancellation policies are set by each individual rental operator. When you make a booking, the vendor will provide their specific cancellation terms. You will need to contact the vendor directly to cancel or modify your reservation.', 40),
('For Customers', 'Does the price include insurance?', 'Insurance coverage varies by vendor. While basic coverage is typically included by law, excess amounts and optional coverages depend on the operator''s specific policies. Always confirm insurance details directly with the vendor before finalizing your booking.', 50),

('For Vendors', 'How much does it cost to list my fleet?', 'We offer tiered subscription plans based on fleet size. The Starter plan is free ($0/month) for up to 5 vehicles. We do not charge commissions on your bookings — you keep 100% of your rental revenue. See our Pricing page for details.', 10),
('For Vendors', 'How do I receive leads?', 'When a customer enquires about your vehicle, you will receive an instant email notification. You can also view and respond to all leads directly in your Vendor Dashboard. Customers can optionally contact you via Phone or WhatsApp if you provide those details.', 20),
('For Vendors', 'How long does it take to get approved?', 'After you complete the onboarding process and submit your ABN, our team reviews your application. Approval typically takes less than 24 hours during business days.', 30),
('For Vendors', 'Can I bulk upload my vehicles?', 'Yes, our Pro and Enterprise plans include bulk upload capabilities and API access, allowing you to sync your fleet inventory directly with our platform.', 40);
