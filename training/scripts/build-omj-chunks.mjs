import fs from 'node:fs';
import path from 'node:path';

const source='generated/omj2188-data.json';
const outDir='generated/omj2188';
const size=36;
const data=JSON.parse(fs.readFileSync(source,'utf8'));
if(data?.actId!=='omj2188'||!Array.isArray(data.articles)||data.articles.length!==217)throw new Error('OMJ source invalid');
fs.mkdirSync(outDir,{recursive:true});
for(const file of fs.readdirSync(outDir))if(/^chunk-\d+\.json$/.test(file)||file==='index.json')fs.rmSync(path.join(outDir,file));
const chunks=[];
for(let i=0;i<data.articles.length;i+=size){
  const articles=data.articles.slice(i,i+size),number=String(chunks.length+1).padStart(2,'0'),file=`chunk-${number}.json`;
  fs.writeFileSync(path.join(outDir,file),JSON.stringify({actId:data.actId,articles}));
  chunks.push({file:`./generated/omj2188/${file}`,start:articles[0].number,end:articles.at(-1).number,count:articles.length});
}
const index={actId:data.actId,actTitle:data.actTitle,sourceUrl:data.sourceUrl,sourceNote:data.sourceNote,totalArticles:data.articles.length,chunks,articles:data.articles.map((article,index)=>({id:article.id,number:article.number,heading:article.heading,wordCount:article.wordCount,chunk:Math.floor(index/size)}))};
fs.writeFileSync(path.join(outDir,'index.json'),JSON.stringify(index));
console.log(`Generated ${chunks.length} OMJ chunks (${data.articles.length} articles).`);
