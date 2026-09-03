self.onmessage=async event=>{
  const id=event.data?.id;
  const paths=[
    "./omj2188-data/part-01.txt",
    "./omj2188-data/part-02.txt",
    "./omj2188-data/part-02b.txt",
    "./omj2188-data/part-03.txt",
    "./omj2188-data/part-04.txt",
    "./omj2188-data/part-05.txt",
    "./omj2188-data/part-06.txt",
    "./omj2188-data/part-07.txt",
    "./omj2188-data/part-08.txt"
  ];
  try{
    const parts=await Promise.all(paths.map(async path=>{
      const response=await fetch(path,{cache:"force-cache"});
      if(!response.ok)throw new Error(`Nu pot încărca ${path}`);
      return response.text();
    }));
    const encoded=parts.join("").replace(/\s+/g,"");
    const binary=atob(encoded);
    const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
    if(typeof DecompressionStream!=="function")throw new Error("DecompressionStream indisponibil");
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const jsonText=await new Response(stream).text();
    const data=JSON.parse(jsonText);
    if(data?.actId!=="omj2188"||!Array.isArray(data.articles)||data.articles.length!==217)throw new Error("Corpus OMJ incomplet");
    if(data.articles[0]?.number!=="Art. 1"||data.articles.at(-1)?.number!=="Art. 232")throw new Error("Limite corpus OMJ invalide");
    self.postMessage({id,ok:true,data});
  }catch(error){
    self.postMessage({id,ok:false,error:String(error?.message||error)});
  }
};
