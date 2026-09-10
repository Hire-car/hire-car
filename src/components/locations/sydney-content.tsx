import Link from "next/link";
import { Check, Info, AlertTriangle } from "lucide-react";

export function SydneyContent() {
  return (
    <div className="space-y-12">
      <section className="space-y-6 text-slate-600 leading-relaxed">
        <p>
          Are you looking to explore the beautiful areas of Sydney, Australia, at your own convenience and according to your preferred schedule, or are you thinking about renting a car in Sydney? Hire Car Marketplace can help you find suitable options. Hire Car Marketplace recommends comparing different vehicle categories before booking to potentially save up to 30% on car rentals. Choose an economy car for city driving, an SUV for family trips and longer journeys, or a larger vehicle if you need extra space for passengers and luggage. Where possible, book in advance so you can access more vehicle options and potentially find better rates based on your needs.
        </p>
        <p>
          Travellers should also consider city pickup locations, as they can be a convenient alternative to collecting a vehicle from the airport. Before finalising your rental booking, check the mileage limits, understand what is included in the insurance, and ask about excess, fuel, tolls, and other charges to avoid unexpected fees later.
        </p>
        <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 flex gap-3 text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Most importantly, don&apos;t compare only the daily rate.</strong> Instead, compare the total rental cost. This is because the cheapest advertised rate may not include all additional expenses.
          </p>
        </div>
        <p>
          For a better city travel experience in Sydney, plan your route, parking, toll roads, and day trips in advance. Hire Car Marketplace helps travellers compare different rental options and find the right vehicle according to their Sydney travel plans. Simply follow these easy steps and you will be ready for your journey: first, visit the website to make your booking, choose your preferred location in Sydney, and select an{" "}
          <Link href="/locations/sydney/suv" className="text-amber-600 hover:underline">SUV</Link>,{" "}
          <Link href="/locations/sydney/sedan" className="text-amber-600 hover:underline">sedan</Link>,{" "}
          <Link href="/locations/sydney/luxury" className="text-amber-600 hover:underline">luxury</Link>,{" "}
          <Link href="/locations/sydney/sports-car" className="text-amber-600 hover:underline">sports car</Link>,{" "}
          <Link href="/locations/sydney/van" className="text-amber-600 hover:underline">van</Link>,{" "}
          or other vehicle according to your preferences and requirements. You will find several car rental options to choose from. Next, let us know the date and time when you would like to collect the vehicle. Once you have selected your vehicle, it is time to finalise your booking. Simply provide your personal details, and your booking will be confirmed.
        </p>
        <p>
          If you are looking for{" "}
          <Link href="/locations/sydney" className="text-amber-600 hover:underline">car rental in Sydney</Link>{" "}
          without spending too much of your travel budget, the good news is that comparing vehicle types, booking dates, pickup locations, and rental terms before making payment can help you find affordable options.
        </p>
        <p>
          Current Sydney listings may offer small cars from around $45 per day, although prices can vary significantly depending on the vehicle, season, and supplier. Whether you need a compact car for city driving, an SUV for a road trip, or a people mover for your family, comparing your options carefully can help you find better value.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Sydney Car Rental Price Comparison by Vehicle Type</h3>
        <p className="text-slate-600 mb-6">
          The cost of a rental car in Sydney varies according to the vehicle, rental period, season, location, availability and insurance options. Instead of focusing only on the advertised daily rate, check the total booking cost, including applicable fees, excess, additional drivers and optional extras.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 rounded-tl-xl">Vehicle Type</th>
                <th className="px-4 py-3">Typical Daily Price Range*</th>
                <th className="px-4 py-3 rounded-tr-xl">Best For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">Economy car</td>
                <td className="px-4 py-3">AUD $40–$80</td>
                <td className="px-4 py-3">Solo travellers and couples</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">Compact car</td>
                <td className="px-4 py-3">AUD $45–$90</td>
                <td className="px-4 py-3">City trips and small families</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">Mid-size sedan</td>
                <td className="px-4 py-3">AUD $60–$110</td>
                <td className="px-4 py-3">Business and longer journeys</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">SUV</td>
                <td className="px-4 py-3">AUD $70–$140</td>
                <td className="px-4 py-3">Families and road trips</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">7-seater</td>
                <td className="px-4 py-3">AUD $90–$170+</td>
                <td className="px-4 py-3">Larger families or groups</td>
              </tr>
              <tr className="hover:bg-slate-50 border-b border-slate-200">
                <td className="px-4 py-3 font-medium text-slate-900">Luxury car</td>
                <td className="px-4 py-3">AUD $150–$300+</td>
                <td className="px-4 py-3">Premium travel and special occasions</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-slate-500 italic">
          *Indicative ranges only. Actual prices change based on dates, supplier, vehicle availability, location, insurance and extras.
        </div>
        <p className="mt-4 text-slate-600">
          If you need a car for several days, compare the total rental price, rather than multiplying the cheapest daily rate by the number of days. Weekend demand, school holidays and major events can also affect availability and pricing.
        </p>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Sydney Car Hire Tips</h3>
        <p className="text-slate-600 mb-6">
          Before you book a hire car in Sydney, spend a few minutes checking the details. That small effort can save you money and a headache later.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "Book according to your actual needs", desc: "A small hatchback makes sense for city driving, while an SUV may be better for a family road trip." },
            { title: "Check the fuel policy", desc: "“Full to full” is usually straightforward because you return the vehicle with the same fuel level." },
            { title: "Understand the excess", desc: "A cheap rental can become less cheap if you overlook the damage excess or insurance conditions." },
            { title: "Inspect the vehicle", desc: "Take photos or video of existing scratches, dents and other visible damage before leaving the pickup location." },
            { title: "Check parking arrangements", desc: "Sydney’s CBD can make parking feel like a competitive sport. If your hotel offers parking, check the additional cost before booking." },
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
        <div className="mt-6 rounded-xl bg-blue-50 p-4 border border-blue-100 flex gap-3 text-blue-900">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            If you are an overseas visitor, check your licence requirements before driving. NSW Government states that eligible temporary overseas visitors can generally drive using a current overseas licence for up to six months, subject to the applicable conditions. If the licence is not in English, an English translation or International Driving Permit is required.
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Top Car Rental Companies in Sydney</h3>
        <p className="text-slate-600 mb-4">
          Sydney has a competitive car rental market with international and local providers offering different vehicle categories and rental conditions. Well-known rental brands include Avis, Budget, <a href="http://hire.com.au" className="text-amber-600 hover:underline" target="_blank" rel="noreferrer">car hire.com.au</a>, <a href="https://www.hertz.com.au/rentacar/reservation/" className="text-amber-600 hover:underline" target="_blank" rel="noreferrer">Hertz</a>, Thrifty and SIXT, alongside independent rental businesses.
        </p>
        <p className="text-slate-600">
          Rather than choosing a company purely because it has a familiar name, compare the vehicle available for your dates, total price, pickup location, included kilometres, insurance conditions and customer requirements. A good rental deal is not necessarily the one with the lowest headline price. It is the one that gives you the right vehicle, clear conditions and reasonable overall cost.
        </p>
      </section>
    </div>
  );
}
