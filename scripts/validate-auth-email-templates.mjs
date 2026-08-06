import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const directory = join(process.cwd(), "supabase", "templates");
const requiredVariables = new Map([
  ["confirmation.html", ["{{ .ConfirmationURL }}"]],
  ["invite.html", ["{{ .ConfirmationURL }}"]],
  ["magic-link.html", ["{{ .ConfirmationURL }}"]],
  ["email-change.html", ["{{ .ConfirmationURL }}", "{{ .NewEmail }}"]],
  ["recovery.html", ["{{ .ConfirmationURL }}"]],
  ["reauthentication.html", ["{{ .Token }}"]],
]);

const files = (await readdir(directory)).filter((filename) => filename.endsWith(".html")).sort();
const errors = [];

if (files.length !== requiredVariables.size) {
  errors.push(`Expected ${requiredVariables.size} HTML templates, found ${files.length}.`);
}

for (const [filename, variables] of requiredVariables) {
  const html = await readFile(join(directory, filename), "utf8");
  if (!html.toLowerCase().includes("<!doctype html>")) errors.push(`${filename}: missing doctype.`);
  if (!html.includes("</html>")) errors.push(`${filename}: incomplete HTML document.`);
  if (!html.includes("birdee-face-square.png")) errors.push(`${filename}: current logo is missing.`);
  if (html.includes("birdee-mark.png")) errors.push(`${filename}: old logo is still referenced.`);
  for (const variable of variables) {
    if (!html.includes(variable)) errors.push(`${filename}: missing ${variable}.`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Auth template validation passed: 6/6 complete templates with the current logo and required Supabase variables.");
