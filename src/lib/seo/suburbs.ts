import { createAdminClient } from "@/lib/supabase/admin";

export interface SuburbInfo {
  slug: string;
  name: string;
  parentCitySlug: string;
  parentCityName: string;
  state: string;
  postcode?: string;
  title: string;
  metaDescription: string;
  h1: string;
  introCopy: string;
  localContext: string;
  landmarks: string[];
}

export const SUBURB_REGISTRY: Record<string, Record<string, SuburbInfo>> = {
  sydney: {
    parramatta: {
      slug: "parramatta",
      name: "Parramatta",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2150",
      title: "Car Hire Parramatta (Sydney, NSW) | Compare Local Operators",
      metaDescription:
        "Looking for car hire in Parramatta, NSW? Compare verified local rental operators across Western Sydney with zero booking fees and transparent daily rates.",
      h1: "Car Hire in Parramatta, Sydney NSW",
      introCopy:
        "As Sydney's thriving second central business district, Parramatta serves as the commercial and transport hub of Greater Western Sydney. Whether you need an economical hatchback for local appointments, an executive sedan for business travel, or an SUV for family getaways across New South Wales, our platform connects you directly with trusted local operators.",
      localContext:
        "Conveniently situated along the Great Western Highway and M4 Motorway, Parramatta provides direct access to Parramatta Park, Westfield shopping precinct, and Westmead health quarter. Pick up your vehicle locally to bypass central Sydney traffic and begin your journey immediately.",
      landmarks: ["Parramatta Park", "Westfield Parramatta", "CommBank Stadium", "M4 Motorway corridor"],
    },
    bondi: {
      slug: "bondi",
      name: "Bondi",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2026",
      title: "Car Hire Bondi & Bondi Beach (Sydney, NSW) | Local Rentals",
      metaDescription:
        "Rent a car in Bondi and Bondi Beach, Sydney NSW. Compare vehicles from approved Australian rental operators near Oxford Street and Campbell Parade.",
      h1: "Car Hire in Bondi & Eastern Suburbs, Sydney",
      introCopy:
        "Famous for its iconic coastal stretch and vibrant village lifestyle, Bondi is a premier destination in Sydney's Eastern Suburbs. Renting a vehicle locally offers the ultimate freedom to explore the eastern beaches, coastal headlands, and surrounding Sydney harbor drives.",
      localContext:
        "With convenient connections via Bondi Junction and Oxford Street into central Sydney, local car rental gives you seamless transit along the coastline from South Head to Coogee, as well as easy access to the Sydney Airport gateway via Southern Cross Drive.",
      landmarks: ["Bondi Beach", "Bondi Junction Interchange", "Campbell Parade", "Bronte Coastal Drive"],
    },
    blacktown: {
      slug: "blacktown",
      name: "Blacktown",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2148",
      title: "Car Hire Blacktown, NSW | Reliable Western Sydney Vehicle Rentals",
      metaDescription:
        "Find affordable car hire in Blacktown, Western Sydney. Compare utes, SUVs and family cars from verified local Australian fleet operators.",
      h1: "Car Hire in Blacktown, Western Sydney",
      introCopy:
        "Blacktown represents one of Sydney's most populous and dynamic Western Sydney hubs. From commercial utes and cargo vans for trade requirements to spacious family SUVs, discover competitive local vehicle options without middleman markup fees.",
      localContext:
        "Located at the convergence of the M4, M7, and Great Western Highway, Blacktown is an ideal launch point for journeys to the Blue Mountains, Sydney Motorsport Park, and the growing Western Sydney Aerotropolis.",
      landmarks: ["Sydney Motorsport Park", "Blacktown Westpoint", "M7 Motorway", "Prospect Reservoir"],
    },
    chatswood: {
      slug: "chatswood",
      name: "Chatswood",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2067",
      title: "Car Hire Chatswood (Lower North Shore, Sydney) | Direct Booking",
      metaDescription:
        "Compare car hire in Chatswood on Sydney's Lower North Shore. Book direct with verified operators for business, leisure, and replacement vehicle rentals.",
      h1: "Car Hire in Chatswood, North Sydney",
      introCopy:
        "Chatswood is the bustling retail and corporate heart of Sydney's Lower North Shore. Whether visiting for multinational business or seeking a weekend getaway car, explore verified vehicles ready for convenient pickup.",
      localContext:
        "Connected via the Pacific Highway, Lane Cove Tunnel, and M2 Hills Motorway, Chatswood allows swift northbound travel towards the Central Coast or effortless crossing into the Sydney CBD.",
      landmarks: ["The Concourse", "Chatswood Chase", "Pacific Highway", "Lane Cove Tunnel corridor"],
    },
    "north-sydney": {
      slug: "north-sydney",
      name: "North Sydney",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2060",
      title: "Car Hire North Sydney (NSW) | Corporate & Leisure Rentals",
      metaDescription:
        "Premium and commercial car hire in North Sydney, NSW. Reserve verified fleet vehicles right across the Sydney Harbour Bridge with zero booking commissions.",
      h1: "Car Hire in North Sydney, NSW",
      introCopy:
        "Positioned directly opposite the Sydney Harbour Bridge, North Sydney is a prime commercial center housing tech, financial, and marketing headquarters. Find dependable corporate fleet vehicles or personal car rentals right on the north side of the harbor.",
      localContext:
        "Avoid inner-city congestion and high parking tolls by arranging your rental in North Sydney. Direct access to the Warringah Freeway and Pacific Highway makes excursions north or south effortless.",
      landmarks: ["Sydney Harbour Bridge North Approach", "Victoria Cross Precinct", "Warringah Freeway", "St Leonards Park"],
    },
    manly: {
      slug: "manly",
      name: "Manly",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2095",
      title: "Car Hire Manly & Northern Beaches (Sydney, NSW) | Book Direct",
      metaDescription:
        "Explore car hire in Manly and the Sydney Northern Beaches. Compare compact cars, convertibles, and SUVs from trusted local Australian operators.",
      h1: "Car Hire in Manly & Northern Beaches, Sydney",
      introCopy:
        "Nestled between tranquil Sydney Harbour and the Pacific Ocean, Manly is the gateway to the stunning Northern Beaches peninsula. Renting a vehicle gives you the freedom to explore coastal surf breaks, national parks, and scenic lookouts at your own pace.",
      localContext:
        "Drive north along Pittwater Road to discover Curl Curl, Dee Why, Narrabeen, and Palm Beach, or cross the Spit Bridge towards central Sydney.",
      landmarks: ["Manly Corso", "North Head Sanctuary", "Pittwater Road", "Shelly Beach"],
    },
    penrith: {
      slug: "penrith",
      name: "Penrith",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2750",
      title: "Car Hire Penrith (Blue Mountains Gateway, NSW) | Affordable Rentals",
      metaDescription:
        "Hire cars in Penrith, NSW at the foot of the Blue Mountains. Compare 4WDs, family sedans, and moving vans from verified Australian operators.",
      h1: "Car Hire in Penrith, Western Sydney",
      introCopy:
        "Set against the backdrop of the Blue Mountains and Nepean River, Penrith is an outdoor adventure center and vital commercial hub for Outer Western Sydney. Connect directly with local operators offering practical daily and long-term rental rates.",
      localContext:
        "With instant access to the M4 Western Motorway, Penrith provides the smoothest route up into Katoomba, Wentworth Falls, and the wider Central West region.",
      landmarks: ["Sydney International Regatta Centre", "Nepean River", "Blue Mountains foothills", "Westfield Penrith"],
    },
    "surry-hills": {
      slug: "surry-hills",
      name: "Surry Hills",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2010",
      title: "Car Hire Surry Hills & Inner City Sydney | Direct Operator Booking",
      metaDescription:
        "Find inner-city car hire in Surry Hills, Sydney. Browse compact cars, hybrids, and prestige vehicles from verified operators near Central Station.",
      h1: "Car Hire in Surry Hills & Inner City Sydney",
      introCopy:
        "Surry Hills is renowned for its creative agencies, celebrated dining scene, and immediate proximity to Sydney Central Station. Renting here gives city residents and visitors immediate vehicle access without the overhead of car ownership.",
      localContext:
        "Bordering the Sydney CBD, Eastern Distributor, and Southern Cross Drive, Surry Hills provides quick links south to Sydney Airport or east towards coastal parklands.",
      landmarks: ["Crown Street precinct", "Central Station approach", "Prince Alfred Park", "Eastern Distributor"],
    },
    mascot: {
      slug: "mascot",
      name: "Mascot",
      parentCitySlug: "sydney",
      parentCityName: "Sydney",
      state: "NSW",
      postcode: "2020",
      title: "Car Hire Mascot (Sydney Airport Area, NSW) | Avoid Airport Fees",
      metaDescription:
        "Compare car hire in Mascot near Sydney Kingsford Smith Airport. Book directly with local operators and skip expensive airport concession fees.",
      h1: "Car Hire in Mascot & Sydney Airport Precinct",
      introCopy:
        "Located right on the doorstep of Sydney Kingsford Smith Airport (SYD), Mascot is a premier transport hub. By booking through local off-terminal operators in Mascot, you avoid costly airport location surcharges while enjoying verified Australian vehicle quality.",
      localContext:
        "Close to General Holmes Drive, the M8 WestConnex, and Botany Road, Mascot enables rapid departures to the city center, Sutherland Shire, or western suburbs.",
      landmarks: ["Sydney Kingsford Smith Airport precinct", "M8 Motorway junction", "Botany Road", "Mascot Central"],
    },
  },

  melbourne: {
    "melbourne-cbd": {
      slug: "melbourne-cbd",
      name: "Melbourne CBD",
      parentCitySlug: "melbourne",
      parentCityName: "Melbourne",
      state: "VIC",
      postcode: "3000",
      title: "Car Hire Melbourne CBD, VIC | Compare Inner City Fleet Rentals",
      metaDescription:
        "Central Melbourne car hire in the CBD. Compare vehicles from verified Victorian rental operators near Southern Cross, Flinders Street, and Spencer Street.",
      h1: "Car Hire in Melbourne CBD, Victoria",
      introCopy:
        "The Melbourne Central Business District is the cultural, retail, and financial core of Victoria. Whether arriving at Southern Cross Station or staying downtown, pick up a verified rental vehicle to navigate Melbourne or embark on road trips across regional Victoria.",
      localContext:
        "Situated within the Hoddle Grid, the CBD provides direct connections to CityLink, the West Gate Freeway, and the Eastern Freeway.",
      landmarks: ["Southern Cross Station", "Flinders Street Station", "Collins Street precinct", "CityLink tollway"],
    },
    southbank: {
      slug: "southbank",
      name: "Southbank",
      parentCitySlug: "melbourne",
      parentCityName: "Melbourne",
      state: "VIC",
      postcode: "3006",
      title: "Car Hire Southbank (Melbourne, VIC) | Direct Operator Rates",
      metaDescription:
        "Find car hire in Southbank, Melbourne. Compare sedans, prestige vehicles, and SUVs across the Yarra River from the Melbourne CBD.",
      h1: "Car Hire in Southbank, Melbourne VIC",
      introCopy:
        "Perched along the southern bank of the Yarra River, Southbank is home to Melbourne's premier arts and entertainment precinct. Convenient local vehicle hire lets you cruise through the city or head down toward the Mornington Peninsula.",
      localContext:
        "Immediate access to the West Gate Freeway (M1) and Kings Way ensures effortless travel to Melbourne Airport, Geelong, or Bayside beaches.",
      landmarks: ["Crown Melbourne", "Southbank Promenade", "Melbourne Arts Precinct", "Kings Way arterial"],
    },
    richmond: {
      slug: "richmond",
      name: "Richmond",
      parentCitySlug: "melbourne",
      parentCityName: "Melbourne",
      state: "VIC",
      postcode: "3121",
      title: "Car Hire Richmond (Melbourne, VIC) | Inner East Vehicle Rentals",
      metaDescription:
        "Car hire in Richmond, Melbourne VIC. Compare hatchbacks, SUVs and vans near Bridge Road, Swan Street, and the MCG sports precinct.",
      h1: "Car Hire in Richmond, Melbourne",
      introCopy:
        "Richmond blends sports culture, bustling shopping strips on Bridge Road and Swan Street, and historic charm. Find affordable inner-east rentals for weekend escapes or local errands.",
      localContext:
        "Bordered by Punt Road and the Monash Freeway (CityLink), Richmond provides rapid transit south-east to Chadstone and the Yarra Valley wine district.",
      landmarks: ["Melbourne Cricket Ground (MCG)", "Bridge Road", "Swan Street", "Punt Road corridor"],
    },
    "st-kilda": {
      slug: "st-kilda",
      name: "St Kilda",
      parentCitySlug: "melbourne",
      parentCityName: "Melbourne",
      state: "VIC",
      postcode: "3182",
      title: "Car Hire St Kilda & Bayside Melbourne | Verified Local Operators",
      metaDescription:
        "Compare car hire in St Kilda and Melbourne's Bayside. Rent convertibles, compacts, and SUVs near Acland Street and St Kilda Foreshore.",
      h1: "Car Hire in St Kilda, Bayside Melbourne",
      introCopy:
        "Famous for its historic esplanade, palm-lined foreshore, and bohemian heritage, St Kilda is Melbourne's favorite beachside playground. Renting a vehicle locally allows you to cruise along Beach Road down to Brighton and Frankston.",
      localContext:
        "Easy connections via Nepean Highway and Queens Road take you into Albert Park and the Royal Botanic Gardens in under ten minutes.",
      landmarks: ["St Kilda Beach Foreshore", "Acland Street", "Luna Park Melbourne", "Nepean Highway"],
    },
    carlton: {
      slug: "carlton",
      name: "Carlton",
      parentCitySlug: "melbourne",
      parentCityName: "Melbourne",
      state: "VIC",
      postcode: "3053",
      title: "Car Hire Carlton & Lygon Street (Melbourne, VIC) | Direct Bookings",
      metaDescription:
        "Rent a car in Carlton near the University of Melbourne and Lygon Street. Quality vehicle rentals with transparent pricing and zero marketplace markups.",
      h1: "Car Hire in Carlton, Melbourne",
      introCopy:
        "Renowned as Melbourne's Little Italy, Carlton is celebrated for its historic Victorian architecture, academic institutions, and tree-lined boulevards. Browse local rental cars suitable for students, academics, and tourists alike.",
      localContext:
        "Bordering the northern perimeter of the Melbourne CBD with immediate access to Nicholson Street and the Eastern Freeway via Alexandra Parade.",
      landmarks: ["Lygon Street dining strip", "University of Melbourne", "Carlton Gardens & Royal Exhibition Building", "Alexandra Parade"],
    },
    footscray: {
      slug: "footscray",
      name: "Footscray",
      parentCitySlug: "melbourne",
      parentCityName: "Melbourne",
      state: "VIC",
      postcode: "3011",
      title: "Car Hire Footscray & Western Suburbs Melbourne | Local Deals",
      metaDescription:
        "Affordable car hire in Footscray, Melbourne. Compare fuel-efficient vehicles, utes, and family cars from verified Western Melbourne operators.",
      h1: "Car Hire in Footscray, Melbourne",
      introCopy:
        "Footscray is a vibrant multicultural center located just 5 kilometers west of Melbourne's CBD. Offering competitive rental options, it serves as a budget-friendly launch point for exploring Melbourne's western corridor.",
      localContext:
        "Close to Dynon Road, Ballarat Road, and the West Gate Tunnel corridor, Footscray connects seamlessly to Williamstown, Werribee, and Geelong.",
      landmarks: ["Footscray Market", "Maribyrnong River trail", "Ballarat Road arterial", "Victoria University Footscray"],
    },
    dandenong: {
      slug: "dandenong",
      name: "Dandenong",
      parentCitySlug: "melbourne",
      parentCityName: "Melbourne",
      state: "VIC",
      postcode: "3175",
      title: "Car Hire Dandenong, VIC | South-East Melbourne Commercial & Fleet",
      metaDescription:
        "Reliable car hire in Dandenong, Victoria. Compare commercial utes, vans, sedans and SUVs with local Australian fleet operators.",
      h1: "Car Hire in Dandenong & South-East Melbourne",
      introCopy:
        "As the industrial and manufacturing powerhouse of Greater Melbourne's south-east, Dandenong offers an extensive range of commercial utility vehicles, trucks, and personal cars.",
      localContext:
        "Strategically positioned near the Monash Freeway (M1), EastLink (M3), and Princes Highway, Dandenong provides seamless travel towards Gippsland and the Mornington Peninsula.",
      landmarks: ["Dandenong Market", "EastLink (M3) tollway", "Monash Freeway (M1)", "Princes Highway"],
    },
    "box-hill": {
      slug: "box-hill",
      name: "Box Hill",
      parentCitySlug: "melbourne",
      parentCityName: "Melbourne",
      state: "VIC",
      postcode: "3128",
      title: "Car Hire Box Hill, VIC | Eastern Suburbs Melbourne Rental Cars",
      metaDescription:
        "Find car hire in Box Hill, Melbourne Eastern Suburbs. Compare reliable sedans and family SUVs from verified local operators.",
      h1: "Car Hire in Box Hill, Eastern Melbourne",
      introCopy:
        "Box Hill is a major commercial, shopping, and healthcare capital in Melbourne's Eastern Suburbs. Enjoy the freedom of a private rental vehicle to visit surrounding leafy suburbs, shopping destinations, or the Dandenong Ranges.",
      localContext:
        "Located directly along Whitehorse Road with fast access to the Eastern Freeway and Doncaster Road.",
      landmarks: ["Box Hill Central", "Box Hill Hospital precinct", "Whitehorse Road", "Eastern Freeway corridor"],
    },
  },

  perth: {
    "perth-cbd": {
      slug: "perth-cbd",
      name: "Perth CBD",
      parentCitySlug: "perth",
      parentCityName: "Perth",
      state: "WA",
      postcode: "6000",
      title: "Car Hire Perth CBD, WA | Compare Inner City Fleet Deals",
      metaDescription:
        "Rent a car in the Perth CBD, Western Australia. Compare verified operators across St Georges Terrace, Wellington Street, and Elizabeth Quay.",
      h1: "Car Hire in Perth CBD, Western Australia",
      introCopy:
        "The Perth Central Business District overlooks the wide waters of the Swan River and Kings Park. Pick up your vehicle in downtown Perth for business meetings, city exploration, or journeys to Margaret River and the Pinnacles.",
      localContext:
        "Conveniently linked to the Mitchell Freeway (north) and Kwinana Freeway (south), the CBD provides immediate access to Western Australia's main transit arteries.",
      landmarks: ["Elizabeth Quay", "St Georges Terrace", "Kings Park & Botanic Garden", "Mitchell/Kwinana Freeway interchange"],
    },
    fremantle: {
      slug: "fremantle",
      name: "Fremantle",
      parentCitySlug: "perth",
      parentCityName: "Perth",
      state: "WA",
      postcode: "6160",
      title: "Car Hire Fremantle (Perth, WA) | Historic Port City Vehicle Rentals",
      metaDescription:
        "Explore Fremantle with a reliable rental car. Compare vehicles from verified local Western Australian operators near the harbor and South Terrace.",
      h1: "Car Hire in Fremantle, Western Australia",
      introCopy:
        "Rich in maritime history, 19th-century streetscapes, and microbreweries, Fremantle is Perth's vibrant port city. Renting a car gives you flexibility to travel down the Sunset Coast or explore the southern beaches.",
      localContext:
        "Access Fremantle via Stirling Highway, Canning Highway, or South Street, with direct links south to Rockingham and Mandurah.",
      landmarks: ["Fremantle Fishing Boat Harbour", "Fremantle Markets", "South Terrace 'Cappuccino Strip'", "Stirling Highway"],
    },
    joondalup: {
      slug: "joondalup",
      name: "Joondalup",
      parentCitySlug: "perth",
      parentCityName: "Perth",
      state: "WA",
      postcode: "6027",
      title: "Car Hire Joondalup & Northern Suburbs Perth | Direct Rentals",
      metaDescription:
        "Find car hire in Joondalup, Western Australia. Compare family SUVs, sedans, and compact vehicles from verified Northern Perth fleet operators.",
      h1: "Car Hire in Joondalup, Northern Perth",
      introCopy:
        "Joondalup is the primary regional civic center of Perth's northern coastal corridor. Renting locally allows you to explore coastal hubs like Hillarys Boat Harbour, Mullaloo Beach, and Yanchep National Park without inner-city congestion.",
      localContext:
        "Directly served by the Mitchell Freeway and Joondalup Drive, providing a fast route north to Geraldton or south to Perth city.",
      landmarks: ["Lakeside Joondalup Shopping City", "Joondalup Health Campus", "Hillarys Boat Harbour proximity", "Mitchell Freeway"],
    },
    scarborough: {
      slug: "scarborough",
      name: "Scarborough",
      parentCitySlug: "perth",
      parentCityName: "Perth",
      state: "WA",
      postcode: "6019",
      title: "Car Hire Scarborough Beach (Perth, WA) | Sunset Coast Rentals",
      metaDescription:
        "Compare car hire in Scarborough Beach, Perth WA. Rent cars from verified local Australian operators along the famous Sunset Coast.",
      h1: "Car Hire in Scarborough, Sunset Coast Perth",
      introCopy:
        "Scarborough Beach is celebrated for its golden sands, surf culture, and modern beachfront promenade. Having your own rental vehicle gives you the freedom to cruise up and down West Coast Highway and explore Perth's coastal destinations.",
      localContext:
        "Directly linked to the Perth CBD via Scarborough Beach Road and easily connected north to Trigg and Sorrento.",
      landmarks: ["Scarborough Beach Foreshore", "Scarborough Sunset Markets", "West Coast Highway", "Scarborough Beach Road"],
    },
    subiaco: {
      slug: "subiaco",
      name: "Subiaco",
      parentCitySlug: "perth",
      parentCityName: "Perth",
      state: "WA",
      postcode: "6008",
      title: "Car Hire Subiaco (Inner West Perth, WA) | Book Direct",
      metaDescription:
        "Hire cars in Subiaco, Perth WA. Quality vehicles from verified local rental companies near Rokeby Road and Kings Park.",
      h1: "Car Hire in Subiaco, Perth",
      introCopy:
        "Subiaco is a charming inner-western suburb known for boutique retail, heritage architecture, and thriving leafy streetscapes. Renting in Subiaco provides a tranquil alternative to city center vehicle pickups.",
      localContext:
        "Bordering West Perth, Kings Park, and Shenton Park, Subiaco connects swiftly to Thomas Street, Roberts Road, and Hay Street.",
      landmarks: ["Rokeby Road", "Subiaco Arts Centre", "Kings Park proximity", "Subiaco Square"],
    },
    cannington: {
      slug: "cannington",
      name: "Cannington",
      parentCitySlug: "perth",
      parentCityName: "Perth",
      state: "WA",
      postcode: "6107",
      title: "Car Hire Cannington & South-East Perth | Affordable Vehicle Hire",
      metaDescription:
        "Find car hire in Cannington, Perth WA. Compare economical hatchbacks, family cars, and commercial utes near Westfield Carousel.",
      h1: "Car Hire in Cannington, South-East Perth",
      introCopy:
        "Cannington is a vibrant commercial and retail powerhouse in Perth's south-eastern corridor, housing Western Australia's largest shopping center, Westfield Carousel.",
      localContext:
        "Situated along Albany Highway and Leach Highway with quick access to Roe Highway and Perth Airport terminals.",
      landmarks: ["Westfield Carousel", "Albany Highway commercial strip", "Leach Highway arterial", "Canning River regional park"],
    },
    midland: {
      slug: "midland",
      name: "Midland",
      parentCitySlug: "perth",
      parentCityName: "Perth",
      state: "WA",
      postcode: "6056",
      title: "Car Hire Midland (Swan Valley Gateway, WA) | Local Operators",
      metaDescription:
        "Compare car hire in Midland, Western Australia. Rent vehicles near the Swan Valley wine region and Perth Hills from verified Australian operators.",
      h1: "Car Hire in Midland & Swan Valley Gateway",
      introCopy:
        "Midland is the eastern gateway of metropolitan Perth, connecting the urban coastal plain to the world-renowned Swan Valley vineyards and historic Perth Hills. Renting here offers an ideal base for winery tours and country drives.",
      localContext:
        "Located at the convergence of Great Eastern Highway, Great Northern Highway, and Roe Highway, Midland is the launching point for travel north to the Kimberley or east to Kalgoorlie.",
      landmarks: ["Midland Gate Shopping Centre", "Historic Midland Railway Workshops", "Swan Valley wine region entry", "Great Eastern Highway"],
    },
  },
};

