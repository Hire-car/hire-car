/**
 * City-specific FAQ data for location pages.
 * Each entry maps a city slug to 3–5 locally-relevant Q&As.
 */

export interface CityFaq {
  question: string;
  answer: string;
}

const CITY_FAQS: Record<string, CityFaq[]> = {
  sydney: [
    {
      question: "Do I need a car to get around Sydney?",
      answer:
        "Sydney has good public transport in the CBD and inner suburbs, but a hire car is very useful for visiting areas like the Northern Beaches, Royal National Park, Blue Mountains, and the Hunter Valley — all of which are difficult to reach by train or bus.",
    },
    {
      question: "Where can I pick up a hire car in Sydney?",
      answer:
        "Most Hire Car Marketplace operators in Sydney are based across the CBD, North Shore, Western Suburbs, and near Sydney Airport (SYD). Pickup locations vary by operator — contact them directly to arrange a convenient handover point.",
    },
    {
      question: "Are there toll roads I should know about in Sydney?",
      answer:
        "Yes — Sydney has an extensive toll road network including the Harbour Tunnel, Cross City Tunnel, M7, M5, and others. Most tolls are cashless and charged via e-Tag or a linked number plate account. Confirm with your operator how tolls are handled for your hire vehicle.",
    },
    {
      question: "Is parking easy in Sydney with a rental car?",
      answer:
        "Parking in central Sydney can be expensive and limited. Many rental customers prefer to park at their hotel or use park-and-ride facilities in the suburbs. Always check local parking signs and time restrictions to avoid fines.",
    },
    {
      question: "What is the minimum age to hire a car in Sydney?",
      answer:
        "Minimum age requirements vary by operator, but most require drivers to be at least 21 years old. Drivers under 25 may attract a young-driver surcharge. Always check the individual operator's terms before booking.",
    },
  ],

  melbourne: [
    {
      question: "Do I need a hire car in Melbourne or is public transport enough?",
      answer:
        "Melbourne's tram, train, and bus network covers the inner city well. However, a rental car is ideal for day trips to the Yarra Valley, Mornington Peninsula, Great Ocean Road, or Dandenong Ranges, which are not easily accessible by public transport.",
    },
    {
      question: "What are Melbourne's hook turns and do they affect hire car drivers?",
      answer:
        "Hook turns are a unique Melbourne traffic rule for turning right at certain CBD intersections — you wait in the left lane instead of the right before turning on a green light. They apply at specific signposted intersections. Plan your CBD route in advance if you're unfamiliar with them.",
    },
    {
      question: "Are there tram tracks I need to watch out for when driving?",
      answer:
        "Yes — Melbourne's extensive tram network means tram tracks are embedded in many roads. Take extra care when changing lanes or parking near tracks, and always give way to trams at designated stops.",
    },
    {
      question: "Where can I pick up a hire car in Melbourne?",
      answer:
        "Hire Car Marketplace operators in Melbourne are spread across the CBD, Bayside, Dandenong, and suburbs near Melbourne Airport (MEL). Pickup locations are arranged directly with the operator at time of booking.",
    },
    {
      question: "What is the minimum age requirement to hire a car in Melbourne?",
      answer:
        "Most operators require drivers to be at least 21. Drivers aged 21–24 may be subject to a young-driver surcharge. Confirm age and licence requirements with the specific operator before enquiring.",
    },
  ],

  brisbane: [
    {
      question: "Is Brisbane a good city to explore by hire car?",
      answer:
        "Yes — Brisbane is very car-friendly. While the CBD is walkable, a hire car opens up the Gold Coast, Sunshine Coast, Toowoomba, and the Scenic Rim — all popular day trips from the city.",
    },
    {
      question: "Where can I pick up a hire car in Brisbane?",
      answer:
        "Operators on Hire Car Marketplace are based across Brisbane CBD, Southside, Ipswich, and areas near Brisbane Airport (BNE). Pickup is arranged directly with your chosen operator.",
    },
    {
      question: "Does Brisbane have tolls I should be aware of?",
      answer:
        "Brisbane has several toll roads including the Legacy Way, Clem7 Tunnel, Airport Link, and the Go Between Bridge. Most require a Linkt account or linked plate. Check with your operator how tolls are handled for your hire vehicle.",
    },
    {
      question: "What is the weather like for driving in Brisbane?",
      answer:
        "Brisbane enjoys warm, sunny weather year-round, making it great for road trips. Be prepared for afternoon summer storms and heavy downpours during the wet season (November–March), which can reduce visibility quickly.",
    },
    {
      question: "What are the age requirements to hire a car in Brisbane?",
      answer:
        "Most operators require drivers to be at least 21 years old, with a young-driver fee potentially applying to those aged 21–24. Always check the operator's specific terms.",
    },
  ],

  perth: [
    {
      question: "Do I need a hire car in Perth?",
      answer:
        "A hire car is highly recommended in Perth. While the city centre and train lines are accessible, suburbs are spread out and key attractions like Margaret River, Fremantle, and Swan Valley are best explored by car.",
    },
    {
      question: "Where can I pick up a hire car in Perth?",
      answer:
        "Hire Car Marketplace operators are located across the CBD, Fremantle, northern suburbs, and near Perth Airport (PER). Coordinate pickup details directly with the operator.",
    },
    {
      question: "Are there toll roads in Perth?",
      answer:
        "Perth currently has no major toll roads, making it one of Australia's most road-trip-friendly cities. You can drive freely across the metro area without worrying about e-tag charges.",
    },
    {
      question: "What is the best time of year to hire a car and road trip from Perth?",
      answer:
        "Spring (September–November) and autumn (March–May) offer the most pleasant driving conditions. Summer can be extremely hot — particularly in inland areas — so ensure your hire car has working air conditioning.",
    },
    {
      question: "What licence do I need to hire a car in Perth?",
      answer:
        "A valid Australian state driver's licence is accepted by all operators. International visitors can use a valid overseas licence along with an International Driving Permit (IDP) if the licence is not in English.",
    },
  ],

  adelaide: [
    {
      question: "Is Adelaide easy to drive in?",
      answer:
        "Adelaide is one of Australia's most driver-friendly capitals — wide roads, a simple grid layout in the CBD, and easy access to the Adelaide Hills, Barossa Valley, and McLaren Vale wine regions make it ideal for a hire car trip.",
    },
    {
      question: "Where can I pick up a hire car in Adelaide?",
      answer:
        "Hire Car Marketplace operators are based across the city and near Adelaide Airport (ADL). Arrange pickup details directly with your chosen operator when making an enquiry.",
    },
    {
      question: "Are there good day-trip routes from Adelaide with a hire car?",
      answer:
        "Absolutely. The Barossa Valley is just an hour away, the Adelaide Hills and Hahndorf are 30 minutes from the CBD, and the Fleurieu Peninsula and McLaren Vale are ideal for wine and beach day trips.",
    },
    {
      question: "Does Adelaide have tolls?",
      answer:
        "Adelaide currently has no major toll roads, so you can drive around the metro area and to nearby regions without any toll charges.",
    },
    {
      question: "What is the minimum age to hire a car in Adelaide?",
      answer:
        "Most operators require drivers to be 21 or older. A young-driver surcharge may apply to those aged 21–24. Always confirm requirements with the individual operator.",
    },
  ],

  "gold-coast": [
    {
      question: "Do I need a hire car on the Gold Coast?",
      answer:
        "The Gold Coast light rail (G:link) connects Broadbeach to Helensvale, making the strip accessible without a car. However, a hire car is great for exploring the Hinterland, Lamington National Park, Currumbin Wildlife Sanctuary, and making day trips to Brisbane or Byron Bay.",
    },
    {
      question: "Where can I pick up a hire car on the Gold Coast?",
      answer:
        "Operators on Hire Car Marketplace are located across Surfers Paradise, Broadbeach, Coolangatta, and near Gold Coast Airport (OOL). Pickup location is agreed directly with the operator.",
    },
    {
      question: "Are there tolls on the Gold Coast or when driving to Brisbane?",
      answer:
        "The Pacific Motorway (M1) between Brisbane and the Gold Coast has several toll points managed via Linkt. Confirm with your operator how tolls are handled for your hire vehicle before travelling.",
    },
    {
      question: "What is the best car type to hire on the Gold Coast?",
      answer:
        "A compact or SUV suits most travellers. If you're heading into the Hinterland on unsealed roads, ask about 4WD options. For groups or families, a people-mover or van may be a better choice.",
    },
    {
      question: "What documents do I need to hire a car on the Gold Coast?",
      answer:
        "You'll need a valid driver's licence (Australian or overseas with an IDP if not in English) and some form of ID. Credit card requirements vary by operator — confirm directly when booking.",
    },
  ],

  cairns: [
    {
      question: "Do I need a hire car in Cairns?",
      answer:
        "A hire car is strongly recommended in Cairns. While the city centre is walkable, a car is essential for visiting the Atherton Tablelands, Daintree Rainforest, Cape Tribulation, and Kuranda — all spectacular destinations difficult to reach by public transport.",
    },
    {
      question: "Can I drive to Cape Tribulation in a regular hire car?",
      answer:
        "The road to Cape Tribulation via the Daintree Ferry is accessible in a 2WD vehicle during dry conditions, but some sections north of Cape Tribulation require a 4WD. Always check road conditions and confirm with your operator before heading north.",
    },
    {
      question: "Where can I pick up a hire car in Cairns?",
      answer:
        "Hire Car Marketplace operators are located in and around Cairns, including near Cairns Airport (CNS). Coordinate directly with the operator for pickup arrangements.",
    },
    {
      question: "What are the driving conditions like in Cairns during wet season?",
      answer:
        "Cairns wet season (November–April) brings heavy tropical rainfall that can cause flash flooding and road closures, particularly on routes to the Daintree. Always check road conditions via Queensland Road Conditions before venturing out.",
    },
    {
      question: "What is the minimum age to hire a car in Cairns?",
      answer:
        "Most operators require a minimum age of 21, and young-driver fees may apply for those under 25. Check the specific operator's requirements before enquiring.",
    },
  ],

  darwin: [
    {
      question: "Do I need a hire car in Darwin?",
      answer:
        "Yes — Darwin is a car-dependent city and a hire car is essential for exploring beyond the CBD. Kakadu National Park, Litchfield National Park, and Berry Springs are all popular day trips that require your own transport.",
    },
    {
      question: "Can I drive to Kakadu in a regular hire car?",
      answer:
        "Most main roads into Kakadu (via the Arnhem Highway) are sealed and accessible in a 2WD. However, many internal park tracks and attractions like Jim Jim Falls require a 4WD, especially in the wet season. Confirm track conditions with Parks Australia before your trip.",
    },
    {
      question: "When is the best time to hire a car and explore around Darwin?",
      answer:
        "The dry season (May–October) is the best time for road trips from Darwin. During the wet season (November–April), many outback roads and park tracks become impassable due to flooding.",
    },
    {
      question: "Where can I pick up a hire car in Darwin?",
      answer:
        "Operators on Hire Car Marketplace are based in Darwin, including near Darwin Airport (DRW). Pickup is arranged directly with the operator at the time of enquiry.",
    },
    {
      question: "Are there speed limits I should be aware of on NT highways?",
      answer:
        "The Northern Territory removed its open speed limit policy in 2016. The standard open road speed limit is now 130 km/h on some NT highways. Always check current signage and road conditions. In-town limits follow standard Australian rules.",
    },
  ],

  hobart: [
    {
      question: "Do I need a hire car in Hobart?",
      answer:
        "A hire car is highly recommended in Hobart and across Tasmania. Public transport is limited outside the city, and must-see destinations like MONA, Port Arthur Historic Site, Freycinet National Park, and Cradle Mountain all require your own vehicle.",
    },
    {
      question: "Can I take a hire car on the Spirit of Tasmania ferry?",
      answer:
        "This depends on the operator — most hire car companies prohibit taking vehicles on the Spirit of Tasmania. If travelling by ferry, it is generally better to hire a car once you arrive in Hobart rather than bringing one from the mainland.",
    },
    {
      question: "What roads and driving conditions should I expect in Tasmania?",
      answer:
        "Tasmanian roads outside Hobart can be narrow, winding, and hilly — particularly in the highlands. Be prepared for wildlife on roads at dawn and dusk (wallabies, wombats, and Tasmanian devils are common hazards). Reduce speed at night.",
    },
    {
      question: "Where can I pick up a hire car in Hobart?",
      answer:
        "Hire Car Marketplace operators are based in Hobart and near Hobart Airport (HBA) at Cambridge. Confirm pickup details directly with your operator.",
    },
    {
      question: "What is the weather like for driving in Tasmania?",
      answer:
        "Tasmania's weather is famously changeable — you can experience four seasons in one day, particularly in the central highlands. Pack for all conditions and check forecasts before heading out on mountain routes like the road to Cradle Mountain.",
    },
  ],

  canberra: [
    {
      question: "Is a hire car useful in Canberra?",
      answer:
        "Yes — while Canberra's attractions are spread out and public transport is limited, a hire car makes it easy to visit Parliament House, the Australian War Memorial, Questacon, the National Gallery, and the Snowy Mountains (a 2.5-hour drive away).",
    },
    {
      question: "Where can I pick up a hire car in Canberra?",
      answer:
        "Hire Car Marketplace operators are based in and around Canberra, including near Canberra Airport (CBR). Arrange pickup directly with your operator.",
    },
    {
      question: "Are there speed cameras in Canberra?",
      answer:
        "Yes — Canberra is known for having a high density of fixed and mobile speed cameras. Strictly observe posted speed limits throughout the ACT, as fines can be substantial.",
    },
    {
      question: "What is Canberra like to drive around?",
      answer:
        "Canberra is a planned city with wide roads and roundabouts that can be unfamiliar to visitors. Traffic is generally light compared to Sydney or Melbourne. The city is divided into distinct districts connected by parkways.",
    },
    {
      question: "What is the minimum age to hire a car in Canberra?",
      answer:
        "Most operators require a minimum age of 21, with possible young-driver fees for those under 25. Always confirm the specific operator's requirements before making an enquiry.",
    },
  ],

  newcastle: [
    {
      question: "Do I need a hire car in Newcastle?",
      answer:
        "Newcastle has a light rail line and bus network covering the CBD and inner suburbs, but a hire car is ideal for exploring the Hunter Valley wine region (just 45 minutes away), Port Stephens, Nelson Bay, and the beaches and national parks north of the city.",
    },
    {
      question: "Where can I pick up a hire car in Newcastle?",
      answer:
        "Hire Car Marketplace operators are located across the Newcastle area, including near Newcastle Airport (NTL) at Williamtown. Contact your chosen operator directly to arrange a pickup location.",
    },
    {
      question: "What are the best day trips from Newcastle with a hire car?",
      answer:
        "The Hunter Valley wine region, Port Stephens and its sand dunes, Lake Macquarie, Barrington Tops National Park, and the Central Coast are all within easy reach of Newcastle — making it a great base for a regional road trip.",
    },
    {
      question: "Are there tolls between Newcastle and Sydney?",
      answer:
        "Sections of the M1 Pacific Motorway between Newcastle and Sydney are tolled. If you plan to drive to Sydney in your hire car, check how tolls are handled by your operator in advance.",
    },
    {
      question: "What is the minimum age to hire a car in Newcastle?",
      answer:
        "Most operators require drivers to be at least 21 years old. Drivers aged 21–24 may incur a young-driver surcharge. Confirm with the specific operator before booking.",
    },
  ],

  wollongong: [
    {
      question: "Why hire a car in Wollongong?",
      answer:
        "Wollongong is perfectly located for coastal and mountain exploration. A hire car lets you drive the Grand Pacific Drive (one of Australia's most scenic coastal routes), visit Royal National Park, and reach the Southern Highlands — all within an hour of the city.",
    },
    {
      question: "Where can I pick up a hire car in Wollongong?",
      answer:
        "Hire Car Marketplace operators are based across the Wollongong area (also known as the Illawarra). Pickup is arranged directly with the operator. Note: the nearest major airport is Sydney Airport (SYD), about 80 km north.",
    },
    {
      question: "Is the road between Wollongong and Sydney easy to drive?",
      answer:
        "The F6 freeway offers a direct route to Sydney, while the Lawrence Hargrave Drive coastal route is more scenic but narrow and winding. The Sea Cliff Bridge section is a highlight. Allow extra time if taking the scenic route.",
    },
    {
      question: "What are the best driving routes from Wollongong?",
      answer:
        "South along the coast towards Kiama, Gerringong, and Shoalhaven; west up to the Southern Highlands through Macquarie Pass; or north along Lawrence Hargrave Drive to Royal National Park and Sydney are all excellent hire car itineraries.",
    },
    {
      question: "What is the minimum age to hire a car in Wollongong?",
      answer:
        "Most operators require a minimum age of 21. A young-driver surcharge may apply for drivers aged 21–24. Check the individual operator's terms before enquiring.",
    },
  ],
};

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
      question: `How much does it cost to hire a car in ${displayCity}?`,
      answer: avgPrice
        ? `Based on current listings, the average car hire in ${displayCity} costs around $${avgPrice} AUD per day. Prices vary depending on vehicle type, rental duration, and operator.`
        : `Car hire prices in ${displayCity} vary based on the vehicle type and operator. Browse current listings to compare daily rates.`,
    },
    {
      question: `How do I hire a car in ${displayCity} on Hire Car Marketplace?`,
      answer: `Browse available vehicles on this page, then click through to a listing to view full details. Contact the operator directly to arrange dates, pricing, and pickup. There are no booking fees on Hire Car Marketplace.`,
    },
    {
      question: `Are the operators in ${displayCity} verified?`,
      answer: `Yes — all operators on Hire Car Marketplace are verified with ABN validation and go through an approval process before listing. You can hire with confidence from local rental companies.`,
    },
  ];
}
