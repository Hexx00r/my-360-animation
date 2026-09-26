/* paulsunnydev.com — chat box. Vanilla JS, no deps. Loaded async from the
 * index.html template; prerender-proof. Posts to the quote-relay Worker. */
(function () {
  var WORKER = "https://quote-relay.paulsunny.workers.dev/chat";
  var CLIENT = "paulsunnydev";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var sid = localStorage.getItem("pdc-session");
  if (!sid) {
    sid = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()).replace(/[^A-Za-z0-9-]/g, "-").slice(0, 36);
    while (sid.length < 8) sid = sid + "x";
    localStorage.setItem("pdc-session", sid);
  }

  var css = function (el, style) { for (var k in style) el.style[k] = style[k]; };
  var C = {
    panel: "#101012", text: "#f5f5f7", sub: "#86868b", accent: "#00d4ff",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  var btn = document.createElement("button");
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0a0a0a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 8.5 8.5z"/></svg>';
  css(btn, { position: "fixed", bottom: "20px", right: "20px", width: "56px", height: "56px", borderRadius: "50%", background: C.accent, border: "none", cursor: "pointer", zIndex: "60", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 30px rgba(0,212,255,0.35)" });

  var panel = document.createElement("div");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with Paul's assistant");
  css(panel, { position: "fixed", bottom: "88px", right: "20px", width: "340px", maxWidth: "calc(100vw - 40px)", maxHeight: "70vh", display: "none", flexDirection: "column", background: C.panel, border: C.border, borderRadius: "16px", zIndex: "60", overflow: "hidden", fontFamily: "-apple-system,Segoe UI,Roboto,sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" });

  var head = document.createElement("div");
  css(head, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "14px 16px", color: C.text, fontSize: "13px", fontWeight: "600", borderBottom: C.border, background: "rgba(255,255,255,0.03)" });
  var title = document.createElement("span");
  title.textContent = "Chat — ask me anything";
  var closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close chat");
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  css(closeBtn, { flex: "none", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: "8px", background: "transparent", color: C.sub, cursor: "pointer", padding: "0" });
  head.appendChild(title);
  head.appendChild(closeBtn);

  var log = document.createElement("div");
  css(log, { flex: "1", overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "220px" });

  var form = document.createElement("form");
  css(form, { display: "flex", gap: "8px", padding: "12px", borderTop: C.border });
  var input = document.createElement("input");
  input.placeholder = "Type a message…";
  input.setAttribute("aria-label", "Message");
  css(input, { flex: "1", background: "rgba(255,255,255,0.05)", border: C.border, borderRadius: "10px", padding: "10px 12px", color: C.text, fontSize: "14px", outline: "none" });
  var send = document.createElement("button");
  send.type = "submit";
  send.textContent = "Send";
  css(send, { background: C.accent, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "0 14px", fontWeight: "600", cursor: "pointer", fontSize: "13px" });
  form.appendChild(input);
  form.appendChild(send);
  panel.appendChild(head);
  panel.appendChild(log);
  panel.appendChild(form);

  function bubble(text, mine) {
    var b = document.createElement("div");
    b.textContent = text;
    css(b, { maxWidth: "85%", padding: "9px 12px", borderRadius: "12px", fontSize: "13.5px", lineHeight: "1.45", whiteSpace: "pre-wrap", alignSelf: mine ? "flex-end" : "flex-start", background: mine ? C.accent : "rgba(255,255,255,0.06)", color: mine ? "#0a0a0a" : C.text, borderBottomRightRadius: mine ? "4px" : "12px", borderBottomLeftRadius: mine ? "12px" : "4px" });
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  /* Mobile (≤480px): thumb-sized launcher with safe-area padding, and the
     panel becomes a bottom sheet (90vw, rounded top corners) that caps at
     70vh so it never reaches the sticky header CTA. Desktop values are
     restored when the query stops matching. */
  var mq = window.matchMedia("(max-width: 480px)");
  function applyLayout() {
    var m = mq.matches;
    css(btn, m
      ? { width: "48px", height: "48px", bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", right: "calc(16px + env(safe-area-inset-right, 0px))" }
      : { width: "56px", height: "56px", bottom: "20px", right: "20px" });
    css(panel, m
      ? { left: "5vw", right: "5vw", width: "auto", maxWidth: "none", bottom: "0", maxHeight: "70vh", borderRadius: "16px 16px 0 0" }
      : { left: "", right: "20px", width: "340px", maxWidth: "calc(100vw - 40px)", bottom: "88px", maxHeight: "70vh", borderRadius: "16px" });
    if (m) panel.style.maxHeight = "70dvh"; // ignored where unsupported; 70vh stays
    css(head, m ? { padding: "12px 14px", fontSize: "12.5px" } : { padding: "14px 16px", fontSize: "13px" });
    css(log, m ? { padding: "10px", gap: "6px", minHeight: "160px" } : { padding: "12px", gap: "8px", minHeight: "220px" });
    css(form, m ? { padding: "10px 12px", gap: "6px" } : { padding: "12px", gap: "8px" });
    css(input, m ? { padding: "9px 12px", fontSize: "16px" } : { padding: "10px 12px", fontSize: "14px" });
    css(send, m ? { padding: "0 12px", fontSize: "12.5px" } : { padding: "0 14px", fontSize: "13px" });
    css(closeBtn, m ? { width: "44px", height: "44px", margin: "-10px -12px -10px 0" } : { width: "32px", height: "32px", margin: "-6px -8px -6px 0" });
    if (backdrop) backdrop.style.display = open && m ? "block" : "none";
  }
  applyLayout();
  if (mq.addEventListener) mq.addEventListener("change", applyLayout);
  else mq.addListener(applyLayout);

  var open = false;
  /* Backdrop: mobile-only dim layer behind the sheet; tap = close. */
  var backdrop = document.createElement("div");
  backdrop.setAttribute("aria-hidden", "true");
  css(backdrop, { position: "fixed", top: "0", left: "0", right: "0", bottom: "0", background: "rgba(0,0,0,0.45)", zIndex: "59", display: "none" });
  backdrop.addEventListener("click", function () { setOpen(false); });

  function setOpen(v) {
    open = v;
    panel.style.display = v ? "flex" : "none";
    backdrop.style.display = v && mq.matches ? "block" : "none";
    panel.style.transform = "";
    if (v && !log.childNodes.length) bubble("Hey! Ask me about Paul's websites, GHL systems, pricing, or process.", false);
    if (v) input.focus();
  }
  btn.addEventListener("click", function () { setOpen(!open); });
  closeBtn.addEventListener("click", function () { setOpen(false); });

  /* Nav/footer links marked data-pdc-chat open the panel instead of navigating. */
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-pdc-chat]") : null;
    if (!t) return;
    e.preventDefault();
    setOpen(true);
  });

  /* Swipe-down on the sheet header closes (standard mobile pattern). */
  var dragY = null;
  head.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) dragY = e.touches[0].clientY;
  }, { passive: true });
  head.addEventListener("touchmove", function (e) {
    if (dragY === null) return;
    var dy = Math.max(0, e.touches[0].clientY - dragY);
    if (dy > 0 && !reduced) {
      panel.style.transition = "none";
      panel.style.transform = "translateY(" + dy + "px)";
    }
  }, { passive: true });
  head.addEventListener("touchend", function (e) {
    if (dragY === null) return;
    var dy = e.changedTouches[0].clientY - dragY;
    dragY = null;
    panel.style.transition = reduced ? "" : "opacity 160ms ease, transform 160ms ease";
    panel.style.transform = "";
    if (dy > 60) setOpen(false);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    bubble(text, true);
    var pending = bubble("…", false);
    fetch(WORKER, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, sessionId: sid, clientId: CLIENT }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { pending.textContent = (d && d.reply) || "Something went wrong — please try again."; log.scrollTop = log.scrollHeight; })
      .catch(function () { pending.textContent = "Network hiccup — please try again."; });
  });

  if (!reduced) panel.style.transition = "opacity 160ms ease, transform 160ms ease";
  document.body.appendChild(backdrop);
  document.body.appendChild(btn);
  document.body.appendChild(panel);
})();