export function getSuburbMeta(citySlug: string, suburbSlug: string): SuburbInfo | null {
  const citySuburbs = SUBURB_REGISTRY[citySlug.toLowerCase()];
  if (!citySuburbs) return null;
  return citySuburbs[suburbSlug.toLowerCase()] || null;
}

export function getAllCuratedSuburbs(): SuburbInfo[] {
  const result: SuburbInfo[] = [];
  for (const city of Object.values(SUBURB_REGISTRY)) {
    for (const suburb of Object.values(city)) {
      result.push(suburb);
    }
  }
  return result;
}

export function getSuburbsForCity(citySlug: string): SuburbInfo[] {
  const citySuburbs = SUBURB_REGISTRY[citySlug.toLowerCase()];
  if (!citySuburbs) return [];
  return Object.values(citySuburbs);
}

export function isKnownSuburb(citySlug: string, suburbSlug: string): boolean {
  return getSuburbMeta(citySlug, suburbSlug) !== null;
}

export interface SuburbIndexingParams {
  localInventoryCount: number;
  hasVerifiedCoverage: boolean;
  metroInventoryCount?: number;
}

/**
 * Evaluates whether a suburb page is indexable.
 * Crucial rule: Evaluates local inventory and verified service coverage separately from metropolitan inventory.
 * A suburb page MUST NOT be indexed merely because other vehicles exist elsewhere in the city.
 */
