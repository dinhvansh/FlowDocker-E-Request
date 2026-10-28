import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";
import fs from "node:fs";
import path from "node:path";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      include: ["packages/form-builder/src/**"],
      exclude: ["**/*.test.*"],
      tsconfigPath: "tsconfig.forms.json",
    }),
    {
      name: "forms-bundle-provenance",
      generateBundle(_options, bundle) {
        const roots = new Set<string>();
        for (const item of Object.values(bundle))
          if (item.type === "chunk")
            for (const id of Object.keys(item.modules)) {
              if (!id.includes("node_modules") || id.startsWith("\0")) continue;
              let directory = path.dirname(id.split("?")[0]);
              while (directory.includes("node_modules")) {
                if (fs.existsSync(path.join(directory, "package.json"))) {
                  roots.add(directory);
                  break;
                }
                directory = path.dirname(directory);
              }
            }
        this.emitFile({
          type: "asset",
          fileName: "bundle-provenance.json",
          source: JSON.stringify([...roots]),
        });
      },
    },
  ],
  build: {
    outDir: "dist/forms-library",
    lib: {
      entry: "packages/form-builder/src/standalone.tsx",
      name: "FlowDockerForms",
      formats: ["es"],
      fileName: () => "flowdocker-forms.js",
      cssFileName: "styles",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-dom/client",
        "react-dom/server",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    emptyOutDir: true,
  },
});
