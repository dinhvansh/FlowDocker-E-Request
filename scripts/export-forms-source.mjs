import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const target = process.argv[2];
if (!target || !path.isAbsolute(target))
  throw new Error(
    "Supply a new absolute directory for the independent product source.",
  );
if (fs.existsSync(target))
  throw new Error(
    "Destination exists; choose a new directory to preserve existing work.",
  );
const root = process.cwd();
fs.mkdirSync(target, { recursive: true });
for (const name of ["form-builder", "ui", "i18n"])
  fs.cpSync(
    path.join(root, "packages", name),
    path.join(target, "packages", name),
    {
      recursive: true,
      filter: (source) =>
        !["node_modules", "dist"].includes(path.basename(source)),
    },
  );
for (const file of [
  "vite.forms.config.ts",
  "vite.config.ts",
  "tsconfig.forms.json",
  "eslint.config.js",
  ".gitignore",
])
  fs.copyFileSync(path.join(root, file), path.join(target, file));
fs.mkdirSync(path.join(target, "scripts"));
fs.copyFileSync(
  path.join(root, "scripts/package-forms.mjs"),
  path.join(target, "scripts/package-forms.mjs"),
);
const tsconfig = JSON.parse(fs.readFileSync(path.join(root, "tsconfig.json")));
tsconfig.include = ["packages", "vite.config.ts", "vite.forms.config.ts"];
tsconfig.compilerOptions.paths = { "@/*": ["./packages/ui/src/*"] };
fs.writeFileSync(
  path.join(target, "tsconfig.json"),
  JSON.stringify(tsconfig, null, 2),
);
const workspace = JSON.parse(fs.readFileSync(path.join(root, "package.json")));
workspace.name = "flowdocker-forms-source";
workspace.version = "0.2.0";
workspace.workspaces = ["packages/*"];
workspace.scripts = {
  dev: "vite packages/form-builder/examples --host 127.0.0.1 --port 5176 --strictPort",
  build:
    "vite build --config vite.forms.config.ts && node scripts/package-forms.mjs",
  typecheck: "tsc --noEmit -p tsconfig.json",
  test: "vitest run",
  lint: "eslint .",
};
fs.writeFileSync(
  path.join(target, "package.json"),
  JSON.stringify(workspace, null, 2),
);
for (const file of ["README.md", "OWNERSHIP.md"])
  fs.copyFileSync(
    path.join(root, "packages/form-builder", file),
    path.join(target, file),
  );
fs.writeFileSync(
  path.join(target, "START-HERE.md"),
  "# Independent editable product source\n\nThis directory builds without E-Request or its repository. Run npm install, npm run typecheck, npm test and npm run build. npm run dev opens the synthetic source example at port 5176. Pack dist/forms-library with npm pack. Original source is in packages/form-builder; shared primitives in packages/ui; translation in packages/i18n.\n\nThe root README documents the packed product API. In this extracted source, use npm run build instead of npm run build:forms. Preserve all upstream notices in the built product. No public publishing credentials or customer license terms are included.\n",
);
const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else
      files.push({
        path: path.relative(target, full).replaceAll("\\", "/"),
        sha256: createHash("sha256")
          .update(fs.readFileSync(full))
          .digest("hex"),
      });
  }
};
walk(target);
fs.writeFileSync(
  path.join(target, "SOURCE-MANIFEST.json"),
  JSON.stringify(
    { product: "FlowDocker Forms", version: "0.2.0", files },
    null,
    2,
  ),
);
process.stdout.write(`Exported independent editable source: ${target}\n`);
