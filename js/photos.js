/* Live to Eat Food — concept photos.
   Every photo is openly licensed on Wikimedia Commons and credited where it's shown.
   real: true  = a photo of the actual place or neighborhood.
   real: false = a stand-in of the same kind of dish, taken somewhere else. The page says so.
   Swap these for Tina's own photos (or the restaurant's, with permission) before launch. */
var LTEF = window.LTEF = window.LTEF || {};
(function () {
  var T = "https://upload.wikimedia.org/wikipedia/commons/thumb/"; /* also served from thumb.wikimedia.org */
  function p(path, file, by, lic, real, what) {
    return {
      src: T + path + "/" + file + "/960px-" + file,
      page: "https://commons.wikimedia.org/wiki/File:" + file,
      by: by, lic: lic, real: real, what: what
    };
  }
  LTEF.licenses = {
    "CC0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "Public domain": "https://commons.wikimedia.org/wiki/Commons:Public_domain",
    "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0/",
    "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
    "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0/",
    "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/"
  };
  LTEF.photos = {
    /* real places */
    "boulevard": p("9/95", "Boulevard_Diner%2C_Worcester_Massachusetts.jpg", "Kenneth C. Zirkel", "CC BY-SA 4.0", true, "Boulevard Diner, 155 Shrewsbury St, May 2025"),
    "franklin-50": p("1/13", "50_Franklin_Street_%28Bancroft_on_The_Grid%29_-_Worcester%2C_MA_-_DSC04078.jpg", "Daderot", "CC0", true, "50 Franklin St, downtown Worcester, 2020"),
    "kelley-square": p("6/67", "Kelley_Square%2C_Worcester%2C_September_2024.jpg", "Pi.1415926535", "CC BY-SA 4.0", true, "Kelley Square in the Canal District, September 2024"),
    "candlepin": p("7/77", "Candlepin_lanes_with_balls_being_returned%2C_Bayberry_2026-02-28.jpg", "Peter Cooper Jr.", "CC0", true, "Candlepin lanes with the ball return running, Bayberry Lanes, 2026"),
    /* dish stand-ins */
    "wood-oven": p("d/d7", "Pizza_baking_in_Wood-fired_oven.jpg", "Jared Tarbell", "CC BY 2.0", false, "A pizza in a wood-fired oven"),
    "flatbread": p("b/bb", "Tomato_and_garlic_flatbread_pizza_at_Trilussa_%2822011804006%29.jpg", "Ruth Hartnup", "CC BY 2.0", false, "Tomato and garlic flatbread"),
    "beer-taps": p("9/94", "Coopers_Original_Pale_Ale_%2B_beer_taps%2C_Buffalo_Club%2C_2026_%2801%29.jpg", "Bahnfrend", "CC BY-SA 4.0", false, "A pint at the taps"),
    "mongolian-grill": p("c/c7", "Mongolian_Barbeque_03.JPG", "Brücke-Osteuropa", "Public domain", false, "A Mongolian barbecue grill station"),
    "red-curry": p("1/1a", "Red_Curry_with_Chicken_-_Little_Thai%2C_Brighton_2024-03-01.jpg", "Andy Li", "CC0", false, "Thai red curry with chicken and rice"),
    "stir-fry": p("0/04", "Spicy_King_Prawn_Stir-Fry_Udon_-_Aberdeen_Seafood%2C_Brighton_2026-07-19.jpg", "Andy Li", "CC0", false, "Wok-fried noodles"),
    "burger": p("d/df", "Hamburger_and_fries_-_Brownswood%2C_Finsbury_Park%2C_London.jpg", "Ewan Munro", "CC BY-SA 2.0", false, "A burger and fries"),
    "acai": p("6/6e", "Berries_Galore_Acai_Bowl_%2830276166867%29.jpg", "Ella Olsson", "CC BY 2.0", false, "An acai bowl with berries"),
    "tapas": p("1/11", "Spanish_Tapas.jpg", "Toben", "CC BY-SA 4.0", false, "A spread of Spanish tapas"),
    "buffet": p("5/5a", "Super_China_Buffet_-_November_2023_-_Sarah_Stierch_06.jpg", "Missvain", "CC BY 4.0", false, "A plate from a Chinese buffet"),
    "ramen": p("2/28", "Tonkotsu_ramen_in_Tokyo.jpg", "Syced", "CC0", false, "A bowl of tonkotsu ramen"),
    "chili-dogs": p("b/b9", "Chili_dogs.jpg", "jeffreyw", "CC BY 2.0", false, "Hot dogs with chili"),
    "pho": p("6/65", "Beef_noodle_soup_%28Ph%E1%BB%9F_b%C3%B2%29_-_Pho_Hanoi_Authentic_2024-12-01.jpg", "Andy Li", "CC0", false, "A bowl of beef pho"),
    "sushi": p("0/00", "Sushi_platter%2C_Nikko%2C_Japan.jpg", "Joli Rumi", "CC BY-SA 4.0", false, "A sushi platter"),
    "neapolitan": p("4/46", "Pizza-napoletana.jpg", "Fabryx98", "CC BY-SA 4.0", false, "A Neapolitan margherita"),
    "rigatoni": p("e/e0", "Rigatoni_Alla_Carbonara_-_Pinocchio_2023-07-04.jpg", "Andy Li", "CC0", false, "Rigatoni carbonara"),
    "mezze": p("7/7e", "Mezze_Platter.jpg", "Satdeep Gill", "CC BY-SA 4.0", false, "A mezze platter"),
    "steak": p("d/d0", "Minute_steak_at_restaurant_Manhattan_Steak_House.jpg", "JIP", "CC BY-SA 4.0", false, "Steak and fries"),
    "cheeseburger": p("b/b4", "Cheese_meltdown_beef_burger_-_The_Perkin_Warbeck_2025-07-26.jpg", "Andy Li", "CC0", false, "A cheeseburger"),
    "chicken-parm": p("2/2e", "Mamma_Tanino%27s_-_November_2024_-_Sarah_Stierch_08.jpg", "Missvain", "CC0", false, "Chicken parmigiana")
  };
  /* which photo each place shows */
  LTEF.placePhoto = {
    "hungry-bowl": "mongolian-grill", "american-flatbread": "wood-oven", "racha-thai": "red-curry", "honeygrow": "stir-fry",
    "ground-round": "burger", "playa-bowls": "acai", "bocado": "tapas", "panda-buffet": "buffet", "chashu": "ramen",
    "rio-viejo": "franklin-50", "coney-island": "chili-dogs", "pho-dakao": "pho", "baba-sushi": "sushi", "volturno": "neapolitan",
    "wormtown": "beer-taps", "via": "rigatoni", "nuovo": "mezze", "chop-house": "steak", "boulevard-diner": "boulevard",
    "flying-rhino": "cheeseburger", "leos": "chicken-parm"
  };
})();
