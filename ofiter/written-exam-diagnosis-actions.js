(()=>{
  const host=document.getElementById("full-written-exam");
  if(!host)return;
  const targets=[
    {view:"quiz",label:"Deschide grilele"},
    {view:"synthesis",label:"Deschide sinteza"},
    {view:"calculations",label:"Deschide calculele"}
  ];
  function bind(){
    const cards=[...host.querySelectorAll(".full-exam-diagnosis-grid article")];
    cards.forEach((card,index)=>{
      const target=targets[index];
      if(!target||card.querySelector("[data-diagnosis-go]"))return;
      const button=document.createElement("button");
      button.type="button";
      button.className="secondary full-exam-diagnosis-action";
      button.dataset.diagnosisGo=target.view;
      button.textContent=target.label;
      button.onclick=()=>{
        if(typeof showView==="function")showView(target.view);
        else document.querySelector(`.sidebar .nav-item[data-view="${target.view}"]`)?.click();
      };
      card.appendChild(button);
    });
  }
  new MutationObserver(bind).observe(host,{childList:true,subtree:true});
  bind();
})();