export function evaluateSuburbIndexing(params: SuburbIndexingParams): { index: boolean; follow: boolean } {
  const hasLocalPresence = params.localInventoryCount > 0 || params.hasVerifiedCoverage;
  return {
    index: hasLocalPresence,
    follow: true,
  };
}

/**
 * Checks if the database confirms approved branch presence or verified coverage for a specific suburb.
 * Never claims service coverage unless confirmed by an approved branch.
 */
export async function checkVerifiedVendorCoverage(params: {
  city: string;
  suburbName: string;
  postcode?: string;
}): Promise<{ hasVerifiedCoverage: boolean; branchCount: number; vendorNames: string[] }> {
  try {
    const supabase = createAdminClient();
    const { data: branches, error } = await supabase
      .from("branches")
      .select(`
        id,
        name,
        city,
        address,
        status,
        organizations!inner(id, name, status)
      `)
      .eq("status", "approved");

    if (error || !branches) {
      return { hasVerifiedCoverage: false, branchCount: 0, vendorNames: [] };
    }

    const term = params.suburbName.toLowerCase().trim();
    const postcode = params.postcode?.trim();

    const matching = branches.filter((b) => {
      const org = b.organizations as unknown as { id: string; name: string; status: string } | null;
      if (!org || org.status !== "approved") return false;

      const branchCity = (b.city || "").toLowerCase();
      const branchName = (b.name || "").toLowerCase();
      const branchAddress = (b.address || "").toLowerCase();

      const matchesCity = branchCity === term || branchCity.includes(term);
      const matchesName = branchName.includes(term);
      const matchesAddress = branchAddress.includes(term) || (postcode ? branchAddress.includes(postcode) : false);

      return matchesCity || matchesName || matchesAddress;
    });

    const vendorNames = Array.from(
      new Set(
        matching
          .map((b) => (b.organizations as unknown as { name: string } | null)?.name)
          .filter(Boolean) as string[],
      ),
    );

    return {
      hasVerifiedCoverage: matching.length > 0,
      branchCount: matching.length,
      vendorNames,
    };
  } catch {
    return { hasVerifiedCoverage: false, branchCount: 0, vendorNames: [] };
  }
}

