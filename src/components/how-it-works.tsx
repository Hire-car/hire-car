import { MapPin, BarChart3, MessageCircle } from "lucide-react";
import { Section } from "@/components/ui/section";

const steps = [
  {
    step: 1,
    icon: MapPin,
    title: "Search by Location",
    description: "Search for available vehicles in your area from verified local operators.",
  },
  {
    step: 2,
    icon: BarChart3,
    title: "Compare & Choose",
    description: "Compare prices, features, and reviews to find your ideal rental.",
  },
  {
    step: 3,
    icon: MessageCircle,
    title: "Contact & Book",
    description: "Reach out directly to the vendor — no middleman, no hidden fees.",
  },
];

export function HowItWorks() {
  return (
    <Section variant="default" size="md" container>
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          How It Works
        </h2>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Find your perfect rental in 3 simple steps
        </p>
      </div>

      <div className="relative grid gap-8 md:grid-cols-3">
        {/* Connector line between steps (desktop only) */}
        <div className="hidden md:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-border" aria-hidden="true" />

        {steps.map(({ step, icon: Icon, title, description }) => (
          <div
            key={step}
            className="relative flex flex-col items-center text-center px-4"
          >
            {/* Step number circle with brand accent */}
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white border-2 border-primary/20 shadow-sm mb-5">
              <Icon className="h-8 w-8 text-primary" />
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-black text-white shadow">
                {step}
              </span>
            </div>

            {/* Title and description */}
            <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
