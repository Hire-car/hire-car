import { Check, ChevronDown } from "lucide-react";

export function SydneyVanContent() {
  const faqs = [
    {
      question: "What are the speed limits when driving in Sydney?",
      answer: "Common limits are 50 km/h in urban areas and 100 km/h on many major roads, unless signs show a different limit.",
    },
    {
      question: "What documentation do I need for Sydney people carrier rental?",
      answer: "You generally need a valid driving licence, identification, and a payment card. International drivers may need additional documents.",
    },
    {
      question: "How does hirecarmarkplace find such low van hire prices?",
      answer: "Hire car marketplace compares prices from multiple rental companies to help users find available low-cost deals.",
    },
    {
      question: "How much does a van hire cost in Sydney?",
      answer: "Prices vary by vehicle, rental company, location, and rental period. Daily rates can start from around $50, but prices change regularly.",
    },
    {
      question: "Which car hire companies in Sydney hire vans?",
      answer: "Van options may be available from companies such as Thrifty, Hertz, Dollar, Enterprise, Apex, Ace Rental Cars, and Bargain Car Rentals.",
    },
  ];

  return (
    <div className="space-y-12">
      <section className="space-y-6 text-slate-600 leading-relaxed">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Van Hire in Sydney</h2>
        <p>
          Are you looking for reliable and affordable van hire in Sydney? With Hire Car Marketplace, you may be able to save up to 30% when renting a van. Whether you need a van for a short time or a longer period, for business deliveries, equipment transport, airport trips, or group travel, Hire Car Marketplace makes it easy to find affordable van hire deals in Sydney, Australia.
        </p>
        <p>
          Our platform helps you compare prices from reliable rental providers across Australia, so you can find the right option for your budget and needs. Whether you are moving house, transporting business items, handling deliveries, or planning a group trip, our platform connects you with trusted van rental companies.
        </p>
        <p>
          You can filter your search based on price, rental company, and other options to find the best rental option for you. Are you looking for cheap van hire deals in Sydney, Australia? You can search and compare available options to find a suitable van for your needs.
        </p>
        <p>
          Van hire prices in Sydney can vary depending on the rental company and location. Some deals may offer lower daily rates, but it is important to check the actual price and rental conditions before booking.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Choose Your Van for Hire in Sydney</h3>
        <p className="text-slate-600 mb-4">
          Not every van does the same job. Choosing a vehicle that is too small can mean multiple trips, while hiring a much larger vehicle than necessary may add cost and make city driving harder. Here are common options to consider:
        </p>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="p-3 border border-slate-200 font-semibold">Van type</th>
                <th className="p-3 border border-slate-200 font-semibold">Suitable for</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              <tr>
                <td className="p-3 border border-slate-200">Small cargo van</td>
                <td className="p-3 border border-slate-200">Small deliveries, tools and equipment</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200">1-tonne van</td>
                <td className="p-3 border border-slate-200">Business deliveries and moderate loads</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200">HiTop van</td>
                <td className="p-3 border border-slate-200">Larger cargo and trade work</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200">Moving van</td>
                <td className="p-3 border border-slate-200">Furniture, appliances and house moves</td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-200">People mover</td>
                <td className="p-3 border border-slate-200">Families, groups and passenger travel</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-slate-600">
          Some commercial rental fleets specify cargo capacity and dimensions for individual vehicles. Avis, for example, lists a 1-tonne van with 4.5m³ capacity and a HiTop van with 9.8m³ capacity, while its larger 4.2m moving van has a stated capacity of 18.5m³. Vehicle specifications can vary by location and availability, so check the exact vehicle before booking.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">What should you check before booking?</h3>
        <p className="text-slate-600 mb-4">Think about these points before choosing your rental:</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Cargo size", desc: "Measure large furniture, boxes or equipment." },
            { title: "Payload", desc: "Check the vehicle's permitted load rather than judging capacity by appearance." },
            { title: "Vehicle height", desc: "This matters when entering car parks, loading areas and buildings." },
            { title: "Transmission", desc: "Choose automatic if that is what you are comfortable driving." },
            { title: "Number of seats", desc: "Passenger vans and cargo vans serve different purposes." },
            { title: "Licence requirements", desc: "Larger commercial vehicles may require a different licence category." },
            { title: "Pickup location", desc: "A nearby depot can save time and unnecessary driving." },
            { title: "Rental period", desc: "Daily, weekend and longer bookings may have different rates and conditions." },
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
        <p className="mt-6 text-slate-600">
          For example, some larger moving vehicles require a heavier vehicle licence. Avis lists its 6.4m moving van as requiring an MR licence, while its 4.2m moving van can be driven with a car licence. Always confirm the licence requirement for the specific vehicle you intend to rent.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Why Choose Hire Car Marketplace for Van Rental?</h3>
        <p className="text-slate-600 mb-4">
          Hiring through a marketplace can give customers another way to compare available vehicles rather than checking rental providers one by one. Hire Car Marketplace connects people searching for rental vehicles with vehicle owners and rental listings. This model can be useful when you want to compare different vehicle options based on your requirements.
        </p>
        <p className="text-slate-600 mb-4">When using a marketplace, look beyond the headline rental price. Check:</p>
        <ul className="list-disc pl-5 mb-4 text-slate-600 space-y-1">
          <li>Vehicle type and model</li>
          <li>Rental availability</li>
          <li>Pickup and return arrangements</li>
          <li>Included kilometres, if applicable</li>
          <li>Insurance and excess conditions</li>
          <li>Deposit requirements</li>
          <li>Cancellation terms</li>
          <li>Additional driver rules</li>
          <li>Cleaning or late-return charges</li>
        </ul>
        <p className="text-slate-600 mb-4">
          The final price matters more than the advertised daily figure. A cheap-looking rental can become less attractive after extra charges are added.
        </p>
        <p className="text-slate-600">
          For fleet owners and vehicle businesses, listing vans can also provide another channel for reaching people searching for rental vehicles in Sydney.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">When do you need a van hire?</h3>
        <p className="text-slate-600 mb-6">A van can be useful for far more than moving house. Common situations include:</p>
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-bold text-slate-800">Moving house</h4>
            <p className="text-slate-600">A van can help transport furniture, boxes, appliances and other household items. Before booking, estimate the volume of your belongings and consider whether you need a tail lift or additional loading equipment.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Business deliveries</h4>
            <p className="text-slate-600">Tradespeople, retailers and small businesses may need temporary transport for tools, stock, equipment or deliveries. A cargo van can provide more enclosed storage than a standard car.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Furniture collection</h4>
            <p className="text-slate-600">Buying furniture from a store or marketplace can create a transport problem if the item will not fit in a normal car. Measure the item first and compare those dimensions with the van's cargo area.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Events and equipment</h4>
            <p className="text-slate-600">Catering equipment, exhibition materials, decorations, sound equipment and other event supplies can require additional cargo space.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Group travel</h4>
            <p className="text-slate-600">A passenger van or people mover can be a practical choice for families, sports groups and larger travelling parties. The suitable vehicle depends on the number of passengers and luggage.</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-800">Short-term business needs</h4>
            <p className="text-slate-600">If your business vehicle is unavailable or you have a temporary increase in deliveries, renting a van can cover the gap without committing to another vehicle purchase.</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Popular Van Hire Company</h3>
        <p className="text-slate-600">
          Sydney has several van rental companies offering vehicles for different needs. You can choose from a moving van, cargo van, commercial van, or passenger van based on your requirements. Some popular companies include Avis and Budget. Keddy by Europcar has the most van hire locations in Sydney, with a total of 8 locations. It is followed by Thrifty with 7 locations and Enterprise Rent-A-Car with 6 locations.
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
