// Extracts the home page artwork from the designer's Illustrator SVG exports into
// React components, one per piece, so each piece (and each group inside it) can be
// placed and animated on its own.
//
//   node scripts/home-art/extract.mjs [path/to/svg-dir]
//
// The raw exports (default: docs/lttem/svg) never go in the repo (SPEC Part 3), so run
// this locally after the designer sends new ones. It drives a local Chrome or Edge
// headless (set CHROME to override the path) to parse the SVG and measure every piece,
// then writes src/features/home/art/. Pieces are picked by their child-index path in the
// export (manifest.mjs); a re-export that reorders layers needs the manifest updated.
//
// What it does to each piece:
// - inlines the shared `.stN` class styles as attributes, so a piece stands alone;
// - drops invisible helpers (no fill, no stroke) and empty groups;
// - turns a rectangular clip-path into the viewBox (an <svg> clips to its viewBox);
// - keeps the export's coordinates: viewBox = the piece's box in artboard units.
// Outlined text is never extracted: text lives in data/ and the dictionaries.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pieces } from "./manifest.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const svgDir = resolve(process.argv[2] ?? join(root, "docs/lttem/svg"));
const outDir = join(root, "src/features/home/art");

const chrome =
  process.env.CHROME ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].find(existsSync);
if (!chrome) throw new Error("No Chrome found: set CHROME to its path.");

// Runs in the page: resolves each piece, inlines styles, measures it, serializes it.
function inPage(spec) {
  const svg = document.querySelector("svg");
  const at = (path) =>
    path
      .split("/")
      .filter(Boolean)
      .reduce((el, i) => el.children[Number(i)], svg);
  const hex = (c) => {
    const m = c.match(/rgba?\((\d+), (\d+), (\d+)/);
    return m
      ? "#" +
          m
            .slice(1, 4)
            .map((v) => Number(v).toString(16).padStart(2, "0"))
            .join("")
      : c;
  };
  const props = [
    ["fill", "rgb(0, 0, 0)", hex],
    ["fill-opacity", "1"],
    ["fill-rule", "nonzero"],
    ["stroke", "none", hex],
    ["stroke-width", "1px", (v) => v.replace(/px$/, "")],
    ["stroke-linecap", "butt"],
    ["stroke-linejoin", "miter"],
    ["stroke-miterlimit", "4"],
    ["opacity", "1"],
  ];
  const shapes = "path,rect,polygon,polyline,circle,ellipse,line";
  const out = [];

  for (const { name, source, paths, parts = {} } of spec) {
    if (source !== document.title) continue;
    let box = null;
    let clip = null;
    // Named parts become data-part hooks for motion; a named group is never unwrapped.
    for (const [part, p] of Object.entries(parts)) {
      const el = at(p);
      if (!el) throw new Error(`${name}: part "${part}" has nothing at ${p}`);
      el.setAttribute("data-part", part);
    }
    const nodes = paths.map((p) => {
      const el = at(p);
      if (!el) throw new Error(`${name}: nothing at ${p}`);
      // getBBox leaves out strokes: pad by half the widest one, or a straight line
      // would get a box of zero height.
      const stroked = [el, ...el.querySelectorAll(shapes)].filter(
        (s) => s.matches(shapes) && getComputedStyle(s).stroke !== "none",
      );
      const pad = Math.max(
        0,
        ...stroked.map((s) => parseFloat(getComputedStyle(s).strokeWidth) / 2),
      );
      const g = el.getBBox();
      const b = {
        x: g.x - pad,
        y: g.y - pad,
        width: g.width + 2 * pad,
        height: g.height + 2 * pad,
      };
      box = box
        ? {
            x0: Math.min(box.x0, b.x),
            y0: Math.min(box.y0, b.y),
            x1: Math.max(box.x1, b.x + b.width),
            y1: Math.max(box.y1, b.y + b.height),
          }
        : { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height };

      const copy = el.cloneNode(true);
      const originals = [el, ...el.querySelectorAll("*")];
      const copies = [copy, ...copy.querySelectorAll("*")];
      copies.forEach((c, i) => {
        const o = originals[i];
        const cs = getComputedStyle(o);
        const clipRef = cs.clipPath.match(/url\("?#([^")]+)/);
        if (clipRef) {
          const rect = document
            .getElementById(clipRef[1])
            .querySelector("use, rect");
          const r = (
            rect.tagName === "use"
              ? document.querySelector(
                  rect.getAttribute("xlink:href") ?? rect.getAttribute("href"),
                )
              : rect
          ).getBBox();
          clip = { x0: r.x, y0: r.y, x1: r.x + r.width, y1: r.y + r.height };
        }
        for (const a of ["class", "id", "style"]) c.removeAttribute(a);
        if (c.matches(shapes)) {
          for (const [prop, initial, fmt = (v) => v] of props) {
            const v = cs.getPropertyValue(prop);
            if (v && v !== initial) c.setAttribute(prop, fmt(v));
          }
        } else if (cs.opacity !== "1") c.setAttribute("opacity", cs.opacity);
      });
      // Clip definitions (now the viewBox), invisible helpers, then groups left empty.
      copy.querySelectorAll("defs, clipPath, use").forEach((c) => c.remove());
      copy.querySelectorAll(shapes).forEach((c) => {
        const fill = c.getAttribute("fill");
        if (fill === "none" && !c.hasAttribute("stroke")) c.remove();
      });
      let pruned = true;
      while (pruned) {
        pruned = false;
        copy.querySelectorAll("g").forEach((g) => {
          if (!g.children.length) {
            g.remove();
            pruned = true;
          } else if (g.children.length === 1 && !g.attributes.length) {
            g.replaceWith(g.firstElementChild);
            pruned = true;
          }
        });
      }
      return copy;
    });
    if (clip)
      box = {
        x0: Math.max(box.x0, clip.x0),
        y0: Math.max(box.y0, clip.y0),
        x1: Math.min(box.x1, clip.x1),
        y1: Math.min(box.y1, clip.y1),
      };
    const r = (v) => Math.round(v * 100) / 100;
    out.push({
      name,
      box: {
        x: r(box.x0),
        y: r(box.y0),
        w: r(box.x1 - box.x0),
        h: r(box.y1 - box.y0),
      },
      markup: nodes.map((n) => new XMLSerializer().serializeToString(n)),
    });
  }
  const pre = document.createElement("pre");
  pre.id = "out";
  pre.textContent = JSON.stringify(out);
  document.body.append(pre);
}

