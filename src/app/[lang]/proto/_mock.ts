// ponytail: throwaway fixture for the landing prototypes (A/B/C) only.
// Real content comes from `@/content` (data/heritages.json); delete this folder once a direction is picked.
// Every visible string is a placeholder named after the component it fills, so the designer can see
// which parts of the page still need designing. aria-only labels stay real.

import type { Locale } from "@/i18n/config";

type Localized = Record<Locale, string>;

export interface MockHeritage {
  slug: string;
  name: Localized;
  place: Localized;
  year: Localized;
  summary: Localized;
  /** Pin position in a 100 × 200 map viewBox, north at the top. */
  map: { x: number; y: number };
}

const pins = [
  { x: 38, y: 34 },
  { x: 52, y: 30 },
  { x: 58, y: 96 },
  { x: 66, y: 110 },
  { x: 62, y: 116 },
];

/** In route order. */
export const mockHeritages: MockHeritage[] = pins.map((map, i) => {
  const n = i + 1;
  return {
    slug: `slug-${n}`,
    name: { vi: `<Tên di sản ${n}>`, en: `<Heritage name ${n}>` },
    place: { vi: `<Địa điểm ${n}>`, en: `<Location ${n}>` },
    year: { vi: "<Năm>", en: "<Year>" },
    summary: {
      vi: `<Tóm tắt di sản ${n} · 1 câu ngắn>`,
      en: `<Heritage ${n} summary · one short sentence>`,
    },
    map,
  };
});

/** UI copy for the prototypes. Moves to src/i18n/dictionaries once a direction is picked. */
export const mockCopy = {
  vi: {
    siteName: "<Logo>",
    heroPhrase: "<Hero · tiêu đề>",
    heroListLabel: "Danh sách di sản",
    mapLabel: "Sơ đồ tuyến đường",
    footerNavLabel: "Chân trang",
    primaryNavLabel: "Điều hướng chính",
    switchLang: "EN",
    tagline: "<Hero · mô tả ngắn, 1 câu>",
    intro:
      "<Intro · đoạn giới thiệu dự án, khoảng 1–2 câu, độ dài cỡ đoạn này để ước lượng bố cục>",
    nav: {
      map: "<Nav · Bản đồ>",
      about: "<Nav · Giới thiệu>",
      account: "<Nav · Tài khoản>",
    },
    explore: "<CTA · Khám phá>",
    openMap: "<Nút · Mở bản đồ>",
    mapTeaser: "<Bản đồ · câu dẫn>",
    unesco: "<Nhãn>",
    routeStart: "Điểm khởi đầu hành trình",
    imagePlaceholder: "<Ảnh di sản>",
    contact: "<Footer · Liên hệ>",
    placeholderNote: "<Footer · ghi chú / bản quyền>",
    login: {
      title: "<Login · tiêu đề>",
      lead: "<Login · 1 câu: đăng nhập để lưu yêu thích và bình luận>",
      google: "<Nút · Tiếp tục với Google>",
      error: "<Login · thông báo lỗi, chỉ hiện khi đăng nhập thất bại>",
      note: "<Login · ghi chú quyền riêng tư / điều khoản>",
      back: "<Link · Quay lại trang chủ>",
    },
  },
  en: {
    siteName: "<Logo>",
    heroPhrase: "<Hero · headline>",
    heroListLabel: "Heritage sites",
    mapLabel: "Route diagram",
    footerNavLabel: "Footer",
    primaryNavLabel: "Main",
    switchLang: "VI",
    tagline: "<Hero · short description, one sentence>",
    intro:
      "<Intro · project introduction, about 1–2 sentences, roughly this long to gauge the layout>",
    nav: {
      map: "<Nav · Map>",
      about: "<Nav · About>",
      account: "<Nav · Account>",
    },
    explore: "<CTA · Explore>",
    openMap: "<Button · Open the map>",
    mapTeaser: "<Map · teaser line>",
    unesco: "<Label>",
    routeStart: "Start of the route",
    imagePlaceholder: "<Heritage photo>",
    contact: "<Footer · Contact>",
    placeholderNote: "<Footer · note / copyright>",
    login: {
      title: "<Login · headline>",
      lead: "<Login · one line: sign in to save favorites and comment>",
      google: "<Button · Continue with Google>",
      error: "<Login · error message, shown only when sign-in fails>",
      note: "<Login · privacy / terms note>",
      back: "<Link · Back to home>",
    },
  },
} satisfies Record<Locale, unknown>;
