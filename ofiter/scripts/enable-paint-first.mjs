import fs from 'node:fs';

const file='index.html';
let html=fs.readFileSync(file,'utf8');
const oldBlock=`  <script src="data-core.js"></script>\n  <script src="legal-hotfix.js"></script>\n  <script src="app.js"></script>\n  <script src="runtime-performance.js"></script>\n  <script src="mobile-nav.js"></script>\n  <script src="fast-loader.js"></script>`;
const newBlock=`  <script src="data-core.js"></script>\n  <script src="legal-hotfix.js"></script>\n  <script src="bootstrap.js"></script>`;
if(html.includes(newBlock)){
  console.log('Paint-first bootstrap already enabled.');
  process.exit(0);
}
if(!html.includes(oldBlock))throw new Error('Expected startup script block not found.');
html=html.replace(oldBlock,newBlock);
fs.writeFileSync(file,html);
console.log('Enabled paint-first bootstrap.');
