window.OMJ2188_DATA_READY=(async()=>{
  const started=performance.now();
  const response=await fetch("./generated/omj2188/index.json",{cache:"force-cache"});
  if(!response.ok)throw new Error(`Nu pot încărca indexul OMJ 2188: ${response.status}`);
  const index=await response.json();
  if(index?.actId!=="omj2188"||index.totalArticles!==217||!Array.isArray(index.chunks))throw new Error("Indexul OMJ 2188 este invalid.");
  const order=new Map(index.articles.map((article,i)=>[article.id,i]));
  const loaded=new Map();
  const data={actId:index.actId,actTitle:index.actTitle,sourceUrl:index.sourceUrl,sourceNote:index.sourceNote,articles:[]};
  window.OMJ2188_SYNTHESIS=data;

  async function loadChunk(chunkIndex){
    if(loaded.has(chunkIndex))return loaded.get(chunkIndex);
    const meta=index.chunks[chunkIndex];if(!meta)throw new Error(`Chunk OMJ necunoscut: ${chunkIndex}`);
    const promise=(async()=>{
      const t0=performance.now(),r=await fetch(meta.file,{cache:"force-cache"});if(!r.ok)throw new Error(`Nu pot încărca ${meta.file}`);const payload=await r.json();
      if(payload?.actId!=="omj2188"||!Array.isArray(payload.articles))throw new Error(`Chunk OMJ invalid: ${meta.file}`);
      const existing=new Set(data.articles.map(article=>article.id));for(const article of payload.articles)if(!existing.has(article.id))data.articles.push(article);
      data.articles.sort((a,b)=>(order.get(a.id)??9999)-(order.get(b.id)??9999));
      document.dispatchEvent(new CustomEvent("training:data-measure",{detail:{dataset:"omj2188",chunk:chunkIndex,duration:Math.round((performance.now()-t0)*10)/10,articles:payload.articles.length}}));
      return payload.articles;
    })().catch(error=>{loaded.delete(chunkIndex);throw error});
    loaded.set(chunkIndex,promise);return promise;
  }
  async function loadAll(){await Promise.all(index.chunks.map((_,i)=>loadChunk(i)));if(data.articles.length!==217)throw new Error(`Corpus OMJ incomplet: ${data.articles.length}/217`);return data}
  window.loadOmj2188Chunk=loadChunk;window.loadOmj2188All=loadAll;window.OMJ2188_INDEX=index;
  const initial=Math.floor(Date.now()/86400000)%index.chunks.length;
  await loadChunk(initial);
  document.dispatchEvent(new CustomEvent("training:data-measure",{detail:{dataset:"omj2188-index",duration:Math.round((performance.now()-started)*10)/10,articles:data.articles.length}}));
  return data;
})().catch(error=>{console.error("OMJ 2188 corpus:",error);window.OMJ2188_DATA_ERROR=error;return null});
