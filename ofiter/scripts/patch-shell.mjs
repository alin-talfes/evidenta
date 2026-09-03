import fs from 'node:fs';
const file='index.html';
let html=fs.readFileSync(file,'utf8');
html=html.replace(/\s*<script src="legal-hotfix\.js"><\/script>\s*/,'\n  ');
fs.writeFileSync(file,html);
console.log('App shell cleaned.');
