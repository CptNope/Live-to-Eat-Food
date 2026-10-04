/* Live to Eat Food — concept interactions. Vanilla JS, no dependencies.
   Everything here enhances markup that already reads correctly without JavaScript. */
(function () {
  "use strict";
  var D = window.LTEF;
  if (!D) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var icon = function (id) { return '<svg class="ico" aria-hidden="true"><use href="#' + id + '"></use></svg>'; };
  var store = {
    get: function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var mapApi = [];
  var byId = {};
  D.places.forEach(function (p) { byId[p.id] = p; });
  var area = function (p) { return D.areas[p.area] || { name: "", siding: "green", town: "" }; };
  var placeHref = function (p) { return p.page || "explore.html#" + p.id; };
  var address = function (p) { return p.num ? p.num + " " + p.street : "Street address not on file"; };

  /* ---------- toast ---------- */
  var toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }

  /* ---------- saved places ---------- */
  var saved = store.get("ltef-saved", []).filter(function (id) { return byId[id]; });
  function isSaved(id) { return saved.indexOf(id) > -1; }
  function saveBtn(p, extra) {
    return '<button class="savebtn ' + (extra || "") + '" type="button" data-save="' + p.id + '" aria-pressed="' + isSaved(p.id) + '" aria-label="Save ' + esc(p.name) + '">' +
      icon("i-save") + '<span class="save-label">' + (isSaved(p.id) ? "Saved" : "Save") + "</span></button>";
  }
  function syncSaves() {
    $$("[data-save]").forEach(function (b) {
      var on = isSaved(b.getAttribute("data-save"));
      b.setAttribute("aria-pressed", on);
      var l = $(".save-label", b);
      if (l) l.textContent = on ? "Saved" : (b.getAttribute("data-save-label") || "Save");
    });
    $$("[data-saved-count]").forEach(function (e) { e.textContent = saved.length; });
    renderDrawer();
    if (mapApi.length) mapApi.forEach(function (m) { m.refresh(); });
  }
  function toggleSave(id, btn) {
    var p = byId[id];
    if (!p) return;
    if (isSaved(id)) saved.splice(saved.indexOf(id), 1); else saved.push(id);
    store.set("ltef-saved", saved);
    syncSaves();
    if (btn && !reduceMotion) { btn.classList.remove("pop"); void btn.offsetWidth; btn.classList.add("pop"); }
    toast(isSaved(id) ? "Saved " + p.name : "Removed " + p.name);
  }

  /* saved drawer */
  var drawer = document.createElement("dialog");
  drawer.className = "drawer";
  drawer.setAttribute("aria-labelledby", "drawer-h");
  drawer.innerHTML = '<div class="drawer-in"><div class="drawer-top"><h2 id="drawer-h" class="d-m">Your saved places</h2>' +
    '<button class="iconbtn" type="button" data-close-drawer>Close</button></div><div class="drawer-list"></div>' +
    '<p class="meta drawer-note">Saved in this browser only. Nothing is sent anywhere.</p></div>';
  document.body.appendChild(drawer);
  function renderDrawer() {
    var list = $(".drawer-list", drawer);
    if (!saved.length) {
      list.innerHTML = '<div class="empty"><p class="d-s">Nothing saved yet.</p><p class="body">Tap Save on any place and it lands here, ready for tonight.</p><a class="btn sm" href="explore.html">Explore places</a></div>';
      return;
    }
    list.innerHTML = saved.map(function (id) {
      var p = byId[id];
      return '<div class="drow">' + plate(p) + '<div class="drow-t"><a href="' + placeHref(p) + '"><b>' + esc(p.name) + '</b></a><span class="meta">' + esc(area(p).name) + ", " + esc(p.cuisine) + "</span></div>" +
        '<button class="linkish" type="button" data-save="' + p.id + '" data-save-label="Save" aria-label="Remove ' + esc(p.name) + '"><span class="save-label">Remove</span></button></div>';
    }).join("");
    $$(".drow [data-save] .save-label", list).forEach(function (l) { l.textContent = "Remove"; });
  }
  function openDrawer() {
    renderDrawer();
    if (drawer.showModal) drawer.showModal(); else drawer.setAttribute("open", "");
  }
  drawer.addEventListener("click", function (e) {
    if (e.target === drawer || e.target.closest("[data-close-drawer]")) drawer.close();
  });

  /* ---------- shared bits ---------- */
  function plate(p, cls) {
    if (!p.num) return '<span class="plate ' + (cls || "") + ' plate-none" aria-hidden="true"><span class="n">&mdash;</span></span>';
    return '<span class="plate ' + (cls || "") + '" aria-hidden="true"><span class="n">' + esc(p.num) + "</span></span>";
  }
  function tinaLabel(p) {
    return p.tina ? '<span class="lbl tina">Tina ate here <em>' + esc(p.tina.date) + "</em></span>" : '<span class="lbl unclaimed">Tina hasn\'t been yet</span>';
  }

  document.addEventListener("click", function (e) {
    var s = e.target.closest("[data-save]");
    if (s) { e.preventDefault(); toggleSave(s.getAttribute("data-save"), s); return; }
    var o = e.target.closest("[data-open-saved]");
    if (o) { e.preventDefault(); openDrawer(); return; }
    var sh = e.target.closest("[data-share]");
    if (sh) {
      e.preventDefault();
      var url = location.href.split("#")[0];
      var done = function () { toast("Link copied. Send it to the group chat."); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { toast(url); });
      else toast(url);
    }
  });

  /* ---------- filtering ---------- */
  function matches(p, st) {
    if (st.tinaOnly && !p.tina) return false;
    if (st.craving !== "anything" && (p.cravings || []).indexOf(st.craving) < 0) return false;
    if (st.where === "worcester" && area(p).town !== "Worcester") return false;
    if (st.where !== "anywhere" && st.where !== "worcester" && p.area !== st.where) return false;
    if (st.with !== "anyone" && (p.with || []).indexOf(st.with) < 0) return false;
    return true;
  }
  function sortPlaces(list, how) {
    return list.slice().sort(function (a, b) {
      if (how === "az") return a.name.localeCompare(b.name);
      if (how === "area") return area(a).name.localeCompare(area(b).name) || a.name.localeCompare(b.name);
      var ta = a.tina ? a.tina.sort : 0, tb = b.tina ? b.tina.sort : 0;
      return tb - ta || a.name.localeCompare(b.name);
    });
  }
  function labelFor(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label; return id; }

  /* ---------- the craving sentence ---------- */
  function initCrave(root, onChange) {
    var st = {
      craving: root.getAttribute("data-craving") || "anything",
      where: root.getAttribute("data-where") || "anywhere",
      with: root.getAttribute("data-with") || "anyone",
      tinaOnly: root.getAttribute("data-tina-only") !== "false"
    };
    var lists = { craving: D.cravings, where: D.wheres, with: D.withs };
    var openBox = null;

    function closeBox(focusSlot) {
      if (!openBox) return;
      var slot = openBox.slot;
      openBox.el.remove();
      slot.setAttribute("aria-expanded", "false");
      openBox = null;
      if (focusSlot) slot.focus();
    }
    function setLabel(slot) {
      var key = slot.getAttribute("data-slot");
      $(".slot-t", slot).textContent = labelFor(lists[key], st[key]);
    }
    function openFor(slot) {
      if (openBox && openBox.slot === slot) { closeBox(true); return; }
      closeBox(false);
      var key = slot.getAttribute("data-slot");
      var box = document.createElement("ul");
      box.className = "listbox";
      box.setAttribute("role", "listbox");
      box.id = "lb-" + key + "-" + Math.random().toString(36).slice(2, 7);
      box.setAttribute("aria-label", slot.getAttribute("aria-label"));
      box.innerHTML = lists[key].map(function (o) {
        var n = D.places.filter(function (p) { var t = {}; for (var k in st) t[k] = st[k]; t[key] = o.id; return matches(p, t); }).length;
        return '<li role="option" tabindex="-1" data-v="' + o.id + '" aria-selected="' + (st[key] === o.id) + '"><span>' + esc(o.label) + '</span><span class="lb-n">' + n + "</span></li>";
      }).join("");
      root.appendChild(box);
      var r = slot.getBoundingClientRect(), rr = root.getBoundingClientRect();
      box.style.left = Math.max(0, Math.min(r.left - rr.left, rr.width - 280)) + "px";
      box.style.top = (r.bottom - rr.top + 8) + "px";
      slot.setAttribute("aria-expanded", "true");
      slot.setAttribute("aria-controls", box.id);
      openBox = { el: box, slot: slot };
      var cur = $('[aria-selected="true"]', box) || box.firstChild;
      cur.focus();
      box.addEventListener("click", function (e) {
        var li = e.target.closest("li");
        if (li) choose(key, li.getAttribute("data-v"), slot);
      });
      box.addEventListener("keydown", function (e) {
        var items = $$("li", box), i = items.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); items[Math.min(items.length - 1, i + 1)].focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); items[Math.max(0, i - 1)].focus(); }
        else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
        else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (i > -1) choose(key, items[i].getAttribute("data-v"), slot); }
        else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); closeBox(true); }
      });
    }
    function choose(key, val, slot) {
      st[key] = val;
      setLabel(slot);
      closeBox(true);
      if (!reduceMotion) { slot.classList.remove("swap"); void slot.offsetWidth; slot.classList.add("swap"); }
      update();
    }
    $$(".slot[data-slot]", root).forEach(function (slot) {
      slot.setAttribute("aria-expanded", "false");
      setLabel(slot);
      slot.addEventListener("click", function () { openFor(slot); });
      slot.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); openFor(slot); }
      });
    });
    document.addEventListener("click", function (e) {
      if (openBox && !openBox.el.contains(e.target) && !openBox.slot.contains(e.target)) closeBox(false);
    });
    var sw = $("[data-tina-switch]", root);
    if (sw) {
      sw.setAttribute("aria-checked", st.tinaOnly);
      sw.addEventListener("click", function () {
        st.tinaOnly = !st.tinaOnly;
        sw.setAttribute("aria-checked", st.tinaOnly);
        update();
      });
    }
    var go = $("[data-crave-go]", root);
    var pick = $("[data-tina-pick]", root);
    if (pick) pick.addEventListener("click", function () { tinaPick(st); });

    function update() {
      var list = D.places.filter(function (p) { return matches(p, st); });
      if (go) {
        go.textContent = list.length ? "Show me " + list.length + (list.length === 1 ? " place" : " places") : "Nothing yet. Widen it to Central Mass";
        go.setAttribute("data-count", list.length);
      }
      onChange(st, list);
    }
    if (go) go.addEventListener("click", function (e) {
      if (go.getAttribute("data-count") === "0") {
        e.preventDefault();
        st.where = "anywhere"; st.with = "anyone";
        $$(".slot[data-slot]", root).forEach(setLabel);
        update();
      }
    });
    update();
    return st;
  }

  /* ---------- Let Tina pick ---------- */
  var pickDlg = document.createElement("dialog");
  pickDlg.className = "pickdlg";
  pickDlg.setAttribute("aria-labelledby", "pick-h");
  document.body.appendChild(pickDlg);
  var lastPick = null;
  function tinaPick(st) {
    var pool = D.places.filter(function (p) { return p.tina && p.num && matches(p, { craving: st.craving, where: st.where, with: st.with, tinaOnly: true }); });
    var note = "";
    if (!pool.length) { pool = D.places.filter(function (p) { return p.tina && p.num; }); note = "Nothing of hers matched exactly, so here's one she loved anyway."; }
    if (!note && pool.length === 1) note = "She's only posted one place that fits. Change the sentence for more.";
    var options = pool.filter(function (p) { return p.id !== lastPick; });
    var p = (options.length ? options : pool)[Math.floor(Math.random() * (options.length ? options.length : pool.length))];
    lastPick = p.id;
    var a = area(p);
    pickDlg.innerHTML = '<div class="pick f-' + a.siding + ' clap">' +
      '<p class="meta pick-k">Tina picks</p>' +
      '<div class="pick-row">' + plate(p, "lg") + '<div><h2 class="d-l" id="pick-h">' + esc(p.name) + '</h2><p class="pick-addr">' + esc(address(p)) + ", " + esc(a.name) + "</p></div></div>" +
      '<p class="note">' + esc(p.tina.quote) + '<small><a href="' + p.tina.url + '">Tina on ' + esc(p.tina.platform) + ", " + esc(p.tina.date) + "</a></small></p>" +
      (note ? '<p class="meta">' + esc(note) + "</p>" : "") +
      '<div class="pick-actions"><a class="btn" href="' + placeHref(p) + '">' + icon("i-turn") + "Get there</a>" + saveBtn(p, "btn ghost") +
      '<button class="btn ghost" type="button" data-pick-again>Pick again</button><button class="linkish" type="button" data-pick-close>Close</button></div></div>';
    if (!pickDlg.open) { if (pickDlg.showModal) pickDlg.showModal(); else pickDlg.setAttribute("open", ""); }
    $("[data-pick-again]", pickDlg).addEventListener("click", function () { tinaPick(st); });
    $("[data-pick-close]", pickDlg).addEventListener("click", function () { pickDlg.close(); });
  }
  pickDlg.addEventListener("click", function (e) { if (e.target === pickDlg) pickDlg.close(); });

  /* ---------- the street (houses) ---------- */
  var heights = [520, 470, 500, 450, 540, 480];
  function house(p, i) {
    var a = area(p);
    var top = p.tina && !p.tina.noQuote
      ? '<p class="note flat">' + esc(p.tina.quote) + '<small><a href="' + p.tina.url + '">Tina on ' + esc(p.tina.platform) + ", " + esc(p.tina.date) + "</a></small></p>"
      : p.tina ? '<p class="note flat">Tina featured this one.<small><a href="' + p.tina.url + '">On her Instagram</a></small></p>'
      : '<div class="notyet"><span class="lbl unclaimed">Tina hasn\'t been yet</span>' + (p.facts && p.facts[0] ? '<p class="fact">' + esc(p.facts[0]) + "</p>" : "") + "</div>";
    return '<div class="plot" style="--h:' + heights[i % heights.length] + 'px">' +
      '<article class="house f-' + a.siding + '">' +
      '<div class="roof"></div>' +
      '<div class="fl top">' + top + "</div>" +
      '<div class="fl mid"><div class="window"><div class="ph ' + p.tone + ' ratio-43"><p class="cap"><b>Photo: ' + esc(p.dish) + "</b></p></div></div></div>" +
      '<div class="fl door"><div><h3 class="nm"><a href="' + placeHref(p) + '">' + esc(p.name) + '</a></h3><p class="meta">' + esc(p.cuisine) + (p.price ? ", " + esc(p.price) : "") + "</p>" +
      '<div class="door-acts"><a class="door-go" href="' + placeHref(p) + '">' + icon("i-turn") + "Get there</a>" + saveBtn(p, "mini") + "</div></div>" +
      '<span class="n">' + (p.num ? esc(p.num) : "") + "</span></div></article>" +
      '<p class="curbname">' + (p.street ? esc(p.street) + ", " : "") + esc(a.name) + "</p></div>";
  }
  function renderStreet(el, list, max) {
    var shown = list.slice(0, max || list.length);
    var html = shown.map(house).join("");
    html += '<div class="plot plot-lot" style="--h:360px"><div class="lot">' +
      '<p class="d-s">' + (list.length > shown.length ? (list.length - shown.length) + " more down the street." : "Empty lot. Where should Tina eat next?") + "</p>" +
      (list.length > shown.length ? '<a class="btn sm" href="explore.html">See all ' + list.length + "</a>" :
        '<button class="btn sm" type="button" data-suggest>' + icon("i-plus") + "Suggest a place</button>") +
      '<form class="suggest" hidden><label for="sg-name">Place name</label><input id="sg-name" required autocomplete="off"><label for="sg-town">Town or street</label><input id="sg-town" autocomplete="off"><button class="btn sm" type="submit">Send to Tina</button></form></div>' +
      '<p class="curbname">Your street?</p></div>';
    el.innerHTML = html;
    if (!reduceMotion) $$(".plot", el).forEach(function (n, i) { n.style.animationDelay = (i * 45) + "ms"; n.classList.add("rise"); });
    el.scrollLeft = 0;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-suggest]");
    if (!b) return;
    var f = b.parentNode.querySelector(".suggest");
    b.hidden = true; f.hidden = false; f.querySelector("input").focus();
  });
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f.classList.contains("suggest")) {
      e.preventDefault();
      var name = f.querySelector("input").value.trim();
      f.outerHTML = '<p class="body thanks">Thanks. ' + esc(name || "That place") + " is on Tina's list. <span class=\"meta\">(Concept: nothing was sent.)</span></p>";
    }
    if (f.classList.contains("signup")) {
      e.preventDefault();
      var input = f.querySelector("input[type=email]");
      var err = f.parentNode.querySelector(".signup-err");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        if (!err) { err = document.createElement("p"); err.className = "signup-err"; err.setAttribute("role", "alert"); f.insertAdjacentElement("afterend", err); }
        err.textContent = "That email is missing something. Try name@example.com.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      if (err) err.remove();
      f.outerHTML = '<div class="signed" role="status"><p class="d-s">You\'re on the list.</p><p class="body">Sunday\'s list goes to ' + esc(input.value.trim()) + '. <span class="meta">(Concept: nothing was sent.)</span></p></div>';
    }
  });
  function streetNav(el) {
    var wrap = el.parentNode;
    $$("[data-street-prev],[data-street-next]", wrap).forEach(function (b) {
      b.addEventListener("click", function () {
        el.scrollBy({ left: (b.hasAttribute("data-street-next") ? 1 : -1) * Math.min(el.clientWidth * 0.8, 600), behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  }

  /* ---------- home ---------- */
  var homeStreet = $("#street");
  var homeCrave = $("[data-crave='home']");
  if (homeStreet && homeCrave) {
    streetNav(homeStreet);
    initCrave(homeCrave, function (st, list) {
      list = sortPlaces(list);
      var h = $("#street-h"), lede = $("#street-lede");
      var isDefault = st.craving === "anything" && st.where === "anywhere" && st.with === "anyone" && st.tinaOnly;
      if (isDefault) {
        h.textContent = "Where Tina ate lately";
        lede.textContent = "Places from her recent videos, each with the line she posted about it. Change the sentence above and the street changes with it.";
      } else {
        var bits = [labelFor(D.cravings, st.craving), "in " + labelFor(D.wheres, st.where)];
        if (st.with !== "anyone") bits.push("with " + labelFor(D.withs, st.with));
        h.textContent = list.length + (list.length === 1 ? " place" : " places") + " for " + bits.join(" ");
        lede.textContent = st.tinaOnly ? "Only places Tina has been. Switch it off to see the whole street." : "Tina's picks first, then the places she hasn't been to yet.";
      }
      renderStreet(homeStreet, list, 7);
      syncSaves();
    });
    $("[data-crave-go]", homeCrave).addEventListener("click", function (e) {
      if (this.getAttribute("data-count") !== "0") { e.preventDefault(); $("#street-sec").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }
    });
  }

  /* ---------- map ---------- */
  function initMap(root) {
    var svgG = $("[data-pins]", root), list = $(".maplist-items", root), card = $(".mapcard", root);
    var mode = root.getAttribute("data-map-mode") || "tina", selected = null;
    function inMode(p) { return mode === "all" ? true : mode === "saved" ? isSaved(p.id) : !!p.tina; }
    function pins() {
      var ns = "http://www.w3.org/2000/svg";
      svgG.innerHTML = "";
      D.places.filter(function (p) { return p.x != null && !p.hideOnMap; }).sort(function (a, b) { return (a.tina ? 1 : 0) - (b.tina ? 1 : 0); }).forEach(function (p) {
        var on = inMode(p);
        var g = document.createElementNS(ns, "g");
        g.setAttribute("class", "pin" + (p.tina ? " pin-tina" : " pin-dot") + (on ? "" : " pin-off") + (selected === p.id ? " pin-sel" : "") + (isSaved(p.id) ? " pin-saved" : ""));
        g.setAttribute("data-id", p.id);
        if (on) { g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-label", p.name + ", " + address(p)); }
        if (p.tina) {
          var w = p.num.length > 2 ? 50 : p.num.length > 1 ? 40 : 32;
          g.innerHTML = '<rect x="' + (p.x - w / 2) + '" y="' + (p.y - 16) + '" width="' + w + '" height="32" rx="3"/><text x="' + p.x + '" y="' + (p.y + 10) + '">' + esc(p.num) + "</text>";
        } else {
          g.innerHTML = '<circle cx="' + p.x + '" cy="' + p.y + '" r="8" class="dot-' + area(p).siding + '"/>';
        }
        svgG.appendChild(g);
      });
    }
    function items() {
      var l = sortPlaces(D.places.filter(inMode));
      if (!l.length) {
        list.innerHTML = '<p class="empty-map body">' + (mode === "saved" ? "Nothing saved yet. Tap Save on any place and it shows up here." : "Nothing here yet.") + "</p>";
        return;
      }
      list.innerHTML = l.map(function (p) {
        return '<button class="ml-item' + (selected === p.id ? " sel" : "") + '" type="button" data-id="' + p.id + '"><span class="sw sw-' + area(p).siding + '"></span><span class="ml-t"><span class="ml-name">' + esc(p.name) + '</span><span class="meta">' + esc(address(p)) + ", " + esc(area(p).name) + "</span></span>" + tinaLabel(p) + "</button>";
      }).join("");
    }
    function showCard(p) {
      if (!p) { card.hidden = true; return; }
      var a = area(p);
      card.hidden = false;
      card.innerHTML = '<button class="mc-x" type="button" aria-label="Close" data-mc-close>&times;</button>' +
        '<div class="mc-top">' + plate(p) + '<div><h3 class="d-s">' + esc(p.name) + '</h3><p class="meta">' + esc(address(p)) + ", " + esc(a.name) + "</p></div></div>" +
        (p.tina && !p.tina.noQuote ? '<p class="hand mc-q">' + esc(p.tina.quote) + '</p><p class="meta"><a href="' + p.tina.url + '">Tina on ' + esc(p.tina.platform) + ", " + esc(p.tina.date) + "</a></p>" :
          p.tina ? '<p class="meta"><a href="' + p.tina.url + '">Featured on Tina\'s Instagram</a></p>' : '<p class="mc-fact"><span class="lbl unclaimed">Tina hasn\'t been yet</span></p>') +
        (p.facts && p.facts.length ? '<p class="mc-fact body">' + esc(p.facts[0]) + "</p>" : "") +
        '<div class="mc-acts"><a class="btn sm" href="' + placeHref(p) + '">' + icon("i-turn") + "Get there</a>" + saveBtn(p, "btn ghost sm") + "</div>";
    }
    function select(id, fromList) {
      selected = id;
      pins(); items();
      showCard(byId[id]);
      var it = $('.ml-item[data-id="' + id + '"]', list);
      if (it && !fromList) it.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }
    root.addEventListener("click", function (e) {
      var t = e.target.closest(".tabs button");
      if (t) {
        mode = t.getAttribute("data-mode");
        $$(".tabs button", root).forEach(function (b) { b.setAttribute("aria-pressed", b === t); });
        pins(); items();
        return;
      }
      if (e.target.closest("[data-mc-close]")) { selected = null; pins(); items(); showCard(null); return; }
      var pin = e.target.closest(".pin:not(.pin-off)");
      if (pin) { select(pin.getAttribute("data-id")); return; }
      var it = e.target.closest(".ml-item");
      if (it) select(it.getAttribute("data-id"), true);
    });
    root.addEventListener("keydown", function (e) {
      var pin = e.target.closest && e.target.closest(".pin");
      if (pin && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(pin.getAttribute("data-id")); }
    });
    root.addEventListener("mouseover", function (e) {
      var it = e.target.closest(".ml-item");
      $$(".pin.hot", root).forEach(function (n) { n.classList.remove("hot"); });
      if (it) { var pn = $('.pin[data-id="' + it.getAttribute("data-id") + '"]', root); if (pn) pn.classList.add("hot"); }
    });
    pins(); items();
    var api = { refresh: function () { pins(); items(); if (selected) showCard(byId[selected]); }, select: select };
    mapApi.push(api);
    return api;
  }
  $$("[data-map]").forEach(initMap);

  /* ---------- Watch + Eat ---------- */
  var watch = $("[data-watch]");
  if (watch) {
    var ol = $(".onscreen", watch), thumbs = $$("[data-video]", watch), scrubB = $(".scrub b", watch), scrubI = $(".scrub i", watch);
    var cur = 0, vid = D.videos[0];
    function renderVideo(v) {
      vid = v;
      $("[data-reel-tag]", watch).textContent = "Tina's TikTok, " + v.date;
      $("[data-reel-title]", watch).textContent = "Video: " + v.title;
      var ph = $(".reel .ph", watch);
      ph.className = "ph t-night ratio-916";
      $("[data-reel-play]", watch).setAttribute("href", v.url);
      $("[data-reel-play]", watch).setAttribute("aria-label", "Play Tina's " + v.title + " video on TikTok");
      thumbs.forEach(function (t) { t.setAttribute("aria-pressed", t.getAttribute("data-video") === v.id); });
      ol.innerHTML = v.moments.map(function (m, i) {
        var act = m.action ? '<a class="btn light sm" href="' + m.action.href + '">' + (m.action.icon ? icon(m.action.icon) : "") + esc(m.action.label) + "</a>"
          : m.save ? saveBtn(byId[m.save], "dark") : "<span></span>";
        return '<li data-i="' + i + '"><button class="ts" type="button" aria-label="Jump to ' + esc(m.what) + '">' + esc(m.step) + '</button><p class="what">' + esc(m.what) + "<span>" + esc(m.line) + "</span></p>" + act + "</li>";
      }).join("");
      go(0);
      syncSaves();
    }
    function go(i) {
      cur = i;
      $$("li", ol).forEach(function (li, j) { li.classList.toggle("now", j === i); });
      var pct = vid.moments.length > 1 ? (i / (vid.moments.length - 1)) * 100 : 0;
      scrubB.style.left = pct + "%";
      scrubI.style.right = (100 - pct) + "%";
    }
    ol.addEventListener("click", function (e) {
      var b = e.target.closest(".ts, .what");
      if (b) go(+b.closest("li").getAttribute("data-i"));
    });
    thumbs.forEach(function (t) {
      t.addEventListener("click", function (e) {
        e.preventDefault();
        var v = D.videos.filter(function (x) { return x.id === t.getAttribute("data-video"); })[0];
        if (v) renderVideo(v);
      });
    });
    renderVideo(D.videos[0]);
  }

  /* ---------- guide progress ---------- */
  var tried = store.get("ltef-tried", []);
  function syncTried() {
    $$("[data-tried]").forEach(function (b) {
      var on = tried.indexOf(b.getAttribute("data-tried")) > -1;
      b.setAttribute("aria-pressed", on);
      $(".tried-label", b).textContent = on ? "I've been" : "I've been here";
      var stop = b.closest(".stop");
      if (stop) stop.classList.toggle("is-tried", on);
    });
    var all = $$("[data-tried]").map(function (b) { return b.getAttribute("data-tried"); });
    var n = all.filter(function (id) { return tried.indexOf(id) > -1; }).length;
    $$("[data-progress]").forEach(function (p) {
      p.innerHTML = '<span class="prog-bar"><i style="width:' + (all.length ? n / all.length * 100 : 0) + '%"></i></span><span>' +
        (n === all.length && n ? "You've tried all " + n + ". Tina would be proud." : "You've tried " + n + " of " + all.length) + "</span>";
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tried]");
    if (!b) return;
    var id = b.getAttribute("data-tried");
    if (tried.indexOf(id) > -1) tried.splice(tried.indexOf(id), 1); else tried.push(id);
    store.set("ltef-tried", tried);
    syncTried();
  });
  syncTried();

  /* ---------- explore page ---------- */
  var exp = $("[data-explore]");
  if (exp) {
    var res = $(".ex-results", exp), sortSel = $("#ex-sort", exp), countEl = $("[data-ex-count]", exp), lastList = [];
    function row(p) {
      var a = area(p);
      return '<article class="exrow" id="' + p.id + '">' +
        '<div class="ex-plate f-' + a.siding + '">' + plate(p) + "</div>" +
        '<div class="ex-main"><h3 class="d-s"><a href="' + placeHref(p) + '">' + esc(p.name) + '</a></h3><p class="meta">' + esc(address(p)) + ", " + esc(a.name) + ". " + esc(p.cuisine) + (p.price ? ", " + esc(p.price) : "") + "</p>" +
        (p.tina && !p.tina.noQuote ? '<p class="hand ex-q">' + esc(p.tina.quote) + '</p><p class="meta"><a href="' + p.tina.url + '">Tina on ' + esc(p.tina.platform) + ", " + esc(p.tina.date) + "</a></p>"
          : '<p class="ex-fact">' + tinaLabel(p) + (p.facts && p.facts[0] ? " <span class=\"body\">" + esc(p.facts[0]) + "</span>" : "") + "</p>") +
        '</div><div class="ex-acts">' + saveBtn(p, "btn ghost sm") + '<button class="btn sm" type="button" data-show-on-map="' + p.id + '">' + icon("i-map") + "On the map</button></div></article>";
    }
    function draw() {
      var l = sortPlaces(lastList, sortSel.value);
      countEl.textContent = l.length + (l.length === 1 ? " place" : " places");
      res.innerHTML = l.length ? l.map(row).join("") : '<div class="empty"><p class="d-s">Nothing on this street yet.</p><p class="body">Try a different craving, or switch on places Tina hasn\'t been to.</p></div>';
      syncSaves();
    }
    initCrave($("[data-crave='explore']"), function (st, list) { lastList = list; draw(); });
    sortSel.addEventListener("change", draw);
    var exMap = mapApi[0];
    exp.addEventListener("click", function (e) {
      var b = e.target.closest("[data-show-on-map]");
      if (!b || !exMap) return;
      var p = byId[b.getAttribute("data-show-on-map")];
      if (p.x == null) { toast("No street address on file for " + p.name + " yet."); return; }
      var tab = $('[data-map] .tabs [data-mode="all"]');
      if (tab && !p.tina) tab.click();
      exMap.select(p.id);
      $("[data-map]").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      document.body.classList.add("show-map");
      $$("[data-view]").forEach(function (v) { v.setAttribute("aria-pressed", v.getAttribute("data-view") === "map"); });
    });
    $$("[data-view]").forEach(function (v) {
      v.addEventListener("click", function () {
        document.body.classList.toggle("show-map", v.getAttribute("data-view") === "map");
        $$("[data-view]").forEach(function (x) { x.setAttribute("aria-pressed", x === v); });
      });
    });
    if (location.hash && byId[location.hash.slice(1)]) {
      setTimeout(function () { var el = document.getElementById(location.hash.slice(1)); if (el) { el.classList.add("flash"); el.scrollIntoView({ block: "center" }); } }, 60);
    }
  }

  /* ---------- Tina page feed ---------- */
  var feed = $("[data-feed]");
  if (feed) {
    var posts = D.places.filter(function (p) { return p.tina && !p.tina.noQuote; }).sort(function (a, b) { return b.tina.sort - a.tina.sort; });
    feed.innerHTML = posts.map(function (p, i) {
      return '<article class="post">' +
        '<a class="ph ' + p.tone + ' ratio-916" href="' + p.tina.url + '"><span class="tag">' + esc(p.tina.platform) + ", " + esc(p.tina.date) + '</span><span class="post-play" aria-hidden="true"><svg><use href="#i-play"></use></svg></span><span class="sr">Watch Tina\'s ' + esc(p.name) + " video</span></a>" +
        '<p class="note flat">' + esc(p.tina.quote) + "</p>" +
        '<p class="post-place"><b>' + esc(p.name) + '</b><span class="meta">' + esc(address(p)) + ", " + esc(area(p).name) + "</span></p>" +
        '<div class="post-acts">' + (p.num ? '<a class="door-go" href="' + placeHref(p) + '">' + icon("i-turn") + "Get there</a>" : "") + saveBtn(p, "mini") + "</div></article>";
    }).join("") +
      '<article class="post post-next f-mustard clap"><p class="d-s">Where should she go next?</p><p class="body">Tina reads every suggestion. Tell her about the place you keep telling everyone about.</p><a class="btn sm" href="index.html#street-sec">Suggest a place</a></article>';
  }

  syncSaves();
})();
