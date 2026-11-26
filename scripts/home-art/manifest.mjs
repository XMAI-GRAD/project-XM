// The home artwork pieces: which nodes of the designer's export make up each piece.
// `paths` are child-index paths from the root <svg> (`/61` = its 62nd child), in
// paint order. Pieces are listed in the order they are painted on the page.
// `parts` names groups inside a piece: each gets data-part="<name>", the hook the
// motion code uses (src/features/home/motion/); a part listed as several sibling
// paths is wrapped in a group. The root <svg> gets data-art="<name>".
// Sources are paths in docs/svg/. The WEB-0x exports are the older ones, no longer
// on disk: their pieces keep the files they were last generated into.

const opening = "WEB-01-Opening.svg";
const home = "01.HOME/02-Home.svg";
const footer = "WEB-07-Footer.svg";
const about = "02.ABOUT US/01-AboutUs.svg";
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
    paths: ["/55"],
    letters: Object.fromEntries(
      wordmarkLetters.map((key, i) => [
        key,
        i < 5 ? `/3/0/${i}` : i < 13 ? `/4/0/${i - 5}` : `/5/0/${i - 13}`,
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
    paths: ["/10"],
    note: "The tag-shaped outline of the search box.",
  },
  {
    name: "frame-left",
    source: home,
    paths: ["/57"],
    note: "The frame, left side.",
  },
  {
    name: "frame-right",
    source: home,
    paths: ["/61"],
    note: "The frame, right side.",
  },
  {
    name: "rail-mark",
    source: home,
    paths: ["/75"],
    note: "The seashell mark on the left frame.",
  },

  // Hero
  {
    name: "hero-skyline",
    source: home,
    paths: ["/56"],
    note: "Roofs, petals and stars of the hero, clipped to the card.",
    parts: {
      star: "/56/0/2/0",
      "left-house": "/56/0/2/1",
      "left-petal-low": "/56/0/2/2",
      "left-petal-high": "/56/0/2/3",
      "right-hill": "/56/0/2/4",
      "center-crown": "/56/0/2/5",
      "right-roof": "/56/0/2/6",
      "left-roof": "/56/0/2/7",
      "center-roof": "/56/0/2/8",
      "center-gate": "/56/0/2/9",
    },
  },
  {
    name: "hero-wave",
    source: home,
    paths: [
      "/59",
      "/60",
      "/62",
      "/63",
      "/64",
      "/65",
      "/66",
      "/67",
      "/68",
      "/69",
      "/70",
      "/71",
      "/72",
      "/73",
      "/74",
    ],
    note: "The scalloped frosted band under the hero.",
  },
  {
    name: "glyph-hero-a",
    source: home,
    paths: ["/76/6", "/76/11"],
    note: "The À of HÀ.",
  },

  // Mạch nối ngàn năm
  {
    name: "glyph-thread-a",
    source: home,
    paths: ["/90/13"],
    note: "The Ă of NGÀN NĂM.",
  },
  {
    name: "thread-line",
    source: home,
    paths: ["/99"],
    note: "The line between MẠCH NỐI and NGÀN NĂM.",
  },
  {
    name: "thread-pattern",
    source: home,
    paths: ["/89"],
    note: "The woven pattern: navy, mauve and brick red.",
    // The export draws it as one flat list: the lower half's six pieces, then the
    // upper half's.
    parts: {
      top: ["/89/6", "/89/7", "/89/8", "/89/9", "/89/10", "/89/11"],
      bottom: ["/89/0", "/89/1", "/89/2", "/89/3", "/89/4", "/89/5"],
    },
  },
  {
    name: "join-mark",
    source: home,
    paths: ["/41"],
    note: "The icon above the join link.",
  },

  // Stats band
  { name: "stats-band", source: home, paths: ["/9"] },
  { name: "stat-library", source: home, paths: ["/15"] },
  { name: "stat-university", source: home, paths: ["/12"] },
  { name: "stat-theatre", source: home, paths: ["/13"] },
  { name: "stat-cinema", source: home, paths: ["/14"] },

  // Roles: Nhà nước · Nghệ sỹ · Công chúng
  {
    name: "roles-cluster",
    source: home,
    paths: ["/91"],
    note: "The three actors as buildings, with the line that links them; clipped to the card.",
    parts: {
      "artists-crown": "/91/0/2/0",
      star: "/91/0/2/1/0",
      "state-house": "/91/0/2/1/1",
      "state-roof": "/91/0/2/1/2",
      artists: "/91/0/2/1/3",
      public: "/91/0/2/1/4",
      line: ["/91/0/2/1/5", "/91/0/2/1/6"],
    },
  },
  {
    name: "roles-line",
    source: home,
    paths: ["/51"],
    note: "The line's start, from the card's left edge.",
  },
  { name: "roles-petal", source: home, paths: ["/24"] },
  { name: "roles-cloud", source: home, paths: ["/95", "/96"] },
  { name: "roles-wave", source: home, paths: ["/97"] },

  // Heritage numbers
  { name: "heritage-wave", source: home, paths: ["/98"] },

  // Three layers
  {
    name: "glyph-layers-a",
    source: home,
    paths: ["/101/2", "/101/7"],
    note: "The À of THÀNH.",
  },
  { name: "layer-place-line", source: home, paths: ["/42"] },
  { name: "layer-place-shapes", source: home, paths: ["/37"] },
  { name: "layer-taste-line", source: home, paths: ["/44"] },
  { name: "layer-taste-shapes", source: home, paths: ["/38"] },
  { name: "layer-craft-line", source: home, paths: ["/43"] },
  { name: "layer-craft-shapes", source: home, paths: ["/39"] },
  {
    name: "map-mark",
    source: home,
    paths: ["/40"],
    note: "The icon above the map link.",
  },

  // Footer (SVG-07)
  {
    name: "footer-logo",
    source: footer,
    paths: ["/16"],
    note: "The logo in seashell, for the navy footer.",
  },

  // About (docs/svg/02.ABOUT US)
  {
    name: "about-petal",
    source: about,
    paths: ["/21", "/49"],
    note: "The big frosted petal the title sits around.",
  },
  {
    name: "about-intro-line",
    source: about,
    paths: ["/48"],
    note: "The violet line under GIỚI THIỆU.",
  },
  {
    name: "glyph-about-i",
    source: about,
    paths: ["/57/1"],
    note: "The I of GIA.",
  },
  {
    name: "glyph-about-e",
    source: about,
    paths: ["/58/1", "/58/2"],
    note: "The Ệ of HỆ, in lime.",
  },
  {
    name: "glyph-about-a",
    source: about,
    paths: ["/59/1", "/59/0/0/5"],
    note: "The Ạ of TẠO.",
  },
  {
    name: "about-work-certify",
    source: about,
    paths: ["/32"],
    note: "The mark of Chứng nhận.",
  },
  {
    name: "about-work-launch",
    source: about,
    paths: ["/34"],
    note: "The mark of Bệ phóng.",
  },
  {
    name: "about-work-connect",
    source: about,
    paths: ["/33"],
    note: "The mark of Kết nối.",
  },
  {
    name: "about-work-hook-1",
    source: about,
    paths: ["/44"],
    note: "The hook from the first role to its line.",
  },
  { name: "about-work-hook-2", source: about, paths: ["/45"] },
  { name: "about-work-hook-3", source: about, paths: ["/46"] },
  {
    name: "about-work-line",
    source: about,
    paths: ["/60"],
    note: "The line from the roles down to the fields.",
  },
  {
    name: "about-fields-line",
    source: about,
    paths: ["/80"],
    note: "The line from the fields down to the timeline.",
  },
  { name: "field-roof", source: about, paths: ["/69"] },
  { name: "field-weave", source: about, paths: ["/70"] },
  { name: "field-star", source: about, paths: ["/72"] },
  { name: "field-tiers", source: about, paths: ["/82"] },
  { name: "field-arch", source: about, paths: ["/73"] },
  { name: "field-spark", source: about, paths: ["/75"] },
  { name: "field-line", source: about, paths: ["/71"] },
  { name: "field-gate", source: about, paths: ["/74"] },
  { name: "field-tiers-2", source: about, paths: ["/76"] },
  { name: "field-wave", source: about, paths: ["/77", "/78"] },
  {
    name: "about-timeline-line",
    source: about,
    paths: ["/26"],
    note: "The winding line through the years.",
  },
  { name: "about-year-2019", source: about, paths: ["/27"] },
  { name: "about-year-2022", source: about, paths: ["/28"] },
  { name: "about-year-2023", source: about, paths: ["/29"] },
  { name: "about-year-2025", source: about, paths: ["/30"] },
  {
    name: "about-frame-end-left",
    source: about,
    paths: ["/83"],
    note: "The frame's last slide on the left, with its bottom corner.",
  },
  {
    name: "about-frame-end-right",
    source: about,
    paths: ["/84"],
    note: "The frame's last slide on the right, with its bottom corner.",
  },

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
