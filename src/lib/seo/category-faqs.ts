/**
 * Category-specific FAQ data for vehicle category pages.
 * Each entry maps a category name to 3–5 relevant Q&As.
 */

export interface CategoryFaq {
  question: string;
  answer: string;
}

const CATEGORY_FAQS: Record<string, CategoryFaq[]> = {
  Sedan: [
    {
      question: "What is a sedan and is it the right hire car for me?",
      answer:
        "A sedan is a traditional passenger car with a separate enclosed boot (trunk). It typically seats 4–5 people comfortably and is ideal for city driving, airport transfers, and road trips where comfort and fuel efficiency matter. It's one of the most popular hire car choices in Australia.",
    },
    {
      question: "How fuel-efficient are hire sedans?",
      answer:
        "Sedans are generally among the most fuel-efficient hire car options. Most modern sedans average 7–10 litres per 100 km for petrol, with hybrid variants offering even better economy. This makes them cost-effective for longer drives and regional road trips.",
    },
    {
      question: "How many bags fit in a hire sedan?",
      answer:
        "Boot capacity varies by model, but most sedans comfortably fit 2 large suitcases and 2 carry-on bags. Confirm specific boot dimensions with the operator if you're travelling with bulky luggage.",
    },
    {
      question: "Do hire sedans come with automatic or manual transmission?",
      answer:
        "Most hire sedans on the platform are automatic, making them easy to drive in city traffic. If you need a manual, filter by transmission when browsing or ask the operator directly.",
    },
    {
      question: "Can I hire a sedan for a long-distance road trip in Australia?",
      answer:
        "Absolutely. Sedans are well-suited for long road trips thanks to their comfortable seating and good fuel economy. Check with the operator about kilometre limits — some offer unlimited km plans ideal for interstate travel.",
    },
  ],

  SUV: [
    {
      question: "What's the difference between an SUV and a 4WD hire car?",
      answer:
        "An SUV (Sport Utility Vehicle) is typically a large, raised-ride-height vehicle that may be 2WD, AWD, or 4WD. A dedicated 4WD is engineered for serious off-road use with low-range gearing. If you're heading off sealed roads (e.g., into national parks or on unsealed tracks), confirm whether the SUV is a true 4WD before booking.",
    },
    {
      question: "How many people and bags can an SUV hire car fit?",
      answer:
        "Most SUVs seat 5–7 passengers and offer significantly more cargo space than a sedan. Large SUVs can handle 4–5 suitcases plus carry-ons, making them popular for family road trips and group travel.",
    },
    {
      question: "Are hire SUVs suitable for the Australian outback?",
      answer:
        "This depends on the specific model. Many modern SUVs handle well on gravel and dirt roads but are not designed for extreme off-road terrain. For outback tracks, creek crossings, or unpaved national park roads, ask the operator for a proper 4WD with high clearance.",
    },
    {
      question: "Is SUV hire more expensive than a sedan?",
      answer:
        "SUVs typically cost more to hire per day due to their size, features, and higher fuel consumption. However, for larger groups, splitting the cost of one SUV vs. two sedans can be very economical. Compare current listings to find the best daily rate.",
    },
    {
      question: "Do hire SUVs come with roof racks or tow bars?",
      answer:
        "Some operators offer SUVs with roof racks, tow bars, or luggage carriers as extras. Check individual listings and contact the operator directly if you need specific accessories for your trip.",
    },
  ],

  "People mover": [
    {
      question: "How many passengers can a people mover hire car seat?",
      answer:
        "People movers typically seat 7–8 passengers, making them ideal for large families, group airport transfers, or team travel. Some larger models (such as Toyota HiAce commuter vans) can seat up to 12. Check the specific listing for exact seating capacity.",
    },
    {
      question: "Is a people mover easy to drive for someone used to a regular car?",
      answer:
        "Most people movers are based on car or van platforms and handle similarly to a large family wagon. They have a higher seating position and a larger turning circle than a sedan, so allow extra room when parking and reversing. Most available models are automatic.",
    },
    {
      question: "What's the difference between a people mover and a minibus hire?",
      answer:
        "A people mover typically seats up to 8 passengers and can be driven on a standard car licence. A minibus generally seats 9–22 passengers and may require a specific licence class. Confirm seating needs and licence requirements with the operator.",
    },
    {
      question: "Can I use a people mover for an airport transfer for a large group?",
      answer:
        "Yes — people movers are a popular and cost-effective option for group airport transfers. They typically offer enough boot space for 6–8 suitcases. Confirm luggage capacity with the operator, particularly for oversized bags.",
    },
    {
      question: "Are people movers fuel-efficient?",
      answer:
        "People movers use more fuel than sedans or hatchbacks due to their size and weight, typically averaging 10–14 litres per 100 km. However, when split across multiple passengers, the per-person fuel cost is often lower than booking separate cars.",
    },
  ],

  Van: [
    {
      question: "What types of van can I hire in Australia?",
      answer:
        "Available van hire options typically include compact vans (e.g., Toyota HiAce, Ford Transit), cargo vans for moving goods, and passenger vans for group travel. Browse listings on the platform to compare available models and capacity in your area.",
    },
    {
      question: "Do I need a special licence to hire a van in Australia?",
      answer:
        "Most vans up to 4.5 tonne GVM can be driven on a standard Australian car licence (Class C). Larger or heavier vans may require a light rigid (LR) or medium rigid (MR) licence. Always confirm with the operator before booking.",
    },
    {
      question: "Can I hire a van to move furniture or house contents?",
      answer:
        "Yes — cargo vans are commonly used for moving furniture, appliances, and household goods. Check the van's load capacity and internal dimensions to ensure your items will fit. Some operators also offer furniture protection equipment.",
    },
    {
      question: "How much does van hire cost per day in Australia?",
      answer:
        "Van hire costs vary by size, model, and operator. Compact vans typically start from $80–$150/day, while larger cargo vans may cost more. Check current listings on the platform to compare daily rates in your city.",
    },
    {
      question: "Is there a minimum hire period for vans?",
      answer:
        "Minimum hire periods vary by operator — some offer single-day hire, while others require a minimum of 2–3 days. Contact the operator directly to confirm availability for your required dates.",
    },
  ],

  Ute: [
    {
      question: "What can I use a hire ute for?",
      answer:
        "Utes (utility vehicles) are popular for moving garden supplies, building materials, furniture, bikes, and other cargo that won't fit in a regular car. They're also great for towing trailers (with appropriate tow bar) and for work-related tasks.",
    },
    {
      question: "How much weight can a hire ute carry?",
      answer:
        "Payload capacity varies by model. Single-cab utes typically carry 600–1,200 kg, while dual-cab utes range from 700 to 1,000 kg depending on the model. Always check the specific vehicle's payload rating and do not exceed it.",
    },
    {
      question: "Do I need a special licence to drive a hire ute?",
      answer:
        "Most utes can be driven on a standard Australian car licence (Class C) as they fall under 4.5 tonne GVM. Confirm with the operator if there are any specific requirements for the model you're hiring.",
    },
    {
      question: "Can a hire ute tow a trailer?",
      answer:
        "Many utes are equipped with tow bars and can tow trailers, boats, or caravans — but this must be confirmed with the operator. Towing capacity varies significantly by model. Never tow above the vehicle's rated capacity.",
    },
    {
      question: "What is the difference between a single-cab and dual-cab ute hire?",
      answer:
        "A single-cab ute has one row of seating (typically 2 seats) and maximum tray space. A dual-cab ute has two rows of seating (4–5 seats) plus a shorter tray. Dual-cabs are more versatile for combined work and passenger use.",
    },
  ],

  Luxury: [
    {
      question: "What luxury vehicles are available to hire in Australia?",
      answer:
        "Luxury hire options on the platform include premium European and Japanese marques — such as Mercedes-Benz, BMW, Audi, Lexus, and more — covering executive sedans, luxury SUVs, and prestige coupes. Browse current listings to see what's available in your city.",
    },
    {
      question: "Is insurance included with luxury car hire?",
      answer:
        "Insurance arrangements vary by operator. Many luxury hire operators offer their own comprehensive cover or a damage waiver option. Always clarify what cover is included and what your excess liability is before confirming a booking.",
    },
    {
      question: "Can I hire a luxury car for a special occasion or wedding?",
      answer:
        "Yes — luxury hire vehicles are popular for weddings, corporate events, and special occasions. Contact the operator directly to discuss your needs, preferred pick-up/drop-off, and any special requirements such as decoration or chauffeur options.",
    },
    {
      question: "What is the minimum age to hire a luxury car in Australia?",
      answer:
        "Many luxury car operators require drivers to be at least 25 years old due to insurance requirements. Minimum age and additional age-related fees vary by operator, so always confirm before enquiring.",
    },
    {
      question: "How much does luxury car hire cost per day in Australia?",
      answer:
        "Luxury car hire rates vary widely depending on the model and operator, typically starting from $200–$400+ AUD per day for premium sedans and higher for prestige or exotic vehicles. Browse current listings to compare rates in your city.",
    },
  ],

  Hatchback: [
    {
      question: "What makes a hatchback a good hire car choice?",
      answer:
        "Hatchbacks offer a practical combination of compact size, good fuel economy, and a versatile rear cargo area. Their smaller footprint makes them easy to park in city environments, and the hatch opening allows loading of items that wouldn't fit in a sedan boot.",
    },
    {
      question: "How many passengers can a hire hatchback seat?",
      answer:
        "Most hatchbacks comfortably seat 4–5 adults. The rear cabin space varies by model — some small hatchbacks are tight for tall adults in the back seats, so consider a larger vehicle for longer trips with full passenger loads.",
    },
    {
      question: "Are hire hatchbacks good for city driving?",
      answer:
        "Yes — hatchbacks are one of the best choices for city driving. Their smaller size makes navigating tight streets and parking much easier than larger vehicles, and they generally offer excellent fuel economy in stop-start traffic.",
    },
    {
      question: "How much boot space does a hire hatchback have?",
      answer:
        "Boot space in hatchbacks ranges from around 250 litres (small hatchbacks) to 380+ litres (medium/large hatchbacks). With the rear seats folded, most hatchbacks can carry reasonably large items. Confirm exact dimensions with the operator if needed.",
    },
    {
      question: "Is a hatchback or sedan better for a road trip?",
      answer:
        "Both work well for road trips. Sedans often have a larger, more secure boot, while hatchbacks offer flexible cargo loading. For comfort on long drives, consider a medium or large hatchback with good highway stability.",
    },
  ],

  Convertible: [
    {
      question: "Is a hire convertible practical for touring Australia?",
      answer:
        "Convertibles are a great choice for coastal and scenic drives in good weather — popular routes include the Great Ocean Road, NSW South Coast, and Queensland's Sunshine Coast hinterland. They are less practical for large groups, bad weather, or carrying lots of luggage.",
    },
    {
      question: "What is the boot space like in a hire convertible?",
      answer:
        "Convertibles typically have a smaller boot than equivalent coupes or sedans, partly due to the folding roof mechanism. Pack light — most convertibles accommodate 1–2 small suitcases comfortably.",
    },
    {
      question: "What is the minimum age to hire a convertible?",
      answer:
        "Most operators require drivers to be at least 25 years old to hire a convertible. Young-driver fees or age restrictions vary by operator, so always confirm when making an enquiry.",
    },
    {
      question: "Can I hire a convertible in winter in Australia?",
      answer:
        "Australia's mild climate means convertibles can be enjoyable year-round in northern states. In Victoria, Tasmania, and the ACT, winters can be cold — a convertible with a heated cabin and good heater makes it manageable, but always check the season and forecast for your region.",
    },
    {
      question: "How many people can a hire convertible seat?",
      answer:
        "Most hire convertibles are 2-seaters or 4-seaters. Four-seat convertibles often have smaller rear seats suitable for children or short trips rather than full adult comfort. Confirm seating capacity with the operator.",
    },
  ],

  Coupe: [
    {
      question: "What is a coupe and who is it best suited for?",
      answer:
        "A coupe is a two-door car with a fixed roof and a sloping, sporty roofline. It typically seats 2 adults in the front and 2 in a smaller rear seat. Coupes are best for drivers seeking a sporty, stylish hire car for couple or solo trips.",
    },
    {
      question: "Is a coupe practical for a road trip?",
      answer:
        "Coupes are comfortable for 1–2 people on road trips, with reasonable boot space and good highway performance. For 3–4 passengers or significant luggage, consider a sedan or wagon instead.",
    },
    {
      question: "Are hire coupes automatic or manual?",
      answer:
        "Most hire coupes available on the platform are automatic. If you specifically want a manual coupe, check individual listings or contact the operator to confirm transmission type before enquiring.",
    },
    {
      question: "What is the minimum age to hire a coupe?",
      answer:
        "Age requirements vary by operator and the specific model — particularly for performance or prestige coupes which often require drivers to be 25+. Always confirm with the operator.",
    },
    {
      question: "How do coupes compare to sedans on fuel economy?",
      answer:
        "Coupes are generally comparable to sedans in fuel efficiency, as they share similar drivetrains. Performance or V8 coupes will use more fuel. Check the vehicle specs in each listing for real-world fuel consumption figures.",
    },
  ],

  Wagon: [
    {
      question: "What is a station wagon hire car good for?",
      answer:
        "Station wagons offer the passenger comfort of a sedan with significantly more cargo space. They are ideal for family road trips, airport runs with lots of luggage, and carrying sports or outdoor gear. The flat-folding rear seats add even more versatility.",
    },
    {
      question: "How much cargo space does a hire wagon have?",
      answer:
        "Boot capacity varies by model, typically from 500–700 litres with seats up and 1,500–2,000 litres with rear seats folded. This makes them comparable to small SUVs for practicality, often at a lower hire cost.",
    },
    {
      question: "Is a wagon a good alternative to an SUV hire car?",
      answer:
        "For road trips on sealed roads, a wagon can be an excellent and often more economical alternative to an SUV. Wagons sit lower, handle better, and often get better fuel economy. If you need off-road capability, an SUV or 4WD is a better choice.",
    },
    {
      question: "Can a hire wagon tow a trailer?",
      answer:
        "Some wagons are fitted with tow bars and can tow light trailers, camper trailers, or boat trailers up to the vehicle's rated towing capacity. Confirm towing capability and maximum weight with the operator before booking.",
    },
    {
      question: "How many passengers can a hire wagon seat?",
      answer:
        "Most wagons seat 5 adults comfortably. Some larger wagon models (such as 7-seat wagons) offer a third row, though rear-most seats are typically small and best for children.",
    },
  ],

  "Sports car": [
    {
      question: "What sports cars are available to hire in Australia?",
      answer:
        "The range of sports cars available through Hire Car Marketplace varies by city and operator. Listings may include models such as the Ford Mustang, Toyota GR86, Porsche 718, and other performance vehicles. Browse current listings to see what's available near you.",
    },
    {
      question: "What is the minimum age to hire a sports car?",
      answer:
        "Most operators require sports car drivers to be at least 25 years old. Additional conditions may include a clean driving record and specific licence class. Always confirm requirements with the operator before enquiring.",
    },
    {
      question: "Is insurance included with sports car hire?",
      answer:
        "Insurance cover varies by operator. Many sports car hire operators require a bond and offer a damage waiver to reduce or eliminate your excess. Confirm all insurance terms in detail before confirming a booking.",
    },
    {
      question: "Can I hire a sports car for a track day?",
      answer:
        "Track use is generally not permitted with hire vehicles. Always read the operator's terms and conditions — most hire agreements explicitly prohibit use on racetracks, circuits, or speed events.",
    },
    {
      question: "How does sports car hire work on Hire Car Marketplace?",
      answer:
        "Browse available sports car listings, click through to view details, and contact the operator directly to check availability, arrange pickup, and confirm pricing. There are no booking fees — you deal directly with the local operator.",
    },
  ],

  Minibus: [
    {
      question: "How many passengers can a hire minibus seat?",
      answer:
        "Minibuses available on the platform typically seat between 9 and 22 passengers. The most common hire minibus configurations are 12-seat and 15-seat. Always confirm exact seating capacity with the operator.",
    },
    {
      question: "Do I need a special licence to drive a hire minibus?",
      answer:
        "In Australia, minibuses seating more than 12 passengers typically require a medium rigid (MR) or higher licence class. Minibuses up to 12 seats may be driveable on a standard car licence depending on the GVM — confirm with the operator and your state's licence requirements.",
    },
    {
      question: "What are hire minibuses commonly used for in Australia?",
      answer:
        "Minibus hire is popular for school excursions, sporting team transport, corporate group travel, wedding party transfers, airport group pickups, and conference shuttles. Contact operators directly to discuss your specific requirements.",
    },
    {
      question: "How much does minibus hire cost per day?",
      answer:
        "Minibus hire rates vary depending on passenger capacity, model, and operator. Browse current listings on the platform to compare available daily rates in your city.",
    },
    {
      question: "Can I hire a minibus for a multi-day trip?",
      answer:
        "Yes — many operators offer multi-day minibus hire. Longer-term hire often comes with a reduced daily rate. Contact the operator directly to arrange your dates and discuss kilometre inclusions for extended hire.",
    },
  ],

  Truck: [
    {
      question: "What types of hire trucks are available in Australia?",
      answer:
        "Hire trucks on the platform range from light trucks and tray trucks through to larger rigid trucks. Common uses include moving house, transporting equipment, landscaping deliveries, and commercial freight. Browse listings to find available truck types in your city.",
    },
    {
      question: "What licence do I need to hire a truck?",
      answer:
        "Light trucks up to 4.5 tonne GVM can be driven on a standard Class C car licence. Larger trucks require a Light Rigid (LR) or Medium Rigid (MR) licence. Always confirm the GVM and licence requirements with the operator before booking.",
    },
    {
      question: "Can I hire a truck to move house?",
      answer:
        "Yes — truck hire is a popular and cost-effective option for house moves. Ensure you select a truck with sufficient load volume and payload capacity for your belongings. Ask the operator about load-securing equipment such as tie-down straps and blankets.",
    },
    {
      question: "Is there a minimum hire period for trucks?",
      answer:
        "Minimum hire periods vary by operator. Many offer single-day or weekend hire options, while others have a minimum of 2–3 days. Contact the operator directly to confirm availability and minimum hire terms.",
    },
    {
      question: "How do I estimate what size truck I need for my move?",
      answer:
        "As a rough guide: a 1-bedroom apartment typically needs a 3–4 tonne truck, a 2–3 bedroom home needs a 6–8 tonne truck, and a large family home may need 8–12+ tonnes. When in doubt, go larger — it's better to have extra space than to need two trips.",
    },
  ],

  Campervan: [
    {
      question: "What's included in a campervan hire in Australia?",
      answer:
        "Inclusions vary by operator, but most campervans come with a bed, basic cooking facilities (gas burner or microwave), a small sink, storage, and bedding. Some are fully self-contained with a shower and toilet. Always confirm what's included with the operator before booking.",
    },
    {
      question: "Do I need a special licence to hire a campervan?",
      answer:
        "Most campervans can be driven on a standard Australian car licence (Class C) as they fall under 4.5 tonne GVM. Larger motorhomes may require a light rigid (LR) licence. Confirm the GVM and licence requirements with the operator.",
    },
    {
      question: "Where can I park and stay overnight in a hire campervan?",
      answer:
        "You can stay at caravan parks, campgrounds (national park and private), and designated free-camping areas. If the campervan is certified self-contained, you may have more free camping options. Download the Wikicamps Australia app to find and plan campsites along your route.",
    },
    {
      question: "How much does campervan hire cost per day in Australia?",
      answer:
        "Campervan hire rates vary widely based on size, age, and features. Compact 2-berth campervans typically start from $100–$200/day, while larger self-contained motorhomes can be $200–$400+/day. Browse current listings to compare pricing in your area.",
    },
    {
      question: "What is the best time of year to hire a campervan in Australia?",
      answer:
        "The best time depends on your destination. The dry season (April–October) is ideal for northern Australia and the outback. For southern states and Tasmania, summer (November–March) offers the warmest weather. Spring and autumn are pleasant nearly everywhere and parks are less crowded than school holidays.",
    },
  ],
};

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
      question: `How much does ${category} hire cost in Australia?`,
      answer: avgPrice
        ? `Based on current listings, ${category} hire averages around $${avgPrice} AUD per day nationally. Prices vary by city, operator, and season.`
        : `Prices vary by city and operator. Browse current listings to compare daily rates for ${category} hire across Australia.`,
    },
    {
      question: `How do I book a ${category} on Hire Car Marketplace?`,
      answer: `Browse available ${category} listings, click through to see full details, and contact the operator directly to arrange pickup dates and pricing. There are no booking fees on Hire Car Marketplace.`,
    },
    {
      question: `Are ${category} hire operators verified?`,
      answer: `Yes — all operators on Hire Car Marketplace are verified with ABN validation and go through an approval process before listing. You can hire with confidence from local Australian rental companies.`,
    },
  ];
}
