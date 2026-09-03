import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root=process.cwd();
const parts=[
  'part-01.txt','part-02.txt','part-02b.txt','part-03.txt','part-04.txt',
  'part-05.txt','part-06.txt','part-07.txt','part-08.txt'
].map(name=>path.join(root,'omj2188-data',name));
const encoded=parts.map(file=>fs.readFileSync(file,'utf8')).join('').replace(/\s+/g,'');
const compressed=Buffer.from(encoded,'base64');
const jsonText=zlib.gunzipSync(compressed).toString('utf8');
const data=JSON.parse(jsonText);
if(data?.actId!=='omj2188'||!Array.isArray(data.articles)||data.articles.length!==217)throw new Error('Corpus OMJ invalid');
if(data.articles[0]?.number!=='Art. 1'||data.articles.at(-1)?.number!=='Art. 232')throw new Error('Limite corpus OMJ invalide');
fs.mkdirSync(path.join(root,'generated'),{recursive:true});
fs.writeFileSync(path.join(root,'generated','omj2188-data.json'),JSON.stringify(data));
console.log(`Generated OMJ JSON with ${data.articles.length} articles.`);
