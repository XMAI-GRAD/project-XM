// The Places (ĐỊA) artwork pieces: drawn headline letters and marks from the
// designer's ĐỊA comps, extracted into src/features/explore/art/.
//
// Because VĂN MIẾU.svg and LONG BIÊN.svg have a broken headline font and
// HỒ GƯƠM.svg is truncated, dia-a-breve and dia-a-circ come from ĐỊA FULL.pdf
// via pdftocairo (poppler), and the remaining five pieces come from HTTL.svg.
//
// To rebuild the staging directory ($STAGE) before running extract.mjs:
//   DIA="/Users/phhs/My Personal Stuff/Coding Section/Side Projects/XMAI-GRAD/Assets/ĐỊA"
//   STAGE="/tmp/dia-stage"
//   mkdir -p "$STAGE"
//   ln -sf "$DIA/HTTL.svg" "$STAGE/HTTL.svg"
//   pdftocairo -svg -f 2 -l 2 "$DIA/ĐỊA FULL.pdf" "$STAGE/page-2.svg"
//   pdftocairo -svg -f 5 -l 5 "$DIA/ĐỊA FULL.pdf" "$STAGE/page-5.svg"
//   node scripts/home-art/extract.mjs "$STAGE" scripts/home-art/places.mjs src/features/explore/art

const httl = "HTTL.svg";
const vanMieuPdf = "page-2.svg";
const longBienPdf = "page-5.svg";

export const pieces = [
  {
    name: "dia-a-grave",
    source: httl,
    paths: ["/35/2", "/35/5"],
    note: "The roof-shaped À of HOÀNG / HOÀN.",
  },
  {
    name: "dia-a-breve",
    source: vanMieuPdf,
    paths: ["/768", "/813", "/814", "/815", "/816", "/817"],
    note: "The roof-shaped Ă of VĂN MIẾU.",
  },
  {
    name: "dia-a-circ",
    source: longBienPdf,
    paths: ["/641", "/743", "/744", "/745", "/746", "/747"],
    note: "The roof-shaped Ầ of CẦU LONG BIÊN.",
  },
  {
    name: "dia-o",
    source: httl,
    paths: ["/36"],
    note: "The four-petal O of THĂNG LONG.",
  },
  {
    name: "place-mark",
    source: httl,
    paths: ["/42"],
    note: "The layer mark beside ĐỊA.",
  },
  {
    name: "photo-mark",
    source: httl,
    paths: ["/41"],
    note: "The seashell mark on the bottom-left corner of the photo.",
  },
  {
    name: "fact-mark",
    source: httl,
    paths: ["/26"],
    note: "The four-petal mark beside Điều ít người biết.",
  },
  {
    name: "detail-gate",
    source: httl,
    paths: ["/39/0"],
    note: "The lime gate frame on the point detail page.",
  },
];
