(function () {
  var EXPECTED_HASH = "158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab";
  var STORAGE_KEY = "nl_pin_auth_v1";

  // Compact pure-JS SHA-256 so verification works on both HTTPS and local file://
  function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = "length";
    var i, j;
    var result = "";
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;
    var hash = (sha256.h = sha256.h || []);
    var k = (sha256.k = sha256.k || []);
    var primeCounter = k[lengthProperty];
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += "\x80";
    while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return "";
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;
    for (j = 0; j < words[lengthProperty]; ) {
      var w = words.slice(j, (j += 16));
      var oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var i2 = i + j;
        var w15 = w[i - 15],
          w2 = w[i - 2];
        var a = hash[0],
          e = hash[4];
        var temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);
        var temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? 0 : "") + b.toString(16);
      }
    }
    return result;
  }

  function isSavedAuthValid() {
    try {
      return localStorage.getItem(STORAGE_KEY) === EXPECTED_HASH;
    } catch (e) {
      return false;
    }
  }

  // Inject anti-flash style immediately in <head>
  var style = document.createElement("style");
  style.id = "nl-pin-gate-style";
  style.textContent =
    'html:not([data-nl-unlocked="true"]) body { overflow: hidden !important; }' +
    'html:not([data-nl-unlocked="true"]) body > *:not(#nl-pin-gate-overlay) { display: none !important; }' +
    "#nl-pin-gate-overlay { position: fixed; inset: 0; z-index: 2147483647; background: radial-gradient(circle at 50% 20%, #1a242d 0%, #0d1217 100%); color: #f2f7f7; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; padding: 24px; }" +
    "#nl-pin-gate-card { width: 100%; max-width: 380px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px; padding: 32px 28px; text-align: center; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5); backdrop-filter: blur(12px); }" +
    "#nl-pin-gate-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #3cc4cc; background: rgba(60, 196, 204, 0.12); border: 1px solid rgba(60, 196, 204, 0.28); padding: 5px 12px; border-radius: 999px; margin-bottom: 16px; }" +
    "#nl-pin-gate-title { font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #ffffff; letter-spacing: -0.02em; }" +
    "#nl-pin-gate-sub { font-size: 14px; color: #95a0a1; margin: 0 0 24px; line-height: 1.5; }" +
    "#nl-pin-gate-input { width: 100%; font-size: 28px; font-weight: 700; letter-spacing: 0.45em; text-indent: 0.45em; text-align: center; padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.35); color: #ffffff; outline: none; transition: border-color 0.2s, box-shadow 0.2s; margin-bottom: 14px; box-sizing: border-box; }" +
    "#nl-pin-gate-input:focus { border-color: #3cc4cc; box-shadow: 0 0 0 3px rgba(60, 196, 204, 0.2); }" +
    "#nl-pin-gate-btn { width: 100%; padding: 13px 18px; border-radius: 12px; border: none; background: #0b7f8a; color: #ffffff; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; }" +
    "#nl-pin-gate-btn:hover { background: #096b74; }" +
    "#nl-pin-gate-err { min-height: 20px; font-size: 13px; color: #ff6b6b; margin-top: 10px; font-weight: 500; }" +
    "#nl-pin-lock-btn { position: fixed; bottom: 14px; left: 14px; z-index: 2147483640; background: rgba(15, 20, 25, 0.78); color: #cbd5e1; border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 999px; padding: 5px 11px; font-size: 11px; font-family: system-ui, -apple-system, sans-serif; font-weight: 600; cursor: pointer; backdrop-filter: blur(6px); opacity: 0.55; transition: opacity 0.2s; }" +
    "#nl-pin-lock-btn:hover { opacity: 1; color: #ffffff; }" +
    "@media print { #nl-pin-lock-btn, #nl-pin-gate-overlay { display: none !important; } }";
  document.head.appendChild(style);

  if (isSavedAuthValid()) {
    document.documentElement.setAttribute("data-nl-unlocked", "true");
  }

  function addLockButton() {
    if (document.getElementById("nl-pin-lock-btn")) return;
    var btn = document.createElement("button");
    btn.id = "nl-pin-lock-btn";
    btn.type = "button";
    btn.title = "Lock Private View";
    btn.textContent = "🔒 Lock";
    btn.addEventListener("click", function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      document.documentElement.removeAttribute("data-nl-unlocked");
      btn.remove();
      renderGate();
    });
    document.body.appendChild(btn);
  }

  function unlockSuccess() {
    try {
      localStorage.setItem(STORAGE_KEY, EXPECTED_HASH);
    } catch (e) {}
    document.documentElement.setAttribute("data-nl-unlocked", "true");
    var overlay = document.getElementById("nl-pin-gate-overlay");
    if (overlay) overlay.remove();
    addLockButton();
  }

  function renderGate() {
    if (document.getElementById("nl-pin-gate-overlay")) return;
    var overlay = document.createElement("div");
    overlay.id = "nl-pin-gate-overlay";
    overlay.innerHTML =
      '<div id="nl-pin-gate-card">' +
      '  <div id="nl-pin-gate-badge">🔒 Private Access</div>' +
      '  <h1 id="nl-pin-gate-title">Enter Access PIN</h1>' +
      '  <p id="nl-pin-gate-sub">This page is restricted. Enter your 4-digit PIN to continue.</p>' +
      '  <form id="nl-pin-gate-form" autocomplete="off">' +
      '    <input id="nl-pin-gate-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="••••" autofocus required />' +
      '    <button id="nl-pin-gate-btn" type="submit">Unlock Page</button>' +
      '    <div id="nl-pin-gate-err" aria-live="polite"></div>' +
      "  </form>" +
      "</div>";
    document.body.appendChild(overlay);

    var form = document.getElementById("nl-pin-gate-form");
    var input = document.getElementById("nl-pin-gate-input");
    var err = document.getElementById("nl-pin-gate-err");

    function checkPin(val) {
      if (sha256(val.trim()) === EXPECTED_HASH) {
        unlockSuccess();
        return true;
      }
      return false;
    }

    input.addEventListener("input", function () {
      err.textContent = "";
      if (input.value.length === 4) {
        if (!checkPin(input.value)) {
          err.textContent = "Incorrect PIN. Please try again.";
          input.select();
        }
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!checkPin(input.value)) {
        err.textContent = "Incorrect PIN. Please try again.";
        input.value = "";
        input.focus();
      }
    });

    setTimeout(function () {
      input.focus();
    }, 50);
  }

  function init() {
    if (isSavedAuthValid()) {
      document.documentElement.setAttribute("data-nl-unlocked", "true");
      addLockButton();
    } else {
      renderGate();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