function extract(source) {
  const raw = readFileSync(join(svgDir, source), "utf8")
    .replace(/<\?xml[^>]*>/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Embedded photos are never extracted (they're content, in public/), and can be
    // tens of MB: drop their data before the browser sees the file.
    .replace(/(xlink:)?href="data:[^"]*"/g, "");
  // The script goes in <head>-order after the SVG; the HTML parser closes whatever an
  // incomplete export leaves open.
  const html = `<!doctype html><title>${source}</title><body>${raw}<script>(${inPage})(${JSON.stringify(pieces)})</script>`;
  const tmp = join(tmpdir(), `home-art-${process.pid}.html`);
  writeFileSync(tmp, html);
  try {
    const dom = execFileSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--dump-dom",
        pathToFileURL(tmp).href,
      ],
      { maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
    ).toString();
    const json = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/)?.[1];
    if (!json) throw new Error(`Chrome returned no result for ${source}`);
    return JSON.parse(
      json
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"),
    );
  } finally {
    rmSync(tmp, { force: true });
  }
}

const jsxAttr = {
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
};
const toJsx = (markup) =>
  markup
    .replace(/&#(9|10|13);/g, " ")
    .replace(/\s+xmlns(:\w+)?="[^"]*"/g, "")
    .replace(/\s([a-z-]+)=/g, (m, a) => (jsxAttr[a] ? ` ${jsxAttr[a]}=` : m))
    .replace(/\s+/g, " ")
    // Whitespace between tags would become {" "} text nodes in JSX.
    .replace(/>\s*</g, ">\n<");

const pascal = (name) =>
  name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());

const results = [...new Set(pieces.map((p) => p.source))].flatMap(extract);
// Clear old pieces file by file: a running dev server holds the folder itself open.
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(outDir)) rmSync(join(outDir, f), { force: true });

for (const { name, box, markup } of results) {
  const spec = pieces.find((p) => p.name === name);
  writeFileSync(
    join(outDir, `${name}.tsx`),
    `// Generated by scripts/home-art/extract.mjs from ${spec.source} (${spec.paths.join(", ")}).
// Don't edit by hand: re-run the script. ${spec.note ?? ""}
import type { ArtBox, ArtProps } from "./types";

export const box: ArtBox = ${JSON.stringify(box)};

export function ${pascal(name)}(props: ArtProps) {
  return (
    <svg viewBox="${box.x} ${box.y} ${box.w} ${box.h}" data-art="${name}" aria-hidden="true" focusable="false" {...props}>
${markup.map(toJsx).join("\n")}
    </svg>
  );
}
`,
  );
}

writeFileSync(
  join(outDir, "types.ts"),
  `// Generated by scripts/home-art/extract.mjs.
import type { JSX, SVGProps } from "react";

/** A piece's box in artboard units (the designer's 1920-wide frame). */
export interface ArtBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ArtProps = SVGProps<SVGSVGElement>;

export type ArtComponent = (props: ArtProps) => JSX.Element;
`,
);
const camel = (name) => pascal(name).replace(/^./, (c) => c.toLowerCase());
writeFileSync(
  join(outDir, "index.ts"),
  `// Generated by scripts/home-art/extract.mjs.
import type { ArtBox, ArtComponent } from "./types";
${results
  .map(
    ({ name }) =>
      `import { ${pascal(name)}, box as ${camel(name)}Box } from "./${name}";`,
  )
  .join("\n")}

export type { ArtBox, ArtComponent, ArtProps } from "./types";
export {
${results.map(({ name }) => `  ${pascal(name)}, ${camel(name)}Box,`).join("\n")}
};

/** Every piece by name, for pieces picked in data/ (e.g. a stat's icon). */
export const pieces: Record<string, { Art: ArtComponent; box: ArtBox }> = {
${results.map(({ name }) => `  "${name}": { Art: ${pascal(name)}, box: ${camel(name)}Box },`).join("\n")}
};
`,
);

execFileSync(process.execPath, [
  join(root, "node_modules/prettier/bin/prettier.cjs"),
  "--write",
  "--log-level=warn",
  outDir,
]);

const missing = pieces.filter((p) => !results.some((r) => r.name === p.name));
if (missing.length)
  throw new Error(`Not extracted: ${missing.map((p) => p.name).join(", ")}`);
console.log(`Wrote ${results.length} pieces to ${outDir}`);
