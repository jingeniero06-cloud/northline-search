(() => {
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const btn = document.querySelector(".menu-btn");
  const links = document.getElementById("nav-links");
  if (btn && links) {
    const set = (open) => {
      links.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    };
    btn.addEventListener("click", () => set(!links.classList.contains("open")));
    links.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  }

  const reveal = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        en.target.querySelectorAll(".gauge").forEach((g) => g.classList.add("on"));
        if (en.target.classList.contains("report")) en.target.classList.add("on");
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    reveal.forEach((el) => io.observe(el));
  } else {
    reveal.forEach((el) => el.classList.add("in", "on"));
  }

  const pkg = document.getElementById("package");
  document.querySelectorAll("[data-pkg]").forEach((a) =>
    a.addEventListener("click", () => { if (pkg) pkg.value = a.dataset.pkg; })
  );

  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  let source = null;
  try { source = JSON.parse(store.get("nl_src") || "null"); } catch {}
  if (!source) {
    const params = new URLSearchParams(location.search);
    const utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => { if (params.get(k)) utm[k] = params.get(k); });
    const ref = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : "";
    source = { first_page: location.pathname, first_referrer: ref, utm };
    store.set("nl_src", JSON.stringify(source));
  }

  const form = document.querySelector("form.lead-form[data-lead-api]");
  if (form) {
    const setField = (name, value) => {
      let input = form.querySelector(`input[name="${name}"]`);
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        form.appendChild(input);
      }
      input.value = value;
    };

    form.addEventListener("submit", async (e) => {
      if (form.dataset.sent) return;
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "Sending...";
      const f = new FormData(form);
      const payload = {
        name: f.get("name"), email: f.get("email"), website: f.get("website"),
        package: f.get("package"), size: f.get("size"), goals: f.get("goals"), _honey: f.get("_honey"),
        source: { ...source, form_page: location.pathname + location.hash, used_tool: store.get("nl_used_tool") === "1" },
      };
      const via = source.utm.utm_source || (payload.source.used_tool ? "free AI crawler tool" : source.first_referrer || "direct") + ` (landed on ${source.first_page})`;
      setField("Lead source", via);
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000);
        const res = await fetch(`${form.dataset.leadApi}/lead`, {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal,
        });
        clearTimeout(timer);
        const data = await res.json();
        if (data.id) setField("Review lead", data.review_url);
        if (data.ai_summary) {
          setField("AI crawler check", data.ai_summary);
          const auto = form.querySelector('input[name="_autoresponse"]');
          if (auto) auto.value += `\n\nWhile you wait, we ran a free check on how AI search tools see ${payload.website}:\n${data.ai_summary}`;
        }
      } catch {}
      const auto = form.querySelector('input[name="_autoresponse"]');
      if (auto && form.dataset.calendly) auto.value += `\n\nWant to talk sooner? Book a 30-minute call: ${form.dataset.calendly}`;
      form.dataset.sent = "1";
      form.submit();
    });
  }
})();
