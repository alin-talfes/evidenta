(()=>{
  const ICONS={
    dashboard:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9 20v-6h6v6"/>',
    quiz:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    synthesis:'<path d="M5 6h14"/><path d="M5 10h14"/><path d="M5 14h10"/><path d="M5 18h8"/>',
    calculations:'<path d="M18 5H7l5 7-5 7h11"/>',
    interview:'<circle cx="8" cy="7" r="3.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0"/><path d="M15 6.5h6v6h-2.5L15 16z"/>',
    legislation:'<path d="M12 3v17"/><path d="M7 6h10"/><path d="M5 9 2 15h6z"/><path d="m19 9-3 6h6z"/><path d="M8 21h8"/>',
    official:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    mistakes:'<path d="M20 7v5h-5"/><path d="M19 12a7 7 0 1 0-2 5"/>',
    exam:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
  };
  const DIRECT=[
    {view:"dashboard",label:"Acasă"},
    {view:"quiz",label:"Grile"},
    {view:"synthesis",label:"Sinteză"},
    {view:"calculations",label:"Calcule"}
  ];
  const MORE=[
    {view:"legislation",label:"Legislație și bibliografie"},
    {view:"official",label:"Subiecte ANP"},
    {view:"interview",label:"Interviu"},
    {view:"mistakes",label:"Repetare"},
    {view:"exam",label:"Simulare grile"}
  ];
  const MORE_VIEWS=new Set(MORE.map(item=>item.view));
  const VALID_VIEWS=new Set([...DIRECT,...MORE].map(item=>item.view));
  let lastFocus=null;
  let applyingHistory=false;

  const iconMarkup=key=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[key]||ICONS.more}</svg>`;
  const desktopButton=view=>document.querySelector(`.sidebar .nav-item[data-view="${view}"]`);
  const activeView=()=>document.querySelector(".sidebar .nav-item.active")?.dataset.view||"dashboard";
  const hashView=()=>{try{return decodeURIComponent(location.hash.replace(/^#/,""))}catch{return ""}};

  function setBackgroundInert(value){
    [document.querySelector(".topbar"),document.querySelector(".app-shell")].forEach(element=>{if(element)element.inert=value});
  }

  function syncThemeChrome(){
    const dark=document.body.classList.contains("dark");
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute("content",dark?"#0f1f32":"#10233f");
    document.documentElement.style.colorScheme=dark?"dark":"light";
  }

  function writeHistory(view,replace=false){
    if(!VALID_VIEWS.has(view)||hashView()===view)return;
    const method=replace?"replaceState":"pushState";
    history[method]({trainingView:view},"",`#${encodeURIComponent(view)}`);
  }

  function navigate(view,{historyMode="push",closeMenu=true}={}){
    const button=desktopButton(view);
    if(!button||!VALID_VIEWS.has(view))return;
    if(historyMode!=="none")writeHistory(view,historyMode==="replace");
    if(closeMenu)closeMore(false);
    button.click();
    syncActive();
  }

  function applyHistoryRoute(){
    const view=hashView();
    if(!VALID_VIEWS.has(view))return;
    const button=desktopButton(view);
    if(!button||activeView()===view)return;
    applyingHistory=true;
    closeMore(false);
    button.click();
    syncActive();
    applyingHistory=false;
  }

  function createNavButton(item){
    const button=document.createElement("button");
    button.type="button";
    button.className="mobile-nav-btn";
    button.dataset.mobileView=item.view;
    button.setAttribute("aria-label",item.label);
    button.innerHTML=`<span class="mobile-nav-icon">${iconMarkup(item.view)}</span><span class="mobile-nav-label">${item.label}</span>`;
    button.addEventListener("click",()=>navigate(item.view));
    return button;
  }

  function createMoreItem(item){
    const button=document.createElement("button");
    button.type="button";
    button.className="mobile-more-item";
    button.dataset.mobileMoreView=item.view;
    button.innerHTML=`<span class="mobile-more-icon" aria-hidden="true">${iconMarkup(item.view)}</span><span>${item.label}</span>`;
    button.addEventListener("click",()=>navigate(item.view));
    return button;
  }

  function openMore(){
    const sheet=document.getElementById("mobile-more-sheet");
    const overlay=document.getElementById("mobile-more-overlay");
    const button=document.getElementById("mobile-more-btn");
    if(!sheet||!overlay||!button)return;
    lastFocus=document.activeElement;
    document.body.classList.add("mobile-menu-open");
    setBackgroundInert(true);
    sheet.classList.add("open");overlay.classList.add("open");
    sheet.setAttribute("aria-hidden","false");button.setAttribute("aria-expanded","true");
    requestAnimationFrame(()=>sheet.querySelector(".mobile-more-item")?.focus());
  }

  function closeMore(restoreFocus=true){
    const sheet=document.getElementById("mobile-more-sheet");
    const overlay=document.getElementById("mobile-more-overlay");
    const button=document.getElementById("mobile-more-btn");
    if(!sheet||!overlay||!button)return;
    document.body.classList.remove("mobile-menu-open");
    setBackgroundInert(false);
    sheet.classList.remove("open");overlay.classList.remove("open");
    sheet.setAttribute("aria-hidden","true");button.setAttribute("aria-expanded","false");
    if(restoreFocus&&(lastFocus instanceof HTMLElement))lastFocus.focus();
  }

  function syncBadge(){
    const source=document.getElementById("mistake-count");
    const badge=document.getElementById("mobile-review-badge");
    const moreButton=document.getElementById("mobile-more-btn");
    if(!source||!badge)return;
    const value=Math.max(0,Number.parseInt(source.textContent||"0",10)||0);
    badge.textContent=value>99?"99+":String(value);
    badge.hidden=value===0;
    badge.setAttribute("aria-hidden","true");
    if(moreButton)moreButton.setAttribute("aria-label",value?`Mai multe secțiuni, ${value} întrebări de repetat`:"Mai multe secțiuni");
  }

  function syncActive(){
    const view=activeView();
    document.querySelectorAll("[data-mobile-view]").forEach(button=>{
      const active=button.dataset.mobileView===view;
      button.classList.toggle("active",active);
      if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
    });
    document.querySelectorAll("[data-mobile-more-view]").forEach(button=>{
      const active=button.dataset.mobileMoreView===view;
      button.classList.toggle("active",active);
      if(active)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
    });
    const more=document.getElementById("mobile-more-btn");
    if(more){
      const active=MORE_VIEWS.has(view);
      more.classList.toggle("active",active);
      if(active)more.setAttribute("aria-current","page");else more.removeAttribute("aria-current");
    }
  }

  function syncViewState(){
    syncActive();
    if(!applyingHistory)writeHistory(activeView());
  }

  function trapFocus(event){
    const sheet=document.getElementById("mobile-more-sheet");
    if(event.key!=="Tab"||!sheet?.classList.contains("open"))return;
    const focusable=[...sheet.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>element.offsetParent!==null);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
  }

  function init(){
    if(document.getElementById("mobile-nav"))return;

    document.querySelectorAll(".sidebar .nav-item").forEach(button=>{
      const label=button.querySelector("span")?.textContent?.trim();
      if(label&&!button.hasAttribute("aria-label"))button.setAttribute("aria-label",label);
      button.addEventListener("click",()=>{
        if(!applyingHistory)writeHistory(button.dataset.view);
      });
    });
    document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>{
      if(!applyingHistory)writeHistory(button.dataset.go);
    }));

    const skipLink=document.querySelector(".skip-link");
    if(skipLink)skipLink.addEventListener("click",event=>{
      event.preventDefault();
      closeMore(false);
      const main=document.getElementById("main");
      if(main){main.focus({preventScroll:true});main.scrollIntoView({block:"start"})}
    });

    const nav=document.createElement("nav");
    nav.id="mobile-nav";nav.className="mobile-nav";nav.setAttribute("aria-label","Navigare mobilă");
    DIRECT.forEach(item=>nav.appendChild(createNavButton(item)));

    const moreButton=document.createElement("button");
    moreButton.id="mobile-more-btn";moreButton.type="button";moreButton.className="mobile-nav-btn";
    moreButton.setAttribute("aria-label","Mai multe secțiuni");moreButton.setAttribute("aria-expanded","false");moreButton.setAttribute("aria-controls","mobile-more-sheet");
    moreButton.innerHTML=`<span class="mobile-nav-icon">${iconMarkup("more")}</span><span class="mobile-nav-label">Mai mult</span><span id="mobile-review-badge" class="mobile-nav-badge" hidden></span>`;
    moreButton.addEventListener("click",()=>document.getElementById("mobile-more-sheet")?.classList.contains("open")?closeMore():openMore());
    nav.appendChild(moreButton);

    const overlay=document.createElement("div");
    overlay.id="mobile-more-overlay";overlay.className="mobile-more-overlay";overlay.setAttribute("aria-hidden","true");overlay.addEventListener("click",()=>closeMore());

    const sheet=document.createElement("section");
    sheet.id="mobile-more-sheet";sheet.className="mobile-more-sheet";sheet.setAttribute("role","dialog");sheet.setAttribute("aria-modal","true");sheet.setAttribute("aria-label","Mai multe secțiuni");sheet.setAttribute("aria-hidden","true");
    sheet.innerHTML='<div class="mobile-more-handle" aria-hidden="true"></div><div class="mobile-more-head"><strong>Mai multe secțiuni</strong><button type="button" class="mobile-more-close" aria-label="Închide meniul">×</button></div><div class="mobile-more-grid"></div>';
    MORE.forEach(item=>sheet.querySelector(".mobile-more-grid").appendChild(createMoreItem(item)));
    sheet.querySelector(".mobile-more-close").addEventListener("click",()=>closeMore());

    document.body.append(overlay,sheet,nav);

    const desktopItems=[...document.querySelectorAll(".sidebar .nav-item")];
    const classObserver=new MutationObserver(syncViewState);
    desktopItems.forEach(item=>classObserver.observe(item,{attributes:true,attributeFilter:["class"]}));

    const count=document.getElementById("mistake-count");
    if(count)new MutationObserver(syncBadge).observe(count,{childList:true,characterData:true,subtree:true});
    new MutationObserver(syncThemeChrome).observe(document.body,{attributes:true,attributeFilter:["class"]});

    document.addEventListener("keydown",event=>{
      if(event.key==="Escape"&&sheet.classList.contains("open")){event.preventDefault();closeMore()}
      trapFocus(event);
    });
    window.addEventListener("resize",()=>{if(window.innerWidth>767)closeMore(false)},{passive:true});
    window.addEventListener("popstate",applyHistoryRoute);
    window.addEventListener("hashchange",applyHistoryRoute);

    const initial=hashView();
    if(VALID_VIEWS.has(initial))applyHistoryRoute();
    else writeHistory(activeView(),true);
    syncBadge();syncActive();syncThemeChrome();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
