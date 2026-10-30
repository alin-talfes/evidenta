(() => {
  "use strict";
  const links = [
    ["Politica de confidențialitate", "privacy-policy.html"],
    ["Termeni de utilizare", "terms.html"],
    ["Politica privind cookie-urile", "cookie-policy.html"],
    ["Rambursări și retragere", "refund-policy.html"],
    ["Accesibilitate", "accessibility.html"],
    ["Audit și riscuri", "compliance-audit.html"]
  ];
  const style = document.createElement("style");
  style.textContent = `.ev-legal-footer{margin:2rem auto 1rem;padding:1rem 1.25rem;max-width:1100px;border-top:1px solid #64748b55;color:inherit;font-size:.9rem;display:flex;gap:.75rem 1.25rem;flex-wrap:wrap;justify-content:center}.ev-legal-footer a{color:inherit;text-underline-offset:.2em;text-decoration:underline}.ev-legal-footer a:focus-visible{outline:3px solid #f59e0b;outline-offset:3px;border-radius:2px}.ev-legal-footer button{font:inherit;color:inherit;background:transparent;border:1px solid currentColor;border-radius:.5rem;padding:.5rem .75rem;min-height:44px;cursor:pointer}.ev-legal-footer button:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}`;
  document.head.appendChild(style);
  function addFooter() {
    if (!document.body || document.querySelector(".ev-legal-footer")) return;
    const footer = document.createElement("footer");
    footer.className = "ev-legal-footer";
    footer.setAttribute("aria-label", "Informații juridice");
    const here = new URL(document.currentScript?.src || location.href, location.href);
    const root = new URL("../", here);
    for (const [label, href] of links) {
      const a = document.createElement("a");
      a.textContent = label;
      a.href = new URL(href, root).href;
      footer.appendChild(a);
    }
    const settings = document.createElement("button");
    settings.type = "button";
    settings.textContent = "Setări statistici";
    settings.addEventListener("click", () => {
      if (window.EvidentaAnalytics?.openSettings) window.EvidentaAnalytics.openSettings();
      else window.location.href = new URL("index.html#analytics-settings", root).href;
    });
    settings.setAttribute("aria-label", "Deschide setările de consimțământ pentru statistici");
    footer.appendChild(settings);
    document.body.appendChild(footer);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addFooter, { once:true });
  else addFooter();
})();