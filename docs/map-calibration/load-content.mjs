// Offline adapter for the Turbopack-only raw YAML glob. Keep content parsing,
// validation and map projection in the same src/content module the app uses.
import fs from "node:fs";
import { registerHooks } from "node:module";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export async function loadContent() {
  const root = fileURLToPath(new URL("../../data/", import.meta.url));
  const moduleUrl = new URL("../../src/content/index.ts", import.meta.url).href;
  const files = {};
  function collect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) collect(path);
      else if (entry.isFile() && entry.name.endsWith(".yaml"))
        files["/data/" + relative(root, path).replaceAll("\\", "/")] = {
          default: fs.readFileSync(path, "utf8"),
        };
    }
  }
  collect(root);
  const hook = registerHooks({
    load(url, context, nextLoad) {
      const result = nextLoad(url, context);
      if (url !== moduleUrl) return result;
      const source =
        typeof result.source === "string"
          ? result.source
          : Buffer.from(result.source).toString("utf8");
      return {
        ...result,
        source: `import.meta.glob = (pattern, options) => {
          if (pattern !== "/data/**/*.yaml" || options?.query !== "?raw" || options?.eager !== true)
            throw new Error("Update the offline content adapter for this glob");
          return ${JSON.stringify(files)};
        };\n${source}`,
      };
    },
  });
  try {
    return await import(moduleUrl);
  } finally {
    hook.deregister();
  }
}
