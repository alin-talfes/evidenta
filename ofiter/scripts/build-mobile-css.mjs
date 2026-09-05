import fs from 'node:fs';

const sources=['mobile.css','mobile-study.css','mobile-polish.css','runtime-performance.css'];
const target='generated/mobile-bundle.css';
const banner='/* GENERATED FILE — edit source CSS files, not this bundle. */\n';
const content=banner+sources.map(file=>`\n/* ${file} */\n${fs.readFileSync(file,'utf8').trim()}\n`).join('');
fs.mkdirSync('generated',{recursive:true});
fs.writeFileSync(target,content);
console.log(`Generated ${target} from ${sources.length} source files.`);

const index='index.html';
let html=fs.readFileSync(index,'utf8');
if(!html.includes('generated/mobile-bundle.css')){
  const legacyLinks=/\s*<link rel="stylesheet" href="mobile\.css(?:\?[^\"]*)?">\s*<link rel="stylesheet" href="mobile-study\.css(?:\?[^\"]*)?">\s*<link rel="stylesheet" href="mobile-polish\.css(?:\?[^\"]*)?">\s*<link rel="stylesheet" href="runtime-performance\.css(?:\?[^\"]*)?">/;
  if(!legacyLinks.test(html))throw new Error('Nu există nici bundle-ul mobil, nici blocul legacy de stylesheet-uri mobile.');
  html=html.replace(legacyLinks,'\n  <link rel="stylesheet" href="generated/mobile-bundle.css">');
  fs.writeFileSync(index,html);
}
