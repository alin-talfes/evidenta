(()=>{
  const URLS={
    legislation:"./generated/legislation-data.json",
    official:"./generated/official-data.json",
    interview:"./generated/interview-data.json"
  };
  const memory={};
  const inflight={};

  async function getPart(part){
    if(memory[part])return memory[part];
    if(inflight[part])return inflight[part];
    const url=URLS[part];
    if(!url)throw new Error(`Dataset necunoscut: ${part}`);
    inflight[part]=fetch(url,{cache:"force-cache"}).then(async response=>{
      if(!response.ok)throw new Error(`${url}: ${response.status}`);
      const value=await response.json();
      memory[part]=value;
      delete inflight[part];
      return value;
    }).catch(error=>{delete inflight[part];throw error});
    return inflight[part];
  }

  self.onmessage=async event=>{
    const {id,parts}=event.data||{};
    try{
      const payload={};
      await Promise.all((parts||[]).map(async part=>{payload[part]=await getPart(part)}));
      self.postMessage({id,ok:true,payload});
    }catch(error){
      self.postMessage({id,ok:false,error:String(error?.message||error)});
    }
  };
})();
