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
  /* photos (Wikimedia Commons, credited) and Tina's videos (TikTok's own player) */
  function photoInner(key, place, elsewhere) {
    var ph = (D.photos || {})[key];
    if (!ph) return "";
    var stand = !ph.real || elsewhere;
    var alt = ph.what + (stand && place ? ". Stand-in photo, not taken at " + place.name : "");
    return '<img class="ph-img" src="' + ph.src + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
      (stand ? '<span class="ph-stand" title="' + esc(ph.what) + ', taken elsewhere">Stand-in</span>' : "") +
      '<a class="ph-credit" href="' + ph.page + '" target="_blank" rel="noopener" title="' + esc(ph.what) + '">' + esc(ph.by) + ", " + esc(ph.lic) + "</a>";
  }
  function placePhotoHtml(p) { return photoInner((D.placePhoto || {})[p.id], p); }
  function hydratePhotos(root) {
    $$("[data-photo]", root).forEach(function (el) {
      if (el.classList.contains("has-photo")) return;
      var html = photoInner(el.getAttribute("data-photo"), byId[el.getAttribute("data-place")], el.hasAttribute("data-elsewhere"));
      if (!html) return;
      el.classList.add("has-photo");
      el.insertAdjacentHTML("afterbegin", html);
    });
  }
  function tiktokId(url) { var m = /video\/(\d+)/.exec(url || ""); return m ? m[1] : null; }
  function tiktokFrame(url, title) {
    var id = tiktokId(url);
    if (!id) return "";
    return '<iframe class="tt-frame" src="https://www.tiktok.com/player/v1/' + id + '?music_info=0&amp;description=0&amp;rel=0&amp;native_context_menu=0&amp;closed_caption=1" title="' + esc(title || "Tina's TikTok video") + '" allow="fullscreen; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
  }
  function hydrateVideos(root) {
    $$("[data-tiktok]", root).forEach(function (el) {
      if (el.classList.contains("has-video")) return;
      var html = tiktokFrame(el.getAttribute("data-tiktok"), el.getAttribute("data-title"));
      if (!html) return;
      el.classList.add("has-video");
      el.insertAdjacentHTML("beforeend", html);
    });
  }
  hydratePhotos(document);
  hydrateVideos(document);

  function getThere(p, cls) {
    if (!p.num) return '<a class="' + cls + '" href="' + placeHref(p) + '">' + icon("i-turn") + "Get there</a>";
    return '<a class="' + cls + '" href="' + directionsUrl(p) + '" target="_blank" rel="noopener">' + icon("i-turn") + 'Get there<span class="sr"> (opens Google Maps)</span></a>';
  }
  /* how often she's posted, and the December 2025 gift card giveaways, said plainly */
  function tinaExtra(p) {
    if (!p.tina) return "";
    var bits = [];
    if (p.tina.posts > 1) bits.push(p.tina.posts + " TikToks");
    if (p.tina.giveaway) bits.push("in her " + p.tina.giveaway + " gift card giveaways");
    return bits.length ? '<span class="tina-extra">' + esc(bits.join(", ")) + "</span>" : "";
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
    if (root.hasAttribute("data-url-presets")) {
      ["craving", "where", "with"].forEach(function (k) { var v = param(k); if (v && lists[k].some(function (o) { return o.id === v; })) st[k] = v; });
      if (param("tina") === "1") st.tinaOnly = true;
    }
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
    st.refresh = update;
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
      '<div class="pick-actions">' + getThere(p, "btn") + saveBtn(p, "btn ghost") + '<a class="btn ghost" href="' + placeHref(p) + '">' + (p.page ? "Full page" : "More") + "</a>" +
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
      '<div class="fl mid"><div class="window"><div class="ph ' + p.tone + ' ratio-43' + (placePhotoHtml(p) ? " has-photo" : "") + '">' + placePhotoHtml(p) + '<p class="cap"><b>' + esc(p.dish) + "</b></p></div></div></div>" +
      '<div class="fl door"><div><h3 class="nm"><a href="' + placeHref(p) + '">' + esc(p.name) + '</a></h3><p class="meta">' + esc(p.cuisine) + (p.price ? ", " + esc(p.price) : "") + "</p>" +
      '<div class="door-acts">' + getThere(p, "door-go") + saveBtn(p, "mini") + "</div></div>" +
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
  /* ---------- the map ----------
     A schematic SVG map with pan and zoom. Pins keep the same on-screen size at every zoom,
     crowded pins merge into numbered clusters, names appear once there's room, and the
     Saved tab can plan a route through saved places. All coordinates are map units (900 x 600). */
  var SVGNS = "http://www.w3.org/2000/svg";
  var MAP_W = 900, MAP_H = 600, MAX_K = 5, ROUTE_START = { x: 410, y: 285 };
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function fullAddress(p) { return address(p) + ", " + area(p).town + ", MA"; }
  function directionsUrl(p) { return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(p.name + ", " + fullAddress(p)); }
  function routeUrl(stops) {
    var u = "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(fullAddress(stops[0])) +
      "&destination=" + encodeURIComponent(fullAddress(stops[stops.length - 1]));
    if (stops.length > 2) u += "&waypoints=" + stops.slice(1, -1).map(function (p) { return encodeURIComponent(fullAddress(p)); }).join("%7C");
    return u;
  }
  var measureCtx = document.createElement("canvas").getContext("2d");
  var labelW = {};
  function textW(s) {
    if (labelW[s] == null) { measureCtx.font = '700 12.5px "Archivo", sans-serif'; labelW[s] = Math.ceil(measureCtx.measureText(s).width); }
    return labelW[s];
  }
  function pinSize(p) { return p.tina ? { w: p.num.length > 2 ? 40 : p.num.length > 1 ? 32 : 26, h: 26 } : { w: 16, h: 16 }; }
  function overlaps(a, b) { return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1; }
  function union(a, b) { return { x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1), x2: Math.max(a.x2, b.x2), y2: Math.max(a.y2, b.y2) }; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function initMap(root) {
    var canvas = $(".map", root), svg = $("svg", canvas);
    var gPins = $("[data-pins]", svg), gClusters = $("[data-clusters]", svg), gLabels = $("[data-labels]", svg), gRoute = $("[data-route]", svg);
    var list = $(".maplist-items", root), card = $(".mapcard", canvas);
    var mode = root.getAttribute("data-map-mode") || "tina";
    var selected = null, filter = null, routeOn = false, rove = null, tipKey = null;
    var mapped = D.places.filter(function (p) { return p.x != null && !p.hideOnMap; });
    var v = { x: 0, y: 0, w: MAP_W }, groups = [], anim = null, jumped = null;

    /* -- chrome around the canvas: tools, area jumps, preview, hint, key, live region -- */
    var areaKeys = Object.keys(D.areas).filter(function (k) { return mapped.some(function (p) { return p.area === k; }); });
    canvas.insertAdjacentHTML("beforeend",
      '<div class="map-jump" role="group" aria-label="Jump to a neighborhood"><button type="button" data-jump="all" aria-pressed="true">Everything</button>' +
      areaKeys.map(function (k) { return '<button type="button" data-jump="' + k + '" aria-pressed="false"><span class="sw sw-' + D.areas[k].siding + '" aria-hidden="true"></span>' + esc(D.areas[k].name) + "</button>"; }).join("") + "</div>" +
      '<div class="map-tools" role="group" aria-label="Zoom"><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-zoom="out" aria-label="Zoom out">&minus;</button>' +
      '<button type="button" data-zoom="fit" aria-label="Show everything"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 7V2h5M13 2h5v5M18 13v5h-5M7 18H2v-5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg></button></div>' +
      '<div class="map-tip" hidden></div>' +
      '<p class="map-hint" aria-hidden="true">' + (isMac ? "Pinch, or hold &#8984; and scroll, to zoom" : "Hold Ctrl and scroll to zoom") + "</p>" +
      '<p class="map-key" aria-hidden="true"><span><i class="k-plate">85</i>Tina ate here</span><span><i class="k-dot"></i>Not yet</span><span><i class="k-town"></i>Town not covered yet</span></p>' +
      '<p class="sr" aria-live="polite" data-map-live></p>' +
      '<p class="sr" id="' + (root.id || "map") + '-kb">Arrow keys move between pins. Plus and minus zoom. Zero shows everything. Escape closes the card.</p>');
    /* base-map labels and town plates keep roughly the same on-screen size as you zoom */
    var keepSize = $$(".map-base text", svg).filter(function (t) { return !t.closest(".district, .town-off"); }).map(function (t) {
      return { el: t, x: +t.getAttribute("x"), y: +t.getAttribute("y"), t: t.getAttribute("transform") || "" };
    }).concat($$(".map-base g.district, .map-base .town-off", svg).map(function (g) { return { el: g, box: true, t: "" }; }));
    function scaleBase() {
      var s = Math.min(2.2, Math.pow((v.w / cw()) / 1.15, .85));
      keepSize.forEach(function (o) {
        if (o.box && o.x == null) { var b = o.el.getBBox(); if (!b.width) return; o.x = b.x + b.width / 2; o.y = b.y + b.height / 2; }
        o.el.setAttribute("transform", Math.abs(s - 1) < .01 ? o.t : "translate(" + o.x + " " + o.y + ") scale(" + s + ") translate(" + (-o.x) + " " + (-o.y) + ") " + o.t);
      });
    }
    var tip = $(".map-tip", canvas), hint = $(".map-hint", canvas), live = $("[data-map-live]", canvas);
    var kbId = (root.id || "map") + "-kb";
    function say(s) { live.textContent = ""; setTimeout(function () { live.textContent = s; }, 30); }

    /* -- pins, created once and updated in place so focus survives -- */
    var pinEl = {};
    mapped.slice().sort(function (a, b) { return (a.tina ? 1 : 0) - (b.tina ? 1 : 0); }).forEach(function (p) {
      var s = pinSize(p), g = svgEl("g", { "class": "pin " + (p.tina ? "pin-tina" : "pin-dot"), "data-id": p.id });
      /* an invisible, finger-sized hit area so a near miss still lands on the pin, not the block under it */
      var hw = Math.max(s.w + 12, 34), hh = Math.max(s.h + 12, 34);
      g.appendChild(svgEl("rect", { "class": "hit", x: -hw / 2, y: -hh / 2, width: hw, height: hh, rx: p.tina ? 4 : hh / 2, style: "fill:transparent;stroke:none" }));
      if (p.tina) {
        g.appendChild(svgEl("rect", { x: -s.w / 2, y: -13, width: s.w, height: 26, rx: 2 }));
        g.appendChild(svgEl("text", { x: 0, y: 8 }, p.num));
      } else g.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 6.5, "class": "dot-" + area(p).siding }));
      gPins.appendChild(g);
      pinEl[p.id] = g;
    });

    function inMode(p) { return mode === "all" ? true : mode === "saved" ? isSaved(p.id) : !!p.tina; }
    function inView(p) { return inMode(p) && (!filter || filter[p.id]); }
    /* the selected place always shows at full strength, even if it's outside the current tab or filter */
    function isOn(p) { return p.id === selected || inView(p); }
    function active() {
      return mapped.filter(isOn).sort(function (a, b) {
        return (b.id === selected) - (a.id === selected) || (b.tina ? 1 : 0) - (a.tina ? 1 : 0) || a.y - b.y || a.x - b.x;
      });
    }

    /* -- geometry -- */
    function cw() { return canvas.clientWidth || 600; }
    function ch() { return canvas.clientHeight || 400; }
    function asp() { return Math.max(.45, cw() / ch()); }
    function fitW() { return Math.max(MAP_W, MAP_H * asp()) * 1.04; }
    function kOf(vv) { return fitW() / vv.w; }
    function clampV(vv) {
      var fw = fitW(), w = Math.min(fw, Math.max(fw / MAX_K, vv.w)), h = w / asp(), m = 70;
      var cx = vv.x + vv.w / 2, cy = vv.y + (vv.w / asp()) / 2;
      var lo = Math.min(w / 2 - m, MAP_W / 2), hi = Math.max(MAP_W - w / 2 + m, MAP_W / 2);
      cx = Math.min(hi, Math.max(lo, cx));
      lo = Math.min(h / 2 - m, MAP_H / 2); hi = Math.max(MAP_H - h / 2 + m, MAP_H / 2);
      cy = Math.min(hi, Math.max(lo, cy));
      if (w >= MAP_W) cx = MAP_W / 2;
      if (h >= MAP_H) cy = MAP_H / 2;
      return { x: cx - w / 2, y: cy - h / 2, w: w };
    }
    function toPx(x, y, vv) { var u = (vv || v).w / cw(); return { x: (x - (vv || v).x) / u, y: (y - (vv || v).y) / u }; }
    function pinBox(p, u, pad) {
      var s = pinSize(p), pd = (pad || 0) * u;
      return { x1: p.x - s.w / 2 * u - pd, y1: p.y - s.h / 2 * u - pd, x2: p.x + s.w / 2 * u + pd, y2: p.y + s.h / 2 * u + pd };
    }

    /* -- clustering: merge pins whose plates would touch on screen at this zoom -- */
    function clusterFor(vv) {
      /* group around each cluster's centre (not by chaining touching pins), preferring the same neighbourhood,
         so the city breaks into a handful of neighbourhood circles instead of one blob */
      var u = vv.w / cw(), atMax = kOf(vv) >= MAX_K - .01, out = [];
      function px(p) { return { x: (p.x - vv.x) / u, y: (p.y - vv.y) / u }; }
      function radius(g) { return g.ids.length > 1 ? 15 + Math.min(g.ids.length, 10) * .7 : Math.max(pinSize(byId[g.ids[0]]).w, 16) / 2; }
      active().forEach(function (p) {
        var q = px(p), best = null, bd = Infinity;
        if (!atMax && p.id !== selected) {
          out.forEach(function (g) {
            if (g.ids[0] === selected) return;
            var d = Math.hypot(g.sx / g.ids.length - q.x, g.sy / g.ids.length - q.y);
            var lim = g.area === p.area ? 40 : 26;
            if (d < lim && d < bd) { bd = d; best = g; }
          });
        }
        if (best) { best.ids.push(p.id); best.sx += q.x; best.sy += q.y; }
        else out.push({ ids: [p.id], sx: q.x, sy: q.y, area: p.area });
      });
      for (var pass = 0, merged = true; merged && pass < 6 && !atMax; pass++) {
        merged = false;
        for (var i = 0; i < out.length; i++) for (var j = i + 1; j < out.length; j++) {
          var A = out[i], B = out[j];
          if (A.ids.indexOf(selected) > -1 || B.ids.indexOf(selected) > -1) continue;
          var d = Math.hypot(A.sx / A.ids.length - B.sx / B.ids.length, A.sy / A.ids.length - B.sy / B.ids.length);
          if (d < radius(A) + radius(B) + 2) {
            A.ids = A.ids.concat(B.ids); A.sx += B.sx; A.sy += B.sy;
            if (A.area !== B.area) A.area = null;
            out.splice(j, 1); merged = true; j--;
          }
        }
      }
      out.forEach(function (g) {
        var sx = 0, sy = 0;
        g.ids.forEach(function (id) { sx += byId[id].x; sy += byId[id].y; });
        g.x = sx / g.ids.length; g.y = sy / g.ids.length;
        g.key = g.ids.length > 1 ? "c:" + g.ids.slice().sort().join(",") : "p:" + g.ids[0];
        g.r = 15 + Math.min(g.ids.length, 10) * .7;
        g.box = g.ids.length > 1 ? { x1: g.x - g.r * u, y1: g.y - g.r * u, x2: g.x + g.r * u, y2: g.y + g.r * u } : pinBox(byId[g.ids[0]], u, 3);
      });
      return out;
    }
    function isClustered(id, gs) { return (gs || groups).some(function (g) { return g.ids.length > 1 && g.ids.indexOf(id) > -1; }); }
    function kToSeparate(ids, base) {
      var vv = base;
      for (var i = 0; i < 14; i++) {
        var gs = clusterFor(vv);
        if (!ids.some(function (id) { return isClustered(id, gs); })) return vv;
        if (kOf(vv) >= MAX_K - .01) return vv;
        var cx = vv.x + vv.w / 2, cy = vv.y + vv.w / asp() / 2, w = vv.w / 1.3;
        vv = clampV({ x: cx - w / 2, y: cy - w / asp() / 2, w: w });
      }
      return vv;
    }
    function clusterName(g) {
      var a = byId[g.ids[0]].area, same = g.ids.every(function (id) { return byId[id].area === a; });
      return same ? D.areas[a].name : "this part of the map";
    }

    /* -- render one frame -- */
    var clusterEl = {};
    function layout() {
      var u = v.w / cw(), k = kOf(v);
      groups = clusterFor(v);
      var shown = {};
      groups.forEach(function (g) { if (g.ids.length === 1) shown[g.ids[0]] = true; });
      mapped.forEach(function (p) {
        var el = pinEl[p.id];
        el.setAttribute("transform", "translate(" + p.x + " " + p.y + ") scale(" + u + ")");
        var hide = isOn(p) && !shown[p.id];
        if (hide && document.activeElement === el) svgFocusLost = true;
        el.classList.toggle("pin-hidden", hide);
      });
      var keep = {};
      groups.forEach(function (g) {
        if (g.ids.length < 2) return;
        keep[g.key] = true;
        var el = clusterEl[g.key];
        if (!el) {
          var hasTina = g.ids.some(function (id) { return byId[id].tina; });
          el = svgEl("g", { "class": "cluster" + (hasTina ? " cl-tina" : ""), role: "button", "data-key": g.key, tabindex: "-1", "aria-describedby": kbId });
          el.appendChild(svgEl("circle", { cx: 0, cy: 0, r: g.r }));
          el.appendChild(svgEl("text", { x: 0, y: 5.5 }, g.ids.length));
          var names = g.ids.map(function (id) { return byId[id].name; });
          el.setAttribute("aria-label", g.ids.length + " places in " + clusterName(g) + ": " + names.join(", ") + ". Zoom in to see them.");
          el.__g = g;
          gClusters.appendChild(el);
          clusterEl[g.key] = el;
        }
        el.__g = g;
        el.setAttribute("transform", "translate(" + g.x + " " + g.y + ") scale(" + u + ")");
        el.classList.toggle("hot", !!hotId && g.ids.indexOf(hotId) > -1);
      });
      Object.keys(clusterEl).forEach(function (key) {
        if (!keep[key]) { if (document.activeElement === clusterEl[key]) svgFocusLost = true; clusterEl[key].remove(); delete clusterEl[key]; }
      });
      scaleBase();
      drawLabels(u, k);
      setRove();
      $('[data-zoom="in"]', canvas).disabled = k >= MAX_K - .01;
      $('[data-zoom="out"]', canvas).disabled = $('[data-zoom="fit"]', canvas).disabled = k <= 1.01;
      svg.style.touchAction = k > 1.02 ? "none" : "pan-y";
      if (tipKey) placeTip();
    }
    var svgFocusLost = false;

    /* names next to pins, only where they fit */
    function drawLabels(u, k) {
      gLabels.textContent = "";
      if (k < 1.7) return;
      var taken = [];
      groups.forEach(function (g) {
        if (g.ids.length > 1) taken.push({ x1: g.x - g.r * u, y1: g.y - g.r * u, x2: g.x + g.r * u, y2: g.y + g.r * u });
        else taken.push(pinBox(byId[g.ids[0]], u, 2));
      });
      var view = { x1: v.x, y1: v.y + 64 * u, x2: v.x + v.w - 64 * u, y2: v.y + v.w / asp() };
      groups.forEach(function (g) {
        if (g.ids.length > 1) return;
        var p = byId[g.ids[0]], s = pinSize(p), tw = textW(p.name) + 12, th = 21;
        var tries = [[s.w / 2 + 5, -th / 2], [-s.w / 2 - 5 - tw, -th / 2], [-tw / 2, s.h / 2 + 4], [-tw / 2, -s.h / 2 - 4 - th]];
        for (var i = 0; i < tries.length; i++) {
          var b = { x1: p.x + tries[i][0] * u, y1: p.y + tries[i][1] * u, x2: p.x + (tries[i][0] + tw) * u, y2: p.y + (tries[i][1] + th) * u };
          if (!overlaps(b, view) || b.x1 < view.x1 || b.y1 < view.y1 || b.x2 > view.x2 || b.y2 > view.y2) continue;
          if (taken.some(function (t) { return overlaps(t, b); })) continue;
          taken.push(b);
          var lg = svgEl("g", { "class": "map-label" + (p.tina ? " ml-tina" : "") + (p.id === selected ? " ml-sel" : ""), transform: "translate(" + p.x + " " + p.y + ") scale(" + u + ")" });
          lg.appendChild(svgEl("rect", { x: tries[i][0], y: tries[i][1], width: tw, height: th }));
          lg.appendChild(svgEl("text", { x: tries[i][0] + 6, y: tries[i][1] + 14.5 }, p.name));
          gLabels.appendChild(lg);
          return;
        }
      });
    }

    /* -- state that changes on clicks rather than every frame -- */
    function update() {
      mapped.forEach(function (p) {
        var el = pinEl[p.id], on = isOn(p);
        el.setAttribute("class", "pin " + (p.tina ? "pin-tina" : "pin-dot") + (on ? "" : " pin-off") + (selected === p.id ? " pin-sel" : "") + (isSaved(p.id) ? " pin-saved" : "") + (hotId === p.id ? " hot" : ""));
        if (on) {
          el.setAttribute("role", "button");
          el.setAttribute("aria-label", p.name + ", " + fullAddress(p) + ". " + (p.tina ? "Tina ate here, " + p.tina.date : "Tina hasn't been yet") + (isSaved(p.id) ? ". Saved" : ""));
          el.setAttribute("aria-describedby", kbId);
          el.removeAttribute("aria-hidden");
          if (selected === p.id) el.setAttribute("aria-pressed", "true"); else el.removeAttribute("aria-pressed");
        } else {
          ["role", "aria-label", "aria-describedby", "aria-pressed", "tabindex"].forEach(function (a) { el.removeAttribute(a); });
          el.setAttribute("aria-hidden", "true");
        }
        var old = $(".stopn", el);
        if (old) old.remove();
      });
      Object.keys(clusterEl).forEach(function (key) { clusterEl[key].remove(); delete clusterEl[key]; });
      drawRoute();
      layout();
      items();
    }

    /* roving tabindex: one pin or cluster in the tab order, arrows move spatially */
    function focusables() {
      return groups.map(function (g) { return g.ids.length > 1 ? clusterEl[g.key] : pinEl[g.ids[0]]; }).filter(Boolean);
    }
    function keyOf(el) { return el.classList.contains("cluster") ? el.getAttribute("data-key") : "p:" + el.getAttribute("data-id"); }
    function setRove() {
      var els = focusables();
      if (!els.length) return;
      var cur = els.filter(function (el) { return keyOf(el) === rove; })[0];
      if (!cur && rove && rove.indexOf("p:") === 0) {
        var id = rove.slice(2);
        cur = els.filter(function (el) { return el.__g && el.__g.ids.indexOf(id) > -1; })[0];
      }
      if (!cur) {
        var inView = els.filter(function (el) { var c = centerOf(el); return c.x > 0 && c.y > 0 && c.x < cw() && c.y < ch(); });
        cur = (inView.length ? inView : els)[0];
      }
      els.forEach(function (el) { el.setAttribute("tabindex", el === cur ? "0" : "-1"); });
      mapped.forEach(function (p) { if (!isOn(p) || pinEl[p.id].classList.contains("pin-hidden")) pinEl[p.id].removeAttribute("tabindex"); });
      if (svgFocusLost && cur) { svgFocusLost = false; cur.focus({ preventScroll: true }); }
    }
    function centerOf(el) {
      var g = el.__g, p = g ? g : byId[el.getAttribute("data-id")];
      return toPx(p.x, p.y);
    }

    /* -- the camera -- */
    var kNow = 1, cNow = { x: MAP_W / 2, y: MAP_H / 2 };
    function apply(vv) {
      v = clampV(vv);
      kNow = kOf(v); cNow = { x: v.x + v.w / 2, y: v.y + v.w / asp() / 2 };
      svg.setAttribute("viewBox", v.x + " " + v.y + " " + v.w + " " + (v.w / asp()));
      layout();
    }
    function animateTo(target, done, dur) {
      if (anim) cancelAnimationFrame(anim);
      target = clampV(target);
      if (reduceMotion || dur === 0) { apply(target); if (done) done(); return; }
      var from = { x: v.x, y: v.y, w: v.w }, t0 = null, d = dur || 420;
      var fc = { x: from.x + from.w / 2, y: from.y + from.w / asp() / 2 }, tc = { x: target.x + target.w / 2, y: target.y + target.w / asp() / 2 };
      (function step(ts) {
        if (t0 == null) t0 = ts;
        var t = Math.min(1, (ts - t0) / d), e = ease(t);
        var w = from.w * Math.pow(target.w / from.w, e), cx = fc.x + (tc.x - fc.x) * e, cy = fc.y + (tc.y - fc.y) * e;
        apply({ x: cx - w / 2, y: cy - w / asp() / 2, w: w });
        if (t < 1) anim = requestAnimationFrame(step); else { anim = null; if (done) done(); }
      })(performance.now());
    }
    function zoomBy(f, px, py, animate) {
      if (px == null) { px = cw() / 2; py = ch() / 2; }
      var u = v.w / cw(), ax = v.x + px * u, ay = v.y + py * u;
      var w = Math.min(fitW(), Math.max(fitW() / MAX_K, v.w / f)), u2 = w / cw();
      var t = { x: ax - px * u2, y: ay - py * u2, w: w };
      setJump(null);
      if (animate) animateTo(t, null, 260); else apply(t);
    }
    var PAD = { t: 70, r: 64, b: 30, l: 24 };
    function viewForBox(b, maxK) {
      var pad = { t: PAD.t, r: PAD.r, b: PAD.b, l: PAD.l };
      if (cw() < 560) { pad.r = 58; pad.l = 14; }
      var aw = Math.max(80, cw() - pad.l - pad.r), ah = Math.max(80, ch() - pad.t - pad.b);
      var bw = Math.max(b.x2 - b.x1, 90), bh = Math.max(b.y2 - b.y1, 60);
      var u = Math.max(bw / aw, bh / ah), w = Math.max(u * cw(), fitW() / (maxK || 3.4)), u2 = w / cw();
      var cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
      return { x: cx - (pad.l + aw / 2) * u2, y: cy - (pad.t + ah / 2) * u2, w: w };
    }
    function boxOf(ps, margin) {
      var m = margin == null ? 26 : margin, b = null;
      ps.forEach(function (p) { var r = { x1: p.x - m, y1: p.y - m, x2: p.x + m, y2: p.y + m }; b = b ? union(b, r) : r; });
      return b;
    }
    function fitAll(animate) {
      setJump("all");
      var t = { x: 0, y: 0, w: fitW() };
      if (animate === false) apply(t); else animateTo(t);
    }
    function homeView() {
      if (cw() < 560) apply(viewForBox({ x1: 316, y1: 236, x2: 640, y2: 456 }, 3));
      else apply({ x: 0, y: 0, w: fitW() });
    }

    /* -- area jumps -- */
    function setJump(k) {
      jumped = k;
      $$("[data-jump]", canvas).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-jump") === k); });
    }
    function jumpTo(k) {
      if (k === "all") { fitAll(); say("Showing everything."); return; }
      var ps = mapped.filter(function (p) { return p.area === k; });
      var b = boxOf(ps, 30), d = $('.district[data-area="' + k + '"]', svg);
      if (d && d.getBBox) { var bb = d.getBBox(); b = union(b, { x1: bb.x, y1: bb.y, x2: bb.x + bb.width, y2: bb.y + bb.height }); }
      var t = kToSeparate(ps.filter(isOn).map(function (p) { return p.id; }), clampV(viewForBox(b, 3.4)));
      animateTo(t, function () { setJump(k); });
      setJump(k);
      var on = ps.filter(isOn).length;
      say(D.areas[k].name + ": " + on + (on === 1 ? " place" : " places") + " on the map" + (on < ps.length ? ", " + (ps.length - on) + " more under Everywhere." : "."));
    }

    /* -- cards -- */
    function showCard(p) {
      if (!p) { card.hidden = true; card.innerHTML = ""; return; }
      var a = area(p);
      card.hidden = false;
      card.innerHTML = '<button class="mc-x" type="button" aria-label="Close" data-mc-close>&times;</button>' +
        '<div class="mc-top">' + plate(p) + '<div><h3 class="d-s">' + esc(p.name) + '</h3><p class="meta">' + esc(address(p)) + ", " + esc(a.name) + "</p></div></div>" +
        (p.tina && !p.tina.noQuote ? '<p class="hand mc-q">' + esc(p.tina.quote) + '</p><p class="meta"><a href="' + p.tina.url + '">Tina on ' + esc(p.tina.platform) + ", " + esc(p.tina.date) + "</a>" + (tinaExtra(p) ? " &middot; " + tinaExtra(p) : "") + "</p>" :
          p.tina ? '<p class="meta"><a href="' + p.tina.url + '">Featured on Tina\'s Instagram</a></p>' : '<p class="mc-fact"><span class="lbl unclaimed">Tina hasn\'t been yet</span></p>') +
        (p.facts && p.facts.length ? '<p class="mc-fact body">' + esc(p.facts[0]) + "</p>" : "") +
        '<div class="mc-acts">' + (p.num ? '<a class="btn sm" href="' + directionsUrl(p) + '" target="_blank" rel="noopener">' + icon("i-turn") + 'Get there<span class="sr"> (opens Google Maps)</span></a>' : "") +
        saveBtn(p, "btn ghost sm") + '<a class="mc-more" href="' + placeHref(p) + '">' + (p.page ? "Full page" : "More") + "</a></div>";
    }
    function townCard(name) {
      selected = null;
      update();
      card.hidden = false;
      card.innerHTML = '<button class="mc-x" type="button" aria-label="Close" data-mc-close>&times;</button>' +
        '<p class="meta mc-k">Not covered yet</p><h3 class="d-s">' + esc(name) + '</h3><p class="body mc-fact">Tina hasn\'t posted from ' + esc(name) + " yet. Know the place she should try first?</p>" +
        '<div class="mc-acts"><a class="btn sm" href="index.html#street-sec">Suggest a place</a></div>';
    }
    function setParam(id) {
      try {
        var u = new URL(location.href);
        if (id) u.searchParams.set("pin", id); else u.searchParams.delete("pin");
        history.replaceState(history.state, "", u.pathname + u.search + u.hash);
      } catch (e) {}
    }

    /* select a place: highlight, open its card, and move the camera only if it's hidden */
    function select(id, opts) {
      opts = opts || {};
      var p = byId[id];
      if (!p) return;
      selected = id;
      rove = "p:" + id;
      hideTip();
      update();
      showCard(p);
      setParam(id);
      var it = list && $('.ml-item[data-id="' + id + '"]', list);
      if (it && !opts.fromList) it.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
      if (p.x == null) { say(p.name + " has no street address on file, so it isn't on the map."); return; }
      var c = toPx(p.x, p.y), cr = card.getBoundingClientRect(), mr = canvas.getBoundingClientRect();
      var under = c.x > cr.left - mr.left - 20 && c.x < cr.right - mr.left + 20 && c.y > cr.top - mr.top - 20;
      var off = c.x < 30 || c.y < 70 || c.x > cw() - 70 || c.y > ch() - 20;
      if (under || off || opts.zoom) {
        var anchor = cw() < 640 ? { x: cw() / 2, y: Math.min(ch() * .3, 150) } : { x: cw() * .66, y: ch() * .4 };
        var k = Math.max(kOf(v), opts.zoom ? 2.2 : 1);
        var w = fitW() / k, u = w / cw();
        animateTo({ x: p.x - anchor.x * u, y: p.y - anchor.y * u, w: w });
        setJump(null);
      }
      if (opts.focusPin) setTimeout(function () { if (pinEl[id]) pinEl[id].focus({ preventScroll: true }); }, 30);
      if (onSelect) onSelect(id);
    }
    function clearSelection() {
      var was = selected;
      selected = null;
      update();
      showCard(null);
      setParam(null);
      if (was && pinEl[was] && isOn(byId[was])) { rove = "p:" + was; setRove(); }
    }
    function openCluster(el, viaKeyboard) {
      var g = el.__g, ps = g.ids.map(function (id) { return byId[id]; });
      var t = kToSeparate(g.ids, clampV(viewForBox(boxOf(ps, 24), MAX_K)));
      rove = "p:" + g.ids[0];
      setJump(null);
      animateTo(t, function () {
        if (viaKeyboard) { var first = focusables().filter(function (e) { return g.ids.indexOf(e.getAttribute("data-id")) > -1; })[0]; if (first) { rove = keyOf(first); setRove(); first.focus({ preventScroll: true }); } }
      });
      say("Zoomed in on " + g.ids.length + " places in " + clusterName(g) + ".");
    }

    /* -- the list beside the map -- */
    function routeStops() {
      var left = mapped.filter(function (p) { return isSaved(p.id) && p.num; }), at = ROUTE_START, out = [];
      while (left.length) {
        left.sort(function (a, b) { return Math.hypot(a.x - at.x, a.y - at.y) - Math.hypot(b.x - at.x, b.y - at.y); });
        at = left.shift();
        out.push(at);
      }
      return out;
    }
    function drawRoute() {
      gRoute.textContent = "";
      if (!(routeOn && mode === "saved")) return;
      var stops = routeStops();
      if (stops.length < 2) return;
      var d = "M" + stops.map(function (p) { return p.x + " " + p.y; }).join(" L");
      gRoute.appendChild(svgEl("path", { d: d, "class": "route-case", "vector-effect": "non-scaling-stroke" }));
      gRoute.appendChild(svgEl("path", { d: d, "class": "route-line", "vector-effect": "non-scaling-stroke" }));
      stops.forEach(function (p, i) {
        var s = pinSize(p), b = svgEl("g", { "class": "stopn", transform: "translate(" + (-s.w / 2) + " " + (-s.h / 2) + ")" });
        b.appendChild(svgEl("circle", { cx: 0, cy: 0, r: 9 }));
        b.appendChild(svgEl("text", { x: 0, y: 4 }, i + 1));
        pinEl[p.id].appendChild(b);
      });
    }
    function items() {
      if (!list) return;
      var pool = D.places.filter(inMode), html = "";
      if (mode === "saved") {
        var stops = routeStops(), noAddr = pool.filter(function (p) { return !p.num; });
        if (routeOn && stops.length > 1) {
          var order = {};
          stops.forEach(function (p, i) { order[p.id] = i; });
          pool.sort(function (a, b) { return (a.id in order ? order[a.id] : 99) - (b.id in order ? order[b.id] : 99); });
          html += '<div class="ml-route on"><p class="ml-route-h">Your route, ' + stops.length + ' stops</p><p class="meta">Nearest first, starting downtown. A suggestion, not traffic-aware.</p>' +
            '<div class="mc-acts"><a class="btn sm" href="' + routeUrl(stops) + '" target="_blank" rel="noopener">' + icon("i-turn") + 'Open in Google Maps<span class="sr"> (new tab)</span></a><button class="btn ghost sm" type="button" data-route-toggle aria-pressed="true">Hide route</button></div>' +
            (noAddr.length ? '<p class="meta">' + esc(noAddr.map(function (p) { return p.name; }).join(", ")) + " has no street address on file, so it's left out.</p>" : "") + "</div>";
        } else if (pool.length) {
          html += '<div class="ml-route"><p class="ml-route-h">Make a night of it</p><p class="meta">' + (stops.length > 1 ? "Draw a route through your " + stops.length + " saved places, then open it in Google Maps." : "Save two or more places with an address to plan a route.") + "</p>" +
            '<button class="btn sm" type="button" data-route-toggle aria-pressed="false"' + (stops.length > 1 ? "" : " disabled") + ">" + icon("i-map") + "Plan a route</button></div>";
        }
      } else pool = sortPlaces(pool);
      if (!pool.length) {
        list.innerHTML = '<p class="empty-map body">' + (mode === "saved" ? "Nothing saved yet. Tap Save on any place and it shows up here." : "Nothing here yet.") + "</p>";
        return;
      }
      var stopN = {};
      if (routeOn && mode === "saved") routeStops().forEach(function (p, i) { stopN[p.id] = i + 1; });
      list.innerHTML = html + pool.map(function (p) {
        var lead = stopN[p.id] ? '<span class="ml-stop" aria-label="Stop ' + stopN[p.id] + '">' + stopN[p.id] + "</span>" : '<span class="sw sw-' + area(p).siding + '"></span>';
        return '<button class="ml-item' + (selected === p.id ? " sel" : "") + '" type="button" data-id="' + p.id + '"' + (selected === p.id ? ' aria-current="true"' : "") + ">" + lead + '<span class="ml-t"><span class="ml-name">' + esc(p.name) + '</span><span class="meta">' + esc(address(p)) + ", " + esc(area(p).name) + "</span></span>" + tinaLabel(p) + "</button>";
      }).join("");
    }

    /* -- preview on hover and focus -- */
    function showTip(el) {
      var key = keyOf(el);
      if (key === "p:" + selected) { hideTip(); return; }
      tipKey = key;
      if (el.__g && el.__g.ids.length > 1) {
        var g = el.__g, names = g.ids.map(function (id) { return byId[id].name; });
        tip.innerHTML = "<b>" + g.ids.length + " places in " + esc(clusterName(g)) + "</b><span>" + esc(names.slice(0, 4).join(", ") + (names.length > 4 ? " and " + (names.length - 4) + " more" : "")) + '</span><span class="tip-act">Click to zoom in</span>';
      } else {
        var p = byId[el.getAttribute("data-id")];
        tip.innerHTML = "<b>" + esc(p.name) + "</b><span>" + esc(address(p) + ", " + area(p).name) + '</span><span class="tip-act' + (p.tina ? " t" : "") + '">' + (p.tina ? "Tina ate here, " + esc(p.tina.date) : "Tina hasn't been yet") + "</span>" +
          (isOn(p) ? "" : '<span class="tip-act">' + (filter && !filter[p.id] ? "Doesn't match your sentence." : "Not in this tab.") + " Click to see it anyway.</span>");
      }
      tip.hidden = false;
      placeTip();
    }
    function placeTip() {
      var el = tipKey && (tipKey.indexOf("c:") === 0 ? clusterEl[tipKey] : pinEl[tipKey.slice(2)]);
      if (!el || el.classList.contains("pin-hidden")) { hideTip(); return; }
      var c = centerOf(el), r = el.__g && el.__g.ids.length > 1 ? el.__g.r : 14;
      var below = c.y - r - 70 < 0;
      tip.classList.toggle("below", below);
      tip.style.left = Math.max(100, Math.min(cw() - 100, c.x)) + "px";
      tip.style.top = (below ? c.y + r + 10 : c.y - r - 10) + "px";
    }
    function hideTip() { tipKey = null; tip.hidden = true; }
    var hotId = null;
    function hot(id) {
      hotId = id;
      mapped.forEach(function (p) { pinEl[p.id].classList.toggle("hot", p.id === id); });
      Object.keys(clusterEl).forEach(function (key) { clusterEl[key].classList.toggle("hot", !!id && clusterEl[key].__g.ids.indexOf(id) > -1); });
    }

    /* -- pointer: drag to pan, pinch and Ctrl+wheel to zoom, double-click to zoom in -- */
    var ptrs = {}, drag = null, pinch = null, suppressClick = false;
    function nPtrs() { return Object.keys(ptrs).length; }
    function rel(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    svg.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      ptrs[e.pointerId] = rel(e);
      if (nPtrs() === 1) drag = { p: rel(e), v: { x: v.x, y: v.y, w: v.w }, moved: false, id: e.pointerId };
      if (nPtrs() === 2) {
        var ks = Object.keys(ptrs), a = ptrs[ks[0]], b = ptrs[ks[1]];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, m: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, v: { x: v.x, y: v.y, w: v.w } };
        drag = null;
        try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      }
    });
    svg.addEventListener("pointermove", function (e) {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = rel(e);
      if (pinch && nPtrs() >= 2) {
        var ks = Object.keys(ptrs), a = ptrs[ks[0]], b = ptrs[ks[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        var u0 = pinch.v.w / cw(), ax = pinch.v.x + pinch.m.x * u0, ay = pinch.v.y + pinch.m.y * u0;
        var w = pinch.v.w * pinch.d / d, u = w / cw();
        if (anim) { cancelAnimationFrame(anim); anim = null; }
        apply({ x: ax - m.x * u, y: ay - m.y * u, w: w });
        setJump(null); hideTip(); suppressClick = true;
        return;
      }
      if (!drag || drag.id !== e.pointerId) return;
      var p = rel(e), dx = p.x - drag.p.x, dy = p.y - drag.p.y;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 6) return;
        if (e.pointerType === "touch" && kOf(v) <= 1.02) { drag = null; return; }
        drag.moved = true;
        canvas.classList.add("dragging");
        hideTip();
        if (anim) { cancelAnimationFrame(anim); anim = null; }
        try { svg.setPointerCapture(e.pointerId); } catch (x) {}
      }
      var u2 = drag.v.w / cw();
      apply({ x: drag.v.x - dx * u2, y: drag.v.y - dy * u2, w: drag.v.w });
      setJump(null);
    });
    function endPtr(e) {
      if (!ptrs[e.pointerId]) return;
      delete ptrs[e.pointerId];
      if (nPtrs() < 2) pinch = null;
      if (drag && drag.moved && drag.id === e.pointerId) { suppressClick = true; setTimeout(function () { suppressClick = false; }, 60); }
      if (!nPtrs()) { drag = null; canvas.classList.remove("dragging"); if (suppressClick) setTimeout(function () { suppressClick = false; }, 60); }
    }
    svg.addEventListener("pointerup", endPtr);
    svg.addEventListener("pointercancel", endPtr);
    svg.addEventListener("click", function (e) { if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; } }, true);
    var hintTimer;
    svg.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        var p = rel(e), dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        zoomBy(Math.exp(-dy * .004), p.x, p.y, false);
        hideTip();
      } else {
        hint.classList.add("show");
        clearTimeout(hintTimer);
        hintTimer = setTimeout(function () { hint.classList.remove("show"); }, 1400);
      }
    }, { passive: false });
    svg.addEventListener("dblclick", function (e) {
      if (e.target.closest(".pin, .cluster, .district, .town-off")) return;
      e.preventDefault();
      var p = rel(e);
      zoomBy(2, p.x, p.y, true);
    });
    svg.addEventListener("pointerover", function (e) {
      if (e.pointerType === "touch" || drag && drag.moved) return;
      var el = e.target.closest(".pin, .cluster");
      if (el) showTip(el);
    });
    svg.addEventListener("pointerout", function (e) {
      var el = e.target.closest(".pin, .cluster");
      if (el && !el.contains(e.relatedTarget) && document.activeElement !== el) hideTip();
    });
    svg.addEventListener("focusin", function (e) {
      var el = e.target.closest(".pin, .cluster");
      if (!el) return;
      rove = keyOf(el); setRove();
      showTip(el);
      var c = centerOf(el);
      if (c.x < 20 || c.y < 70 || c.x > cw() - 70 || c.y > ch() - 20) {
        var u = v.w / cw(), p = el.__g || byId[el.getAttribute("data-id")];
        animateTo({ x: p.x - cw() / 2 * u, y: p.y - ch() / 2 * u, w: v.w }, null, 260);
      }
    });
    svg.addEventListener("focusout", function (e) { if (!svg.contains(e.relatedTarget)) hideTip(); });

    /* -- clicks -- */
    root.addEventListener("click", function (e) {
      var t = e.target.closest(".tabs button");
      if (t) {
        mode = t.getAttribute("data-mode");
        $$(".tabs button", root).forEach(function (b) { b.setAttribute("aria-pressed", b === t); });
        if (mode !== "saved") routeOn = false;
        if (selected && !inView(byId[selected])) { selected = null; showCard(null); setParam(null); }
        update();
        if (mode === "saved") { var sp = mapped.filter(isOn); if (sp.length) { setJump(null); animateTo(viewForBox(boxOf(sp), 3)); } }
        var n = mapped.filter(isOn).length;
        say((mode === "tina" ? "Tina's picks" : mode === "all" ? "Everywhere" : "Saved") + ": " + n + (n === 1 ? " place" : " places") + " on the map.");
        return;
      }
      if (e.target.closest("[data-route-toggle]")) {
        routeOn = !routeOn;
        update();
        if (routeOn) { setJump(null); animateTo(viewForBox(boxOf(routeStops(), 30), 3)); say("Route drawn through " + routeStops().length + " saved places."); var rb = $("[data-route-toggle]", list); if (rb) rb.focus(); }
        return;
      }
      var z = e.target.closest("[data-zoom]");
      if (z) {
        var how = z.getAttribute("data-zoom");
        if (how === "fit") { fitAll(); say("Showing everything."); } else zoomBy(how === "in" ? 1.7 : 1 / 1.7, null, null, true);
        return;
      }
      var j = e.target.closest("[data-jump]");
      if (j) { jumpTo(j.getAttribute("data-jump")); return; }
      if (e.target.closest("[data-mc-close]")) { clearSelection(); return; }
      var pin = e.target.closest(".pin");
      if (pin) { hideTip(); select(pin.getAttribute("data-id")); return; }
      var cl = e.target.closest(".cluster");
      if (cl) { hideTip(); openCluster(cl, e.detail === 0); return; }
      /* a click on the map near a pin or cluster opens that, rather than the block underneath */
      if (svg.contains(e.target) && e.clientX) {
        var near = nearestItem(e.clientX, e.clientY, 26);
        if (near) {
          hideTip();
          if (near.classList.contains("cluster")) openCluster(near, false); else select(near.getAttribute("data-id"));
          return;
        }
      }
      var dist = e.target.closest(".district");
      if (dist) {
        var ak = dist.getAttribute("data-area");
        if (jumped === ak) { say("Already showing " + D.areas[ak].name + ". Pick a pin to open a place."); return; }
        jumpTo(ak);
        return;
      }
      var town = e.target.closest(".town-off");
      if (town) { townCard(town.getAttribute("data-town")); return; }
      var it = e.target.closest(".ml-item");
      if (it) select(it.getAttribute("data-id"), { fromList: true, zoom: kOf(v) < 1.8 });
    });

    function nearestItem(cx, cy, maxPx) {
      var best = null, bd = maxPx;
      $$(".pin:not(.pin-hidden), .cluster", svg).forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (!r.width) return;
        var d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
        if (d < bd) { bd = d; best = el; }
      });
      return best;
    }

    /* -- keyboard -- */
    root.addEventListener("keydown", function (e) {
      if (e.target.closest(".map-jump, .maplist, .mapcard input")) return;
      var inMap = canvas.contains(e.target);
      if (!inMap) return;
      var item = e.target.closest && e.target.closest(".pin, .cluster");
      if (e.key === "Escape" && !card.hidden) {
        e.preventDefault();
        var was = selected;
        clearSelection();
        if (was && pinEl[was]) pinEl[was].focus({ preventScroll: true });
        return;
      }
      if (e.target.closest(".mapcard")) return;
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(1.7, null, null, true); return; }
      if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(1 / 1.7, null, null, true); return; }
      if (e.key === "0") { e.preventDefault(); fitAll(); return; }
      if (!item) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (item.classList.contains("cluster")) openCluster(item, true);
        else select(item.getAttribute("data-id"), { focusPin: true });
        return;
      }
      var dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
      if (!dir) return;
      e.preventDefault();
      var c0 = centerOf(item), best = null, bs = Infinity;
      focusables().forEach(function (el) {
        if (el === item) return;
        var c = centerOf(el), dx = c.x - c0.x, dy = c.y - c0.y;
        var along = dx * dir[0] + dy * dir[1], across = Math.abs(dx * dir[1] + dy * dir[0]);
        if (along <= 2) return;
        var s = along + across * 2.2;
        if (s < bs) { bs = s; best = el; }
      });
      if (best) { rove = keyOf(best); setRove(); best.focus({ preventScroll: true }); }
      else { var u = v.w / cw(); animateTo({ x: v.x + dir[0] * cw() * .3 * u, y: v.y + dir[1] * ch() * .3 * u, w: v.w }, null, 200); }
    });

    root.addEventListener("mouseover", function (e) {
      var it = e.target.closest(".ml-item");
      if (it) hot(it.getAttribute("data-id"));
      else if (!e.target.closest("svg")) hot(null);
    });
    root.addEventListener("mouseleave", function () { hot(null); });

    if (window.ResizeObserver) {
      var lastW = canvas.clientWidth, lastH = canvas.clientHeight;
      new ResizeObserver(function () {
        var W = canvas.clientWidth, H = canvas.clientHeight;
        if (W === lastW && H === lastH) return;
        var wasHidden = !lastW || !lastH;
        lastW = W; lastH = H;
        if (!W || !H) return;
        if (wasHidden) { homeView(); return; }
        var w = fitW() / kNow;
        apply({ x: cNow.x - w / 2, y: cNow.y - w / asp() / 2, w: w });
      }).observe(canvas);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { labelW = {}; layout(); });

    homeView();
    setJump(cw() < 560 ? null : "all");
    update();

    var onSelect = null;
    var api = {
      refresh: function () { update(); if (selected) showCard(byId[selected]); },
      select: function (id, opts) { select(id, opts || { zoom: true }); },
      setFilter: function (ids, fit) {
        filter = null;
        if (ids) { filter = {}; ids.forEach(function (id) { filter[id] = true; }); }
        if (selected && !inView(byId[selected])) { selected = null; showCard(null); setParam(null); }
        update();
        if (fit) {
          var ps = mapped.filter(isOn);
          if (!ps.length || ps.length === mapped.length) fitAll(); else { animateTo(viewForBox(boxOf(ps), 3.2)); setJump(null); }
        }
      },
      hot: hot,
      onSelect: function (fn) { onSelect = fn; },
      root: root
    };
    mapApi.push(api);
    return api;
  }
  $$("[data-map]").forEach(initMap);
  (function () {
    var id = null;
    try { id = new URL(location.href).searchParams.get("pin"); } catch (e) {}
    if (id && byId[id] && mapApi[0]) {
      setTimeout(function () {
        mapApi[0].root.scrollIntoView({ block: "center" });
        mapApi[0].select(id, { zoom: true });
      }, 80);
    }
  })();

  /* ---------- Watch + Eat ---------- */
  var watch = $("[data-watch]");
  if (watch) {
    var ol = $(".onscreen", watch), thumbs = $$("[data-video]", watch), scrubB = $(".scrub b", watch), scrubI = $(".scrub i", watch);
    var cur = 0, vid = D.videos[0];
    function renderVideo(v) {
      vid = v;
      $("[data-reel-tag]", watch).textContent = "Tina's TikTok, " + v.date;
      $("[data-reel-title]", watch).textContent = "Video: " + v.title;
      var ph = $("[data-reel-frame]", watch), fr = $(".tt-frame", ph);
      ph.classList.add("has-video");
      if (fr) fr.remove();
      ph.insertAdjacentHTML("beforeend", tiktokFrame(v.url, "Tina's TikTok: " + v.title));
      $(".reel", watch).classList.add("has-video");
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

  /* ---------- guides (guide.html?g=<id>) ---------- */
  function param(k) { try { return new URL(location.href).searchParams.get(k); } catch (e) { return null; } }
  function guideById(id) { return (D.guides || []).filter(function (g) { return g.id === id; })[0]; }
  var routeEl = $("ol.route[data-guide]");
  if (routeEl && D.guides) {
    var G = guideById(param("g")) || guideById(routeEl.getAttribute("data-guide")) || D.guides[0];
    var head = $("header.field"), dark = G.siding === "mustard";
    head.className = "field f-" + G.siding + " clap" + (dark ? " g-dark" : "");
    var logo = $(".logo", head);
    if (logo) logo.classList.toggle("light", !dark);
    $$(".top-r .iconbtn", head).forEach(function (b) { b.style.borderColor = b.style.color = dark ? "var(--asphalt)" : "var(--trim)"; });
    document.title = G.title + " — Live to Eat Food";
    var soft = dark ? "var(--mustard-ink)" : "#F3E1DA", notePlace = G.note && byId[G.note.place];
    $(".g-hero", head).innerHTML = '<div><h1 class="d-xl">' + esc(G.title) + '</h1><p class="lede" style="margin-top:24px;color:' + soft + '">' + esc(G.lede) + "</p></div>" +
      '<div style="display:grid;gap:14px;justify-items:start">' +
      (notePlace ? '<p class="note" style="font-size:24px">' + esc(G.note.text) + '<small><a href="' + notePlace.tina.url + '">Tina on ' + esc(notePlace.tina.platform) + ", " + esc(notePlace.tina.date) + "</a></small></p>" : "") +
      '<p class="meta" style="color:' + soft + ';margin:0">' + esc(G.meta) + "</p>" +
      '<p class="progress" data-progress></p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn ' + (dark ? "" : "light") + '" href="explore.html?guide=' + G.id + '#map">' + icon("i-map") + 'See them on the map</a><button class="btn ghost" type="button" data-share>Send to a friend</button></div></div>';
    var stops = G.stops.filter(function (st) { return st.sponsor || byId[st.place]; });
    routeEl.innerHTML = stops.map(function (st, i) {
      var last = i === stops.length - 1 ? ' style="padding-bottom:0"' : "";
      if (st.sponsor) {
        return '<li class="stop sponsor"><div class="pin"><span class="plate light" style="border:2px solid var(--asphalt)"><span class="n">$</span></span></div>' +
          '<div class="window" style="background:var(--trim)"><div class="ph t-room ratio-43"><span class="tag">Sponsor photo</span><p class="cap"><b>Advertiser\'s image</b>Supplied by the sponsor, labeled as theirs.</p></div></div>' +
          '<div class="info"><span class="lbl sponsored">Sponsored</span><h2 class="d-m" style="margin-top:14px">[Sponsor name]</h2><p class="body" style="margin:10px 0 0">A paid placement between stops. It is not on Tina\'s route and never gets her handwriting.</p>' +
          '<p style="margin:16px 0 0"><a class="btn ghost sm" href="owners.html#advertise">How sponsored stops work</a></p></div></li>';
      }
      var p = byId[st.place], a = area(p), key = (D.placePhoto || {})[p.id];
      var quote = p.tina && !p.tina.noQuote ? '<p class="hand" style="font-size:24px;margin:0 0 12px">' + esc(p.tina.quote) + "</p>" : "";
      var links = [];
      if (p.tina) links.push('<a href="' + p.tina.url + '">' + (p.tina.platform === "TikTok" ? "Tina\'s video" : "Tina on " + esc(p.tina.platform)) + "</a>");
      if (tinaExtra(p)) links.push(tinaExtra(p));
      if (p.num) links.push('<a href="' + directionsUrl(p) + '" target="_blank" rel="noopener">Directions</a>');
      links.push('<a href="' + placeHref(p) + '">' + (p.page ? "Full place page" : "On Explore") + "</a>");
      return '<li class="stop"' + last + ' id="stop-' + p.id + '"><div class="pin"><span class="plate"><span class="n">' + esc(p.num || "—") + "</span></span></div>" +
        '<div class="window" style="background:var(--trim-2)"><div class="ph ' + p.tone + ' ratio-32"' + (key ? ' data-photo="' + key + '" data-place="' + p.id + '"' : "") + '><p class="cap"><b>' + esc(p.dish) + "</b></p></div></div>" +
        '<div class="info"><h2 class="d-m"><a href="' + placeHref(p) + '" style="text-decoration:none">' + esc(p.name) + "</a></h2>" +
        '<p class="meta" style="margin:0">' + esc(address(p) + ", " + a.name) + (st.extra ? ". " + esc(st.extra) : "") + "</p>" +
        '<div class="labels">' + tinaLabel(p) + "</div>" + quote +
        '<p class="body" style="margin:0">' + esc(st.say) + "</p>" +
        '<p class="meta" style="margin:12px 0 0">' + links.join(" &middot; ") + "</p>" +
        '<p style="margin:16px 0 0;display:flex;gap:8px;flex-wrap:wrap"><button class="tried" type="button" data-tried="' + p.id + '" aria-pressed="false"><span class="box" aria-hidden="true"></span><span class="tried-label">I\'ve been here</span></button>' + saveBtn(p) + "</p></div></li>";
    }).join("");
    hydratePhotos(routeEl);
    var nextSec = $("[data-next-guide]");
    if (nextSec) {
      var gi = D.guides.indexOf(G), N = D.guides[(gi + 1) % D.guides.length];
      nextSec.innerHTML = '<div><h2 class="d-m">Next guide: ' + esc(N.short) + '</h2><p class="meta" style="margin:8px 0 0">' + esc(N.meta) + '</p></div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="guide.html?g=' + N.id + '">Open the guide</a><a class="btn ghost" href="guides.html">Every guide</a></div>';
    }
    syncSaves();
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
        (p.tina && !p.tina.noQuote ? '<p class="hand ex-q">' + esc(p.tina.quote) + '</p><p class="meta"><a href="' + p.tina.url + '">Tina on ' + esc(p.tina.platform) + ", " + esc(p.tina.date) + "</a>" + (tinaExtra(p) ? " &middot; " + tinaExtra(p) : "") + "</p>"
          : '<p class="ex-fact">' + tinaLabel(p) + (p.facts && p.facts[0] ? " <span class=\"body\">" + esc(p.facts[0]) + "</span>" : "") + "</p>") +
        '</div><div class="ex-acts">' + saveBtn(p, "btn ghost sm") + '<button class="btn sm" type="button" data-show-on-map="' + p.id + '">' + icon("i-map") + "On the map</button></div></article>";
    }
    function draw() {
      var l = sortPlaces(lastList, sortSel.value);
      countEl.textContent = l.length + (l.length === 1 ? " place" : " places");
      res.innerHTML = l.length ? l.map(row).join("") : '<div class="empty"><p class="d-s">Nothing on this street yet.</p><p class="body">Try a different craving, or switch on places Tina hasn\'t been to.</p></div>';
      syncSaves();
    }
    var exMap = mapApi[0], firstDraw = true, onlyGuide = guideById(param("guide"));
    var guideNote = $("[data-guide-note]", exp);
    function guideIds(g) { return g.stops.filter(function (st) { return st.place; }).map(function (st) { return st.place; }); }
    function showGuideNote() {
      if (!guideNote) return;
      guideNote.hidden = !onlyGuide;
      if (onlyGuide) guideNote.innerHTML = '<span>Showing the ' + guideIds(onlyGuide).length + ' places in <a href="guide.html?g=' + onlyGuide.id + '">' + esc(onlyGuide.title) + '</a>.</span><button class="linkish" type="button" data-clear-guide>Show every place</button>';
    }
    showGuideNote();
    var craveApi = null;
    exp.addEventListener("click", function (e) {
      if (!e.target.closest("[data-clear-guide]")) return;
      onlyGuide = null; showGuideNote();
      try { var u = new URL(location.href); u.searchParams.delete("guide"); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (x) {}
      if (craveApi) craveApi.refresh();
    });
    craveApi = initCrave($("[data-crave='explore']"), function (st, list) {
      if (onlyGuide) { var ids = guideIds(onlyGuide); list = list.filter(function (p) { return ids.indexOf(p.id) > -1; }); }
      lastList = list;
      draw();
      if (exMap) exMap.setFilter(list.map(function (p) { return p.id; }), !firstDraw || !!onlyGuide);
      firstDraw = false;
    });
    sortSel.addEventListener("change", draw);
    function markRow(id) {
      $$(".exrow.on-map", res).forEach(function (r) { r.classList.remove("on-map"); });
      var r = document.getElementById(id);
      if (r) r.classList.add("on-map");
      return r;
    }
    if (exMap) {
      exMap.onSelect(function (id) {
        var r = markRow(id);
        if (r && !document.body.classList.contains("show-map") && window.innerWidth > 1100) r.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
      });
      res.addEventListener("mouseover", function (e) { var r = e.target.closest(".exrow"); exMap.hot(r ? r.id : null); });
      res.addEventListener("mouseleave", function () { exMap.hot(null); });
      res.addEventListener("focusin", function (e) { var r = e.target.closest(".exrow"); exMap.hot(r ? r.id : null); });
    }
    exp.addEventListener("click", function (e) {
      var b = e.target.closest("[data-show-on-map]");
      if (!b || !exMap) return;
      var p = byId[b.getAttribute("data-show-on-map")];
      if (p.x == null) { toast("No street address on file for " + p.name + " yet."); return; }
      document.body.classList.add("show-map");
      $$("[data-view]").forEach(function (v) { v.setAttribute("aria-pressed", v.getAttribute("data-view") === "map"); });
      $("[data-map]").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      setTimeout(function () { exMap.select(p.id, { zoom: true, focusPin: true }); }, reduceMotion ? 0 : 250);
    });
    window.addEventListener("hashchange", function () {
      var el = document.getElementById(location.hash.slice(1));
      if (el && el.classList.contains("exrow")) {
        document.body.classList.remove("show-map");
        $$("[data-view]").forEach(function (v) { v.setAttribute("aria-pressed", v.getAttribute("data-view") === "list"); });
        el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      }
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
    var shown = 0, BATCH = 12;
    function postHtml(p) {
      return '<article class="post">' +
        (tiktokId(p.tina.url) ? '<div class="ph ' + p.tone + ' ratio-916 has-video">' + tiktokFrame(p.tina.url, "Tina's TikTok at " + p.name) + "</div>"
          : '<a class="ph ' + p.tone + ' ratio-916" href="' + p.tina.url + '"><span class="tag">' + esc(p.tina.platform) + ", " + esc(p.tina.date) + '</span><span class="post-play" aria-hidden="true"><svg><use href="#i-play"></use></svg></span><span class="sr">Watch Tina\'s ' + esc(p.name) + " video</span></a>") +
        '<p class="note flat">' + esc(p.tina.quote) + "</p>" +
        '<p class="post-place"><b>' + esc(p.name) + '</b><span class="meta">' + esc(address(p)) + ", " + esc(area(p).name) + ". " + esc(p.tina.date) + "</span>" + tinaExtra(p) + "</p>" +
        '<div class="post-acts">' + (p.num ? getThere(p, "door-go") : "") + saveBtn(p, "mini") + "</div></article>";
    }
    var nextCard = '<article class="post post-next f-mustard clap"><p class="d-s">Where should she go next?</p><p class="body">Tell her about the place you keep telling everyone about.</p><a class="btn sm" href="index.html#street-sec">Suggest a place</a></article>';
    var more = document.createElement("p");
    more.className = "feed-more";
    feed.after(more);
    function showMore(focusFirst) {
      var next = posts.slice(shown, shown + BATCH);
      var nc = $(".post-next", feed);
      if (nc) nc.remove();
      feed.insertAdjacentHTML("beforeend", next.map(postHtml).join("") + (shown + next.length >= posts.length ? nextCard : ""));
      if (focusFirst) { var firstNew = $$(".post", feed)[shown]; var lnk = firstNew && $("a, button", firstNew); if (lnk) lnk.focus(); }
      shown += next.length;
      more.innerHTML = shown < posts.length ? '<button class="btn" type="button" data-feed-more>Show ' + Math.min(BATCH, posts.length - shown) + " more of her " + posts.length + " places</button>" : '<span class="meta">That\'s all ' + posts.length + " places she\'s posted from on the site. Her full feed is on <a href=\"https://www.tiktok.com/@livetoeatfoodie\">TikTok</a>.</span>";
      syncSaves();
    }
    more.addEventListener("click", function (e) { if (e.target.closest("[data-feed-more]")) showMore(true); });
    showMore(false);
  }

  /* ---------- concept forms (About, For restaurants) ---------- */
  $$("select[data-place-select]").forEach(function (sel) {
    var want = param("place");
    sortPlaces(D.places, "az").forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.id; o.textContent = p.name + ", " + address(p);
      if (p.id === want) o.selected = true;
      sel.appendChild(o);
    });
  });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("form[data-concept]");
    if (!f) return;
    e.preventDefault();
    var err = $(".cf-err", f), bad = null;
    $$("[required]", f).forEach(function (el) { el.removeAttribute("aria-invalid"); if (!bad && !String(el.value).trim()) bad = el; });
    var em = $('input[type="email"]', f);
    if (!bad && em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) bad = em;
    if (bad) {
      var lbl = $('label[for="' + bad.id + '"]', f);
      err.textContent = (bad === em ? "That email is missing something. Try name@example.com." : (lbl ? lbl.firstChild.textContent.trim() : "This field") + " is needed.");
      err.hidden = false;
      bad.setAttribute("aria-invalid", "true");
      bad.focus();
      return;
    }
    var done = document.createElement("div");
    done.className = "signed";
    done.setAttribute("role", "status");
    done.innerHTML = "<p><b>" + esc(f.getAttribute("data-thanks") || "Thanks.") + "</b></p><p class=\"meta\" style=\"margin:0\">Concept: nothing was sent.</p>";
    f.replaceWith(done);
  });
  if (location.hash) { var tgt = document.getElementById(location.hash.slice(1)); if (tgt && tgt.tagName === "SECTION") setTimeout(function () { tgt.scrollIntoView(); }, 30); }

  /* ---------- guides index ---------- */
  var gl = $("[data-guide-lists]");
  if (gl && D.guides) {
    gl.innerHTML = D.guides.map(function (g) {
      return '<div class="gl"><h3 class="d-s"><a href="guide.html?g=' + g.id + '">' + esc(g.title) + '</a></h3><p class="meta">' + esc(g.meta) + "</p><ol>" +
        g.stops.filter(function (st) { return st.place && byId[st.place]; }).map(function (st) { var p = byId[st.place]; return "<li>" + plate(p) + '<a href="' + placeHref(p) + '">' + esc(p.name) + "</a> " + tinaLabel(p) + "</li>"; }).join("") + "</ol></div>";
    }).join("");
  }

  syncSaves();
})();
