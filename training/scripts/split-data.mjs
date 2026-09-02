import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, 'data.js');
const outDir = path.join(ROOT, 'generated');
const text = await fs.readFile(sourcePath, 'utf8');

function evaluate(expression) {
  const clean = String(expression).trim().replace(/;\s*$/g, '');
  return Function(`"use strict";return (${clean});`)();
}

function between(startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing marker: ${startMarker}`);
  const from = start + startMarker.length;
  const end = text.indexOf(endMarker, from);
  if (end < 0) throw new Error(`Missing marker: ${endMarker}`);
  return text.slice(from, end).trim();
}

function officialQuestionData() {
  const marker = 'questions.push(';
  const start = text.indexOf(marker);
  if (start < 0) return [];
  const next = text.indexOf('const interviewScenarios =', start + marker.length);
  if (next < 0) return [];
  const block = text.slice(start + marker.length, next);
  const close = block.lastIndexOf(');');
  const args = (close >= 0 ? block.slice(0, close) : block).trim().replace(/;\s*$/g, '');
  return evaluate(`[${args}]`);
}

const legislation = evaluate(between('const legislationActs = ', '\n\nconst laws ='));
const official = {
  written: evaluate(between('const officialWritten = ', '\n\nconst officialSets =')),
  sets: evaluate(between('const officialSets = ', '\n\nquestions.push(')),
  questions: officialQuestionData()
};
const interview = evaluate(between('const interviewScenarios = ', 'const interviewAnswerKey ='));
const answerKey = evaluate(between('const interviewAnswerKey = ', 'interviewScenarios.forEach'));
interview.forEach(item => Object.assign(item, answerKey[item.id] || {}));

await fs.mkdir(outDir, { recursive: true });
const outputs = {
  'legislation-data.json': legislation,
  'official-data.json': official,
  'interview-data.json': interview
};

for (const [name, payload] of Object.entries(outputs)) {
  const target = path.join(outDir, name);
  await fs.writeFile(target, `${JSON.stringify(payload)}\n`, 'utf8');
  const stat = await fs.stat(target);
  console.log(`${name}: ${stat.size} bytes`);
}
