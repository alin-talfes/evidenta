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
const old=`  <link rel="stylesheet" href="styles.css">\n  <link rel="stylesheet" href="mobile.css">\n  <link rel="stylesheet" href="mobile-study.css">\n  <link rel="stylesheet" href="mobile-polish.css">\n  <link rel="stylesheet" href="runtime-performance.css">`;
const next=`  <link rel="stylesheet" href="styles.css">\n  <link rel="stylesheet" href="generated/mobile-bundle.css">`;
if(html.includes(old))html=html.replace(old,next);
else if(!html.includes(next))throw new Error('Expected stylesheet block not found.');
fs.writeFileSync(index,html);
