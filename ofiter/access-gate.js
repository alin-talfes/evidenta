(() => {
  "use strict";

  const SESSION_KEY = "evidenta-ofiter-access-v1";
  const ACCESS_DIGEST = "915f35cab3430325ef85ec31dc9cd0430bb667abaca0215914e5e3bbfa80c833";
  const root = document.documentElement;

  function authenticated() {
    try {
      return sessionStorage.getItem(SESSION_KEY) === ACCESS_DIGEST;
    } catch {
      return false;
    }
  }

  function setAuthenticated(value) {
    try {
      if (value) sessionStorage.setItem(SESSION_KEY, ACCESS_DIGEST);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Dacă stocarea este blocată, accesul funcționează doar până la reîncărcare.
    }
  }

  async function digest(value) {
    const bytes = new TextEncoder().encode(value);
    const hash = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function unlock() {
    root.classList.remove("auth-pending");
    document.getElementById("main")?.focus({ preventScroll: true });
  }

  function lock() {
    root.classList.add("auth-pending");
    const input = document.getElementById("access-code");
    if (input) {
      input.value = "";
      setTimeout(() => input.focus(), 0);
    }
  }

  if (authenticated()) root.classList.remove("auth-pending");

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("access-form");
    const input = document.getElementById("access-code");
    const message = document.getElementById("access-message");
    const submit = document.getElementById("access-submit");
    const toggle = document.getElementById("access-toggle");
    const logout = document.getElementById("access-logout");

    if (!form || !input || !message || !submit || !toggle || !logout) return;

    if (!authenticated()) input.focus();

    toggle.addEventListener("click", () => {
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      toggle.textContent = reveal ? "Ascunde" : "Arată";
      toggle.setAttribute("aria-label", reveal ? "Ascunde codul" : "Arată codul");
      toggle.setAttribute("aria-pressed", String(reveal));
      input.focus();
    });

    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 10);
      message.textContent = "";
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (input.value.length !== 10) {
        message.textContent = "Codul trebuie să conțină 10 cifre.";
        input.focus();
        return;
      }

      submit.disabled = true;
      submit.textContent = "Se verifică…";
      try {
        if (await digest(input.value) === ACCESS_DIGEST) {
          setAuthenticated(true);
          message.textContent = "";
          unlock();
          return;
        }
        message.textContent = "Cod incorect. Verifică cifrele introduse.";
        input.select();
      } catch {
        message.textContent = "Browserul nu permite verificarea codului.";
      } finally {
        submit.disabled = false;
        submit.textContent = "Intră în modul";
      }
    });

    logout.addEventListener("click", () => {
      setAuthenticated(false);
      lock();
    });
  });
})();
