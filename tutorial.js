/* ═══════════════════════════════════════════════════════════════
   FUSION — Interactive Tutorial
   Drop-in: <script src="tutorial.js"></script> at end of <body>
   Shows once per user, resetable via: FusionTutorial.reset()
═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────
  const STORAGE_KEY = "fusion_tutorial_done";
  const ACCENT      = "#7b6fff";
  const ACCENT_GLOW = "rgba(123,111,255,0.35)";

  // ── Steps ───────────────────────────────────────────────────
  const STEPS = [
    {
      id:      "welcome",
      type:    "center",           // full-screen centered card
      icon:    "🎮",
      title:   "Welcome to FUSION",
      body:    "Your all-in-one browser game hub. This quick tour will show you everything — it only takes about 30 seconds.",
      cta:     "Let's go →",
    },
    {
      id:      "gotd",
      type:    "spotlight",
      target:  "#gotdCard",
      icon:    "🏆",
      title:   "Game of the Day",
      body:    "Every day a new game is picked just for you. Click anywhere on the banner to preview it, or hit Play Now to jump straight in.",
      cta:     "Got it →",
      pos:     "bottom",
    },
    {
      id:      "carousel",
      type:    "spotlight",
      target:  "#featWrap",
      icon:    "⭐",
      title:   "Recommended Games",
      body:    "Handpicked recommendations cycle automatically. Use the arrows or dots to browse manually — hover to pause.",
      cta:     "Next →",
      pos:     "bottom",
    },
    {
      id:      "search",
      type:    "spotlight",
      target:  ".tb-search",
      icon:    "🔍",
      title:   "Search & Filter",
      body:    "Find any game instantly by name, genre, or publisher. Use the filter dropdown to browse by category.",
      cta:     "Next →",
      pos:     "bottom",
    },
    {
      id:      "grid",
      type:    "spotlight",
      target:  "#gamebar",
      icon:    "🕹️",
      title:   "All Games",
      body:    "Hover any card to reveal its name and genre. Click to open the game preview. Hit the ❤ to save it to your favorites.",
      cta:     "Next →",
      pos:     "top",
    },
    {
      id:      "random",
      type:    "spotlight",
      target:  ".rnd-btn",
      icon:    "🎲",
      title:   "Feeling Lucky?",
      body:    "Hit Random and we'll pick a game for you at complete random. Great for when you can't decide.",
      cta:     "Next →",
      pos:     "top",
    },
    {
      id:      "theme",
      type:    "spotlight",
      target:  ".icon-btn",
      icon:    "🌙",
      title:   "Light & Dark Mode",
      body:    "Toggle between dark and light theme anytime using the moon icon in the top bar.",
      cta:     "Next →",
      pos:     "bottom",
    },
    {
      id:      "done",
      type:    "center",
      icon:    "🚀",
      title:   "You're all set!",
      body:    "Start exploring, save your favorites, and come back daily for a fresh Game of the Day. Have fun!",
      cta:     "Start Playing!",
      confetti: true,
    },
  ];

  // ── State ────────────────────────────────────────────────────
  let currentStep = 0;
  let overlay, card, spotlight, tooltip;
  let confettiCanvas, confettiCtx, confettiParticles = [], confettiRaf;

  // ── Public API ───────────────────────────────────────────────
  window.FusionTutorial = {
    start: start,
    reset: () => { localStorage.removeItem(STORAGE_KEY); start(); },
  };

  // ── Auto-launch on first visit ───────────────────────────────
  if (!localStorage.getItem(STORAGE_KEY)) {
    // Wait for page to be ready
    if (document.readyState === "complete") {
      setTimeout(start, 900);
    } else {
      window.addEventListener("load", () => setTimeout(start, 900));
    }
  }

  // ════════════════════════════════════════════════════════════
  //  BUILD UI
  // ════════════════════════════════════════════════════════════
  function buildUI() {
    if (document.getElementById("ft-overlay")) return;

    injectStyles();

    // ── Overlay ──
    overlay = document.createElement("div");
    overlay.id = "ft-overlay";
    overlay.innerHTML = `
      <div id="ft-skip">Skip tutorial</div>
      <svg id="ft-spotlight-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="ft-mask">
            <rect width="100%" height="100%" fill="white"/>
            <rect id="ft-hole" rx="14" ry="14" fill="black"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#ft-mask)"/>
      </svg>
    `;
    document.body.appendChild(overlay);

    document.getElementById("ft-skip").onclick = finish;

    // ── Tooltip (spotlight steps) ──
    tooltip = document.createElement("div");
    tooltip.id = "ft-tooltip";
    document.body.appendChild(tooltip);

    // ── Center card ──
    card = document.createElement("div");
    card.id = "ft-card";
    document.body.appendChild(card);

    // ── Confetti canvas ──
    confettiCanvas = document.createElement("canvas");
    confettiCanvas.id = "ft-confetti";
    document.body.appendChild(confettiCanvas);
  }

  // ════════════════════════════════════════════════════════════
  //  RENDER STEP
  // ════════════════════════════════════════════════════════════
  function renderStep(idx) {
    const step = STEPS[idx];
    const isFirst = idx === 0;
    const progress = Math.round(((idx) / (STEPS.length - 1)) * 100);

    if (step.type === "center") {
      showCard(step, progress, isFirst);
      hideTooltip();
      clearSpotlight();
    } else {
      showTooltip(step, progress);
      hideCard();
    }

    if (step.confetti) launchConfetti();
  }

  // ── CENTER CARD ──────────────────────────────────────────────
  function showCard(step, progress, isFirst) {
    card.className = "";
    card.style.opacity = "0";
    card.style.transform = "scale(0.88) translateY(20px)";

    card.innerHTML = `
      <div class="ft-progress-bar"><div class="ft-progress-fill" style="width:${progress}%"></div></div>
      <div class="ft-card-icon">${step.icon}</div>
      <div class="ft-card-title">${step.title}</div>
      <div class="ft-card-body">${step.body}</div>
      <button class="ft-cta" id="ft-cta-btn">${step.cta}</button>
      ${!isFirst ? `<div class="ft-step-count">${currentStep + 1} / ${STEPS.length}</div>` : ""}
    `;

    card.style.display = "flex";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.style.opacity = "1";
      card.style.transform = "scale(1) translateY(0)";
    }));

    document.getElementById("ft-cta-btn").onclick = nextStep;
  }

  function hideCard() {
    card.style.opacity = "0";
    card.style.transform = "scale(0.92) translateY(12px)";
    setTimeout(() => { card.style.display = "none"; }, 300);
  }

  // ── SPOTLIGHT + TOOLTIP ──────────────────────────────────────
  function showTooltip(step, progress) {
    const el = document.querySelector(step.target);
    if (!el) { nextStep(); return; }

    // Clear any existing highlights first
    clearHighlights();

    // Scroll element into view
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      const r = el.getBoundingClientRect();
      const PAD = 12;

      // Punch hole in overlay
      const hole = document.getElementById("ft-hole");
      hole.setAttribute("x",      r.left - PAD);
      hole.setAttribute("y",      r.top  - PAD);
      hole.setAttribute("width",  r.width  + PAD * 2);
      hole.setAttribute("height", r.height + PAD * 2);

      // Animate hole in
      hole.style.transition = "none";
      requestAnimationFrame(() => {
        hole.style.transition = "x .35s ease, y .35s ease, width .35s ease, height .35s ease";
      });

      // Add pulsing ring to ONLY this element
      el.classList.add("ft-highlighted");

      // Build tooltip
      tooltip.innerHTML = `
        <div class="ft-progress-bar"><div class="ft-progress-fill" style="width:${progress}%"></div></div>
        <div class="ft-tt-header">
          <span class="ft-tt-icon">${step.icon}</span>
          <span class="ft-tt-title">${step.title}</span>
        </div>
        <div class="ft-tt-body">${step.body}</div>
        <div class="ft-tt-footer">
          <span class="ft-step-count">${currentStep + 1} / ${STEPS.length}</span>
          <button class="ft-cta ft-cta-sm" id="ft-tt-btn">${step.cta}</button>
        </div>
      `;

      // Position tooltip
      positionTooltip(r, step.pos || "bottom");

      tooltip.style.opacity = "0";
      tooltip.style.transform = "scale(0.92) translateY(8px)";
      tooltip.style.display = "block";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        tooltip.style.opacity = "1";
        tooltip.style.transform = "scale(1) translateY(0)";
      }));

      document.getElementById("ft-tt-btn").onclick = nextStep;
    }, 350);
  }

  function positionTooltip(r, pos) {
    const TW = 320, TH = 180, MARGIN = 16;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top, left;

    if (pos === "bottom") {
      top  = r.bottom + 18;
      left = r.left + r.width / 2 - TW / 2;
    } else {
      top  = r.top - TH - 18;
      left = r.left + r.width / 2 - TW / 2;
    }

    // Clamp within viewport
    left = Math.max(MARGIN, Math.min(left, vw - TW - MARGIN));
    top  = Math.max(MARGIN, Math.min(top,  vh - TH - MARGIN));

    tooltip.style.left  = left + "px";
    tooltip.style.top   = top  + "px";
    tooltip.style.width = TW   + "px";
  }

  function hideTooltip() {
    tooltip.style.opacity = "0";
    tooltip.style.transform = "scale(0.92)";
    setTimeout(() => { tooltip.style.display = "none"; }, 280);
    clearHighlights();
  }

  function clearSpotlight() {
    const hole = document.getElementById("ft-hole");
    if (hole) { hole.setAttribute("width", "0"); hole.setAttribute("height", "0"); }
    clearHighlights();
  }

  function clearHighlights() {
    document.querySelectorAll(".ft-highlighted").forEach(e => e.classList.remove("ft-highlighted"));
  }

  // ════════════════════════════════════════════════════════════
  //  NAVIGATION
  // ════════════════════════════════════════════════════════════
  function nextStep() {
    currentStep++;
    if (currentStep >= STEPS.length) { finish(); return; }
    renderStep(currentStep);
  }

  function start() {
    currentStep = 0;
    buildUI();

    // Show overlay with fade-in
    overlay.style.opacity = "0";
    overlay.style.display = "flex";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    }));

    renderStep(0);
  }

  function finish() {
    stopConfetti();
    clearHighlights();

    // Fade out everything
    [overlay, card, tooltip].forEach(el => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "scale(0.96)";
    });

    setTimeout(() => {
      [overlay, card, tooltip, confettiCanvas].forEach(el => {
        if (el) el.remove();
      });
      overlay = card = tooltip = confettiCanvas = null;
    }, 400);

    localStorage.setItem(STORAGE_KEY, "1");
  }

  // ════════════════════════════════════════════════════════════
  //  CONFETTI
  // ════════════════════════════════════════════════════════════
  function launchConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiCtx = confettiCanvas.getContext("2d");
    confettiParticles = [];

    const COLORS = ["#7b6fff","#ff6b9d","#ffd93d","#6bcb77","#4d96ff","#ff922b"];
    for (let i = 0; i < 140; i++) {
      confettiParticles.push({
        x:     Math.random() * confettiCanvas.width,
        y:     -10 - Math.random() * 200,
        r:     3 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx:    (Math.random() - 0.5) * 3,
        vy:    2 + Math.random() * 4,
        angle: Math.random() * 360,
        spin:  (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? "rect" : "circle",
        w:     6 + Math.random() * 8,
        h:     3 + Math.random() * 4,
        alpha: 1,
      });
    }

    animateConfetti();
    setTimeout(stopConfetti, 3500);
  }

  function animateConfetti() {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach(p => {
      p.x     += p.vx;
      p.y     += p.vy;
      p.angle += p.spin;
      p.vy    *= 1.01; // gravity
      if (p.y > confettiCanvas.height * 0.7) p.alpha = Math.max(0, p.alpha - 0.025);

      confettiCtx.save();
      confettiCtx.globalAlpha = p.alpha;
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate(p.angle * Math.PI / 180);
      confettiCtx.fillStyle = p.color;

      if (p.shape === "circle") {
        confettiCtx.beginPath();
        confettiCtx.arc(0, 0, p.r, 0, Math.PI * 2);
        confettiCtx.fill();
      } else {
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }

      confettiCtx.restore();
    });

    confettiParticles = confettiParticles.filter(p => p.alpha > 0);
    if (confettiParticles.length) {
      confettiRaf = requestAnimationFrame(animateConfetti);
    }
  }

  function stopConfetti() {
    cancelAnimationFrame(confettiRaf);
    if (confettiCtx && confettiCanvas) {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // ════════════════════════════════════════════════════════════
  //  STYLES
  // ════════════════════════════════════════════════════════════
  function injectStyles() {
    if (document.getElementById("ft-styles")) return;
    const s = document.createElement("style");
    s.id = "ft-styles";
    s.textContent = `
      /* ── Overlay ── */
      #ft-overlay {
        position: fixed; inset: 0; z-index: 8000;
        transition: opacity .35s ease;
        pointer-events: all;
      }
      #ft-overlay svg#ft-spotlight-svg {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        pointer-events: none;
      }
      #ft-skip {
        position: absolute; top: 18px; right: 22px;
        color: rgba(255,255,255,.5); font-size: 12px; font-weight: 700;
        cursor: pointer; font-family: 'Nunito', sans-serif;
        letter-spacing: .5px; z-index: 10;
        transition: color .2s;
      }
      #ft-skip:hover { color: #fff; }

      /* ── Center card ── */
      #ft-card {
        position: fixed; inset: 0; z-index: 8100;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        padding: 28px;
        pointer-events: none;
        transition: opacity .3s ease, transform .3s ease;
      }
      #ft-card > * { pointer-events: all; }
      #ft-card::before {
        content: '';
        position: absolute;
        width: min(440px, 92vw);
        background: var(--surface, #1c1d21);
        border: 1.5px solid rgba(123,111,255,.25);
        border-radius: 22px;
        box-shadow: 0 32px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(123,111,255,.1), inset 0 1px 0 rgba(255,255,255,.06);
        padding: 36px;
        top: 50%; left: 50%; transform: translate(-50%,-50%);
        height: auto; min-height: 280px;
        z-index: -1;
      }
      .ft-card-icon {
        font-size: 52px; line-height: 1;
        margin-bottom: 16px;
        animation: ft-bounce .6s ease forwards;
        animation-delay: .15s;
        opacity: 0;
      }
      @keyframes ft-bounce {
        0%   { opacity:0; transform: scale(.5) translateY(10px); }
        60%  { opacity:1; transform: scale(1.15) translateY(-4px); }
        100% { opacity:1; transform: scale(1) translateY(0); }
      }
      .ft-card-title {
        font-family: 'Rajdhani', sans-serif;
        font-size: 28px; font-weight: 700;
        color: var(--text, #e8e9f0);
        text-align: center; margin-bottom: 10px;
        letter-spacing: .5px;
        animation: ft-fadein .4s ease .25s both;
      }
      .ft-card-body {
        font-family: 'Nunito', sans-serif;
        font-size: 14px; font-weight: 600; line-height: 1.65;
        color: var(--muted, #6b6d80);
        text-align: center; max-width: 340px;
        animation: ft-fadein .4s ease .35s both;
      }
      @keyframes ft-fadein {
        from { opacity:0; transform: translateY(8px); }
        to   { opacity:1; transform: translateY(0); }
      }

      /* ── Tooltip ── */
      #ft-tooltip {
        position: fixed; z-index: 8100;
        background: var(--surface, #1c1d21);
        border: 1.5px solid rgba(123,111,255,.3);
        border-radius: 16px;
        padding: 18px 20px 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(123,111,255,.08);
        transition: opacity .28s ease, transform .28s ease;
        display: none;
        font-family: 'Nunito', sans-serif;
      }
      .ft-tt-header {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 8px;
      }
      .ft-tt-icon { font-size: 22px; line-height: 1; }
      .ft-tt-title {
        font-family: 'Rajdhani', sans-serif;
        font-size: 18px; font-weight: 700;
        color: var(--text, #e8e9f0); letter-spacing: .3px;
      }
      .ft-tt-body {
        font-size: 13px; font-weight: 600; line-height: 1.6;
        color: var(--muted, #6b6d80); margin-bottom: 14px;
      }
      .ft-tt-footer {
        display: flex; align-items: center;
        justify-content: space-between; gap: 12px;
      }

      /* ── CTA button ── */
      .ft-cta {
        height: 44px; padding: 0 28px;
        background: ${ACCENT};
        color: #fff; border: none; border-radius: 99px;
        font-size: 14px; font-weight: 800;
        cursor: pointer; font-family: 'Nunito', sans-serif;
        letter-spacing: .4px;
        box-shadow: 0 4px 20px ${ACCENT_GLOW};
        transition: transform .15s, box-shadow .15s, opacity .15s;
        animation: ft-fadein .4s ease .45s both;
        margin-top: 22px;
      }
      .ft-cta:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 8px 28px ${ACCENT_GLOW};
      }
      .ft-cta:active { transform: scale(.97); }
      .ft-cta-sm {
        height: 34px; padding: 0 18px;
        font-size: 12px; margin-top: 0;
        animation: none;
      }

      /* ── Progress bar ── */
      .ft-progress-bar {
        width: 100%; height: 3px;
        background: rgba(123,111,255,.15);
        border-radius: 99px; overflow: hidden;
        margin-bottom: 18px;
      }
      .ft-progress-fill {
        height: 100%; background: ${ACCENT};
        border-radius: 99px;
        transition: width .5s ease;
        box-shadow: 0 0 8px ${ACCENT_GLOW};
      }

      /* ── Step count ── */
      .ft-step-count {
        font-size: 11px; font-weight: 700;
        color: var(--muted, #6b6d80);
        font-family: 'Nunito', sans-serif;
        letter-spacing: .5px;
      }

      /* ── Spotlight highlight ring ── */
      .ft-highlighted {
        position: relative;
        z-index: 8050 !important;
        border-radius: 14px;
        animation: ft-ring 1.4s ease-in-out infinite;
        outline: 2px solid ${ACCENT} !important;
        outline-offset: 4px;
      }
      @keyframes ft-ring {
        0%, 100% { box-shadow: 0 0 0 0 ${ACCENT_GLOW}; }
        50%       { box-shadow: 0 0 0 10px rgba(123,111,255,0); }
      }

      /* ── Confetti canvas ── */
      #ft-confetti {
        position: fixed; inset: 0;
        z-index: 8200; pointer-events: none;
      }

      /* ── Arrow decoration on tooltip ── */
      #ft-tooltip::before {
        content: '';
        position: absolute;
        width: 10px; height: 10px;
        background: var(--surface, #1c1d21);
        border-left: 1.5px solid rgba(123,111,255,.3);
        border-top: 1.5px solid rgba(123,111,255,.3);
        transform: rotate(45deg);
        top: -6px; left: 24px;
      }
    `;
    document.head.appendChild(s);
  }

})();