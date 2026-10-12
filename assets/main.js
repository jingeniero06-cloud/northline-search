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

  const steps = document.querySelectorAll(".flow li");
  if (steps.length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let i = 0;
    setInterval(() => {
      steps[i].classList.remove("on");
      i = (i + 1) % steps.length;
      steps[i].classList.add("on");
    }, 2200);
  }

  const tocLinks = [...document.querySelectorAll(".toc a")];
  const progress = document.querySelector(".read-progress");
  const body = document.querySelector(".cs-body");
  if (tocLinks.length && body) {
    const targets = tocLinks.map((a) => document.querySelector(a.getAttribute("href")));
    const update = () => {
      let current = 0;
      targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < 140) current = i; });
      tocLinks.forEach((a, i) => a.classList.toggle("active", i === current));
      if (progress) {
        const r = body.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * 0.6)));
        progress.style.width = (pct * 100).toFixed(1) + "%";
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  const copy = document.querySelector("[data-copy-link]");
  if (copy) {
    copy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.href.split("#")[0]); copy.title = "Link copied"; copy.setAttribute("aria-label", "Link copied"); } catch {}
    });
  }

  const filter = document.querySelector(".cs-filters form");
  if (filter) {
    const q = filter.querySelector("input");
    const cat = filter.querySelector("select");
    const cards = [...document.querySelectorAll(".cs-list .cs-card")];
    const count = filter.querySelector(".cs-count");
    const empty = document.querySelector(".cs-empty");
    const run = () => {
      const term = q.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach((c) => {
        const ok = (!cat.value || c.dataset.category === cat.value) && (!term || c.textContent.toLowerCase().includes(term));
        c.hidden = !ok;
        if (ok) shown++;
      });
      count.textContent = shown + (shown === 1 ? " case study" : " case studies");
      if (empty) empty.hidden = shown > 0;
    };
    filter.addEventListener("input", run);
    filter.addEventListener("submit", (e) => e.preventDefault());
    run();
  }

  let calendly;
  const loadCalendly = () => calendly || (calendly = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://assets.calendly.com/assets/external/widget.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://assets.calendly.com/assets/external/widget.js";
    js.async = true;
    js.onload = () => (window.Calendly ? resolve(window.Calendly) : reject());
    js.onerror = () => { calendly = null; reject(); };
    document.head.appendChild(js);
  }));
  document.querySelectorAll('a[href^="https://calendly.com/"]').forEach((a) => {
    ["pointerenter", "focus", "touchstart"].forEach((ev) => a.addEventListener(ev, () => loadCalendly().catch(() => {}), { once: true, passive: true }));
    a.addEventListener("click", async (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      try {
        (await loadCalendly()).initPopupWidget({ url: a.href });
      } catch {
        window.open(a.href, "_blank", "noopener");
      }
    });
  });

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
        const timer = setTimeout(() => ctrl.abort(), 9000);
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
      try {
        const fields = Object.fromEntries(new FormData(form).entries());
        const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(fields),
          signal: AbortSignal.timeout(15000),
        });
        const out = await res.json();
        if (!res.ok || String(out.success) !== "true") throw new Error(out.message || "FormSubmit error");
        location.href = fields._next;
      } catch {
        form.submit();
      }
    });
  }
})();