/**
 * Accurately describes the displayed inventory without false service-area claims.
 * If metropolitan-wide inventory is used as fallback, clearly describes it as vehicles
 * available across the greater metropolitan area.
 */
export function getSuburbInventoryDescription(params: {
  hasDirectLocalInventory: boolean;
  hasVerifiedCoverage: boolean;
  displayCity: string;
  displaySuburb: string;
  total: number;
}): string {
  if (params.total === 0) {
    return "No vehicles currently listed in this specific area.";
  }
  if (params.hasDirectLocalInventory) {
    return `Showing verified vehicles directly servicing ${params.displaySuburb}.`;
  }
  if (params.hasVerifiedCoverage) {
    return `Showing approved vehicles available across Greater ${params.displayCity} with verified operator coverage in ${params.displaySuburb}.`;
  }
  // When no verified coverage in this suburb, describe as vehicles available across the greater metropolitan area.
  // Never claim that a vendor services a suburb unless the database confirms its branch or service-area coverage.
  return `Showing approved vehicles available across the Greater ${params.displayCity} metropolitan area.`;
}

/**
 * Returns localized driving and context copy.
 * Never makes unconfirmed claims of local operator presence when coverage is unverified.
 */
export function getSuburbLocalContext(params: {
  curatedContext?: string;
  displayCity: string;
  displaySuburb: string;
  state: string;
  hasVerifiedCoverage: boolean;
}): string {
  if (params.hasVerifiedCoverage && params.curatedContext) {
    return params.curatedContext;
  }
  if (params.hasVerifiedCoverage) {
    return `Why travel across ${params.displayCity} when you can pick up your rental car right near ${params.displaySuburb}? We connect you directly with Australian fleet operators with verified service coverage in the ${params.displaySuburb} area. Whether you need an economical compact car or a spacious SUV, discover competitive local rates here.`;
  }
  return `Looking for car hire near ${params.displaySuburb}? Browse rental vehicles available across Greater ${params.displayCity}. Transact directly with verified Australian fleet operators and inquire about vehicle delivery or convenient pickup points across the metropolitan area.`;
}

