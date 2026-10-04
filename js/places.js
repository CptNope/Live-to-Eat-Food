/* Live to Eat Food — concept data.
   Every place is real. "tina" holds a short excerpt from Tina's own public post, with a link;
   places without "tina" are listed but she hasn't covered them yet.
   Sources for facts are listed in the README. Map x/y are positions on the schematic map (900 x 600). */
var LTEF = window.LTEF = window.LTEF || {};

LTEF.areas = {
  "canal":        { name: "Canal District",   siding: "brick",   town: "Worcester" },
  "downtown":     { name: "Downtown",         siding: "blue",    town: "Worcester" },
  "shrewsbury-st":{ name: "Shrewsbury Street",siding: "mustard", town: "Worcester" },
  "park-ave":     { name: "Park Ave",         siding: "green",   town: "Worcester" },
  "south":        { name: "South Worcester",  siding: "green",   town: "Worcester" },
  "shrewsbury":   { name: "Shrewsbury",       siding: "bluelt",  town: "Shrewsbury" },
  "leominster":   { name: "Leominster",       siding: "greenlt", town: "Leominster" }
};

LTEF.places = [
  {
    id: "hungry-bowl", name: "Hungry Bowl", num: "865", street: "Merriam Ave", area: "leominster",
    cuisine: "Mongolian BBQ", cravings: ["bowls", "new"], with: ["anyone", "group", "family"],
    dish: "Mongolian BBQ, off the grill", tone: "t-chili", x: 545, y: 38, isNew: true,
    tina: { quote: "It's un-bowl-ievable that I've never tried Mongolian BBQ before.", date: "Feb 2026", sort: 20260209,
            url: "https://www.tiktok.com/@livetoeatfoodie/video/7604965242379996430", platform: "TikTok" },
    facts: ["About 30 minutes north of Worcester on I-190", "Tina's first time trying Mongolian BBQ"]
  },
  {
    id: "american-flatbread", name: "American Flatbread Co", num: "85", street: "Green St", area: "canal",
    cuisine: "Flatbread and candlepin", cravings: ["pizza", "drinks", "new"], with: ["anyone", "date", "group", "family"],
    dish: "Wood-fired flatbread upstairs, candlepin lanes downstairs", tone: "t-pie", x: 478, y: 346, isNew: true, page: "place.html",
    tina: { quote: "Please don't crowd the place cause I wanna go back.", date: "May 2025", sort: 20250528,
            url: "https://www.tiktok.com/@livetoeatfoodie/video/7509509382808292651", platform: "TikTok" },
    facts: ["Opened May 10, 2025, inside The Cove", "10 candlepin lanes, rented by the hour", "10 New England drafts"]
  },
  {
    id: "racha-thai", name: "Racha Thai", num: "545", street: "Southwest Cutoff", area: "south",
    cuisine: "Thai", price: "$15–30", cravings: ["spicy", "bowls"], with: ["anyone", "date", "family"],
    dish: "Thai, at The Worcester Fair", tone: "t-chili", x: 397, y: 446,
    tina: { quote: "Our favorite Thai place in Worcester has to be Racha Thai.", date: "Mar 2025", sort: 20250327,
            url: "https://www.tiktok.com/@livetoeatfoodie/video/7486636461693979946", platform: "TikTok" },
    facts: ["Inside The Worcester Fair plaza", "Price range $15–30"]
  },
  {
    id: "honeygrow", name: "honeygrow", num: "193", street: "Boston Turnpike", area: "shrewsbury",
    cuisine: "Stir-fry", cravings: ["bowls", "new", "quick"], with: ["anyone", "family"],
    dish: "Made-to-order stir-fry, off Route 9", tone: "t-broth", x: 593, y: 338, isNew: true,
    tina: { quote: "Ca-noodling around with some honeygrow. What's your order?", date: "Jul 2025", sort: 20250729,
            url: "https://www.tiktok.com/@livetoeatfoodie/video/7532590916696132919", platform: "TikTok" },
    facts: ["Opened July 7, 2025, at Lakeway Commons", "Stir-fry, salads and honeybars"]
  },
  {
    id: "ground-round", name: "Ground Round", num: "271", street: "Grafton St", area: "shrewsbury",
    cuisine: "American pub", cravings: ["classic"], with: ["anyone", "group", "family"],
    dish: "Pub menu, the whole spread", tone: "t-diner", x: 629, y: 408,
    tina: { quote: "We found the most well rounded menu at Ground Round!", date: "Sept 2025", sort: 20250927,
            url: "https://www.tiktok.com/@livetoeatfoodie/video/7554878364746648846", platform: "TikTok" },
    facts: ["On Grafton St in Shrewsbury"]
  },
  {
    id: "playa-bowls", name: "Playa Bowls", num: "1", street: "Green Island Blvd", area: "canal",
    cuisine: "Acai and fruit bowls", cravings: ["bowls", "quick", "sweet"], with: ["anyone", "family"],
    dish: "Acai bowls, piled high", tone: "t-tuna", x: 522, y: 384,
    tina: { quote: "Quit playa-ing around and stop at Playa Bowls.", date: "Oct 2025", sort: 20251008,
            url: "https://www.tiktok.com/@livetoeatfoodie/video/7558980619980541197", platform: "TikTok" },
    facts: ["Green Island, near Kelley Square"]
  },
  {
    id: "bocado", name: "Bocado Tapas Wine Bar", num: "82", street: "Winter St", area: "canal",
    cuisine: "Spanish tapas", price: "$30 and under", cravings: ["drinks"], with: ["date", "group"],
    dish: "40+ tapas, paella, Spanish wine", tone: "t-saffron", x: 524, y: 346,
    tina: { quote: "Featured on Tina's Instagram.", date: "Instagram", sort: 20240101,
            url: "https://www.instagram.com/livetoeatfood/", platform: "Instagram", noQuote: true },
    facts: ["Exclusively Spanish wine list", "Fried goat cheese and paella are signatures"]
  },
  {
    id: "panda-buffet", name: "Panda Buffet", num: null, street: null, area: "south",
    cuisine: "Buffet", cravings: ["classic"], with: ["anyone", "family", "group"],
    dish: "The buffet, honestly", tone: "t-broth", x: null, y: null,
    tina: { quote: "In summary, it's an average buffet…and I'm still gonna eat there sometimes.", date: "Aug 2025", sort: 20250812,
            url: "https://www.tiktok.com/@livetoeatfoodie/video/7537763472541584653", platform: "TikTok", honest: true },
    facts: ["Tina's honest take: average, convenient, and she still goes"]
  },

  { id: "chashu", name: "Chashu Ramen + Izakaya", num: "38", street: "Franklin St", area: "downtown",
    cuisine: "Ramen and izakaya", price: "$31–50", cravings: ["bowls", "drinks"], with: ["date", "group"],
    dish: "Ramen, Brussels sprouts, udon", tone: "t-broth", x: 396, y: 268,
    facts: ["Closed Tuesdays", "Anime on the screens, murals on the walls"] },
  { id: "rio-viejo", name: "Rio Viejo Cocina", num: "50", street: "Franklin St", area: "downtown",
    cuisine: "Mexican, Jalisco style", cravings: ["spicy", "drinks"], with: ["anyone", "group", "family"],
    dish: "Street tacos, fajitas, churros", tone: "t-chili", x: 428, y: 268,
    facts: ["Owner Jaime Avila started with the Taco Libre food truck"] },
  { id: "coney-island", name: "Coney Island Hot Dogs", num: "158", street: "Southbridge St", area: "downtown",
    cuisine: "Hot dogs", cravings: ["classic", "quick"], with: ["anyone", "family"],
    dish: "Hot dogs with the secret sauce", tone: "t-diner", x: 402, y: 352,
    facts: ["Open since 1918", "The neon sign went up in 1938", "Initials carved into the wooden booths"] },
  { id: "pho-dakao", name: "Pho Dakao", num: "593", street: "Park Ave", area: "park-ave",
    cuisine: "Vietnamese", cravings: ["bowls", "spicy", "quick"], with: ["anyone", "family"],
    dish: "Pho, vermicelli, noodle soups", tone: "t-broth", x: 340, y: 316,
    facts: ["Pho, noodle soups and vermicelli"] },
  { id: "baba-sushi", name: "Baba Sushi", num: "309", street: "Park Ave", area: "park-ave",
    cuisine: "Sushi", cravings: ["sushi"], with: ["date", "group"],
    dish: "Sushi and nigiri", tone: "t-tuna", x: 340, y: 250,
    facts: ["On Park Ave"] },
  { id: "volturno", name: "Volturno", num: "72", street: "Shrewsbury St", area: "shrewsbury-st",
    cuisine: "Neapolitan pizza", cravings: ["pizza"], with: ["anyone", "date", "group"],
    dish: "Wood-fired Neapolitan pizza", tone: "t-pie", x: 470, y: 300,
    facts: ["Shares 72 Shrewsbury St with Wormtown Brewery"] },
  { id: "wormtown", name: "Wormtown Brewery", num: "72", street: "Shrewsbury St", area: "shrewsbury-st",
    cuisine: "Brewery", cravings: ["drinks"], with: ["group"],
    dish: "Local beer on Restaurant Row", tone: "t-saffron", x: 470, y: 300, hideOnMap: true,
    facts: ["Next door to Volturno at 72"] },
  { id: "via", name: "VIA Italian Table", num: "89", street: "Shrewsbury St", area: "shrewsbury-st",
    cuisine: "Italian", cravings: ["italian", "pizza"], with: ["date", "group", "family"],
    dish: "Italian, Restaurant Row", tone: "t-chili", x: 496, y: 300, facts: [] },
  { id: "nuovo", name: "Nuovo", num: "92", street: "Shrewsbury St", area: "shrewsbury-st",
    cuisine: "Mediterranean", cravings: ["italian"], with: ["date"],
    dish: "Mediterranean", tone: "t-saffron", x: 520, y: 300, facts: [] },
  { id: "chop-house", name: "111 Chop House", num: "111", street: "Shrewsbury St", area: "shrewsbury-st",
    cuisine: "Steakhouse", cravings: ["classic"], with: ["date"],
    dish: "Steakhouse on Restaurant Row", tone: "t-tuna", x: 544, y: 300, facts: [] },
  { id: "boulevard-diner", name: "Boulevard Diner", num: "155", street: "Shrewsbury St", area: "shrewsbury-st",
    cuisine: "Classic diner", cravings: ["classic", "quick"], with: ["anyone", "family"],
    dish: "Diner counter in a 1936 lunch car", tone: "t-diner", x: 568, y: 300,
    facts: ["Built in 1936 by the Worcester Lunch Car Company, car no. 730"] },
  { id: "flying-rhino", name: "Flying Rhino Café", num: "278", street: "Shrewsbury St", area: "shrewsbury-st",
    cuisine: "Eclectic American", cravings: ["drinks", "classic"], with: ["group"],
    dish: "Eclectic American, bar and kitchen", tone: "t-night", x: 590, y: 292, facts: [] },
  { id: "leos", name: "Leo's Ristorante", num: "11", street: "Leo Turo Way", area: "shrewsbury-st",
    cuisine: "Italian", cravings: ["italian"], with: ["family", "group"],
    dish: "Italian", tone: "t-chili", x: 458, y: 288, facts: ["Just off Shrewsbury St"] }
];

