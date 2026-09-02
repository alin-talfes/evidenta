import "./engine-v3.js";

function addBenchmarkNavigation() {
    const footerLinks = document.querySelector(".footer-links");
    if (footerLinks && !footerLinks.querySelector('[data-benchmark-link]')) {
        const link = document.createElement("a");
        link.href = "benchmark.html";
        link.textContent = "Calibrare / benchmark";
        link.dataset.benchmarkLink = "true";
        footerLinks.prepend(link);
    }

    const analysisCopy = document.querySelector(".analysis-panel p:not(.section-kicker)");
    if (analysisCopy) {
        analysisCopy.textContent = "Motorul v3 folosește landmark-uri MediaPipe, geometrie corectată pentru raportul imaginii, reguli testabile, verificări de calitate și revizuire manuală auditabilă.";
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addBenchmarkNavigation, { once: true });
} else {
    addBenchmarkNavigation();
}