/**
 * Generates accurate FAQs based on whether confirmed local coverage exists.
 */
export function getSuburbFaqs(params: {
  displaySuburb: string;
  displayCity: string;
  state: string;
  hasVerifiedCoverage: boolean;
}) {
  return [
    {
      question: `How does car hire in ${params.displaySuburb} work?`,
      answer: params.hasVerifiedCoverage
        ? `Hire Car connects you directly with verified Australian rental operators with branch presence and service coverage in ${params.displaySuburb} and ${params.displayCity}. Search listings, verify your mobile number, and submit a direct enquiry with zero middleman booking fees.`
        : `Hire Car connects you directly with verified Australian rental operators across Greater ${params.displayCity}. Search available metropolitan fleet listings, verify your mobile number, and connect directly with operators regarding vehicle availability and pickup options near ${params.displaySuburb}.`,
    },
    {
      question: `Can I pick up my rental vehicle in ${params.displaySuburb}?`,
      answer: params.hasVerifiedCoverage
        ? `Yes, participating operators provide confirmed branch pickups or local deliveries in and around ${params.displaySuburb}. Check each vehicle listing for branch locations and handover options.`
        : `Pickup availability in ${params.displaySuburb} depends on individual operator fleet locations and delivery terms. Vehicles listed are based in the Greater ${params.displayCity} metropolitan area; check listing details and enquire with operators regarding pickup or delivery arrangements.`,
    },
    {
      question: `What driver license is required for car hire in ${params.displaySuburb}, ${params.state}?`,
      answer: `You must hold a valid, unrestricted Australian driver's license (or an accepted international license with English translation) upon pickup.`,
    },
  ];
}
