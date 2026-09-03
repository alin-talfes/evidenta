import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("./data.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const data = context.window.INSTRUCTAJ_DATA;

assert.ok(data, "Setul de date trebuie să existe");
assert.equal(data.verifiedAt, "03.09.2026");
assert.equal(data.workflows.length, 23, "Sunt necesare toate cele 23 de fișe operaționale");
assert.equal(new Set(data.workflows.map(item => item.id)).size, data.workflows.length, "ID-urile trebuie să fie unice");
for (const workflow of data.workflows) {
  assert.ok(data.categories.includes(workflow.category), `Categorie validă pentru ${workflow.id}`);
  assert.ok(workflow.legal.some(item => item.includes("OMJ 2188/C/2022")), `Temei OMJ pentru ${workflow.id}`);
  assert.ok(workflow.steps.length >= 5, `Minimum 5 pași pentru ${workflow.id}`);
  assert.ok(workflow.checks.length >= 3, `Minimum 3 verificări pentru ${workflow.id}`);
  assert.ok(workflow.pitfalls.length >= 2, `Minimum 2 erori frecvente pentru ${workflow.id}`);
}
const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
for (const file of ["styles.css", "data.js", "app.js"]) assert.ok(html.includes(file), `${file} este încărcat`);
for (const url of ["255745", "109855", "120611"]) assert.ok(html.includes(url), `Sursa oficială ${url} este publicată`);
console.log("Instructaj: structură și conținut validate.");