/* Watch + Eat: each of Tina's videos as a menu of moments. Step names replace timestamps until videos are imported. */
LTEF.videos = [
  { id: "american-flatbread", title: "American Flatbread Co, 85 Green St", date: "May 28, 2025", tone: "t-pie",
    url: "https://www.tiktok.com/@livetoeatfoodie/video/7509509382808292651",
    moments: [
      { step: "Where", what: "The Cove, Canal District", line: "Opened May 10, 2025, on Green St." },
      { step: "Eat", what: "Flatbread from the oven", line: "Tina: “L(oven) this new establishment.”", action: { label: "See the place", href: "place.html" } },
      { step: "Play", what: "Candlepin downstairs", line: "10 lanes, the first public candlepin in Worcester since 2020.", save: "american-flatbread" },
      { step: "Verdict", what: "Tina's verdict", line: "“It's so much fun!”" },
      { step: "Go", what: "85 Green St", line: "Canal District, Worcester 01604", action: { label: "Directions", href: "place.html#door", icon: "i-turn" } }
    ] },
  { id: "hungry-bowl", title: "Hungry Bowl, 865 Merriam Ave", date: "Feb 9, 2026", tone: "t-chili",
    url: "https://www.tiktok.com/@livetoeatfoodie/video/7604965242379996430",
    moments: [
      { step: "Where", what: "Leominster", line: "About 30 minutes north of Worcester on I-190." },
      { step: "Eat", what: "Mongolian BBQ", line: "Tina: “un-bowl-ievable that I've never tried Mongolian BBQ before.”", save: "hungry-bowl" },
      { step: "Verdict", what: "Worth the drive", line: "“Thank goodness Hungry Bowl opened in Leominster.”" },
      { step: "Go", what: "865 Merriam Ave", line: "Leominster, MA", action: { label: "Directions", href: "#", icon: "i-turn" } }
    ] },
  { id: "racha-thai", title: "Racha Thai, 545 Southwest Cutoff", date: "Mar 27, 2025", tone: "t-saffron",
    url: "https://www.tiktok.com/@livetoeatfoodie/video/7486636461693979946",
    moments: [
      { step: "Where", what: "The Worcester Fair", line: "Southwest Cutoff, south Worcester." },
      { step: "Verdict", what: "Her favorite Thai", line: "Tina: “Our favorite Thai place in Worcester has to be Racha Thai.”", save: "racha-thai" },
      { step: "Cost", what: "$15–30", line: "Price range on their ordering page." },
      { step: "Go", what: "545 Southwest Cutoff", line: "Worcester 01607", action: { label: "Directions", href: "#", icon: "i-turn" } }
    ] },
  { id: "honeygrow", title: "honeygrow, 193 Boston Turnpike", date: "Jul 29, 2025", tone: "t-broth",
    url: "https://www.tiktok.com/@livetoeatfoodie/video/7532590916696132919",
    moments: [
      { step: "Where", what: "Lakeway Commons, Shrewsbury", line: "Right off Route 9. Opened July 7, 2025." },
      { step: "Eat", what: "Stir-fry, made to order", line: "Tina: “Ca-noodling around with some honeygrow.”", save: "honeygrow" },
      { step: "Ask", what: "What's your order?", line: "She asked her followers for theirs." },
      { step: "Go", what: "193 Boston Turnpike", line: "Shrewsbury, MA", action: { label: "Directions", href: "#", icon: "i-turn" } }
    ] }
];

LTEF.cravings = [
  { id: "anything", label: "anything" },
  { id: "spicy", label: "something spicy" },
  { id: "bowls", label: "noodles and bowls" },
  { id: "pizza", label: "pizza" },
  { id: "italian", label: "Italian" },
  { id: "sushi", label: "sushi" },
  { id: "classic", label: "a Worcester classic" },
  { id: "drinks", label: "a drink with dinner" },
  { id: "quick", label: "something quick" },
  { id: "sweet", label: "something sweet" },
  { id: "new", label: "somewhere new" }
];
LTEF.wheres = [
  { id: "anywhere", label: "Central Mass" },
  { id: "worcester", label: "Worcester" },
  { id: "canal", label: "the Canal District" },
  { id: "downtown", label: "Downtown" },
  { id: "shrewsbury-st", label: "Shrewsbury Street" },
  { id: "park-ave", label: "Park Ave" },
  { id: "shrewsbury", label: "Shrewsbury" },
  { id: "leominster", label: "Leominster" }
];
LTEF.withs = [
  { id: "anyone", label: "anyone" },
  { id: "date", label: "a date" },
  { id: "group", label: "a group" },
  { id: "family", label: "the family" }
];
