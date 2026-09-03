(()=>{
  if(window.TRAINING_WINDOWING)return;
  const states=new WeakMap();
  const CONFIG={
    interview:{selector:"#interview-list",batch:16},
    mistakes:{selector:"#mistakes-list",batch:20},
    bibliography:{selector:"#bibliography-list",batch:16},
    official:{selector:"#official-sets",batch:12},
    synthesis:{selector:"#synthesis-list",batch:18},
    calculations:{selector:"#calculation-list",batch:16}
  };
  function cleanup(host){const old=states.get(host);if(old?.button?.isConnected)old.button.remove();if(old?.queue?.length)old.queue.length=0;states.delete(host)}
  function applyHost(host,batch=18){
    if(!host)return;
    cleanup(host);
    const children=[...host.children].filter(node=>!node.matches?.(".training-load-more"));
    if(children.length<=batch)return;
    const queue=children.slice(batch);
    queue.forEach(node=>node.remove());
    const button=document.createElement("button");button.type="button";button.className="secondary training-load-more";
    const state={queue,batch,button};states.set(host,state);
    const update=()=>{button.textContent=`Încarcă încă ${Math.min(batch,state.queue.length)} · ${state.queue.length} rămase`};
    button.onclick=()=>{const fragment=document.createDocumentFragment(),next=state.queue.splice(0,state.batch);next.forEach(node=>fragment.appendChild(node));host.insertBefore(fragment,button);if(!state.queue.length){button.remove();states.delete(host)}else update()};
    update();host.appendChild(button);
  }
  function applyForView(id){const config=CONFIG[id];if(!config)return;requestAnimationFrame(()=>applyHost(document.querySelector(config.selector),config.batch))}
  const filterMap={"interview-search":"interview","interview-category":"interview","interview-difficulty":"interview","synthesis-search":"synthesis","synthesis-act":"synthesis","synthesis-length":"synthesis","synthesis-status":"synthesis"};
  document.addEventListener("input",event=>{const id=filterMap[event.target?.id];if(id)setTimeout(()=>applyForView(id),190)},false);
  document.addEventListener("change",event=>{const id=filterMap[event.target?.id];if(id)setTimeout(()=>applyForView(id),0)},false);
  document.addEventListener("click",event=>{if(event.target.closest?.("[data-card],[data-interview-result],[data-written-score]")){const active=document.querySelector(".view.active-view")?.id;if(active)setTimeout(()=>applyForView(active),0)}},false);
  window.TRAINING_WINDOWING={applyForView,applyHost,version:"window-v1"};
})();
