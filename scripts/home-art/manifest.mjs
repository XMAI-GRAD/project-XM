// The home artwork pieces: which nodes of the designer's export make up each piece.
// `paths` are child-index paths from the root <svg> (`/61` = its 62nd child), in
// paint order. Pieces are listed in the order they are painted on the page.

const opening = "WEB-01-Opening.svg";
const home = "WEB-02-HomePage.svg";

// Stable animation hooks, paired by letter rather than the export's paint order.
const wordmarkLetters = [
  "hanoi-h",
  "hanoi-a",
  "hanoi-n",
  "hanoi-o",
  "hanoi-i",
  "creative-c",
  "creative-r",
  "creative-e1",
  "creative-a",
  "creative-t",
  "creative-i",
  "creative-v",
  "creative-e2",
  "city-c",
  "city-i",
  "city-t",
  "city-y",
];
const openingOrder = [13, 7, 14, 16, 15, 4, 5, 12, 6, 8, 9, 10, 11, 0, 3, 1, 2];

export const pieces = [
  // Opening (SVG-01)
  {
    name: "opening-wordmark",
    source: opening,
    paths: ["/3"],
    letters: Object.fromEntries(
      wordmarkLetters.map((key, i) => [key, `/${openingOrder[i]}`]),
    ),
    note: "The HANOI CREATIVE CITY wordmark.",
  },
  {
    name: "opening-petal",
    source: opening,
    paths: ["/1"],
    note: "Peeks in at the bottom: the same shape as the hero's left petal.",
  },

  // Header and frame
  {
    name: "logo",
    source: home,
    paths: ["/60"],
    letters: Object.fromEntries(
      wordmarkLetters.map((key, i) => [
        key,
        i < 5 ? `/3/${i}` : i < 13 ? `/4/${i - 5}` : `/5/${i - 13}`,
      ]),
    ),
    markDetails: true,
    note: "The header logo, wordmark included.",
  },
  {
    name: "search-frame",
    source: home,
    paths: ["/6"],
    note: "The tag-shaped outline of the search box.",
  },
  {
    name: "frame-left",
    source: home,
    paths: ["/62"],
    note: "The lime frame, left side.",
  },
  {
    name: "frame-right",
    source: home,
    paths: ["/65"],
    note: "The lime frame, right side.",
  },
  {
    name: "rail-mark",
    source: home,
    paths: ["/79"],
    note: "The seashell mark on the left frame.",
  },

  // Hero
  {
    name: "hero-skyline",
    source: home,
    paths: ["/61"],
    note: "Roofs, petals and stars of the hero, clipped to the card.",
  },
  {
    name: "hero-wave",
    source: home,
    paths: [
      "/64",
      "/66",
      "/67",
      "/68",
      "/69",
      "/70",
      "/71",
      "/72",
      "/73",
      "/74",
      "/75",
      "/76",
      "/77",
      "/78",
    ],
    note: "The scalloped frosted band under the hero.",
  },
  {
    name: "glyph-hero-o",
    source: home,
    paths: ["/80/4", "/80/11"],
    note: "The Ô of THỦ ĐÔ.",
  },
  {
    name: "glyph-hero-a",
    source: home,
    paths: ["/80/6", "/80/12"],
    note: "The À of HÀ.",
  },

  // Mạch nối ngàn năm
  {
    name: "glyph-thread-i",
    source: home,
    paths: ["/82/6"],
    note: "The I of MẠCH NỐI.",
  },
  {
    name: "glyph-thread-a",
    source: home,
    paths: ["/82/13"],
    note: "The Ă of NGÀN NĂM.",
  },
  {
    name: "thread-line",
    source: home,
    paths: ["/90"],
    note: "The line between MẠCH NỐI and NGÀN NĂM.",
  },
  {
    name: "thread-pattern",
    source: home,
    paths: ["/81"],
    note: "The woven brick-red pattern.",
  },
  {
    name: "join-mark",
    source: home,
    paths: ["/38"],
    note: "The icon above the join link.",
  },

  // Stats band
  { name: "stats-band", source: home, paths: ["/5"] },
  { name: "stat-library", source: home, paths: ["/12"] },
  { name: "stat-university", source: home, paths: ["/9"] },
  { name: "stat-theatre", source: home, paths: ["/10"] },
  { name: "stat-cinema", source: home, paths: ["/11"] },

  // Roles: Nhà nước · Nghệ sỹ · Công chúng
  {
    name: "roles-cluster",
    source: home,
    paths: ["/83"],
    note: "The three actors as buildings, with the line that links them; clipped to the card.",
  },
  {
    name: "roles-line",
    source: home,
    paths: ["/93"],
    note: "The line's start, from the card's left edge.",
  },
  { name: "roles-petal", source: home, paths: ["/21"] },
  { name: "roles-cloud", source: home, paths: ["/87"] },
  { name: "roles-wave", source: home, paths: ["/88"] },

  // Heritage numbers
  { name: "heritage-wave", source: home, paths: ["/89"] },

  // Three layers
  {
    name: "glyph-layers-a",
    source: home,
    paths: ["/49", "/55"],
    note: "The À of THÀNH.",
  },
  {
    name: "glyph-layers-o",
    source: home,
    paths: ["/54", "/92"],
    note: "The Ố of PHỐ.",
  },
  { name: "layer-place-line", source: home, paths: ["/39"] },
  { name: "layer-place-shapes", source: home, paths: ["/34"] },
  { name: "layer-taste-line", source: home, paths: ["/41"] },
  { name: "layer-taste-shapes", source: home, paths: ["/35"] },
  { name: "layer-craft-line", source: home, paths: ["/40"] },
  { name: "layer-craft-shapes", source: home, paths: ["/36"] },
  {
    name: "map-mark",
    source: home,
    paths: ["/37"],
    note: "The icon above the map link.",
  },
];
