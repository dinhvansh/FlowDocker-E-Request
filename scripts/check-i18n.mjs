import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const catalogPath = "packages/i18n/src/en.ts";
const catalog = ts.createSourceFile(
  catalogPath,
  fs.readFileSync(catalogPath, "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
const keys = new Set();
function readKeys(node) {
  if (ts.isPropertyAssignment(node) && node.name)
    keys.add(
      ts.isStringLiteral(node.name)
        ? node.name.text
        : node.name.getText(catalog),
    );
  ts.forEachChild(node, readKeys);
}
readKeys(catalog);
const errors = [];
function inspect(file) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  function report(node, message) {
    const { line } = source.getLineAndCharacterOfPosition(
      node.getStart(source),
    );
    errors.push(`${file}:${line + 1}: ${message}`);
  }
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(source) === "t" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0]) &&
      !keys.has(node.arguments[0].text)
    )
      report(node, `Missing English catalog key: ${node.arguments[0].text}`);
    if (ts.isJsxText(node) && /[A-Za-zÀ-ỹĐđ]/u.test(node.text.trim()))
      report(node, `Move visible text into t(): ${node.text.trim()}`);
    if (
      ts.isJsxAttribute(node) &&
      [
        "title",
        "label",
        "aria-label",
        "placeholder",
        "hint",
        "detail",
        "empty",
      ].includes(node.name.getText(source)) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      /[A-Za-zÀ-ỹĐđ]/u.test(node.initializer.text)
    )
      report(node, `Localize ${node.name.getText(source)} with t()`);
    ts.forEachChild(node, visit);
  }
  visit(source);
}
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", "dist"].includes(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
      inspect(file);
  }
}
walk("apps");
walk("packages");
if (errors.length) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else
  process.stdout.write(
    "i18n check passed: UI literals are localized and literal translation keys exist.\n",
  );
