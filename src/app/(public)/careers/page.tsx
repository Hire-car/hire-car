/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Heart, Rocket, Users, Target } from "lucide-react";
import { SiteHeader } from "@/components/server-site-header";
import { SiteFooter } from "@/components/site-footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers | Hire Car Marketplace",
  description:
    "Join our mission to revolutionize the Australian car rental industry. We're always looking for passionate talent.",
};

const perks = [
  {
    icon: Zap,
    title: "Move Fast",
    desc: "We ship quickly, learn constantly, and aren't afraid to break things to build better solutions for our users.",
    color: "from-amber-400 to-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-600"
  },
  {
    icon: Heart,
    title: "Owner's Mindset",
    desc: "Take true ownership of your work. If you see a problem, you have the power and autonomy to fix it.",
    color: "from-pink-500 to-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-600"
  },
  {
    icon: Rocket,
    title: "Massive Impact",
    desc: "Every line of code and design decision directly impacts local Australian businesses and renters.",
    color: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
    text: "text-blue-600"
  },
  {
    icon: Users,
    title: "Small & Mighty",
    desc: "We are a tight-knit team where everyone's voice is heard. No corporate bureaucracy or endless meetings.",
    color: "from-emerald-400 to-teal-500",
    bg: "bg-teal-50",
    text: "text-teal-600"
  },
  {
    icon: Target,
    title: "Clear Vision",
    desc: "We are singularly focused on becoming the absolute best marketplace for vehicle rentals in Australia.",
    color: "from-purple-500 to-fuchsia-500",
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-600"
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#ea580c]/20">
      <SiteHeader />
      
      <main>
        {/* ===== HERO SECTION ===== */}
        <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40 bg-white">
          {/* Artistic background shapes */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] sm:w-[800px] h-[600px] bg-gradient-to-br from-[#ea580c]/15 to-[#f59e0b]/15 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] sm:w-[600px] h-[600px] bg-gradient-to-tr from-[#3b82f6]/10 to-[#8b5cf6]/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ea580c]/20 bg-[#ea580c]/10 px-4 py-1.5 mb-8 backdrop-blur-sm shadow-sm">
              <Sparkles className="h-4 w-4 text-[#ea580c]" />
              <span className="text-sm font-bold tracking-wide text-[#ea580c] uppercase">Join the journey</span>
            </div>
            
            <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-7xl mb-8 leading-[1.05]">
              Build the future of <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea580c] to-[#f59e0b]">
                mobility with us.
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-600 leading-relaxed mb-12">
              We're a fast-moving, passionate team on a mission to empower independent Australian car rental operators and provide renters with a premium experience.
            </p>
          </div>
        </section>

        {/* ===== VALUES & PERKS SECTION ===== */}
        <section className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Why work with us?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                We believe in giving great people the freedom to do their best work.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {perks.map((perk, i) => (
                <div 
                  key={i} 
                  className="group relative w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-3xl bg-white p-8 border border-slate-200 hover:border-slate-300 transition-all hover:shadow-xl overflow-hidden flex flex-col"
                >
                  <div className={`absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity transform group-hover:scale-110 ${perk.text}`}>
                    <perk.icon className="h-32 w-32" />
                  </div>
                  
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${perk.color} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <perk.icon className="h-7 w-7" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{perk.title}</h3>
                  <p className="text-slate-600 leading-relaxed relative z-10">{perk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CALL TO ACTION SECTION ===== */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          {/* Glassmorphism Background Pattern */}
          <div className="absolute inset-0 bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(234,88,12,0.2)_0%,_transparent_70%)]" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#ea580c]/50 to-transparent" />
          </div>
          
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl p-10 sm:p-16 shadow-2xl relative overflow-hidden">
              {/* Decorative glare */}
              <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 tracking-tight leading-tight relative z-10">
                No open roles right now, <br className="hidden sm:block" />
                <span className="text-[#ea580c]">but we're listening.</span>
              </h2>
              
              <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl mx-auto relative z-10">
                We're always thrilled to meet exceptionally talented engineers, designers, and marketers. If you believe you belong here, don't wait for a job posting.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <a
                  href="mailto:support@hirecarmarketplace.com.au"
                  className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f59e0b] px-8 py-4 text-base font-bold text-white shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)] transition-all hover:shadow-[0_0_60px_-15px_rgba(234,88,12,0.7)] hover:-translate-y-1"
                >
                  Email us your pitch
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
                <Link
                  href="/contact"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10"
                >
                  Contact Form
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  );
}

