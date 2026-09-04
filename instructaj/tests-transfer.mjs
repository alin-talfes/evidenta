import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const context = { window: {}, console };

for (const file of ["data.js", "omj2188-completari.js", "verificare-dosar-transfer.js"]) {
  vm.runInNewContext(fs.readFileSync(path.join(moduleDir, file), "utf8"), context, { filename: file });
}

const data = context.window.INSTRUCTAJ_DATA;
assert.ok(data, "Setul de date instructaj trebuie să existe");
assert.equal(data.omj2188Coverage?.complete, true, "Acoperirea OMJ 2188 trebuie să rămână completă");
assert.deepEqual(Array.from(data.omj2188Coverage?.missingArticles || []), [], "Nu sunt permise articole OMJ lipsă");

const workflow = data.workflows.find(item => item.id === "verificare-dosar-transfer");
assert.ok(workflow, "Fișa verificare dosar transfer trebuie încărcată");
assert.equal(workflow.steps.length, 12, "Fișa trebuie să păstreze cei 12 itemi principali de verificare");
assert.ok(workflow.legal.some(item => item.includes("Decizia nr. 293/17.05.2022")), "Fișa trebuie să includă CCR nr. 293/2022");
assert.ok(workflow.legal.some(item => item.includes("Legea nr. 169/2017")), "Fișa trebuie să includă Legea nr. 169/2017");
assert.ok(workflow.steps.some(item => item.includes("01.02.2014") && item.includes("nu se stabilește mecanic")), "Data de 01.02.2014 trebuie prezentată ca reper, nu ca regulă automată");
assert.ok(workflow.steps.some(item => item.includes("art. 66 alin. (1) lit. d)")), "Dreptul de vot trebuie corelat cu art. 66 alin. (1) lit. d) din Codul penal actual");
assert.ok(workflow.steps.some(item => {
  const text = item.toLocaleLowerCase("ro");
  return text.includes("extrădat") && text.includes("garan");
}), "Fișa trebuie să trateze extrădarea și garanțiile");
assert.ok(workflow.steps.some(item => item.includes("RECHIZITORIU")), "Fișa trebuie să trateze rechizitoriul/cauza nouă");
assert.ok(workflow.steps.some(item => item.includes("PROBE BIOLOGICE")), "Fișa trebuie să trateze probele biologice");
assert.ok(workflow.steps.some(item => item.includes("REGISTRUL DE TERMENE")), "Fișa trebuie să impună actualizarea registrului de termene");
assert.ok(workflow.legalRules.some(item => item.includes("proceduri operaționale interne")), "Practica internă trebuie separată explicit de norma juridică generală");

const ids = data.workflows.map(item => item.id);
assert.equal(new Set(ids).size, ids.length, "Fișele îmbogățite trebuie să aibă ID-uri unice");

console.log("Instructaj: fișa de verificare a dosarului sosit prin transfer este încărcată și validată.");
