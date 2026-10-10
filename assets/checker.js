(() => {
  const form = document.getElementById("checker");
  if (!form) return;
  const api = form.dataset.api;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const LIVE = {
    ok: ["Reachable", "ok"],
    blocked: ["Blocked", "bad"],
    challenged: ["Challenged", "warn"],
    error: ["Error", "warn"],
    timeout: ["Timed out", "warn"],
  };

  const pill = (text, tone) => `<span class="pill-s ${tone}">${esc(text)}</span>`;

  function render(d) {
    $("results").hidden = false;
    $("target").textContent = d.target.replace(/^https?:\/\//, "").replace(/\/$/, "");
    $("score").textContent = d.score;
    $("gauge").style.setProperty("--v", d.score);
    const blockedR = d.bots.filter((b) => !b.robots.allowed).length;
    const blockedL = d.bots.filter((b) => b.live && b.live.verdict !== "ok").length;
    $("summary").textContent =
      blockedR || blockedL
        ? `${blockedR} crawler(s) disallowed in robots.txt and ${blockedL} blocked or challenged in live tests.`
        : "Every crawler we tested is allowed by robots.txt and reached the page.";
    $("chips").innerHTML = [
      d.llms.present ? pill("llms.txt found", "ok") : pill("No llms.txt", "warn"),
      d.robots.sitemaps.length ? pill("Sitemap in robots.txt", "ok") : pill("No sitemap in robots.txt", "warn"),
      d.baseline.verdict === "ok" ? pill(`Page returns ${d.baseline.status}`, "ok") : pill(`Page returns ${d.baseline.status ?? "no response"}`, "bad"),
    ].join("");
    $("rows").innerHTML = d.bots
      .map((b) => {
        const r = b.robots.allowed ? pill("Allowed", "ok") : pill("Disallowed", "bad");
        const rule = b.robots.agent ? `<small>${esc(b.robots.rule)}${b.robots.agent !== "*" ? "" : " (via *)"}</small>` : "";
        let live = "<small>robots.txt token only</small>";
        if (b.live) {
          const [label, tone] = LIVE[b.live.verdict] || ["Unknown", "warn"];
          live = `${pill(label, tone)}<small>${b.live.status ?? "-"}${b.live.verdict !== "ok" && b.live.where ? " on " + esc(b.live.where) : ""}</small>`;
        }
        return `<tr><td><b>${esc(b.name)}</b><small>${esc(b.owner)}</small></td><td>${esc(b.purpose)}</td><td>${r}${rule}</td><td>${live}</td></tr>`;
      })
      .join("");
    $("note").textContent = d.note;
    $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = $("url").value.trim();
    if (!url) return;
    const btn = form.querySelector("button");
    btn.disabled = true;
    $("status").textContent = "Checking robots.txt, llms.txt and 10 crawlers. This takes about 15 seconds...";
    try {
      const res = await fetch(`${api}/check?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      $("status").textContent = "";
      render(data);
    } catch (err) {
      $("status").textContent = err.message || "Something went wrong. Try again in a minute.";
    } finally {
      btn.disabled = false;
    }
  });
})();
