const fs = require('fs');
const path = require('path');

const cities = ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'gold-coast', 'cairns', 'darwin', 'hobart', 'canberra', 'newcastle', 'wollongong'];
const categories = ['Sedan', 'SUV', 'People mover', 'Van', 'Ute', 'Luxury', 'Hatchback', 'Convertible', 'Coupe', 'Wagon', 'Sports car', 'Minibus', 'Truck', 'Campervan'];

function generateCityFaqs() {
  let content = `/**
 * City-specific FAQ data for location pages.
 * Each entry maps a city slug to 8–9 locally-relevant Q&As.
 */

export interface CityFaq {
  question: string;
  answer: string;
}

const CITY_FAQS: Record<string, CityFaq[]> = {
`;

  for (const city of cities) {
    const cName = city.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    content += `  "${city}": [
    {
      question: "Do I need a hire car to get around ${cName} effectively?",
      answer: "While ${cName} does offer a public transport network in its city centre, hiring a car is highly recommended for a truly complete and unconstrained travel experience. A rental vehicle grants you the freedom to explore the wider metropolitan area at your own pace, uncover hidden coastal and suburban gems, and seamlessly take scenic day trips to surrounding national parks or wine regions that are often difficult to reach via train or bus. It saves you valuable transit time and provides unparalleled flexibility for your unique itinerary."
    },
    {
      question: "Where are the most convenient locations to pick up a hire car in ${cName}?",
      answer: "In ${cName}, you can conveniently pick up a hire car from a wide variety of locations. Our marketplace operators are strategically distributed across the central business district (CBD), key suburban hubs, and near major transport terminals like the local airport. When you finalize your booking, you can coordinate directly with the local operator to arrange a pickup and drop-off point that perfectly aligns with your travel schedule and accommodation location."
    },
    {
      question: "Are there any toll roads I should be aware of when driving a hire car in ${cName}?",
      answer: "Depending on your specific routes, you may encounter toll roads in and around ${cName}. The majority of Australia's major urban centres utilize cashless, electronic tolling systems rather than physical toll booths. It is essential to discuss toll management with your hire car operator prior to beginning your trip. Many operators can provide a vehicle fitted with an electronic tag or will explain how you can set up a temporary visitor pass to ensure you avoid unexpected administrative fees and fines."
    },
    {
      question: "What are the typical parking options and associated costs for a rental car in ${cName}?",
      answer: "Parking in the bustling inner city of ${cName} can often be competitive and relatively expensive, with metered street parking and commercial parking garages being the standard options. To mitigate these costs, consider booking accommodation that explicitly includes secure parking. For daytime exploration, look into early-bird parking rates at commercial garages, or utilize park-and-ride facilities located at suburban transport hubs for easier access to the city centre."
    },
    {
      question: "What is the minimum age requirement to rent and drive a car in ${cName}?",
      answer: "To legally hire and drive a car in ${cName}, the vast majority of rental operators require the primary driver to be at least 21 years of age and hold a full, valid driver's licence. Furthermore, drivers aged between 21 and 24 are frequently subject to a young-driver surcharge due to standard insurance industry policies. It is highly recommended that you carefully check the specific age requirements and fee structures of individual operators before confirming your reservation."
    },
    {
      question: "Which type of hire vehicle is best suited for driving and parking in ${cName}?",
      answer: "The ideal vehicle type depends entirely on your specific travel plans and passenger numbers in ${cName}. For navigating busy city streets and easily fitting into tight urban parking spots, a compact hatchback or a standard sedan is usually perfect. However, if you are planning extensive family road trips to nearby coastal towns, hinterland areas, or national parks, a more spacious SUV or a comfortable people mover would provide the necessary extra legroom and luggage capacity."
    },
    {
      question: "Can I use an international driver's licence to rent a car in ${cName}?",
      answer: "Yes, international visitors are generally permitted to use a valid, current overseas driver's licence to rent a vehicle in ${cName}. However, if your original licence is not printed in English, you will also be legally required to provide an International Driving Permit (IDP) alongside your native licence. Ensure you carry both of these documents with you at all times when driving, along with your passport for secondary identification purposes."
    },
    {
      question: "What is the standard procedure if my hire car breaks down while driving in ${cName}?",
      answer: "In the unlikely and unfortunate event of a mechanical breakdown in ${cName}, your first priority should be to safely pull your vehicle over to the side of the road and activate your hazard lights. Most vehicles hired through our comprehensive marketplace include round-the-clock roadside assistance. You should immediately contact your specific rental operator using the designated emergency phone number provided in your rental agreement; they will guide you step-by-step on how to get the vehicle repaired or quickly replaced."
    },
    {
      question: "Are there any specific driving rules or local road etiquette I should know in ${cName}?",
      answer: "Driving in ${cName} follows standard Australian road rules, which means you must always drive on the left side of the road and strictly adhere to all posted speed limits, which are strictly enforced by cameras and police. In school zones, speed limits are heavily reduced during specific hours. Always yield to pedestrians at marked crossings and be highly aware of sharing the road safely with cyclists and, depending on the specific area, public transport vehicles like trams or large buses."
    }
  ],
`;
  }

  content += `};

/**
 * Returns the FAQ list for a given city slug.
 * Falls back to a generic set of questions if no specific data is found.
 */
export function getCityFaqs(
  slug: string,
  displayCity: string,
  avgPrice?: number | null,
): CityFaq[] {
  if (CITY_FAQS[slug]) {
    return CITY_FAQS[slug];
  }

  // Generic fallback for cities without curated FAQs
  return [
    {
      question: \`How much does it typically cost to hire a car in \${displayCity}?\`,
      answer: avgPrice
        ? \`Based on our current comprehensive platform listings, the average car hire in \${displayCity} costs approximately $\${avgPrice} AUD per day. However, it is important to note that actual prices will vary significantly depending on the specific vehicle type, the total duration of your rental, the time of year, and the individual operator's pricing structure.\`
        : \`Car hire prices in \${displayCity} can vary widely based on the vehicle type, rental duration, and the specific operator you choose. We recommend browsing our current listings to compare daily rates and find a vehicle that fits your specific budget and travel needs.\`,
    },
    {
      question: \`What is the process to hire a car in \${displayCity} using the Hire Car Marketplace?\`,
      answer: \`The process is designed to be as simple and seamless as possible. First, browse the wide selection of available vehicles on this page. Once you find a car that suits your needs, click through to the detailed listing to view all specifications and terms. From there, you can contact the local operator directly to arrange your preferred dates, confirm pricing, and establish a convenient pickup location. Importantly, there are absolutely no hidden booking fees when you use the Hire Car Marketplace.\`,
    },
    {
      question: \`Are the rental operators located in \${displayCity} fully verified and trustworthy?\`,
      answer: \`Yes, maintaining a secure and reliable marketplace is our top priority. All vehicle operators listed on the Hire Car Marketplace are thoroughly verified, which includes rigorous ABN (Australian Business Number) validation. They must also go through a strict internal approval process before their listings go live. This ensures you can hire your vehicle with complete confidence from legitimate, local Australian rental companies.\`,
    },
    {
      question: \`Can I book a one-way car hire starting from \${displayCity}?\`,
      answer: \`One-way rentals starting from \${displayCity} may be possible depending on the specific operator's policies and their network of depot locations. Because our marketplace connects you directly with independent local operators, you will need to inquire with them directly about one-way availability and any potential relocation fees that might apply to your booking.\`,
    },
    {
      question: \`What kind of insurance coverage is included when I hire a car in \${displayCity}?\`,
      answer: \`Insurance coverage details vary from one operator to another. Generally, a standard level of damage cover is included in the base daily rate, which comes with a predetermined excess amount in the event of an accident. Many operators offer the option to purchase a 'Damage Waiver' or 'Excess Reduction' to significantly lower your financial liability. Always carefully review the insurance terms provided by the operator before finalizing your booking.\`,
    },
    {
      question: \`Is it possible to hire a vehicle in \${displayCity} if I am under 25 years old?\`,
      answer: \`Yes, it is often possible to hire a car in \${displayCity} if you are under 25, provided you are at least 21 years old and hold a full driver's licence. However, drivers in the 21-24 age bracket should expect to pay a mandatory 'young driver surcharge' applied by the operator to cover higher insurance premiums. Check the specific age policies on individual vehicle listings for exact details.\`,
    },
    {
      question: \`Are there kilometre limits on hire cars booked in \${displayCity}?\`,
      answer: \`Kilometre allowances vary by vehicle and operator. Some listings offer unlimited kilometres, which is perfect for extended road trips, while others include a daily kilometre cap (e.g., 100km or 200km per day), with per-kilometre charges applying for any excess distance travelled. Always check the 'Mileage' or 'Kilometre Allowance' section of the vehicle listing so you can plan your trip accordingly.\`,
    },
    {
      question: \`Can I easily extend my car hire period while I am in \${displayCity}?\`,
      answer: \`If you decide you need the vehicle for a longer period while in \${displayCity}, you should contact your rental operator as soon as possible. Extensions are subject to vehicle availability and must be formally agreed upon and paid for before your original rental period expires. Unauthorized extensions can lead to significant penalty fees and may void your insurance coverage.\`,
    }
  ];
}
`;

  fs.writeFileSync(path.join(__dirname, '../src/lib/seo/city-faqs.ts'), content);
}

