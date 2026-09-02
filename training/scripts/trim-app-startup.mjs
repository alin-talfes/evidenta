import fs from 'node:fs/promises';

const file='app.js';
const text=await fs.readFile(file,'utf8');
const legacy='populateSelects();populateInterviewFilters();bindLegislation();renderLegislation();renderModules();renderBibliography();renderOfficial();renderInterview();renderCards();renderStats();renderMistakes();';
const optimized='populateSelects();renderModules();renderStats();';

if(text.includes(optimized)&&!text.includes(legacy)){
  console.log('app.js startup is already trimmed.');
  process.exit(0);
}
if(!text.includes(legacy))throw new Error('Expected app.js startup block not found. Refusing an unsafe patch.');
await fs.writeFile(file,text.replace(legacy,optimized),'utf8');
console.log('Trimmed app.js startup render path.');
