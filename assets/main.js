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
})();
