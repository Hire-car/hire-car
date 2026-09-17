import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";

export function MelbourneLuxuryContent() {
  const faqs = [
    {
      question: "How much does it cost to hire a luxury car?",
      answer: "Luxury car hire generally starts from around $150 per day, while high-end luxury and exotic cars can range from $300 to $2,000+ per day, depending on the vehicle, location, and rental duration. Hire Car Marketplace makes it easier to compare available options.",
    },
    {
      question: "Can I hire a BMW or Mercedes for a day?",
      answer: (
        <>
          Yes. <Link href="/cars/bmw-bmw-x5-2017-ut4vm" className="text-amber-600 hover:underline">BMW</Link> and Mercedes models can typically be hired from around $150–$400 per day, depending on the model and provider. You can explore available options through Hire Car Marketplace.
        </>
      ),
    },
    {
      question: "Are luxury cars available for long-term hire?",
      answer: "Yes. Some providers offer weekly and long-term luxury car rentals. Daily rates may become more competitive for longer bookings, depending on the vehicle and provider.",
    },
    {
      question: "Can I hire a luxury car for a business meeting?",
      answer: "Yes. Luxury cars are available for business meetings, corporate events, and client visits. Depending on the model, prices can start from around $150 per day through providers listed on Hire Car Marketplace.",
    },
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-6 text-slate-600 leading-relaxed">
        <h2 className="text-3xl font-black text-slate-900 mb-6">Luxury car hire in Melbourne</h2>
        <p>
          On Hire Car Marketplace, you can find your favourite car from different car rental dealers near your location. Compare the prices, vehicle features, and rental terms of supercars, luxury SUVs, and premium cars like Mercedes, BMW, Audi, Maserati, Mustang, and Chevrolet. Pick your perfect car and enjoy a great driving experience.
        </p>
        <p>
          Melbourne is one of Australia’s most vibrant cities. It is known for its luxury lifestyle, business districts, beautiful coastal drives, and world-class events. Whether you are attending a corporate meeting, planning a wedding, exploring the Great Ocean Road, or simply looking for a comfortable journey, <Link href="/locations/melbourne/luxury" className="text-amber-600 hover:underline">luxury car hire in Melbourne</Link> gives you the opportunity to enjoy premium vehicles without the cost of owning one.
        </p>
        <p>
          From high-end sedans and <Link href="/locations/melbourne/sports-car" className="text-amber-600 hover:underline">luxury SUVs</Link> to sports cars and exotic models, Melbourne offers a wide range of impressive rental vehicles. Before booking, compare the prices, features, and rental terms of different cars. This will help you choose the right vehicle based on your needs and budget.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Why Choose Luxury Car Hire in Melbourne?</h3>
        <p className="text-slate-600 mb-4">
          Hiring a luxury vehicle is about more than style. Modern premium cars are designed to provide advanced safety systems, comfortable interiors, and powerful performance. Many travellers choose luxury car rental in Melbourne for business trips, airport transfers, family holidays, and special occasions.
        </p>
        <p className="text-slate-600 mb-6">
          Luxury car hire services allow customers to experience premium brands such as Mercedes-Benz, <Link href="/cars/bmw-bmw-x5-2017-ut4vm" className="text-amber-600 hover:underline">BMW</Link>, Audi, Porsche, Lexus, and Range Rover without making a long-term financial commitment. Flexible rental periods also make it easier to book a vehicle for a day, a weekend, or an extended stay.
        </p>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-900 mb-4">Popular reasons to <Link href="/blog/luxury-car-hire-melbourne-compare-prices-features" className="text-amber-600 hover:underline">hire a luxury car in Melbourne</Link> include:</h4>
          <ul className="grid sm:grid-cols-2 gap-3">
            {[
              "Corporate events and business travel.",
              "Weddings and anniversary celebrations.",
              "Airport pick-up and drop-off services.",
              "Weekend getaways.",
              "Road trips across Victoria.",
              "Family vacations requiring extra comfort."
            ].map((reason, idx) => (
              <li key={idx} className="flex gap-2 items-start">
                <Check className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-slate-600">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Compare Luxury Car Hire Prices in Melbourne</h3>
        <p className="text-slate-600 mb-6">
          Luxury car rental prices in Melbourne vary depending on the vehicle category, rental duration, season, and included features. Booking early often provides better rates, especially during holidays and major events.
        </p>
        
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 px-4 font-bold text-slate-900">Vehicle Type</th>
                <th className="py-3 px-4 font-bold text-slate-900">Average Daily Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-700">Premium Sedan</td>
                <td className="py-3 px-4 text-slate-600">AUD 180–350</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-700">Luxury SUV</td>
                <td className="py-3 px-4 text-slate-600">AUD 250–500</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-700">
                  <Link href="/locations/melbourne/sports-car" className="text-amber-600 hover:underline">Sports Car</Link>
                </td>
                <td className="py-3 px-4 text-slate-600">AUD 350–800</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-700">Exotic Car</td>
                <td className="py-3 px-4 text-slate-600">AUD 700–2,000+</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 className="text-lg font-bold text-slate-900 mb-4">Many factors influence luxury car hire costs:</h4>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-slate-900 mb-2">Rental Duration</h5>
            <p className="text-slate-600 text-sm">Long-term rentals usually cost less per day than one-day rentals. Many car rental companies give discounts when you book a car for a week or a month.</p>
          </div>
          <div>
            <h5 className="font-semibold text-slate-900 mb-2">Vehicle Brand and Model</h5>
            <p className="text-slate-600 text-sm">High-performance models from Porsche, Maserati, or Ferrari generally cost more than luxury sedans from BMW or Audi.</p>
          </div>
          <div>
            <h5 className="font-semibold text-slate-900 mb-2">Insurance Coverage</h5>
            <p className="text-slate-600 text-sm">Comprehensive insurance, reduced excess options, and roadside assistance can increase the total rental cost but provide additional peace of mind.</p>
          </div>
          <div>
            <h5 className="font-semibold text-slate-900 mb-2">Seasonal Demand</h5>
            <p className="text-slate-600 text-sm">Major sporting events, festivals, and holiday periods often lead to higher prices across Melbourne’s luxury car rental market.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Top Features to Look for in a Luxury Rental Car</h3>
        <p className="text-slate-600 mb-6">
          Comparing features is just as important as comparing prices. A premium vehicle should offer comfort, technology, and safety that match your travel requirements.
        </p>
        
        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-3">Advanced Safety Technology</h4>
            <p className="text-slate-600 mb-2">Most luxury rental cars include:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1 mb-2">
              <li>Adaptive cruise control.</li>
              <li>Lane-keeping assistance.</li>
              <li>Blind-spot monitoring.</li>
              <li>Emergency braking systems.</li>
              <li>Parking sensors and cameras.</li>
            </ul>
            <p className="text-slate-600 text-sm">These features improve safety, particularly for visitors unfamiliar with Melbourne’s roads.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-3">Premium Interior Comfort</h4>
            <p className="text-slate-600 mb-2">Luxury vehicles are designed with high-quality materials and additional comfort features, including:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1 mb-2">
              <li>Leather seating.</li>
              <li>Climate control.</li>
              <li>Heated and ventilated seats.</li>
              <li>Panoramic sunroofs.</li>
              <li>Spacious cabins.</li>
            </ul>
            <p className="text-slate-600 text-sm">Families and business travellers often prioritise interior comfort during longer journeys.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-3">Performance and Driving Experience</h4>
            <p className="text-slate-600 mb-2">Many people choose luxury car hire in Melbourne because of the superior driving experience. Premium vehicles offer:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1 mb-2">
              <li>Powerful engines.</li>
              <li>Smooth automatic transmissions.</li>
              <li>Better suspension systems.</li>
              <li>Responsive handling.</li>
              <li>Quiet cabins.</li>
            </ul>
            <p className="text-slate-600 text-sm">Whether driving through Melbourne CBD or along coastal roads, performance remains a key advantage.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-slate-900 mb-3">Smart Connectivity</h4>
            <p className="text-slate-600 mb-2">Modern luxury cars include technology such as:</p>
            <ul className="list-disc pl-5 text-slate-600 space-y-1 mb-2">
              <li>Apple CarPlay and Android Auto.</li>
              <li>Wireless charging.</li>
              <li>Navigation systems.</li>
              <li>Bluetooth connectivity.</li>
              <li>Premium sound systems.</li>
            </ul>
            <p className="text-slate-600 text-sm">These features make both business trips and holidays more convenient.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Popular Luxury Cars Available in Melbourne</h3>
        <p className="text-slate-600 mb-6">
          Melbourne&apos;s rental market includes a wide selection of premium vehicles suitable for different travel needs.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-bold text-slate-800">Mercedes-Benz</h4>
            <p className="text-slate-600">Mercedes-Benz models are known for elegant interiors, advanced technology, and smooth driving performance.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">BMW</h4>
            <p className="text-slate-600">BMW luxury rentals combine sporty handling with everyday practicality, making them popular among business travellers.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Audi</h4>
            <p className="text-slate-600">Audi vehicles offer modern styling, quattro all-wheel drive technology, and premium comfort.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Range Rover</h4>
            <p className="text-slate-600">Range Rover SUVs are ideal for families seeking space, luxury, and performance.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Porsche</h4>
            <p className="text-slate-600">For drivers wanting a more dynamic experience, Porsche delivers impressive speed and handling.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Tips for Finding the Best Luxury Car Hire Deals in Melbourne</h3>
        <p className="text-slate-600 mb-4">
          Finding <Link href="/locations/melbourne/luxury" className="text-amber-600 hover:underline">affordable luxury car hire</Link> does not always mean choosing the cheapest option. Compare rental providers carefully and review all terms before making a booking.
        </p>
        <p className="text-slate-600 mb-4">Consider the following tips:</p>
        <ul className="list-disc pl-5 text-slate-600 space-y-2 mb-4">
          <li>Compare multiple luxury car rental companies.</li>
          <li>Book early to secure lower prices.</li>
          <li>Check mileage limits and fuel policies.</li>
          <li>Review insurance coverage options.</li>
          <li>Read customer reviews.</li>
          <li>Look for long-term rental discounts.</li>
          <li>Inspect the vehicle before collection.</li>
        </ul>
        <p className="text-slate-600">
          Travellers who compare features alongside pricing often receive better overall value.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Choosing the Right Luxury Car for Your Trip</h3>
        <p className="text-slate-600 mb-4 leading-relaxed">
          The ideal vehicle depends on your travel plans. Business professionals may prefer a premium sedan, while families often choose luxury SUVs with additional seating and luggage space. Sports cars suit weekend escapes, and exotic models are popular for weddings and special occasions.
        </p>
        <p className="text-slate-600 mb-4 leading-relaxed">
          Before finalising your booking, think about passenger numbers, luggage requirements, driving distance, and your preferred level of comfort.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Luxury car hire in Melbourne offers flexibility, convenience, and access to some of the world’s most desirable vehicles. By comparing prices, features, and rental conditions, you can select a premium car that fits your budget while enhancing your travel experience across Melbourne and Victoria.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">FAQs About Hiring a Luxury Car in Melbourne</h3>
        <div className="divide-y divide-slate-200">
          {faqs.map((faq, i) => (
            <details key={i} className="group py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="text-base font-semibold text-slate-900 leading-snug">
                  {faq.question}
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180 mt-0.5" />
              </summary>
              <div className="mt-3 text-sm text-slate-600 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
