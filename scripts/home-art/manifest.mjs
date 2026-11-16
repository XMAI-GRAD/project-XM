// The home artwork pieces: which nodes of the designer's export make up each piece.
// `paths` are child-index paths from the root <svg> (`/61` = its 62nd child), in
// paint order. Pieces are listed in the order they are painted on the page.
// `parts` names groups inside a piece: each gets data-part="<name>", the hook the
// motion code uses (src/features/home/motion/). The root <svg> gets data-art="<name>".

const opening = "WEB-01-Opening.svg";
const home = "WEB-02-HomePage.svg";
const footer = "WEB-07-Footer.svg";
const about = "WEB-05-Introduction.svg";
const earth = "WEB-06-EARTH.svg";

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
    brandParts: {
      symbol: ["/0", "/1", "/6"],
      copy: ["/2", "/3", "/4", "/5"],
    },
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
    parts: {
      star: "/61/2/0",
      "left-house": "/61/2/1",
      "left-petal-low": "/61/2/2",
      "left-petal-high": "/61/2/3",
      "right-hill": "/61/2/4",
      "center-crown": "/61/2/5",
      "right-roof": "/61/2/6",
      "left-roof": "/61/2/7",
      "center-roof": "/61/2/8",
      "center-gate": "/61/2/9",
    },
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
    parts: { top: "/81/1", bottom: "/81/0" },
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
    parts: {
      "artists-crown": "/83/2/0",
      star: "/83/2/1/0",
      "state-house": "/83/2/1/1",
      "state-roof": "/83/2/1/2",
      artists: "/83/2/1/3",
      public: "/83/2/1/4",
      line: "/83/2/1/5",
    },
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

  // Footer (SVG-07)
  {
    name: "footer-logo",
    source: footer,
    paths: ["/16"],
    note: "The logo in seashell, for the navy footer.",
  },

  // About (SVG-05)
  {
    name: "about-petal",
    source: about,
    paths: ["/28", "/68"],
    note: "The big frosted petal the title sits around.",
  },
  {
    name: "about-intro-line",
    source: about,
    paths: ["/67"],
    note: "The violet line under GIỚI THIỆU.",
  },
  {
    name: "glyph-about-i",
    source: about,
    paths: ["/76"],
    note: "The I of GIA.",
  },
  {
    name: "glyph-about-e",
    source: about,
    paths: ["/31/1", "/77"],
    note: "The Ệ of HỆ: its marks in navy, the letter in lime.",
  },
  {
    name: "glyph-about-a",
    source: about,
    paths: ["/78", "/33/0/5"],
    note: "The Ạ of TẠO.",
  },
  {
    name: "about-work-certify",
    source: about,
    paths: ["/51"],
    note: "The mark of Chứng nhận.",
  },
  {
    name: "about-work-launch",
    source: about,
    paths: ["/53"],
    note: "The mark of Bệ phóng.",
  },
  {
    name: "about-work-connect",
    source: about,
    paths: ["/52"],
    note: "The mark of Kết nối.",
  },
  {
    name: "about-work-hook-1",
    source: about,
    paths: ["/63"],
    note: "The hook from the first role to its line.",
  },
  { name: "about-work-hook-2", source: about, paths: ["/64"] },
  { name: "about-work-hook-3", source: about, paths: ["/65"] },
  {
    name: "about-work-line",
    source: about,
    paths: ["/79"],
    note: "The line from the roles down to the fields.",
  },
  { name: "field-roof", source: about, paths: ["/88"] },
  { name: "field-weave", source: about, paths: ["/89"] },
  { name: "field-star", source: about, paths: ["/91"] },
  { name: "field-tiers", source: about, paths: ["/92"] },
  { name: "field-arch", source: about, paths: ["/93"] },
  { name: "field-spark", source: about, paths: ["/95"] },
  { name: "field-line", source: about, paths: ["/90"] },
  { name: "field-gate", source: about, paths: ["/94"] },
  { name: "field-tiers-2", source: about, paths: ["/96"] },
  { name: "field-wave", source: about, paths: ["/97"] },
  {
    name: "about-timeline-line",
    source: about,
    paths: ["/45"],
    note: "The winding line through the years.",
  },
  { name: "about-year-2019", source: about, paths: ["/46"] },
  { name: "about-year-2022", source: about, paths: ["/47"] },
  { name: "about-year-2023", source: about, paths: ["/48"] },
  { name: "about-year-2025", source: about, paths: ["/49"] },

  // Explore · ĐỊA (SVG-06)
  {
    name: "explore-gate",
    source: earth,
    paths: ["/21/0"],
    note: "A point's card: the lime gate its photo is cut to.",
  },
  {
    name: "explore-place-line",
    source: earth,
    paths: ["/16"],
    note: "The line from ĐỊA to its caption.",
  },
];
