import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const output = path.resolve(root, "dist/forms-library");
// The declarations emitted by the monorepo compiler preserve package directories.
// Move the self-contained public type graph beside the JS export.
const declarationDir = path.join(output, "form-builder/src");
if (fs.existsSync(declarationDir)) {
  for (const file of fs.readdirSync(declarationDir))
    if (file.endsWith(".d.ts")) {
      const source = fs.readFileSync(path.join(declarationDir, file), "utf8");
      if (source.includes("@flowdocker/"))
        throw new Error(`Private workspace type dependency: ${file}`);
      fs.writeFileSync(path.join(output, file), source);
    }
  fs.rmSync(path.join(output, "form-builder"), { recursive: true });
}
if (!fs.existsSync(path.join(output, "standalone.d.ts")))
  throw new Error("Missing public declarations");
const provenance = JSON.parse(
  fs.readFileSync(path.join(output, "bundle-provenance.json"), "utf8"),
);
provenance.push(
  path.join(root, "node_modules/@fontsource/inter"),
  path.join(root, "node_modules/tw-animate-css"),
);
const noticeDir = path.join(output, "licenses");
fs.mkdirSync(noticeDir, { recursive: true });
const inventory = [];
for (const directory of provenance) {
  const meta = JSON.parse(
    fs.readFileSync(path.join(directory, "package.json"), "utf8"),
  );
  if (
    inventory.some(
      (entry) => entry.name === meta.name && entry.version === meta.version,
    )
  )
    continue;
  const licenseFiles = fs
    .readdirSync(directory)
    .filter(
      (file) =>
        /^(license|licence|copying|notice)(\.|-|$)/i.test(file) &&
        fs.statSync(path.join(directory, file)).isFile(),
    );
  if (
    !licenseFiles.length &&
    meta.name === "react-remove-scroll-bar" &&
    meta.version === "2.3.8"
  ) {
    const file = "react-remove-scroll-bar-LICENSE.txt";
    fs.copyFileSync(
      path.join(root, "packages/form-builder/legal", file),
      path.join(noticeDir, file),
    );
    inventory.push({
      name: meta.name,
      version: meta.version,
      license: meta.license,
      files: [`licenses/${file}`],
      source:
        "https://github.com/theKashey/react-remove-scroll-bar/blob/8ca9ba5ea52de03308fe8ced94f7b159a44d28ff/LICENSE",
      note: "npm tarball omits license; upstream license retrieved separately. npm gitHead does not resolve in upstream repository.",
    });
    continue;
  }
  if (!licenseFiles.length)
    throw new Error(`Missing bundled license text: ${meta.name}`);
  const destination = path.join(noticeDir, meta.name.replace(/[@/]/g, "_"));
  fs.mkdirSync(destination, { recursive: true });
  for (const file of licenseFiles)
    fs.copyFileSync(path.join(directory, file), path.join(destination, file));
  inventory.push({
    name: meta.name,
    version: meta.version,
    license: meta.license,
    files: licenseFiles.map(
      (file) => `licenses/${path.basename(destination)}/${file}`,
    ),
  });
}
fs.copyFileSync(
  path.join(root, "packages/form-builder/legal/shadcn-LICENSE.txt"),
  path.join(noticeDir, "shadcn-LICENSE.txt"),
);
inventory.push({
  name: "shadcn/ui adapted source",
  version: "CLI 4.23.0 registry",
  license: "MIT",
  files: ["licenses/shadcn-LICENSE.txt"],
});
fs.writeFileSync(
  path.join(output, "dependency-inventory.json"),
  JSON.stringify(
    inventory.sort((a, b) => a.name.localeCompare(b.name)),
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(output, "THIRD_PARTY_NOTICES.md"),
  "# Bundled third-party licenses\n\nOriginal FlowDocker wrappers, schema, renderer and designer remain separate from upstream code. See dependency-inventory.json and licenses/ for complete bundled notices. React and React DOM are peer dependencies.\n\n" +
    inventory
      .map((entry) => `- ${entry.name} ${entry.version}: ${entry.license}`)
      .join("\n") +
    "\n",
);
fs.copyFileSync(
  path.join(root, "packages/form-builder/OWNERSHIP.md"),
  path.join(output, "OWNERSHIP.md"),
);
fs.copyFileSync(
  path.join(root, "packages/form-builder/README.md"),
  path.join(output, "README.md"),
);
fs.writeFileSync(
  path.join(output, "package.json"),
  JSON.stringify(
    {
      name: "@flowdocker/forms",
      version: "0.2.0",
      type: "module",
      private: true,
      license: "UNLICENSED",
      main: "./flowdocker-forms.js",
      module: "./flowdocker-forms.js",
      types: "./standalone.d.ts",
      exports: {
        ".": { types: "./standalone.d.ts", import: "./flowdocker-forms.js" },
        "./styles.css": "./styles.css",
      },
      peerDependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
      files: ["*.js", "*.d.ts", "*.css", "licenses", "*.json", "*.md"],
      sideEffects: ["*.css"],
    },
    null,
    2,
  ),
);
fs.unlinkSync(path.join(output, "bundle-provenance.json"));
process.stdout.write(
  `Prepared @flowdocker/forms 0.2.0 with ${inventory.length} bundled license entries.\n`,
);
