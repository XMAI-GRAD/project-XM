// ponytail: throwaway fixture for the landing prototypes (A/B/C) only.
// Real content comes from `@/content` (data/heritages.json); delete this folder once a direction is picked.
// Names are real UNESCO sites used as stand-ins until O-04 settles the final five.

import type { Locale } from "@/i18n/config";

type Localized = Record<Locale, string>;

export interface MockHeritage {
  slug: string;
  name: Localized;
  place: Localized;
  /** Year inscribed as UNESCO World Heritage. */
  year: number;
  summary: Localized;
  /** Pin position in a 100 × 200 map viewBox, north at the top. */
  map: { x: number; y: number };
}

/** In route order, north to south. */
export const mockHeritages: MockHeritage[] = [
  {
    slug: "thang-long",
    name: { vi: "Hoàng thành Thăng Long", en: "Thang Long Imperial Citadel" },
    place: { vi: "Hà Nội", en: "Hanoi" },
    year: 2010,
    summary: {
      vi: "Mười ba thế kỷ quyền lực chồng lớp dưới lòng đất thủ đô.",
      en: "Thirteen centuries of power, layered beneath the capital.",
    },
    map: { x: 38, y: 34 },
  },
  {
    slug: "ha-long",
    name: { vi: "Vịnh Hạ Long", en: "Ha Long Bay" },
    place: { vi: "Quảng Ninh", en: "Quang Ninh" },
    year: 1994,
    summary: {
      vi: "Gần hai nghìn đảo đá vôi nhô lên từ mặt nước xanh lục.",
      en: "Nearly two thousand limestone islands rising from green water.",
    },
    map: { x: 52, y: 30 },
  },
  {
    slug: "hue",
    name: { vi: "Quần thể di tích Cố đô Huế", en: "Complex of Hue Monuments" },
    place: { vi: "Huế", en: "Hue" },
    year: 1993,
    summary: {
      vi: "Kinh đô cuối cùng của triều Nguyễn bên dòng sông Hương.",
      en: "The last imperial capital, on the Perfume River.",
    },
    map: { x: 58, y: 96 },
  },
  {
    slug: "hoi-an",
    name: { vi: "Phố cổ Hội An", en: "Hoi An Ancient Town" },
    place: { vi: "Hội An", en: "Hoi An" },
    year: 1999,
    summary: {
      vi: "Thương cảng cũ, nơi mái ngói và đèn lồng còn nguyên nếp.",
      en: "An old trading port where tile roofs and lanterns endure.",
    },
    map: { x: 66, y: 110 },
  },
  {
    slug: "my-son",
    name: { vi: "Thánh địa Mỹ Sơn", en: "My Son Sanctuary" },
    place: { vi: "Quảng Nam", en: "Quang Nam" },
    year: 1999,
    summary: {
      vi: "Đền tháp Chăm bằng gạch nung giữa thung lũng rừng.",
      en: "Cham brick temple-towers in a forested valley.",
    },
    map: { x: 62, y: 116 },
  },
];

/** UI copy for the prototypes. Moves to src/i18n/dictionaries once a direction is picked. */
export const mockCopy = {
  vi: {
    siteName: "Năm di sản",
    heroPhrase: "Hành trình qua",
    heroListLabel: "Năm di sản",
    mapLabel: "Sơ đồ tuyến đường Bắc – Nam",
    footerNavLabel: "Chân trang",
    primaryNavLabel: "Điều hướng chính",
    switchLang: "EN",
    tagline: "Một phòng trưng bày trực tuyến về năm di sản văn hoá Việt Nam.",
    intro:
      "Đồ án tốt nghiệp thiết kế đồ hoạ: năm địa danh, một hành trình từ Bắc vào Nam, kể bằng hình ảnh, chuyển động và bản đồ.",
    nav: { map: "Bản đồ", about: "Giới thiệu", account: "Tài khoản" },
    explore: "Khám phá",
    openMap: "Mở bản đồ hành trình",
    mapTeaser: "Năm điểm dừng, một tuyến đường.",
    unesco: "UNESCO",
    routeStart: "Điểm khởi đầu hành trình",
    imagePlaceholder: "Ảnh di sản",
    contact: "Liên hệ",
    placeholderNote: "Bản mẫu: nội dung và ảnh là tạm",
  },
  en: {
    siteName: "Five Heritages",
    heroPhrase: "A journey through",
    heroListLabel: "Five heritage sites",
    mapLabel: "Schematic north to south route",
    footerNavLabel: "Footer",
    primaryNavLabel: "Main",
    switchLang: "VI",
    tagline: "An online gallery of five Vietnamese cultural heritage sites.",
    intro:
      "A graphic design graduation project: five places, one journey from north to south, told through image, motion and a map.",
    nav: { map: "Map", about: "About", account: "Account" },
    explore: "Explore",
    openMap: "Open the journey map",
    mapTeaser: "Five stops, one route.",
    unesco: "UNESCO",
    routeStart: "Start of the route",
    imagePlaceholder: "Heritage photo",
    contact: "Contact",
    placeholderNote: "Prototype: content and images are placeholders",
  },
} satisfies Record<Locale, unknown>;