function generateCategoryFaqs() {
  let content = `/**
 * Category-specific FAQ data for vehicle category pages.
 * Each entry maps a category name to 8–9 relevant Q&As.
 */

export interface CategoryFaq {
  question: string;
  answer: string;
}

const CATEGORY_FAQS: Record<string, CategoryFaq[]> = {
`;

  for (const cat of categories) {
    content += `  "${cat}": [
    {
      question: "What exactly is a ${cat} and is it the right choice for my rental needs?",
      answer: "A ${cat} is a specific class of vehicle designed to cater to particular driving preferences, passenger requirements, and cargo needs. Choosing a ${cat} is highly recommended if its unique features—such as its seating layout, overall size, and performance characteristics—align with the nature of your trip. Whether you need efficient city transport, spacious family travel, or robust load-carrying capacity, evaluating the core attributes of a ${cat} against your itinerary will ensure a comfortable and practical rental experience."
    },
    {
      question: "How fuel-efficient is a typical ${cat} hire vehicle?",
      answer: "The fuel efficiency of a ${cat} can vary significantly depending on the exact make, model, engine size, and whether it features a hybrid drivetrain. Generally speaking, operators maintain modern, well-serviced fleets to ensure optimal fuel economy. If minimizing your petrol or diesel expenses is a primary concern for your upcoming journey, we strongly advise checking the specific engine details on the individual vehicle listing or contacting the operator directly to inquire about expected fuel consumption rates."
    },
    {
      question: "How much luggage and how many passengers can a ${cat} comfortably accommodate?",
      answer: "Capacity is a crucial factor when hiring a ${cat}. The passenger seating and boot (trunk) space are optimized for this specific vehicle class, but exact dimensions can differ between manufacturers. Most listings will clearly indicate the maximum number of passengers and provide a reliable estimate of how many large suitcases and small carry-on bags can securely fit in the vehicle. Always verify these details to ensure everyone travels in comfort without compromising safety or visibility."
    },
    {
      question: "Do ${cat} rental vehicles come equipped with automatic or manual transmissions?",
      answer: "The vast majority of ${cat} vehicles available on our marketplace are equipped with modern automatic transmissions, as this is the overwhelming preference for most contemporary drivers navigating varied traffic conditions. However, if you specifically require or prefer a manual transmission, you can utilize the platform's filtering tools to search for manual options, or reach out to the vehicle operator directly to confirm the transmission type before finalizing your booking."
    },
    {
      question: "Are there any specific driver's licence requirements for hiring a ${cat} in Australia?",
      answer: "For standard ${cat} models that fall under a Gross Vehicle Mass (GVM) of 4.5 tonnes and carry fewer than 12 passengers, a standard Australian Class C (Car) driver's licence is entirely sufficient. However, if you are looking at particularly large, heavy, or high-capacity variants within this category, you might legally require a Light Rigid (LR) or Medium Rigid (MR) licence. It is imperative that you confirm the exact licence requirements with the operator before booking."
    },
    {
      question: "Can I use a hired ${cat} for long-distance interstate road trips?",
      answer: "Absolutely, many renters choose a ${cat} specifically for extended road trips and interstate travel due to its characteristics. However, before embarking on a long journey, you must confirm two things with the operator: first, whether their specific insurance policy permits interstate travel, and second, what the vehicle's kilometre allowance is. Look for listings that explicitly offer 'unlimited kilometres' to avoid incurring substantial excess mileage charges upon return."
    },
    {
      question: "What is the typical minimum age required to hire a ${cat}?",
      answer: "While the baseline minimum age to rent most standard vehicles is 21, the requirement for a ${cat} can sometimes be higher, particularly if the specific model is classified as a performance, luxury, or heavy commercial vehicle. In such cases, operators or their insurers may require the driver to be at least 25 years old. Drivers aged 21-24 should also anticipate a potential young-driver surcharge. Always check the specific age criteria listed by the operator."
    },
    {
      question: "Are child seats and other accessories available when hiring a ${cat}?",
      answer: "Yes, many operators understand the diverse needs of renters and offer a range of optional extras that can be fitted to a ${cat}. This frequently includes baby seats, child booster seats, GPS navigation units, and sometimes even roof racks or snow chains depending on the season and location. These accessories typically incur an additional daily fee. You should communicate your exact requirements to the operator well in advance to ensure they have the necessary equipment available."
    },
    {
      question: "How does insurance work when hiring a ${cat} through the marketplace?",
      answer: "Insurance arrangements are managed directly by the independent rental operators listed on the platform. Typically, the daily rental rate for a ${cat} includes standard comprehensive insurance or a collision damage waiver, which comes with a predetermined financial excess that you are liable for in the event of damage. Most operators provide you with the option to pay an additional daily premium to significantly reduce this excess amount. You must carefully read and understand the operator's specific terms and conditions regarding insurance before signing the rental agreement."
    }
  ],
`;
  }

  content += `};

/**
 * Returns FAQs for a given vehicle category.
 * Falls back to a generic set if no specific data exists.
 */
export function getCategoryFaqs(
  category: string,
  avgPrice?: number | null,
): CategoryFaq[] {
  if (CATEGORY_FAQS[category]) {
    return CATEGORY_FAQS[category];
  }

  // Generic fallback
  return [
    {
      question: \`How much does it typically cost to hire a \${category} in Australia?\`,
      answer: avgPrice
        ? \`Based on our current comprehensive platform listings, hiring a \${category} averages around $\${avgPrice} AUD per day on a national level. It is important to remember that exact prices will fluctuate based on the specific city you are renting in, the individual operator's pricing, the vehicle's age, and peak seasonal demand.\`
        : \`Prices for hiring a \${category} can vary significantly based on your location, the time of year, and the specific operator you select. We highly recommend browsing our current, up-to-date listings to compare daily rates and find the best possible deal for a \${category} across Australia.\`,
    },
    {
      question: \`What is the best way to book a \${category} on the Hire Car Marketplace?\`,
      answer: \`Booking is simple and direct. Browse the available \${category} listings on our platform, click on a vehicle that catches your eye to review its full details, specifications, and rental terms. From there, use the provided contact options to reach out to the local operator directly. You can arrange your pickup dates, confirm the total pricing, and finalize the booking with them. Best of all, Hire Car Marketplace charges zero booking fees.\`,
    },
    {
      question: \`Are the operators offering \${category} rentals thoroughly verified?\`,
      answer: \`Absolutely. Trust and safety are paramount on our platform. Every single operator listing a \${category} on the Hire Car Marketplace has undergone a stringent verification process. This includes mandatory ABN (Australian Business Number) validation and a comprehensive profile review before they are permitted to list any vehicles. You can confidently hire from reputable, local Australian rental companies.\`,
    },
    {
      question: \`Can I hire a \${category} for a very short duration, like a single day?\`,
      answer: \`Minimum hire periods for a \${category} are entirely at the discretion of the individual rental operators. While many operators are perfectly happy to accommodate single-day or weekend rentals, others may enforce a 2 or 3-day minimum booking period, especially during busy holiday seasons. Check the specific listing details or contact the operator to confirm their minimum rental duration.\`,
    },
    {
      question: \`Is roadside assistance included when I hire a \${category}?\`,
      answer: \`In the vast majority of cases, yes. Reputable operators providing a \${category} typically include 24/7 roadside assistance as part of the standard rental agreement to ensure your peace of mind in the event of a mechanical failure or flat battery. Always confirm this inclusion and ask for the emergency contact procedure when you collect the keys from the operator.\`,
    },
    {
      question: \`What documentation do I need to bring when picking up my \${category}?\`,
      answer: \`When you arrive to collect your \${category}, you will typically need to present a valid, full driver's licence (and an International Driving Permit if your licence is not in English), a valid credit card in the primary driver's name for the security bond, and potentially a secondary form of identification such as a passport or utility bill. Operators will clearly outline their specific documentation requirements prior to pickup.\`,
    },
    {
      question: \`Are there any restrictions on where I can drive a \${category}?\`,
      answer: \`Driving restrictions depend heavily on the operator's terms and the specific type of \${category} you hire. Common restrictions include prohibitions against driving on unsealed dirt roads, taking vehicles to specific remote islands (like K'gari/Fraser Island), or driving above the snow line without prior written authorization and fitted snow chains. Always declare your intended travel route to the operator to ensure you remain fully insured.\`,
    },
    {
      question: \`How is the security deposit (bond) handled when hiring a \${category}?\`,
      answer: \`When you hire a \${category}, the operator will typically place a pre-authorization hold on your credit card for a specific bond amount when you pick up the vehicle. This acts as security against potential damage or unpaid tolls/infringements. Provided the vehicle is returned in its original condition and all terms are met, the hold is released. The time it takes for funds to become fully available again depends on your specific bank's processing times.\`,
    }
  ];
}
`;

  fs.writeFileSync(path.join(__dirname, '../src/lib/seo/category-faqs.ts'), content);
}

generateCityFaqs();
generateCategoryFaqs();
console.log('Successfully generated extensive FAQs.');
