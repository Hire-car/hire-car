import { Check, ChevronDown } from "lucide-react";

export function SydneySportsCarContent() {
  const faqs = [
    {
      question: "How much does it cost to hire a sports car in Sydney?",
      answer: "Sports car hire can start at around AUD $130 per day, while premium performance and exotic cars can cost several hundred or even more than AUD $1,000 per day.",
    },
    {
      question: "What is the cheapest sports car to hire in Sydney?",
      answer: "Entry-level performance cars such as an Audi S3 or similar models can be among the more affordable options, with current listings around the low-AUD-$100s per day.",
    },
    {
      question: "Can I hire a Porsche in Sydney?",
      answer: "Yes. Porsche models are available through some Sydney rental and car-sharing providers, although availability and pricing vary by model and date.",
    },
    {
      question: "Can I hire a Ferrari in Sydney?",
      answer: "Ferrari hire is available through selected prestige rental providers. Availability depends on the location, model and booking dates.",
    },
    {
      question: "How old do I need to be to hire a sports car?",
      answer: "Age requirements depend on the rental provider and vehicle. Some prestige providers have higher minimum ages. For example, Avis Prestige lists 25 years for prestige cars and 30 years for supercars.",
    },
    {
      question: "Can international visitors hire a sports car in Sydney?",
      answer: "Yes, subject to the rental company's requirements and NSW licence rules. Temporary overseas visitors can generally drive with a current overseas licence for up to six months while meeting NSW conditions.",
    },
    {
      question: "Do sports car rentals require a security deposit?",
      answer: "Many premium rental providers require a security bond. The amount depends on the vehicle and supplier. Avis Prestige currently states bonds between AUD $5,000 and $15,000.",
    },
    {
      question: "Are kilometres limited on sports car rentals?",
      answer: "They can be. Some prestige rentals include a daily kilometre allowance, with additional charges applying after the included limit.",
    },
    {
      question: "Is insurance included with sports car hire?",
      answer: "Insurance arrangements vary by provider and vehicle. Always check what protection is included, the excess amount and any exclusions before booking.",
    },
    {
      question: "Should I book a sports car in advance?",
      answer: "Yes. Booking early can give you a better choice of models and dates, particularly for popular cars and busy periods.",
    },
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-6 text-slate-600 leading-relaxed">
        <p>
          With Hire Car Marketplace, you can make your Sydney trip more exciting by hiring a sports car. Renting a sports car in Sydney can make your driving journey more enjoyable, stylish, and memorable. On Hire Car Marketplace, you can find your preferred vehicle from different car rental dealers near your location. Depending on the car model, sports cars in Sydney are currently available from around AUD $130 per day.
        </p>
        <p>
          You can compare the prices, vehicle features, and rental terms of premium cars such as Mercedes, BMW, Audi, Maserati, Mustang, Chevrolet, and other high-end vehicles. Choose a car that suits your needs and enjoy a great driving experience with a performance vehicle.
        </p>
        <p>
          Whether you need a sports car for a weekend, a special event, a photoshoot, or simply want to enjoy a memorable drive, it is important to compare the car, rental terms, and total rental cost before booking.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Top Tips for Hiring a Sports Car in Sydney</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Compare total costs", desc: "Compare the total rental cost, including insurance, security bond, fuel, tolls, and extra charges." },
            { title: "Check age and licence rules", desc: "Check the driver's age and licence requirements because sports cars may have stricter rules." },
            { title: "Book early", desc: "Book early if you want a specific car, as popular models may not be available." },
            { title: "Choose the right fit", desc: "A small sports car can be easier in busy areas, while a convertible is great for coastal drives." },
            { title: "Inspect condition", desc: "Before driving away, take photos of the car and check its condition, tyres, interior, and fuel level." },
          ].map((tip, idx) => (
            <div key={idx} className="flex gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <Check className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-slate-900 font-semibold mb-1">{tip.title}</strong>
                <span className="text-sm text-slate-600">{tip.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Top Sports Car Brands Available for Hire</h3>
        <p className="text-slate-600 mb-6">
          Sydney offers a good choice of performance and sports-car brands. Availability depends on the supplier and your selected dates.
        </p>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-bold text-slate-800">Porsche</h4>
            <p className="text-slate-600">Porsche is a popular choice for drivers who want a combination of performance, comfort and everyday usability. Current Sydney listings include Porsche Boxster, 718 and other Porsche models, with prices varying significantly by model.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">BMW M</h4>
            <p className="text-slate-600">BMW&apos;s M range is aimed at drivers who want strong performance without giving up everyday comfort. Sydney listings currently include models such as the BMW M2, M3 and M4 Competition.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Ford Mustang</h4>
            <p className="text-slate-600">The Mustang brings classic muscle-car styling with plenty of road presence. Current Sydney listings show several Mustang models, with daily prices varying considerably depending on the year and specification.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Ferrari and Lamborghini</h4>
            <p className="text-slate-600">If you want something more exotic, Ferrari and Lamborghini sit firmly at the premium end of the market. Avis Prestige lists models and brands including the Lamborghini Huracán, Ferrari 488, McLaren, Porsche and other high-end performance vehicles, although availability varies by location.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">How Much Does It Cost to Hire a Sports Car in Sydney?</h3>
        <p className="text-slate-600">
          The cost of sports car rental in Sydney varies widely depending on the model, age of the vehicle, rental period, season and supplier. Current Sydney sports-car listings provide a useful example. Audi S3 models are listed at around AUD $131 per day, Porsche Boxster models around AUD $163 per day, BMW M3 models around AUD $294 per day, and BMW M2 models around AUD $261–$326 per day in current listings. Some newer Ford Mustang models are listed above AUD $400 per day.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
        <div className="divide-y divide-slate-200">
          {faqs.map((faq, i) => (
            <details key={i} className="group py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="text-base font-semibold text-slate-900 leading-snug">
                  {faq.question}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 mt-0.5" />
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
