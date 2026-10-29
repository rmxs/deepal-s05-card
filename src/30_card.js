/* ───────────────────────── Κάρτα ───────────────────────── */
const RING = '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><rect x="2.5" y="2.5" width="95" height="95" rx="47.5" pathLength="100"/></svg>';
const REBUILD_KEYS = ["image_path", "layers_path", "images", "name", "image_scale", "image_aspect", "prefix", "entities"];
const normPath = (p) => (p ? (p.endsWith("/") ? p : p + "/") : p);

/* Συγχώνευση: προεπιλογές < YAML κάρτας < τοπικές ρυθμίσεις συσκευής */
function mergeConfig(yaml, local) {
  const y = { ...(yaml || {}) };
  // συμβατότητα με παλιές εκδόσεις (v0.1–0.3)
  if (y.diagnostics !== undefined && y.diag === undefined) y.diag = y.diagnostics;
  if (y.diagnostics_mode !== undefined && y.diag_mode === undefined) y.diag_mode = y.diagnostics_mode;
  if (y.button_labels === true) y.button_labels = "status";
  if (y.button_labels === false) y.button_labels = "none";
  const c = { ...clone(DEFAULTS), ...y, ...(local || {}) };
  c.images = { ...((yaml || {}).images || {}), ...((local || {}).images || {}) };
  c.entities = { ...((yaml || {}).entities || {}), ...((local || {}).entities || {}) };
  c.confirm = Array.isArray(c.confirm) ? c.confirm : DEFAULTS.confirm;
  const fix = (arr, all) => {
    const a = uniq((Array.isArray(arr) ? arr : []).filter((x) => all.includes(x)));
    return [...a, ...all.filter((x) => !a.includes(x))];
  };
  c.order = fix(c.order, SECTIONS);
  c.buttons = fix(c.buttons, BUTTON_IDS);
  c.hidden = (c.hidden || []).filter((x) => SECTIONS.includes(x));
  c.buttons_hidden = (c.buttons_hidden || []).filter((x) => BUTTON_IDS.includes(x));
  return c;
}

class DeepalS05Card extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }); I18N.watch(this.shadowRoot);
    this._pending = {}; this._flashes = {}; this._opt = {}; this._last = {};
    this._toastState = null; this._confirm = null; this._customize = false; this._diagSheet = false;
    this._sig = null; this._built = false; this._stab = "vehicle";
  }

  static getStubConfig() { return { type: `custom:${TAG}`, prefix: "s05", name: "Deepal S05" }; }
  static getConfigElement() { return document.createElement(EDITOR_TAG); }

  setConfig(config) {
    if (!config) throw new Error("Λείπει το config");
    this._yaml = config;
    this._local = onlySettings(lsRead(this._lsKey()));
    this._c = mergeConfig(config, this._local);
    this._last = lsRead(`deepal-s05-last:${this._c.prefix}`) || {};
    this._built = false; this._sig = null; this._remoteLoaded = false;
    if (!this._uiDone) { this._uiDone = true; this._uiRestore(); }
    if (this._hass) this._render();
  }
  set hass(hass) {
    this._hass = hass;
    this._syncLang();
    if (this._c && !this._remoteLoaded && hass && typeof hass.callWS === "function") { this._remoteLoaded = true; this._loadRemote(); }
    if (this._c) this._render();
  }
  _syncLang() {
    const l = this._c && this._c.language && this._c.language !== "auto" ? this._c.language : this._hass?.locale?.language || this._hass?.language || "en";
    I18N.request(l);
  }
  connectedCallback() {
    I18N.subs.add(this);
    if (!this._onKey) this._onKey = (e) => this._key(e);
    document.addEventListener("keydown", this._onKey, true);
    if (window.IntersectionObserver && !this._io) { this._io = new IntersectionObserver(([e]) => { if (this._el && this._el.card) this._el.card.classList.toggle("off", !e.isIntersecting); }); this._io.observe(this); }
  }
  disconnectedCallback() { I18N.subs.delete(this); if (this._onKey) document.removeEventListener("keydown", this._onKey, true); if (this._yPend) { this._yPend = false; this._customize = false; this._doSaveYaml(); } if (this._io) { this._io.disconnect(); this._io = null; } }
  getCardSize() { return 9; }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  /* ───── ρυθμίσεις (αποθηκεύονται στη συσκευή) ───── */
  /* Μετά την αποθήκευση στο YAML το HA ξαναχτίζει την κάρτα· κρατάμε το ανοιχτό παράθυρο ρυθμίσεων για να ξανανοίξει */
  _uiKey() { return `deepal-s05-ui:${(this._yaml && this._yaml.prefix) || DEFAULTS.prefix}`; }
  _uiSave() {
    try {
      if (!this._customize) { sessionStorage.removeItem(this._uiKey()); return; }
      sessionStorage.setItem(this._uiKey(), JSON.stringify({ t: Date.now(), tab: this._stab, sc: this._el && this._el.box ? this._el.box.scrollTop : 0 }));
    } catch (_) {}
  }
  _uiRestore() {
    try {
      const v = JSON.parse(sessionStorage.getItem(this._uiKey()) || "null");
      if (v && Date.now() - v.t < 30000) { this._customize = true; this._stab = v.tab || "sections"; this._restoreSc = v.sc || 0; }
      sessionStorage.removeItem(this._uiKey());
    } catch (_) {}
  }
  _lsKey() { return `deepal-s05-card:${(this._yaml && this._yaml.prefix) || DEFAULTS.prefix}`; }
  _patch(p) {
    this._local = { ...(this._local || {}), ...p };
    lsWrite(this._lsKey(), this._local); this._saveYaml(); this._uiSave();
    const rebuild = Object.keys(p).some((k) => REBUILD_KEYS.includes(k));
    this._c = mergeConfig(this._yaml, this._local);
    if (rebuild) this._built = false;
    this._force();
  }
  _resetLocal() { this._local = {}; lsWrite(this._lsKey(), null); this._c = mergeConfig(this._yaml, {}); this._built = false; this._saveYaml(true); this._force(); }

  /* ───── αποθήκευση στο YAML του dashboard (κοινές ρυθμίσεις παντού) ───── */
  _saveYaml(reset) {
    clearTimeout(this._yT);
    if (reset) this._yReset = true;
    if (this._customize) { this._yPend = true; this._saveRemote(); return; } /* όσο είναι ανοιχτές οι ρυθμίσεις δεν γράφουμε στο YAML (προκαλεί επαναφόρτωση του dashboard) */
    this._yT = setTimeout(() => this._doSaveYaml(), 1200);
  }
  async _doSaveYaml() {
    if (this._ySaving) { this._yAgain = true; return; }
    const hass = this._hass; if (!hass || typeof hass.callWS !== "function" || !this._yaml) return;
    this._ySaving = true;
    const snap = this._local || {}, reset = this._yReset; this._yReset = false;
    try {
      if (hass.user && hass.user.is_admin === false) throw new Error("not admin");
      const seg = location.pathname.split("/")[1] || "lovelace", urlPath = seg === "lovelace" ? null : seg;
      const cfg = await hass.callWS({ type: "lovelace/config", url_path: urlPath, force: true });
      const found = [], visit = (o) => { if (Array.isArray(o)) o.forEach(visit); else if (o && typeof o === "object") { if (o.type === `custom:${TAG}`) found.push(o); Object.values(o).forEach(visit); } };
      visit(cfg);
      const px = this._yaml.prefix || DEFAULTS.prefix, mine = found.filter((f) => (f.prefix || DEFAULTS.prefix) === px);
      const target = mine.find((f) => JSON.stringify(f) === JSON.stringify(this._yaml)) || (mine.length === 1 ? mine[0] : null);
      if (!target) throw new Error("card not found");
      if (reset) { const keep = { type: target.type, prefix: target.prefix, name: target.name }; Object.keys(target).forEach((k) => delete target[k]); Object.assign(target, keep); }
      Object.assign(target, snap);
      this._uiSave();
      await hass.callWS({ type: "lovelace/config/save", url_path: urlPath, config: cfg });
      this._yaml = { ...target };
      for (const k of Object.keys(snap)) if (JSON.stringify((this._local || {})[k]) === JSON.stringify(snap[k])) delete this._local[k];
      lsWrite(this._lsKey(), Object.keys(this._local || {}).length ? this._local : null);
      this._c = mergeConfig(this._yaml, this._local);
      this._yamlErr = false;
      this._saveRemote();
    } catch (err) {
      this._saveRemote();
      if (!this._yamlErr) { this._yamlErr = true; this._toast("Δεν γράφτηκε στο YAML του dashboard (θέλει διαχειριστή και dashboard που να επεξεργάζεται από το UI) — αποθηκεύτηκε στον λογαριασμό σου", "error"); }
    }
    this._ySaving = false;
    if (this._yAgain) { this._yAgain = false; this._saveYaml(); }
  }

  /* ───── αποθήκευση στον λογαριασμό HA (frontend user data) → ίδιες ρυθμίσεις σε όλες τις συσκευές ───── */
  _rkey() { return `deepal_s05_card_${(this._yaml && this._yaml.prefix) || DEFAULTS.prefix}`; }
  async _loadRemote() {
    try {
      const r = await this._hass.callWS({ type: "frontend/get_user_data", key: this._rkey() });
      const v = r && r.value ? onlySettings(r.value) : null;
      if (v && typeof v === "object" && Object.keys(v).length) {
        if (JSON.stringify(v) !== JSON.stringify(this._local || {})) {
          this._local = v; lsWrite(this._lsKey(), v);
          this._c = mergeConfig(this._yaml, this._local); this._built = false; this._force();
        }
        this._saveYaml(); // μεταφορά παλιών ρυθμίσεων στο YAML
      } else if (this._local && Object.keys(this._local).length) {
        // ο λογαριασμός/YAML είναι η αλήθεια: σβήνουμε παλιές τοπικές ρυθμίσεις της συσκευής
        this._local = {}; lsWrite(this._lsKey(), null); this._c = mergeConfig(this._yaml, {}); this._built = false; this._force();
      }
    } catch (_) { this._remoteErr = true; }
  }
  _saveRemote() {
    clearTimeout(this._rT);
    this._rT = setTimeout(async () => {
      if (!this._hass || typeof this._hass.callWS !== "function") return;
      try { await this._hass.callWS({ type: "frontend/set_user_data", key: this._rkey(), value: this._local || {} }); this._remoteErr = false; }
      catch (_) { if (!this._remoteErr) { this._remoteErr = true; this._toast("Οι ρυθμίσεις δεν αποθηκεύτηκαν στο HA — ισχύουν μόνο σε αυτή τη συσκευή", "error"); } }
    }, 500);
  }

  /* ───── helpers ───── */
  _id(key) {
    return resolveId(this._hass, this._c, key);
  }
  _obj(key) { return this._hass?.states?.[this._id(key)]; }
  _s(key) { const o = this._obj(key); return !o || BAD.includes(o.state) ? null : o.state; }
  _is(key, v) { return this._s(key) === v; }
  _n(key) { const s = this._s(key); if (s === null) return null; const n = parseFloat(s); return Number.isFinite(n) ? n : null; }
  _unit(key) { return this._obj(key)?.attributes?.unit_of_measurement || ""; }
  _eobj(id) { return this._hass?.states?.[id]; }
  /* τελευταία γνωστή τιμή (όταν ο αισθητήρας γίνει unavailable) */
  _nl(key) {
    const n = this._n(key);
    if (n !== null) {
      if (this._last[key] !== n) { this._last[key] = n; lsWrite(`deepal-s05-last:${this._c.prefix}`, this._last); }
      return { v: n, stale: false };
    }
    return this._last[key] !== undefined ? { v: this._last[key], stale: true } : { v: null, stale: false };
  }
  _allKeys() { return [...OTHER_KEYS, ...OPEN_ITEMS.map((x) => x[0]), ...DIAG.map((x) => x[0]), ...INFO_IDS.map((i) => INFO_ITEMS[i][0]), ...TIRES.map((t) => `binary_sensor.${t.id}_tire_alarm`)]; }
  _signature() {
    const st = this._allKeys().map((k) => this._obj(k)?.state ?? "∅").join("|");
    const cu = [...(this._c.diag_custom || []), ...(this._c.info_custom || [])].map((x) => this._eobj(x.entity)?.state ?? "∅").join("|");
    return [st, cu, Math.floor(Date.now() / 60000), Object.keys(this._pending).join(","),
      Object.entries(this._flashes).map(([k, v]) => k + v.type).join(","), this._confirm ? this._confirm.id : "", String(this._customize), String(this._diagSheet),
      JSON.stringify(this._c), JSON.stringify(this._opt), String(this._tpend), String(this._moreOpen), String((this._tgt() || {}).state), String(this._view), this._toastState ? this._toastState.msg : ""].join("#");
  }
  _force() { this._sig = null; if (this._hass && this._c) this._render(); }
  _diagAvail() { return DIAG.filter((d) => this._obj(d[0])); }
  _diagItems() {
    const c = this._c, avail = this._diagAvail(), selIds = Array.isArray(c.diag) ? c.diag : DIAG.map((d) => d[0]);
    const mk = (label, icon, ent, on, na, sev) => ({ label, icon, ent, on, na, st: on ? sev : na ? "na" : "ok" });
    const items = avail.filter((d) => selIds.includes(d[0])).map((d) => mk(d[1], d[2], this._id(d[0]), this._is(d[0], "on"), this._s(d[0]) === null, d[3] === "r" ? "bad" : "warn"));
    for (const x of c.diag_custom || []) {
      const o = this._eobj(x.entity);
      items.push(mk(x.label || o?.attributes?.friendly_name || x.entity, x.icon || "alert", x.entity, !!o && ["on", "true", "problem", "alarm", "low"].includes(String(o.state).toLowerCase()), !o || BAD.includes(o.state), "bad"));
    }
    return items;
  }
  /* Popup «Διαγνωστικά»: όλοι οι αισθητήρες, χωρισμένοι σε προβλήματα / μη διαθέσιμοι / εντάξει */
  _diagHtml() {
    const it = this._diagItems(), rank = { bad: 0, warn: 1, na: 2, ok: 3 };
    const bad = it.filter((x) => x.st === "bad" || x.st === "warn").sort((a, b) => rank[a.st] - rank[b.st]), na = it.filter((x) => x.st === "na"), ok = it.filter((x) => x.st === "ok");
    const stTxt = { bad: "Πρόβλημα", warn: "Προειδοποίηση", na: "Μη διαθέσιμο", ok: "Εντάξει" };
    const row = (d) => `<button class="dgrow ${d.st}" data-ent="${esc(d.ent)}" title="${esc(d.label)}">${icoBadge(d.icon)}<span><b>${esc(d.label)}</b><small>${esc(T(stTxt[d.st]))}</small></span></button>`;
    const sec = (title, arr, cls) => arr.length ? `<h4 class="dgh ${cls}">${esc(T(title))} <em>${arr.length}</em></h4><div class="dglist ${cls}">${arr.map(row).join("")}</div>` : "";
    const sum = [T("{0} αισθητήρες", it.length), ok.length ? T("{0} εντάξει", ok.length) : "", bad.length ? T(bad.length === 1 ? "{0} πρόβλημα" : "{0} προβλήματα", bad.length) : "", na.length ? T("{0} μη διαθέσιμοι", na.length) : ""].filter(Boolean).join(" · ");
    const found = discoverDiag(this._hass, this._c);
    const nw = found.length ? `<div class="dgnew"><div><b>${esc(T(found.length === 1 ? "Βρέθηκε {0} νέος αισθητήρας" : "Βρέθηκαν {0} νέοι αισθητήρες", found.length))}</b><small>${esc(found.map((f) => f.label).join(", "))}</small></div>
      <div class="btnrow"><button class="btn sm" data-dg-ignore>${esc(T("Αγνόηση"))}</button><button class="btn sm pl" data-dg-add>${ico("plus")} ${esc(T("Προσθήκη"))}</button></div></div>` : "";
    return `<div class="hd"><h3>${esc(T("Διαγνωστικά"))}</h3><button class="x" data-close aria-label="Κλείσιμο">${ico("close")}</button></div>
      <p class="dgsum ${bad.length ? "bad" : "ok"}">${bad.length ? "" : "✓ "}${esc(sum)}</p>
      <div class="dgbody">${nw}${it.length ? "" : `<p class="hint">${esc(T("Δεν υπάρχουν αισθητήρες διαγνωστικών. Πρόσθεσέ τους από τις Ρυθμίσεις."))}</p>`}${sec("Προβλήματα", bad, "bad")}${sec("Μη διαθέσιμοι", na, "na")}${sec("Εντάξει", ok, "ok")}</div>
      <div class="btnrow dgfoot"><button class="btn sm" data-dg-set>${ico("sliders")} ${esc(T("Ρυθμίσεις αισθητήρων"))}</button></div>`;
  }

  /* ───── κατάσταση οχήματος ───── */
  _vehicle() {
    const unlocked = this._is("lock.doors", "unlocked") || this._is("lock.doors", "unlocking");
    const lights = ["position_lamp", "low_beam", "high_beam"].some((k) => this._is(`binary_sensor.${k}`, "on"));
    const charging = this._is("binary_sensor.charging", "on");
    const plugged = this._is("binary_sensor.charger_plugged", "on");
    const battery = this._n("sensor.battery_level");
    const open = OPEN_ITEMS.filter(([k]) => this._is(k, "on"));
    let img;
    if (charging) img = unlocked ? "charging_unlocked" : "charging";
    else if (unlocked) img = lights ? "unlocked_lights" : "unlocked";
    else if (lights) img = "lights";
    else if (plugged && battery !== null && battery >= 100) img = "complete";
    else img = "off";
    return { unlocked, lights, charging, plugged, battery, open, img };
  }
  _scUpd() {
    const a = this._el && this._el.actions; if (!a) return;
    if (!this._scBound) { this._scBound = true; a.addEventListener("scroll", () => this._scUpd(), { passive: true }); }
    const r = a.scrollWidth - a.clientWidth - a.scrollLeft > 6, l = a.scrollLeft > 6;
    a.toggleAttribute("data-r", r); a.toggleAttribute("data-l", l);
  }
  _ageMin() { const t = new Date(this._s("sensor.last_updated") || "").getTime(); return Number.isFinite(t) ? Math.max(0, Math.round((Date.now() - t) / 60000)) : 0; }
  _age() {
    const raw = this._s("sensor.last_updated");
    if (!raw) return "--";
    const t = new Date(raw).getTime();
    if (!Number.isFinite(t)) return "--";
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 1) return T("μόλις τώρα");
    if (m < 60) return T("πριν {0} λ.", m);
    if (m < 1440) return T("πριν {0} ώ.", Math.floor(m / 60));
    return T("πριν {0} ημ.", Math.floor(m / 1440));
  }
  _fmtLeft(raw) { const m = raw && /^(\d+):(\d{1,2})/.exec(raw); return m ? T("{0}ώ {1}λ", +m[1], +m[2]) : raw || ""; }
  _chargeCurrent() {
    const dc = this._n("sensor.dc_charge_current");
    if (dc && dc > 0) return `DC ${Math.round(dc)} ${this._unit("sensor.dc_charge_current") || "A"}`;
    const acKey = this._n("sensor.ac_charge_current") !== null ? "sensor.ac_charge_current" : "sensor.charge_current";
    const ac = this._n(acKey);
    return ac && ac > 0 ? `AC ${Math.round(ac)} ${this._unit(acKey) || "A"}` : "";
  }
  _offline() { const s = this._s("binary_sensor.cloud_connection"); return s === "off" || s === "unavailable"; }
  _status(v) {
    const cloudOk = this._is("binary_sensor.cloud_connection", "on");
    const left = this._s("sensor.remaining_charge_time_h_mm");
    if (v.open.length) {
      const names = v.open.slice(0, 2).map((x) => x[1]).join(" · ");
      return { icon: "alert", text: "Ανοιχτά", sub: names + (v.open.length > 2 ? ` +${v.open.length - 2}` : ""), rgb: "var(--ds-bad)" };
    }
    const pl = this._pending && this._pending.lock;
    if (pl) { const un = pl.before === "locked"; return { icon: un ? "unlock" : "lock", text: un ? "Ξεκλειδώνει…" : "Κλειδώνει…", sub: "Αναμονή επιβεβαίωσης από το όχημα", rgb: "var(--ds-warn)" }; }
    if (this._s("binary_sensor.cloud_connection") === null && this._s("lock.doors") === null) return { icon: "alert", text: "Δεν βρέθηκε το όχημα", sub: "Έλεγξε το πρόθεμα στις Ρυθμίσεις → Αισθητήρες", rgb: "var(--ds-warn)" };
    if (!cloudOk) return { icon: "cloudoff", text: "Εκτός σύνδεσης", sub: T("Τελευταία ενημέρωση {0}", this._age()), rgb: "var(--ds-bad)" };
    if (v.charging) return { icon: "bolt", text: "Φορτίζει", sub: "", rgb: "var(--ds-ok)" };
    const alerts = this._diagItems().filter((d) => d.on).length, warn = alerts ? T(alerts === 1 ? "{0} προειδοποίηση" : "{0} προειδοποιήσεις", alerts) : "";
    if (v.plugged) return { icon: "plug", text: "Φορτιστής συνδεδεμένος", sub: warn, rgb: "var(--ds-warn)" };
    if (v.unlocked) return { icon: "unlock", text: "Ξεκλείδωτο", sub: warn, rgb: "var(--ds-warn)" };
    return { icon: "lock", text: "Κλειδωμένο", sub: warn, rgb: alerts ? "var(--ds-warn)" : "var(--ds-ok)" };
  }

  /* ───── κλιματισμός ───── */
  _climateIsOn() {
    if (this._s("binary_sensor.climate_on") !== null) return this._is("binary_sensor.climate_on", "on");
    const s = this._s("climate.cabin_climate");
    return s !== null && s !== "off";
  }
  _climateCall(turnOn) {
    const o = this._obj("climate.cabin_climate");
    if (!o) return null;
    const feat = o.attributes?.supported_features || 0;
    const modes = o.attributes?.hvac_modes || [];
    if (turnOn) {
      if (feat & CLIMATE_TURN_ON) return ["climate", "turn_on", "climate.cabin_climate"];
      const mode = this._c.climate_on_mode || ["auto", "heat_cool", "cool", "heat", "fan_only"].find((m) => modes.includes(m)) || modes.find((m) => m !== "off");
      return mode ? ["climate", "set_hvac_mode", "climate.cabin_climate", { hvac_mode: mode }] : null;
    }
    if (feat & CLIMATE_TURN_OFF) return ["climate", "turn_off", "climate.cabin_climate"];
    return modes.includes("off") ? ["climate", "set_hvac_mode", "climate.cabin_climate", { hvac_mode: "off" }] : null;
  }

  /* ───── κουμπιά ───── */
  _actions() {
    const lock = this._s("lock.doors"), win = this._s("cover.windows"), trunk = this._s("cover.trunk"), climate = this._s("climate.cabin_climate");
    const climateOn = this._climateIsOn();
    const cCall = climate === null ? null : this._climateCall(!climateOn);
    const tg = (() => { const t = this._tgt(); const n = t ? parseFloat(t.state) : NaN; return Number.isFinite(n) ? n : null; })();
    const openTone = (s) => (s === "closed" ? "" : s === null ? "bad" : "warn");
    const txt = (s, closed, open) => (s === "closed" ? closed : s === "open" ? open : s === null ? "μη διαθέσιμο" : s);
    const all = {
      lock: { on: lock === "locked", icon: lock === "locked" ? "lock" : "unlock", sub: lock === "locked" ? "κλειδωμένο" : lock === "unlocked" ? "ξεκλείδωτο" : lock || "μη διαθέσιμο",
        tone: lock === "locked" ? "ok" : lock === "unlocked" ? "warn" : "bad", disabled: lock === null, watch: "lock.doors", confirm: lock === "locked" ? "unlock" : "lock",
        call: ["lock", lock === "locked" ? "unlock" : "lock", "lock.doors"] },
      windows: { on: win === "open", icon: win === "closed" || win === null ? "windowclosed" : "windowopen", sub: txt(win, "κλειστά", "ανοιχτά"), tone: openTone(win), disabled: win === null,
        watch: "cover.windows", confirm: win === "closed" ? "windows" : null, call: ["cover", "toggle", "cover.windows"] },
      trunk: { on: trunk === "open", icon: trunk === "open" ? "trunkopen" : "trunk", sub: txt(trunk, "κλειστό", "ανοιχτό"), tone: openTone(trunk), disabled: trunk === null, watch: "cover.trunk", confirm: trunk === "closed" ? "trunk" : null,
        call: ["cover", "toggle", "cover.trunk"] },
      climate: { on: climateOn, icon: climateOn ? "snow" : "snowoff", sub: climate === null ? "μη διαθέσιμο" : climateOn ? (tg !== null ? `ενεργός · ${this._fmtNum(tg, 1)}°` : "ενεργός") : "ανενεργός", tone: climate === null ? "bad" : "", disabled: climate === null, confirm: "climate",
        watch: this._obj("binary_sensor.climate_on") ? "binary_sensor.climate_on" : "climate.cabin_climate", timeout: 35000, call: cCall,
        unsupported: climateOn ? "Ο κλιματισμός δεν έχει εντολή απενεργοποίησης σε αυτή την οντότητα" : "Ο κλιματισμός δεν έχει εντολή ενεργοποίησης σε αυτή την οντότητα" },
      tires: (() => { const s = this._tiresSummary(); return { icon: "tirealert", ...s, open: "iso" }; })(),
      cabin: (() => { const s = this._cabinSummary(climateOn); return { icon: s.on ? "interioron" : "interior", ...s, open: "climate" }; })(),
      flash: { confirm: "flash", icon: "headlight", sub: "αναλαμπή", btn: "button.flash_lights", call: ["button", "press", "button.flash_lights"] },
      honk: { confirm: "honk", icon: "horn", sub: "ηχητικό σήμα", btn: "button.honk_horn", call: ["button", "press", "button.honk_horn"] },
      find: { confirm: "find", icon: "find", sub: "εντοπισμός", btn: "button.flash_lights_and_honk", call: ["button", "press", "button.flash_lights_and_honk"] },
      refresh: { confirm: "refresh", icon: "refresh", sub: this._age(), btn: "button.refresh_vehicle_data", watch: "sensor.last_updated", timeout: 25000, call: ["button", "press", "button.refresh_vehicle_data"] },
    };
    return [...BUTTON_IDS, "refresh"].map((id) => {
      const a = { id, label: BUTTON_LABELS[id], ...all[id] };
      if (a.btn) {
        const o = this._obj(a.btn);
        if (!o || o.state === "unavailable") { a.disabled = true; a.tone = "bad"; }
      }
      return a;
    });
  }
  _cabinSummary(climateOn) {
    const L = (k) => this._level(k), act = [];
    if (climateOn) act.push("A/C");
    if (L("number.front_left_seat_heating_level") > 0 || L("number.front_right_seat_heating_level") > 0) act.push("θέρμ.");
    if (L("number.front_left_seat_ventilation_level") > 0 || L("number.front_right_seat_ventilation_level") > 0) act.push("αερ.");
    if (L("switch.steering_wheel_heating") > 0) act.push("τιμόνι");
    return { on: act.length > 0, sub: act.length ? act.join(" · ") : "ταμπλό", tone: "" };
  }
  _tiresSummary() {
    const rs = TIRES.map((t) => this._tire(t)), vals = rs.map((r) => r.bar).filter((x) => x !== null);
    const unit = this._c.tire_unit, f = (b) => (unit === "kPa" ? Math.round(b * 100) : unit === "psi" ? (b / 0.0689476).toFixed(1) : b.toFixed(2));
    const bad = rs.some((r) => r.alarm), warn = rs.some((r) => r.note);
    const open = OPEN_ITEMS.filter(([k]) => this._is(k, "on"));
    if (!bad && !warn && open.length) return { sub: T("{0} ανοιχτά", open.length), tone: "warn" };
    return { sub: bad ? "συναγερμός" : warn ? "έλεγξε πίεση" : vals.length ? `${f(Math.min(...vals))} ${unit} min` : "--", tone: bad ? "bad" : warn ? "warn" : "" };
  }
  _onAction(id) {
    const a = this._actions().find((x) => x.id === id);
    if (!a || a.disabled || this._pending[id]) return;
    if (a.open) { this._view = a.open; return this._force(); }
    if (!a.call) { this._flash(id, "error"); this._toast(a.unsupported || "Η ενέργεια δεν υποστηρίζεται", "error"); return; }
    if (a.confirm && this._c.confirm.includes(a.confirm)) {
      this._confirm = { id, key: a.confirm };
      clearTimeout(this._confirmTimer);
      this._confirmTimer = setTimeout(() => { this._confirm = null; this._force(); }, 8000);
      return this._force();
    }
    this._run(a);
  }
  async _run(a) {
    const before = a.watch ? this._s(a.watch) ?? this._obj(a.watch)?.state : null;
    this._pending[a.id] = { before, watch: a.watch };
    this._pending[a.id].timer = setTimeout(() => {
      if (!this._pending[a.id]) return;
      delete this._pending[a.id]; this._flash(a.id, "error"); this._toast("Δεν επιβεβαιώθηκε από το όχημα", "error");
    }, a.timeout || 20000);
    this._force();
    const [domain, service, entity, data] = a.call;
    try {
      await this._hass.callService(domain, service, { entity_id: this._id(entity), ...(data || {}) });
    } catch (err) {
      clearTimeout(this._pending[a.id]?.timer); delete this._pending[a.id]; this._flash(a.id, "error");
      return this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error");
    }
    if (!a.watch) { clearTimeout(this._pending[a.id]?.timer); delete this._pending[a.id]; this._flash(a.id, "success"); this._actToast = Date.now(); this._toast(this._sentMsg(a), "ok"); }
    else { this._actToast = Date.now(); this._toast(this._sentMsg(a), "ok"); }
  }
  _doneMsg(id) {
    const st = (k) => this._s(k);
    switch (id) {
      case "lock": return st("lock.doors") === "locked" ? "Το όχημα κλειδώθηκε" : "Το όχημα ξεκλειδώθηκε";
      case "windows": return st("cover.windows") === "open" ? "Τα παράθυρα άνοιξαν" : "Τα παράθυρα έκλεισαν";
      case "trunk": return st("cover.trunk") === "open" ? "Το πορτμπαγκάζ άνοιξε" : "Το πορτμπαγκάζ έκλεισε";
      case "climate": return this._climateIsOn() ? "Ο κλιματισμός άνοιξε" : "Ο κλιματισμός έσβησε";
      case "refresh": return "Τα δεδομένα του οχήματος ανανεώθηκαν";
      default: return null;
    }
  }
  _sentMsg(a) {
    const m = { lock: "Στάλθηκε εντολή κλειδώματος", windows: "Στάλθηκε εντολή για τα παράθυρα", trunk: "Στάλθηκε εντολή για το πορτμπαγκάζ", climate: "Στάλθηκε εντολή κλιματισμού",
      flash: "Στάλθηκε εντολή: φώτα", honk: "Στάλθηκε εντολή: κόρνα", find: "Στάλθηκε εντολή: φώτα + κόρνα", refresh: "Ζητήθηκε ανανέωση δεδομένων" };
    if (a.id === "lock") return this._s("lock.doors") === "locked" ? "Στάλθηκε εντολή ξεκλειδώματος" : "Στάλθηκε εντολή κλειδώματος";
    return m[a.id] || `${a.label}: εστάλη`;
  }
  _resolvePending() {
    for (const [id, p] of Object.entries(this._pending)) {
      if (!p.watch) continue;
      const cur = this._obj(p.watch)?.state;
      if (cur === undefined || cur === p.before || TRANSITIONAL.includes(cur) || BAD.includes(cur)) continue;
      clearTimeout(p.timer); delete this._pending[id]; this._flash(id, "success");
      const msg = this._doneMsg(id); if (msg) { this._actToast = Date.now(); this._toast(msg, "ok"); }
    }
  }
  /* αλλαγές κατάστασης (π.χ. από την εφαρμογή ή αυτόματα) → μήνυμα στην οθόνη */
  _watchChanges(v) {
    const lock = this._s("lock.doors");
    const cur = { lock, climate: this._s("climate.cabin_climate") === null ? null : this._climateIsOn(), charging: v.charging, plugged: v.plugged, open: v.open.length };
    const p = this._prevS; this._prevS = cur;
    if (!p || Date.now() - (this._actToast || 0) < 8000) return;
    let msg = null, type = "ok";
    if (p.lock && cur.lock && p.lock !== cur.lock) { if (cur.lock === "locked") msg = "Το όχημα κλειδώθηκε"; else if (cur.lock === "unlocked") { msg = "Το όχημα ξεκλειδώθηκε"; type = "warn"; } }
    else if (p.climate !== null && cur.climate !== null && p.climate !== cur.climate) msg = cur.climate ? "Ο κλιματισμός άνοιξε" : "Ο κλιματισμός έσβησε";
    else if (p.charging !== cur.charging) msg = cur.charging ? "Η φόρτιση ξεκίνησε" : "Η φόρτιση σταμάτησε";
    else if (p.plugged !== cur.plugged) msg = cur.plugged ? "Ο φορτιστής συνδέθηκε" : "Ο φορτιστής αποσυνδέθηκε";
    else if (cur.open > p.open) { msg = T("Κάτι έμεινε ανοιχτό: {0}", v.open.slice(0, 2).map((x) => x[1]).join(", ")); type = "error"; }
    if (msg) setTimeout(() => this._toast(msg, type), 0);
  }
  _flash(id, type) {
    clearTimeout(this._flashes[id]?.timer);
    this._flashes[id] = { type, timer: setTimeout(() => { delete this._flashes[id]; this._force(); }, type === "error" ? 1800 : 1300) };
    this._force();
  }
  _toast(msg, type) {
    clearTimeout(this._toastTimer);
    this._toastState = { msg, type };
    this._toastTimer = setTimeout(() => { this._toastState = null; this._force(); }, ((Number(this._c.toast_duration) > 0 ? Number(this._c.toast_duration) : 5) + (type === "error" ? 3 : 0)) * 1000);
    this._force();
  }
  _diagAct(d) {
    if (d.dgSet !== undefined) { this._diagSheet = false; this._stab = "sensors"; this._customize = true; return this._force(); }
    const found = discoverDiag(this._hass, this._c);
    if (d.dgAdd !== undefined) { this._patch({ diag_custom: [...(this._c.diag_custom || []), ...found.map((f) => ({ entity: f.entity, label: f.label, icon: f.icon }))] }); }
    else if (d.dgIgnore !== undefined) { this._patch({ diag_ignore: [...new Set([...(this._c.diag_ignore || []), ...found.map((f) => f.entity)])] }); }
    this._force();
  }
  _closeSheet() { clearTimeout(this._confirmTimer); if (this._confirm && this._confirm.temp !== undefined) this._tpend = undefined; this._confirm = null; const wasC = this._customize; this._customize = false; this._diagSheet = false; this._uiSave(); this._force(); if (wasC && this._yPend) { this._yPend = false; this._saveYaml(); } }
  _popupBox() { if (!this._el) return null; if (this._confirm || this._customize || this._diagSheet) return this._el.box; return this._view ? this._el.vbox : null; }
  _closeTop() { if (this._confirm || this._customize || this._diagSheet) return this._closeSheet(); if (this._view) { this._view = null; this._force(); } }
  _key(e) {
    const box = this._popupBox(); if (!box) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); return this._closeTop(); }
    if (e.key !== "Tab") return;
    const f = [...box.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null || x.getClientRects().length);
    if (!f.length) return;
    const act = this.shadowRoot.activeElement, i = f.indexOf(act);
    if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
  }
  _focusSync() {
    const open = !!this._popupBox();
    if (open && !this._wasOpen) {
      const a = this.shadowRoot.activeElement;
      this._retSel = a ? (a.dataset.id ? `[data-id="${a.dataset.id}"]` : a.dataset.more !== undefined ? "[data-more]" : a.id ? `#${a.id}` : a.className ? `.${String(a.className).split(" ")[0]}` : null) : null;
      requestAnimationFrame(() => { const b = this._popupBox(); const t = b && (b.querySelector(".go") || b.querySelector(".x") || b.querySelector("button")); if (t) t.focus({ preventScroll: true }); });
    } else if (!open && this._wasOpen && this._retSel) {
      const sel = this._retSel; this._retSel = null;
      requestAnimationFrame(() => { const t = this.shadowRoot.querySelector(sel); if (t && !t.disabled) t.focus({ preventScroll: true }); });
    }
    this._wasOpen = open;
  }
  _vsheetOpen() { return !!this._view && !this._confirm && !this._customize && !this._diagSheet; }

  /* ───── εσωτερικό: επίπεδα καθισμάτων / τιμόνι / θερμοκρασία ───── */
  _level(key) {
    const o = this._opt[key], now = Date.now();
    const real = key.startsWith("switch.") ? (this._is(key, "on") || this._is("binary_sensor.steering_wheel_heater", "on") ? 1 : 0) : this._n(key) ?? 0;
    if (o && now - o.t < 15000) { if (o.v === real) delete this._opt[key]; else return o.v; }
    return real;
  }
  _setOpt(key, v) {
    this._opt[key] = { v, t: Date.now() };
    clearTimeout(this._optTimer);
    this._optTimer = setTimeout(() => this._force(), 15200);
    this._force();
  }
  async _spot(id) {
    const sp = INT_SPOTS.find((s) => s[0] === id);
    if (!sp) return;
    const key = sp[1], cur = this._level(key);
    try {
      if (key.startsWith("switch.")) {
        this._setOpt(key, cur ? 0 : 1);
        await this._hass.callService("switch", cur ? "turn_off" : "turn_on", { entity_id: this._id(key) });
      } else {
        const max = this._obj(key)?.attributes?.max ?? 3;
        const next = cur >= max ? 0 : cur + 1;
        this._setOpt(key, next);
        await this._hass.callService("number", "set_value", { entity_id: this._id(key), value: next });
      }
    } catch (err) { delete this._opt[key]; this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error"); }
  }
  /* Θερμοκρασία στόχος: απευθείας από την οντότητα climate (χωρίς helper) */
  _tgt() {
    const co = this._obj("climate.cabin_climate"), a = co?.attributes;
    if (!a || a.temperature == null) return null;
    return { state: String(a.temperature), attributes: { min: a.min_temp, max: a.max_temp, step: a.target_temp_step } };
  }
  /* η αλλαγή στόχου όταν ο κλιματισμός είναι σβηστός τον ανοίγει → ζητά την ίδια επιβεβαίωση με το power */
  _needTempConfirm() { return !this._climateIsOn() && this._c.confirm.includes("climate"); }
  _askTemp(v) {
    this._confirm = { id: "climate", key: "climate_temp", temp: v };
    clearTimeout(this._confirmTimer);
    this._confirmTimer = setTimeout(() => { this._confirm = null; this._tpend = undefined; this._force(); }, 8000);
    this._force();
  }
  async _applyTemp(v) {
    this._tpend = v; clearTimeout(this._tTimer2);
    this._tTimer2 = setTimeout(() => { this._tpend = undefined; this._force(); }, 6000);
    this._force();
    try { await this._setTgt(v); }
    catch (err) { this._tpend = undefined; this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error"); }
  }
  _setTgt(v) { return this._hass.callService("climate", "set_temperature", { entity_id: this._id("climate.cabin_climate"), temperature: v }); }
  _tempStep(d) {
    const o = this._tgt();
    if (!o) return;
    const a = o.attributes || {}, step = a.step || 0.5, min = a.min ?? 16, max = a.max ?? 32;
    const cur = this._tpend ?? parseFloat(o.state);
    if (!Number.isFinite(cur)) return;
    this._tpend = Math.min(max, Math.max(min, Math.round((cur + d * step) / step) * step));
    clearTimeout(this._tTimer);
    this._tTimer = setTimeout(async () => {
      const v = this._tpend;
      if (this._needTempConfirm()) return this._askTemp(v);
      try { await this._setTgt(v); }
      catch (err) { this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error"); }
      this._tTimer2 = setTimeout(() => { this._tpend = undefined; this._force(); }, 6000);
    }, 800);
    clearTimeout(this._tTimer2);
    this._force();
  }

  /* ───── build ───── */
  _heroSrc(k, idx = 0) {
    const c = this._c, file = c.images[k] || HERO_FILES[k] || DASH_FILES[k];
    if (/^(https?:)?\/\//.test(file) || file.startsWith("/")) return idx === 0 ? file : null;
    const bases = c.image_path ? [normPath(c.image_path)] : [`${SCRIPT_BASE}images/car/`];
    return bases[idx] ? bases[idx] + file : null;
  }
  _layerBase() { return this._c.layers_path ? normPath(this._c.layers_path) : `${SCRIPT_BASE}images/`; }

  /* Αέρας από τους αεραγωγούς: δέσμες από λεπτές καμπύλες που ανοίγουν σε βεντάλια, με διαφάνεια που σβήνει (συντεταγμένες εικόνας 510×285) */
  _airSvg() {
    // μεσαίοι αεραγωγοί: βεντάλια· πλαϊνοί (σχισμές ταμπλό): λεπτές "φυσικές" γραμμές ροής
    const R = [
      [[244, 170, 236, 195, 190, 218, 160, 233], [236, 172, 232, 200, 222, 232, 205, 250]],
      [[270, 170, 284, 198, 320, 216, 350, 233], [262, 172, 268, 205, 285, 235, 300, 250]],
    ];
    const f = (n) => n.toFixed(1), P = (p) => `M${f(p[0])} ${f(p[1])}C${f(p[2])} ${f(p[3])} ${f(p[4])} ${f(p[5])} ${f(p[6])} ${f(p[7])}`;
    const grad = (id, x0, y0, x1, y1) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"><stop offset="0" style="stop-color:var(--a0)" stop-opacity=".95"/><stop offset=".55" style="stop-color:var(--a1)" stop-opacity=".6"/><stop offset="1" style="stop-color:var(--a2)" stop-opacity="0"/></linearGradient>`;
    let defs = '<filter id="airb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="airb2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation=".6"/></filter><filter id="airb3" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation=".45"/></filter>', body = "";
    R.forEach(([A, B], r) => {
      const N = 9, x0 = (A[0] + B[0]) / 2, y0 = (A[1] + B[1]) / 2, x1 = (A[6] + B[6]) / 2, y1 = (A[7] + B[7]) / 2;
      defs += grad("ag" + r, x0, y0, x1, y1);
      const Br = `L${f(B[6])} ${f(B[7])}C${f(B[4])} ${f(B[5])} ${f(B[2])} ${f(B[3])} ${f(B[0])} ${f(B[1])}Z`;
      body += `<path class="bg" d="${P(A)}${Br}" fill="url(#ag${r})" filter="url(#airb)" style="--d:${(-r * 0.7).toFixed(1)}s"/>`;
      let st = "";
      for (let k = 0; k < N; k++) {
        const t = k / (N - 1), s = A.map((v, i) => v * (1 - t) + B[i] * t);
        const edge = k === 0 || k === N - 1, w = edge ? 1 : 1.4 + ((k * 7 + r) % 3) * 0.5;
        const dl = -(((k * 0.53 + r * 0.9) % 2.4)).toFixed(2), tt = (2.0 + ((k * 5 + r * 3) % 7) * 0.22).toFixed(2);
        st += `<path class="st" d="${P(s)}" pathLength="100" stroke="url(#ag${r})" stroke-width="${w}" style="--w:${(3.4 + ((k * 3 + r) % 5) * 0.4).toFixed(2)}s;--d:${dl}s;--t:${tt}s"/>`;
      }
      body += `<g filter="url(#airb2)">${st}</g>`;
    });
    // πλαϊνές σχισμές: δεξιά x 438–464 (αριστερά καθρέφτης), ροή προς τους επιβάτες
    // δεξιά σχισμή: απαλή ροή προς τους επιβάτες
    const W = [[0, 78, -6, -16, -22], [4, 92, 5, -10, -26], [8, 70, -4, -18, -16], [12, 100, 6, -6, -24], [16, 84, -5, -14, -28], [20, 96, 4, -9, -20], [24, 74, -3, -17, -23], [27, 88, 5, -8, -30]];
    const wisp = (p, k, side, w, da) => `<path class="st" d="${P(p)}" pathLength="100" stroke="url(#as${side})" stroke-width="${w}" stroke-dasharray="${da}" style="--w:${(3.2 + ((k * 3 + side) % 5) * 0.45).toFixed(2)}s;--d:${-(((k * 0.61 + side * 0.9) % 2.4)).toFixed(2)}s;--t:${(2.8 + ((k * 5 + side * 3) % 7) * 0.28).toFixed(2)}s"/>`;
    defs += grad("as0", 451, 123, 430, 215) + grad("as1", 80, 122, 12, 200);
    let st = "";
    W.forEach(([dx, L, a, b, c], k) => { const x = 438 + dx; st += wisp([x, 123, x + a, 123 + L * 0.3, x + b, 123 + L * 0.65, x + c, 123 + L], k, 0, (0.7 + (k % 3) * 0.2).toFixed(2), k % 2 ? "78 22" : "64 36"); });
    body += `<path class="bg" d="M438 123C436 150 424 175 412 200L440 200C450 175 464 150 465 123Z" fill="url(#as0)" filter="url(#airb)" style="opacity:.4"/><g filter="url(#airb3)">${st}</g>`;
    // αριστερή σχισμή: ο αέρας βγαίνει ΠΙΣΩ από το τιμόνι (το εσωτερικό του τιμονιού κρύβεται με μάσκα) και ρέει προς τα έξω/κάτω
    defs += '<mask id="wmask" maskUnits="userSpaceOnUse" x="0" y="0" width="510" height="285"><rect width="510" height="285" fill="#fff"/><ellipse cx="115" cy="137" rx="69" ry="63" fill="#000" filter="url(#airb3)"/></mask>';
    st = "";
    for (let k = 0; k < 9; k++) {
      const sx = 70 + k * 4, ex = 6 + ((k * 7) % 5) * 7, ey = 160 + ((k * 11) % 6) * 9, ph = (k % 3) * 4;
      st += wisp([sx, 121 + (k % 2), sx - 28, 123 + ph, ex + 24, ey - 48 - ph, ex, ey], k, 1, (0.7 + (k % 3) * 0.2).toFixed(2), k % 2 ? "78 22" : "62 38");
    }
    body += `<g mask="url(#wmask)"><path class="bg" d="M72 120C40 122 20 140 4 170L4 205C30 190 44 160 82 126Z" fill="url(#as1)" filter="url(#airb)" style="opacity:.45"/><g filter="url(#airb3)">${st}</g></g>`;
    return `<svg class="air" viewBox="0 0 510 285" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
  }
  // χρώμα αέρα ανάλογα με τη θερμοκρασία-στόχο: < air_t1 μπλε, μέχρι air_t2 κίτρινο, πάνω πορτοκαλί
  _airTone(v) {
    const svg = this._el && this._el.dash && this._el.dash.querySelector(".air"); if (!svg || !Number.isFinite(v)) return;
    const t1 = Number(this._c.air_t1) || 22, t2 = Number(this._c.air_t2) || 24;
    const hex2rgb = (h, d) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim()); return m ? [0, 2, 4].map((i) => parseInt(m[1].substr(i, 2), 16)).join(",") : d; };
    const base = v < t1 ? this._c.air_c1 : v <= t2 ? this._c.air_c2 : this._c.air_c3, rgb = hex2rgb(base, v < t1 ? "142,197,255" : v <= t2 ? "255,204,61" : "255,122,46").split(",").map(Number);
    const mix = (w) => `rgb(${rgb.map((x) => Math.round(x + (255 - x) * w)).join(",")})`, c = [mix(0.82), mix(0.4), mix(0)];
    c.forEach((x, i) => svg.style.setProperty("--a" + i, x));
  }
  _climHtml() {
    return `<div class="dash" id="dash"><img class="b" alt="">${this._airSvg()}</div>
      <div id="vtctl"></div>
      <div class="pk" id="pk"><div class="pt">Στόχος</div><div class="pv"><span id="pkv">--</span><small>°C</small></div>
        <div class="pw"><div class="pp" id="pkp"></div><div class="pf l"></div><div class="pf r"></div><div class="pc"></div></div></div>`;
  }
  _seatsHtml() {
    const B = `${this._layerBase()}interior/`;
    const btns = INT_SPOTS.map(([id, , icon, name, x, y]) => `<button class="sbtn ${icon === "fan" ? "cool" : "hot"}" data-spot="${id}" style="left:${x}%;top:${y}%" aria-label="${esc(name)}" title="${esc(name)}">${ico(icon === "fan" ? "fan" : icon === "steering" ? "steering" : "seat")}<span class="lvl"><i></i><i></i><i></i></span></button>`).join("");
    return `<div class="ipane"><img data-l="base" src="${esc(B)}base.webp" alt="">${INT_LAYERS.map((n) => `<img class="l" data-l="${n}" src="${esc(B + n)}.webp" alt="">`).join("")}${btns}</div>`;
  }

  /* Λίστα layers Car View [όνομα, φάκελος, συνθήκη] με τη σειρά του repo dec_deepal (πίσω από το αμάξι → αμάξι → μπροστά) */
  _isoLayers(color, wheels) {
    const out = [];
    const L = (dir, name, fn) => { out.push([name, dir, fn]); };
    const dk = (p, sd) => `binary_sensor.${p}_${sd}_door`, wk = (p, sd) => `binary_sensor.${p}_${sd}_window_open`;
    const door = (p, sd) => { const d = () => this._is(dk(p, sd), "on"), w = () => this._is(wk(p, sd), "on"); L("common", `window_${p}_${sd}_closed`, () => !w() && !d()); L("common", `window_${p}_${sd}_closed_door_open`, () => !w() && d()); L(color, `door_${p}_${sd}_open`, d); L(color, `door_${p}_${sd}_closed`, () => !d()); };
    const trunk = () => this._is("binary_sensor.trunk", "on"), hood = () => this._is("binary_sensor.hood", "on");
    door("rear", "right"); door("front", "right"); L(color, "trunk_closed", () => !trunk());
    L(color, "base", () => true); if (wheels) L("common", "wheels_" + wheels, () => true);
    L(color, "trunk_open", trunk); L(color, "hood_open", hood); L(color, "hood_closed", () => !hood());
    door("rear", "left"); door("front", "left"); L("common", "low_beam_on", () => this._is("binary_sensor.low_beam", "on"));
    return out;
  }

  /* Hero σε στυλ «Car View»: 3/4 render με ζωντανές πόρτες/καπό/πορτμπαγκάζ/παράθυρα/φώτα· όταν ο φορτιστής είναι συνδεδεμένος
     (ή το αμάξι φορτίζει) αλλάζει με τη διάφανη όψη (vista_carga) με το καλώδιο και τα ίδια εφέ φόρτισης με τις φωτογραφίες. */
  _heroCv(v) {
    const el = this._el, c = this._c, on = c.hero_style === "carview" && !this._cvFail;
    el.hero.dataset.style = on ? "carview" : "photo";
    if (!on) return;
    const color = CAR_COLORS.some((x) => x[0] === c.car_color) ? c.car_color : "black", wheels = ["open", "pro"].includes(c.iso_wheels) ? c.iso_wheels : "";
    const key = color + "|" + wheels + "|" + this._layerBase();
    if (this._cvKey !== key || !this._cvImgs || !el.cva.firstChild) {
      this._cvKey = key; this._cvL = this._isoLayers(color, wheels);
      const root = this._layerBase(), ci = (n) => `<img data-n="${n}" src="${esc(root + "carga/" + n + ".webp")}" alt="" decoding="async">`;
      el.cva.innerHTML = this._cvL.map(([n, d]) => `<img data-n="${n}" src="${esc(root + "iso/" + d + "/" + n + ".webp")}" alt="" decoding="async">`).join("");
      el.cvb.innerHTML = `${ci("base")}${ci("cable_connected")}${ci("cable_charging")}<svg viewBox="0 0 750 500" preserveAspectRatio="none" aria-hidden="true"><path class="cb" d="${CARGA_D}"/><path class="cf" d="${CARGA_D}"/>
        <g class="pt" transform="translate(${CARGA_PORT[0]} ${CARGA_PORT[1]})"><circle class="pg" r="9"/><circle class="pr" r="6"/><circle class="pr r2" r="6"/></g></svg><img class="sweep" alt="" src="${esc(root + "carga/base.webp")}">`;
      this._cvImgs = [...el.cva.querySelectorAll("img")];
      const base = el.cva.querySelector('img[data-n="base"]');
      if (base) base.addEventListener("error", () => { this._cvFail = true; this._force && this._force(); }, { once: true }); // faltan τα layers: γύρνα στις φωτογραφίες
    }
    el.hero.style.setProperty("--ds-cvs", String(Math.max(0.5, Math.min(2, (Number(c.image_scale) || 1.2) / 1.2) * 1.08)));
    this._cvImgs.forEach((im, i) => im.classList.toggle("on", !!this._cvL[i][2]()));
    const plug = v.charging || v.plugged;
    el.cv.classList.toggle("chg", plug);
    el.cvb.querySelector('img[data-n="cable_connected"]').classList.toggle("on", plug && !v.charging);
    el.cvb.querySelector('img[data-n="cable_charging"]').classList.toggle("on", !!v.charging);
    el.cvb.querySelector('img[data-n="base"]').classList.toggle("on", plug);
  }

  /* Προβολή 3/4: layers με τη σειρά του repo dec_deepal (πίσω από το αμάξι → αμάξι → μπροστά) */
  _isoRender(v) {
    const el = this._el, c = this._c, color = CAR_COLORS.some((x) => x[0] === c.car_color) ? c.car_color : "black", wheels = ["open", "pro"].includes(c.iso_wheels) ? c.iso_wheels : "";
    const key = color + "|" + wheels, root = this._layerBase() + "iso/";
    if (this._isoKey !== key) {
      this._isoKey = key;
      this._isoL = this._isoLayers(color, wheels);
      const lines = TIRES.map((t) => { const h = t.hid ? " hid" : "", x = t.wx * 7.5, y = t.wy * 5; return `<line data-pin="${t.id}" class="${h.trim()}" x1="${t.px * 7.5}" y1="${t.py * 5}" x2="${x}" y2="${y}"/>` + (t.hid ? `<circle data-pin="${t.id}" class="hid" cx="${x}" cy="${y}" r="8"/>` : `<circle data-pin="${t.id}" cx="${x}" cy="${y}" r="5"/><circle class="halo" data-pin="${t.id}" cx="${x}" cy="${y}" r="11"/>`); }).join("");
      const pills = TIRES.map((t) => `<div class="tp na" data-t="${t.id}" style="left:${t.px}%;top:${t.py}%"><div class="n">${esc(T(t.name))}</div><div class="v">--</div><div class="s"></div></div>`).join("");
      el.viso.innerHTML = `<div class="isop">${this._isoL.map(([n, d]) => `<img data-n="${n}" src="${esc(root + d + "/" + n + ".webp")}" alt="" decoding="async">`).join("")}<svg class="tl" viewBox="0 0 750 500" aria-hidden="true">${lines}</svg>${pills}</div>`;
      this._isoImgs = [...el.viso.querySelectorAll("img")];
      const base = el.viso.querySelector('img[data-n="base"]');
      el.vmiss.hidden = true;
      if (base) base.addEventListener("error", () => { el.vmiss.hidden = false; const p = el.viso.querySelector(".isop"); if (p) p.classList.add("noimg"); }, { once: true });
    }
    this._isoImgs.forEach((im, i) => im.classList.toggle("on", !!this._isoL[i][2]()));
    const notes = [];
    TIRES.forEach((t) => {
      const r = this._tire(t), g = el.viso.querySelector(`.tp[data-t="${t.id}"]`); if (!g) return;
      const st = r.bar === null ? "na" : r.tone === "var(--ds-ok)" ? "ok" : "bad";
      g.className = `tp ${st}`; g.style.opacity = r.stale ? ".7" : "";
      g.querySelector(".v").textContent = r.txt + (r.stale ? "·" : "");
      g.querySelector(".s").textContent = st === "ok" ? "✓ OK" : st === "bad" ? `! ${T(r.note || "έλεγξε πίεση")}` : "";
      el.viso.querySelectorAll(`[data-pin="${t.id}"]`).forEach((n) => n.setAttribute("class", `${n.classList.contains("halo") ? "halo " : ""}${n.classList.contains("hid") ? "hid " : ""}${st}`));
      if (r.note) notes.push(`<span><b style="--c:${r.tone}">${esc(T(t.name))}</b>: ${esc(T(r.note))}</span>`);
    });
    const open = v.open.map((x) => x[1]);
    const bits = [...(open.length ? [`<span><b style="--c:var(--ds-bad)">Ανοιχτά:</b> ${esc(open.join(", "))}</span>`] : []), ...notes];
    const hasTy = TIRES.some((t) => this._tire(t).bar !== null);
    if (!bits.length && hasTy) bits.push(`<span><b style="--c:var(--ds-ok)">✓ ${esc(T("Όλα καλά"))}</b> — ${esc(T("όλα κλειστά, πιέσεις εντάξει"))}</span>`);
    el.vextra.innerHTML = bits.length ? `<div class="vline">${bits.join("")}</div>` : ""; el.vextra.hidden = !bits.length;
  }

  _build() {
    const c = this._c;
    this._cvKey = null; this._cvImgs = null; // το DOM του hero ξαναχτίζεται: τα layers Car View πρέπει να ξαναφορτωθούν
    const imgs = Object.keys(HERO_FILES).map((k) => `<img data-k="${k}" data-i="0" src="${esc(this._heroSrc(k, 0))}" alt="" decoding="async">`).join("");
    this.shadowRoot.innerHTML = `
      <style>${CSS}</style>
      <ha-card>
        <div class="hero" id="hero">
          <div class="stage">${imgs}</div>
          <div class="hcv" id="cv"><div class="cvi"><div class="cva" id="cva"></div><div class="cvb" id="cvb"></div></div></div>
          <div class="fx fx-handles"><div class="halo"></div><div class="core"></div></div>
          <div class="fxs"><svg viewBox="0 0 500 278" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="cb" d="${CHG_D}"/><path class="cf" d="${CHG_D}"/>
            <g class="pt" transform="translate(${CHG_PORT[0]} ${CHG_PORT[1]})"><circle class="pg" r="7"/><circle class="pr" r="5"/><circle class="pr r2" r="5"/></g></svg><img class="sweep" alt="" src=""></div>
          <div class="shade-left"></div><div class="shade-top"></div><div class="shade-bot"></div>
          <div class="hero-top"><div><div class="title" id="ttl"><span id="nm">${esc(c.name)}</span><span class="plate" id="plate"></span></div><div class="total" id="total"></div></div>
            <div class="meta" id="meta"><span class="cloud" id="cloud" role="button"></span><button class="rfs" id="rfs" data-id="refresh"></button></div></div>
          <div class="status" id="status"></div>
          <div class="chgbox" id="chgbox" hidden></div><i class="chgline" id="chgline" hidden></i>
          <div class="tells" id="tells"></div>
          <div class="toast" id="toast" role="status" aria-live="polite"></div>
        </div>
        <div class="actions" id="actions"></div>
        <div class="stats" id="stats"></div>
        <div class="info" id="info"></div>
        <div class="diag" id="diag"></div>
        <div class="charge" id="charge" hidden></div>
        <button class="foot" id="foot" aria-label="Ρυθμίσεις κάρτας"><span class="age" id="age"></span><span class="sets">${ico("sliders")}Ρυθμίσεις</span></button>
        <div class="sheet" id="vsheet"><div class="box wide" id="vbox" role="dialog" aria-modal="true" aria-labelledby="vtitle">
          <div class="hd"><h3 id="vtitle">Όχημα</h3><button class="x" data-vclose aria-label="Κλείσιμο">${ico("close")}</button></div>
          <div class="veh" id="veh">
            <div class="seg" id="vtabs"><button data-vv="iso">${ico("carside")}<span class="tx">Car View</span></button><button data-vv="climate">${ico("fan")}<span class="tx">Κλιματισμός</span></button><button data-vv="seats">${ico("seat")}<span class="tx">Καθίσματα</span></button></div>
            <div class="vcol" id="viso"></div>
            <div class="vcol" id="vclim">${this._climHtml()}</div>
            <div class="vcol" id="vseats">${this._seatsHtml()}</div>
            <div class="vmiss" id="vmiss" hidden>${T("Δεν βρέθηκαν οι εικόνες οχήματος. Αντέγραψε τον φάκελο {0} δίπλα στο αρχείο της κάρτας (δες Ρυθμίσεις → Εικόνες).", "<b>images</b>")}</div>
            <div id="vextra"></div>
          </div>
        </div></div>
        <div class="sheet" id="sheet"><div class="box" id="box" role="dialog" aria-modal="true"></div></div>
      </ha-card>`;
    const sr = this.shadowRoot, g = (i) => sr.getElementById(i);
    this._dashKeys = {};
    this._el = { card: sr.querySelector("ha-card"), hero: g("hero"), cv: g("cv"), cva: g("cva"), cvb: g("cvb"), sweep: sr.querySelector(".sweep"), imgs: [...sr.querySelectorAll(".stage img")], plate: g("plate"), cloud: g("cloud"), age: g("age"),
      toast: g("toast"), status: g("status"), tells: g("tells"), rfs: g("rfs"), total: g("total"), stats: g("stats"), veh: g("veh"), vtabs: g("vtabs"), viso: g("viso"), vclim: g("vclim"), vseats: g("vseats"), pk: g("pk"), pkp: g("pkp"), pkv: g("pkv"), vmiss: g("vmiss"), vextra: g("vextra"),
      vsheet: g("vsheet"), vtctl: g("vtctl"), dash: g("dash"), info: g("info"), diag: g("diag"), charge: g("charge"), chgbox: g("chgbox"), chgline: g("chgline"), actions: g("actions"), foot: g("foot"), sheet: g("sheet"), box: g("box") };
    this._el.hero.style.setProperty("--ds-scale", String(c.image_scale));
    if (c.image_aspect) this._el.hero.style.setProperty("--ds-aspect", c.image_aspect);
    this._el.imgs.forEach((img) => {
      img.addEventListener("error", () => {
        const next = this._heroSrc(img.dataset.k, Number(img.dataset.i) + 1);
        if (next) { img.dataset.i = String(Number(img.dataset.i) + 1); img.src = next; } else img.style.visibility = "hidden";
      });
      img.addEventListener("load", () => {
        if (img.dataset.k === "off" && img.naturalWidth) { this._el.hero.dataset.auto = `${img.naturalWidth} / ${img.naturalHeight}`; if (!this._c.image_aspect) this._el.hero.style.setProperty("--ds-aspect", this._el.hero.dataset.auto); }
      });
    });
    this._el.dash.querySelectorAll(":scope > img").forEach((img) => {
      img.dataset.i = "0";
      img.addEventListener("error", () => {
        const next = this._heroSrc(img.dataset.key, Number(img.dataset.i) + 1);
        if (next) { img.dataset.i = String(Number(img.dataset.i) + 1); img.src = next; } else img.style.visibility = "hidden";
      });
    });
    this._el.vsheet.addEventListener("click", (e) => { if (e.target === this._el.vsheet) { this._view = null; this._force(); } });
    this._el.veh.addEventListener("error", (e) => { if (e.target?.dataset?.l === "base") this._el.vmiss.hidden = false; }, true);
    this._el.veh.addEventListener("load", (e) => { if (e.target?.dataset?.l === "base") this._el.vmiss.hidden = true; }, true);
    this._el.vbox = g("vbox");
    this._el.vbox.addEventListener("click", (e) => { if (e.target.closest("[data-vclose]")) { this._view = null; this._force(); } });
    this._swipe(this._el.vbox, this._el.vsheet); this._swipe(this._el.box, this._el.sheet);
    this._pkInit(); this._bindPress();
    this._el.rfs.addEventListener("click", () => this._onAction("refresh"));
    this._el.stats.addEventListener("click", (e) => {
      const tp = e.target.closest("[data-tp]"); if (tp) { if (!tp.disabled) this._tempStep(Number(tp.dataset.tp)); return; }
      const b = e.target.closest("[data-id]"); if (b) return this._onAction(b.dataset.id);
    });
    this._el.actions.addEventListener("click", (e) => {
      if (e.target.closest("[data-more]")) { this._moreOpen = !this._moreOpen; lsWrite(`deepal-s05-more:${this._c.prefix}`, this._moreOpen ? 1 : null); return this._force(); }
      const b = e.target.closest("[data-id]"); if (b) this._onAction(b.dataset.id);
    });
    this._el.veh.addEventListener("click", (e) => {
      const t = e.target.closest("[data-vv],[data-spot],[data-t],[data-id],[data-tp]");
      if (!t) return;
      if (t.dataset.vv) { this._view = t.dataset.vv; return this._force(); }
      if (t.dataset.spot) return this._spot(t.dataset.spot);
      if (t.dataset.id) return this._onAction(t.dataset.id);
      if (t.dataset.tp) return this._tempStep(Number(t.dataset.tp));
    });
    this._el.tells.addEventListener("click", (e) => { if (e.target.closest("[data-diag-open]")) { this._diagSheet = true; this._force(); } });
    this._el.foot.addEventListener("click", () => { if (this._c.show_customize === false) return; this._stab = "vehicle"; this._customize = true; this._force(); });
    this._el.sheet.addEventListener("click", (e) => {
      if (e.target === this._el.sheet) return this._closeSheet();
      const dg = e.target.closest("[data-dg-set],[data-dg-add],[data-dg-ignore]");
      if (dg) return this._diagAct(dg.dataset);
      const t = e.target.closest("[data-sheet],[data-close]");
      if (!t) return;
      if (t.dataset.sheet === "yes") {
        const cf = this._confirm, a = this._actions().find((x) => x.id === cf?.id);
        this._closeSheet(); if (cf && cf.temp !== undefined) return this._applyTemp(cf.temp);
        if (a) this._run(a); return;
      }
      this._closeSheet();
    });
    this._setEl = null;
    this._built = true;
  }

  /* ───── render ───── */
  _fmtNum(n, d = 0) { return n.toLocaleString(I18N.numLocale(), { minimumFractionDigits: 0, maximumFractionDigits: d }); }
  _tire(t) {
    const key = `sensor.${t.id}_tire_pressure`, o = this._obj(key);
    const { v, stale } = this._nl(key);
    let bar = null;
    if (v !== null) {
      const u = (o?.attributes?.unit_of_measurement || "").toLowerCase();
      bar = u === "kpa" ? v / 100 : u === "psi" ? v * 0.0689476 : u === "bar" ? v : v > 50 ? v / 100 : v;
    }
    const alarm = this._is(`binary_sensor.${t.id}_tire_alarm`, "on");
    const c = this._c;
    let tone = "148,163,184", note = "";
    const chk = c.tire_check || "vehicle", own = chk === "limits" || chk === "both", veh = chk === "vehicle" || chk === "both";
    if (bar !== null) {
      tone = "var(--ds-ok)";
      if (own) { if (bar < c.tire_min) { tone = "var(--ds-warn)"; note = "χαμηλή"; } else if (bar > c.tire_max) { tone = "var(--ds-warn)"; note = "υψηλή"; } }
      if (veh && this._is("binary_sensor.tire_pressure_warning", "on") && !TIRES.some((x) => this._is(`binary_sensor.${x.id}_tire_alarm`, "on"))) { tone = "var(--ds-warn)"; note = "έλεγξε πίεση"; } // γενική ειδοποίηση του οχήματος
    }
    if (alarm && veh) { tone = "var(--ds-bad)"; note = "συναγερμός"; }
    const unit = c.tire_unit;
    const txt = bar === null ? "--" : unit === "kPa" ? `${Math.round(bar * 100)}` : unit === "psi" ? `${(bar / 0.0689476).toFixed(1)}` : bar.toFixed(2);
    return { txt: `${txt}${bar === null ? "" : " " + unit}`, tone, note, stale, alarm: alarm && veh, name: t.name, bar };
  }

  _render() {
    if (!this._hass || !this._c) return;
    this._syncLang();
    if (!I18N.ready) return;
    if (!this._built) this._build();
    this._resolvePending();
    const sig = this._signature();
    if (sig === this._sig) return;
    this._sig = sig;
    const el = this._el, c = this._c, v = this._vehicle();

    const secs = { hero: el.hero, actions: el.actions, status: el.status, stats: el.stats, info: el.info, diagnostics: el.diag, charge: el.charge };
    const hid = new Set(c.hidden);
    c.order.forEach((id, i) => { const s = secs[id]; if (!s) return; s.style.order = i; s.toggleAttribute("data-off", hid.has(id)); });
    el.foot.style.order = 99;
    el.foot.classList.toggle("nosets", c.show_customize === false);

    /* hero */
    el.hero.classList.toggle("unlocked", v.unlocked);
    const fx = ["flow_port", "flow", "port", "sweep", "none"].includes(c.charge_fx) ? c.charge_fx : "flow_port";
    el.hero.dataset.fx = v.charging && fx !== "none" ? fx.replace("_", " ") : "";
    el.hero.style.setProperty("--ds-scale", String(c.image_scale));
    if (c.image_aspect) el.hero.style.setProperty("--ds-aspect", String(c.image_aspect)); else if (el.hero.dataset.auto) el.hero.style.setProperty("--ds-aspect", el.hero.dataset.auto); else el.hero.style.removeProperty("--ds-aspect");
    el.imgs.forEach((i) => i.classList.toggle("on", i.dataset.k === v.img));
    this._heroCv(v);
    if (/sweep/.test(el.hero.dataset.fx)) { const on = el.imgs.find((i) => i.classList.contains("on")); if (on && on.src && el.sweep.getAttribute("src") !== on.src) el.sweep.src = on.src; }
    el.plate.textContent = this._s("sensor.license_plate") || "";
    const hs = new Set(c.hero_show || []), sr = this.shadowRoot;
    sr.getElementById("nm").hidden = !hs.has("name"); el.plate.hidden = !hs.has("plate"); sr.getElementById("ttl").hidden = !hs.has("name") && !hs.has("plate");
    el.total.hidden = !hs.has("range"); el.cloud.hidden = !hs.has("cloud"); el.age.hidden = !hs.has("updated");
    const cloudOk = this._is("binary_sensor.cloud_connection", "on");
    el.cloud.className = `cloud ${cloudOk ? "ok" : "bad"}`;
    el.cloud.innerHTML = ico(cloudOk ? "cloudcheck" : "cloudoff");
    el.cloud.dataset.ent = this._id("binary_sensor.cloud_connection");
    el.cloud.title = cloudOk ? "Συνδεδεμένο" : "Εκτός σύνδεσης"; el.cloud.setAttribute("aria-label", el.cloud.title);
    el.age.textContent = T("Ενημερώθηκε {0}", this._age());
    el.age.classList.toggle("old", this._ageMin() > 180);
    this._scUpd();
    const ts = this._toastState;
    if (ts) el.toast.textContent = ts.msg;
    el.toast.className = `toast pos-${c.toast_position === "top" ? "top" : "bottom"} ${ts && c.toasts !== false ? `show ${ts.type}` : ""}`;

    {
      const ra = this._actions().find((x) => x.id === "refresh"), f = this._flashes.refresh, pend = !!this._pending.refresh;
      const rs = pend ? "pending" : f ? f.type : "";
      el.rfs.className = `rfs ${rs}`; el.rfs.disabled = !!ra.disabled; el.rfs.hidden = !!ra.disabled;
      const rl = T("Ανανέωση δεδομένων · {0}", this._age()); el.rfs.title = rl; el.rfs.setAttribute("aria-label", rl);
      el.rfs.innerHTML = ico(f && !pend ? (f.type === "success" ? "check" : "alert") : "refresh") + (pend ? RING : "");
    }

    /* κουμπιά */
    const off = this._offline();
    const lay = ["split", "grid", "scroll", "fit"].includes(c.button_layout) ? c.button_layout : "split";
    const lab = c.button_labels, showT = lab === "title" || lab === "both", showS = lab === "status" || lab === "both";
    const acts = this._actions();
    const cellOf = (id) => {
      const a = acts.find((x) => x.id === id);
      const f = this._flashes[a.id], pend = !!this._pending[a.id], state = pend ? "pending" : f ? f.type : "";
      const icon = f && !pend ? (f.type === "success" ? "check" : "alert") : a.icon;
      const tone = off ? "" : a.tone || "";
      const dot = !state && (tone === "warn" || tone === "bad") ? '<span class="dot"></span>' : "";
      const ring = pend ? '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><rect x="2.5" y="2.5" width="95" height="95" rx="47.5" pathLength="100"/></svg>' : "";
      const label = `${a.label}: ${off ? "" : a.sub || ""}`;
      const sub = off ? "" : pend ? "Αναμονή…" : f ? (f.type === "success" ? "Έτοιμο" : "Απέτυχε") : cap(a.sub || "");
      return `<div class="cell ${tone}"><button class="act ${tone} ${a.on && !off ? "on" : ""} ${state}" data-id="${a.id}" ${a.disabled || off ? "disabled" : ""} title="${esc(label)}" aria-label="${esc(label)}">${ico(icon)}${dot}${ring}</button>${showT ? `<span class="cap t">${esc(a.label)}</span>` : ""}${showS && sub ? `<span class="cap s">${esc(sub)}</span>` : ""}</div>`;
    };
    const vis = c.buttons.filter((id) => !c.buttons_hidden.includes(id));
    if (this._moreOpen === undefined) this._moreOpen = !!lsRead(`deepal-s05-more:${c.prefix}`);
    if (lay === "split") {
      const np = Math.max(1, Math.min(5, Math.round(Number(c.button_primary)) || 4)), prim = vis.slice(0, np), more = vis.slice(np);
      const keep = c.buttons_more === "show", open = keep || this._moreOpen;
      const alert = !off && more.some((id) => { const t = (acts.find((x) => x.id === id) || {}).tone; return t === "warn" || t === "bad"; });
      el.actions.className = `actions split sz-${c.button_size} ${open ? "moreopen" : ""} ${off ? "offline" : ""}`;
      el.actions.style.setProperty("--np", String(prim.length));
      el.actions.innerHTML = `<div class="prow">${prim.map(cellOf).join("")}</div>` +
        (more.length ? `<div class="mwrap"><div class="mrow" id="mrow" ${open ? "" : "inert"}>${more.map(cellOf).join("")}</div></div>` +
          (keep ? "" : `<button class="morebtn" data-more aria-expanded="${open}" aria-controls="mrow" title="${esc(T("Περισσότερα"))}" aria-label="${esc(T("Περισσότερα"))}"><span>Περισσότερα</span>${ico("chevd")}${alert ? '<span class="mdot"></span>' : ""}</button>`) : "");
    } else {
      el.actions.className = `actions ${lay} sz-${c.button_size} ${off ? "offline" : ""}`;
      el.actions.style.removeProperty("--np");
      el.actions.innerHTML = vis.map(cellOf).join("");
    }

    /* κατάσταση (πάνω στην εικόνα) */
    const st = this._status(v);
    el.status.style.cssText = `--st: ${st.rgb}`; el.status.dataset.ent = this._id("lock.doors");
    el.status.innerHTML = `${ico(st.icon)}<div><div class="t">${esc(st.text)}</div>${st.sub ? `<div class="s">${esc(st.sub)}</div>` : ""}</div>`;

    /* αυτονομία / θερμοκρασία */
    const bat = v.battery, range = this._n("sensor.remaining_range"), fuel = this._n("sensor.fuel_range"), temp = this._n("sensor.inside_temperature");
    const fl = this._n("sensor.fuel_level");
    const fuelPct = fl !== null && this._unit("sensor.fuel_level") === "%" ? fl : fuel !== null ? (fuel / c.fuel_max) * 100 : null;
    const hex2rgb = (h, d) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || "").trim()); return m ? [0, 2, 4].map((i) => parseInt(m[1].substr(i, 2), 16)).join(",") : d; };
    const LC = { r: hex2rgb(c.lvl_red, "248,113,113"), o: hex2rgb(c.lvl_orange, "251,146,60"), y: hex2rgb(c.lvl_yellow, "250,204,21"), g: hex2rgb(c.lvl_green, "52,211,153") };
    const lvl = (p, t1, t2, t3, top = LC.g) => (p === null ? "148,163,184" : p < t1 ? LC.r : p < t2 ? LC.o : p < t3 ? LC.y : top);
    const evRgb = lvl(bat, Number(c.bat_t1), Number(c.bat_t2), Number(c.bat_t3));
    const fuRgb = lvl(fuelPct, Number(c.fuel_t1), Number(c.fuel_t2), Number(c.fuel_t3));
    el.card.dataset.pad = c.card_padding || "normal"; el.card.dataset.ppad = c.popup_padding || "normal";
    el.card.style.setProperty("--ds-ev", evRgb); el.card.style.setProperty("--ds-fu", fuRgb);
    const num = (n) => (n === null ? "--" : Math.round(n));
    const fu = hasFuel(this._hass, c);
    const parts = [range, fu ? fuel : null].filter((x) => x !== null), total = parts.length ? parts.reduce((s, x) => s + x, 0) : null;
    el.total.dataset.ent = this._id("sensor.remaining_range");
    el.total.innerHTML = `<div class="big">${num(total)}<small>km</small></div><div class="cap">${fu ? "συνολική αυτονομία" : "αυτονομία"}</div>`;
    const cl = (x) => (x === null ? 0 : Math.min(100, Math.max(0, x)));
    const climOn = this._climateIsOn(), tgt = (() => { const t = this._tgt(); const n = t ? parseFloat(t.state) : NaN; return Number.isFinite(n) ? n : null; })(), pendC = !!this._pending.climate, climOk = this._s("climate.cabin_climate") !== null;
    const tgtShown = this._tpend ?? tgt;
    const leftTxt = this._fmtLeft(this._s("sensor.remaining_charge_time_h_mm"));
    const chgSub = "";
    /* Κύκλος: το ποσοστό αντιστοιχεί στο ΟΡΑΤΟ τόξο (από το κάτω όριο του tile ως το δεξί όριο), όχι σε ολόκληρο τον κύκλο */
    const GD = 40, GS = 1.5, arc = (r) => { const rp = r * GS, a = (x) => (x * 180) / Math.PI; return [180 - a(Math.asin(Math.min(1, GD / rp))) - 4, 360 - a(Math.acos(Math.min(1, GD / rp))) + 4]; };
    const [o0, o1] = arc(44), [i0, i1] = arc(33), at = (a0, a1, p) => a0 + ((a1 - a0) * cl(p)) / 100, f1 = (x) => x.toFixed(1);
    const oEnd = at(o0, o1, bat);
    const flow = v.charging && bat !== null && bat < 99.5 ? `<circle class="fg" cx="50" cy="50" r="44" stroke-width="7" pathLength="360" stroke-dasharray="${f1(o1 - oEnd)} 360" stroke-dashoffset="-${f1(oEnd)}"/><circle class="fp" cx="50" cy="50" r="44" stroke-width="7" pathLength="360" stroke-dasharray="25 360" style="--fs:-${f1(oEnd)};--fe:-${f1(Math.max(oEnd, o1 - 25))}"/>` : "";
    el.stats.innerHTML = `
      ${c.climate_ui === "circle" ? `<div class="t2 tempc" data-open="climate" data-ent="${esc(this._id("climate.cabin_climate"))}" data-hold="${esc(JSON.stringify({ action: "more-info", entity: this._id("sensor.inside_temperature") }))}" role="button" tabindex="0" aria-label="Κλιματισμός">
        <div class="tt">Θερμοκρασία</div>
        <div class="ts">Μέσα<br><b>${temp === null ? "--" : this._fmtNum(temp, 0) + "°C"}</b>${tgt === null || !climOn ? "" : `<br><span class="sub">στόχος ${this._fmtNum(tgt, 1)}°</span>`}</div>
        <button class="knob ${climOn ? "on" : ""} ${pendC ? "pending" : ""}" data-id="climate" ${climOk && !off ? "" : "disabled"} aria-label="Κλιματισμός on/off">${ico("power")}${pendC ? RING : ""}</button></div>` : `<div class="t2 temp ${climOn ? "on" : ""}" data-open="climate" data-ent="${esc(this._id("climate.cabin_climate"))}" data-hold="${esc(JSON.stringify({ action: "more-info", entity: this._id("sensor.inside_temperature") }))}" role="button" tabindex="0" aria-label="Κλιματισμός">
        <div class="tt">Κλιματισμός</div>
        <button class="tpw ${climOn ? "on" : ""} ${pendC ? "pending" : ""}" data-id="climate" ${climOk && !off ? "" : "disabled"} aria-label="Κλιματισμός on/off">${ico("power")}${pendC ? RING : ""}</button>
        <div class="ct"><span class="cur">${temp === null ? "--" : this._fmtNum(temp, 0) + "°"}</span><span class="lbl">Μέσα</span></div>
        ${tgt === null ? "" : `<div class="cstep ${climOn ? "" : "idle"}"><button class="cs" data-tp="-1" ${off ? "disabled" : ""} aria-label="Μείωση θερμοκρασίας">${ico("minus")}</button><div class="cv"><small>στόχος</small><b>${this._fmtNum(tgtShown, 1)}°</b></div><button class="cs" data-tp="1" ${off ? "disabled" : ""} aria-label="Αύξηση θερμοκρασίας">${ico("plus")}</button></div>`}
      </div>`}
      <div class="t2 batt" data-ent="${esc(this._id("sensor.battery_level"))}" role="button" tabindex="0">
        <div class="tt">${fu ? "Ενέργεια" : "Μπαταρία"}</div>
        ${v.charging ? `<div class="ts chg"><b>${T("Φορτίζει τώρα")}</b>${chgSub ? `<br><span class="sub">${chgSub}</span>` : ""}</div>` : ""}
        <div class="lg"><span style="color:rgb(${evRgb})">${ico("bolt")}<b>${num(range)}</b><small>km</small></span>${fu ? `<span style="color:rgb(${fuRgb})">${ico("fuel")}<b>${num(fuel)}</b><small>km</small></span>` : ""}</div>
        <div class="gauge"><svg viewBox="0 0 100 100" aria-hidden="true">
          <circle class="tr" cx="50" cy="50" r="44" stroke-width="7" pathLength="360" stroke-dasharray="${f1(o1 - o0)} 360" stroke-dashoffset="-${f1(o0)}"/><circle class="ev" cx="50" cy="50" r="44" stroke-width="7" pathLength="360" stroke-dasharray="${f1(oEnd - o0)} 360" stroke-dashoffset="-${f1(o0)}"/>${flow}
          ${fu ? `<circle class="tr" cx="50" cy="50" r="33" stroke-width="7" pathLength="360" stroke-dasharray="${f1(i1 - i0)} 360" stroke-dashoffset="-${f1(i0)}"/><circle class="fu" cx="50" cy="50" r="33" stroke-width="7" pathLength="360" stroke-dasharray="${f1(at(i0, i1, fuelPct) - i0)} 360" stroke-dashoffset="-${f1(i0)}"/>` : ""}</svg>
          <div class="c"><span>${bat === null ? "--" : Math.round(bat)}<small>%</small></span>${fu ? `<span class="gf" style="color:rgb(${fuRgb})">${ico("fuel")}${fuelPct === null ? "--" : Math.round(cl(fuelPct))}<small>%</small></span>` : ""}</div></div></div>`;

    this._renderVehicle(v);
    this._watchChanges(v);

    /* πληροφορίες */
    const tiles = [];
    for (const id of c.info || []) {
      if (id === "inside_temp" && !(c.hidden || []).includes("stats")) continue; /* η θερμοκρασία φαίνεται ήδη στο tile Θερμοκρασία */
      const it = INFO_ITEMS[id]; if (!it) continue;
      if (id === "fuel_level" && !hasFuel(this._hass, c)) continue;
      const { v: n, stale } = it[3] === null ? { v: null } : this._nl(it[0]);
      const s = this._s(it[0]);
      if (s === null && n === null) continue;
      const val = it[3] === null ? (s === null ? "--" : stateText(s)) : n === null ? "--" : `${this._fmtNum(n, it[3])} ${this._unit(it[0])}`.trim();
      tiles.push(`<div class="tile" data-ent="${esc(this._id(it[0]))}">${ico(it[2])}<div><div class="v">${esc(val)}</div><div class="l">${esc(it[1])}</div></div></div>`);
    }
    for (const x of c.info_custom || []) {
      const o = this._eobj(x.entity), n = o ? parseFloat(o.state) : NaN;
      const val = !o || BAD.includes(o.state) ? "--" : Number.isFinite(n) ? `${this._fmtNum(n, 1)} ${o.attributes?.unit_of_measurement || x.unit || ""}`.trim() : stateText(o.state);
      tiles.push(`<div class="tile" data-ent="${esc(x.entity)}"${x.tap_action ? ` data-tap="${esc(JSON.stringify(x.tap_action))}"` : ""}${x.hold_action ? ` data-hold="${esc(JSON.stringify(x.hold_action))}"` : ""}>${ico(x.icon || "info")}<div><div class="v">${esc(val)}</div><div class="l">${esc(x.label || o?.attributes?.friendly_name || x.entity)}</div></div></div>`);
    }
    /* διαγνωστικά: εικονίδια-ενδείξεις πάνω στην εικόνα, μόνο όταν υπάρχει κάτι να δεις */
    const hidSec = new Set(c.hidden), items = hidSec.has("diagnostics") ? [] : this._diagItems(), all = c.diag_mode === "all";
    const rank = { bad: 0, warn: 1, na: 2, ok: 3 }, dvis = items.filter((x) => all || x.on), grp = new Map();
    for (const d of dvis) { const k = `${d.icon}|${d.st}`, g = grp.get(k); if (g) { g.n++; g.label += `, ${d.label}`; } else grp.set(k, { ...d, n: 1 }); }
    const shown = [...grp.values()].sort((a, b) => rank[a.st] - rank[b.st]), hw = el.hero ? el.hero.clientWidth : 0, MAXT = !hw ? 4 : hw < 330 ? 2 : hw < 400 ? 3 : 4, top = shown.slice(0, MAXT), rest = dvis.length - top.reduce((t, g) => t + g.n, 0);
    el.tells.innerHTML = top.map((d) => `<button class="tell ${d.st}" ${d.n > 1 ? "data-diag-open" : `data-ent="${esc(d.ent)}"`} title="${esc(d.label)}" aria-label="${esc(d.label)}">${icoBadge(d.icon)}${d.n > 1 ? `<b class="n">${d.n}</b>` : ""}</button>`).join("")
      + (rest > 0 ? `<button class="tell more" data-diag-open title="${esc(T("Όλες οι ενδείξεις"))}" aria-label="${esc(T("Όλες οι ενδείξεις"))}">+${rest}</button>` : "");
    el.tells.toggleAttribute("hidden", !shown.length);
    el.info.innerHTML = tiles.join("");
    el.info.toggleAttribute("data-off", !tiles.length || hidSec.has("info"));
    el.diag.toggleAttribute("data-empty-diag", true);

    /* φόρτιση */
    const showCharge = v.charging || v.plugged, cst = ["text", "line", "big", "beside"].includes(c.charge_style) ? c.charge_style : "line";
    el.chgbox.className = "chgbox " + cst; el.chgline.className = "chgline s-" + cst;
    el.charge.hidden = true;
    el.chgbox.hidden = el.chgline.hidden = !showCharge;
    if (showCharge) {
      const left = this._s("sensor.remaining_charge_time_h_mm"), type = this._s("sensor.charging_type");
      const curRaw = this._chargeCurrent(), pre = (curRaw.match(/^(AC|DC)\s/) || [])[1] || "";
      const cur = curRaw ? curRaw.replace(/^(AC|DC)\s+/, "") : "", rem = left && v.charging ? this._fmtLeft(left) : "", typ = type || pre || "";
      const known = [cur, rem, typ].filter(Boolean);
      el.chgbox.hidden = el.chgline.hidden = !known.length; /* αν δεν υπάρχει κανένα στοιχείο δεν δείχνουμε τίποτα (όχι «--») */
      if (cst === "line") el.chgbox.innerHTML = ico("bolt") + known.map((x) => `<span>${esc(x)}</span>`).join("<i>·</i>");
      else if (cst === "big") { const m = cur && /^(.*?)\s*([A-Za-z]+)$/.exec(cur); el.chgbox.innerHTML = (cur ? `<span class="a">${esc(m ? m[1] : cur)}${m ? `<small>${esc(m[2])}</small>` : ""}</span>` : "") + `<span class="b">${esc([typ, rem].filter(Boolean).join(" · "))}${rem ? ` <em>Απομένουν</em>` : ""}</span>`; }
      else el.chgbox.innerHTML = (cur ? `<span class="a">${esc(cur)}</span>` : "") + (rem ? `<span class="b">${esc(rem)} <em>Απομένουν</em></span>` : "") + (typ ? `<span class="c">${esc(typ)}</span>` : "");
    }

    /* φύλλα */
    if (this._confirm) {
      const [title, text] = CONFIRM_TEXT[this._confirm.key] || ["Να συνεχίσω;", ""];
      el.box.className = "box confirm";
      el.box.innerHTML = `<h3>${esc(title)}</h3><p class="c">${esc(text)}</p><div class="btnrow"><button class="btn" data-close>Ακύρωση</button><button class="btn go" data-sheet="yes">Επιβεβαίωση</button></div>`;
      this._setEl = null;
      el.sheet.classList.add("show");
    } else if (this._diagSheet && !this._customize) {
      el.box.className = "box wide dg";
      el.box.innerHTML = this._diagHtml();
      this._setEl = null;
      el.sheet.classList.add("show");
    } else if (this._customize) {
      if (!this._setEl || !el.box.contains(this._setEl)) {
        el.box.className = "box";
        el.box.innerHTML = `<div class="hd"><h3>Ρυθμίσεις κάρτας</h3><button class="x" data-close aria-label="Κλείσιμο">${ico("close")}</button></div>`;
        const s = document.createElement(SETTINGS_TAG);
        s.mode = "card";
        s.tab = this._stab;
        s.onTab = (t) => { this._stab = t; this._uiSave(); };
        s.onPatch = (p) => this._patch(p);
        s.onReset = () => this._resetLocal();
        el.box.appendChild(s);
        this._setEl = s;
        if (this._restoreSc) { const y = this._restoreSc; this._restoreSc = 0; requestAnimationFrame(() => { el.box.scrollTop = y; }); }
      }
      this._setEl.hass = this._hass;
      this._setEl.cfg = this._c;
      this._setEl.yamlBase = this._yaml;
      el.sheet.classList.add("show");
    } else {
      this._setEl = null;
      el.sheet.classList.remove("show");
    }
    el.box.setAttribute("aria-label", this._confirm ? (CONFIRM_TEXT[this._confirm.key] || ["Επιβεβαίωση"])[0] : this._diagSheet && !this._customize ? "Διαγνωστικά" : "Ρυθμίσεις κάρτας");
    this._focusSync();
  }

  /* ───── πάτημα / παρατεταμένο πάτημα σε αισθητήρες ───── */
  _bindPress() {
    const root = this._el.card; let st = null;
    root.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || e.target.closest("[data-id],[data-tp],[data-more]")) return;
      const t = e.target.closest("[data-ent],[data-open]"); if (!t) return;
      st = { t, x: e.clientX, y: e.clientY, held: false };
      st.timer = setTimeout(() => { if (st) { st.held = true; try { navigator.vibrate && navigator.vibrate(15); } catch (_) {} this._hold(st.t); } }, 520);
    });
    root.addEventListener("pointermove", (e) => { if (st && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 10) { clearTimeout(st.timer); st.moved = true; } });
    const end = (cancel) => { if (!st) return; clearTimeout(st.timer); const s = st; st = null; if (!cancel && !s.held && !s.moved) this._tap(s.t); };
    root.addEventListener("pointerup", () => end(false));
    root.addEventListener("pointercancel", () => end(true));
    root.addEventListener("contextmenu", (e) => { if (e.target.closest("[data-ent]")) e.preventDefault(); });
  }
  /* κινητό: το popup κλείνει με σύρσιμο προς τα κάτω από την κορυφή του (λαβή) */
  _swipe(box, sheet) {
    let st = null;
    const mobile = () => window.matchMedia && window.matchMedia("(max-width: 639px)").matches;
    box.addEventListener("pointerdown", (e) => {
      if (e.button > 0 || !mobile() || e.target.closest("button,input,select,textarea,a")) return;
      const r = box.getBoundingClientRect(); if (e.clientY - r.top > 64) return;
      st = { y: e.clientY, id: e.pointerId, dy: 0, t: Date.now() }; try { box.setPointerCapture(e.pointerId); } catch (_) {}
      box.style.transition = "none";
    });
    box.addEventListener("pointermove", (e) => {
      if (!st || e.pointerId !== st.id) return;
      st.dy = Math.max(0, e.clientY - st.y); box.style.transform = `translateY(${st.dy}px)`; sheet.style.background = `rgba(0,0,0,${Math.max(0.1, 0.62 - st.dy / 700)})`;
    });
    const end = (cancel) => {
      if (!st) return; const s = st; st = null;
      box.style.transition = "transform .22s ease"; sheet.style.background = "";
      const fast = s.dy / Math.max(1, Date.now() - s.t) > 0.6;
      if (!cancel && (s.dy > 90 || (fast && s.dy > 30))) { box.style.transform = "translateY(100%)"; setTimeout(() => { box.style.transition = ""; box.style.transform = ""; this._closeTop(); }, 200); }
      else { box.style.transform = ""; setTimeout(() => { box.style.transition = ""; }, 240); }
    };
    box.addEventListener("pointerup", () => end(false)); box.addEventListener("pointercancel", () => end(true));
  }
  _cfgOf(t, k) { try { return t.dataset[k] ? JSON.parse(t.dataset[k]) : null; } catch (_) { return null; } }
  _tap(t) {
    if (t.dataset.open && !t.dataset.tap) { this._view = t.dataset.open; return this._force(); }
    this._act(this._cfgOf(t, "tap") || { action: "more-info" }, t.dataset.ent);
  }
  _hold(t) {
    const a = this._cfgOf(t, "hold");
    if (a) return this._act(a, t.dataset.ent);
    this._tap(t);
  }
  _act(cfg, ent) {
    const a = cfg.action || "more-info", id = cfg.entity || ent;
    if (a === "more-info") { if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } })); return; }
    if (a === "toggle") return this._hass.callService("homeassistant", "toggle", { entity_id: id });
    if (a === "call-service" || a === "perform-action") {
      const [dom, svc] = String(cfg.service || cfg.perform_action || "").split(".");
      if (!dom || !svc) return this._toast("Λάθος υπηρεσία στο action", "error");
      return this._hass.callService(dom, svc, { ...(cfg.data || cfg.service_data || {}), ...(cfg.target || {}) })
        .then(() => this._toast("Η ενέργεια εστάλη", "ok")).catch((err) => this._toast(err?.message || "Η ενέργεια απέτυχε", "error"));
    }
    if (a === "navigate" && /^\/(?!\/)/.test(String(cfg.navigation_path || ""))) { history.pushState(null, "", cfg.navigation_path); window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } })); return; }
    if (a === "url" && /^(https?:\/\/|\/(?!\/))/i.test(String(cfg.url_path || ""))) window.open(cfg.url_path, "_blank", "noopener,noreferrer"); // ασφάλεια: όχι javascript:/data:
  }

  /* ───── number picker (προσαρμογή του deepal-number-picker) ───── */
  _pkInit() {
    const p = this._el.pkp, IW = 64;
    const idx = () => (this._pk ? Math.max(0, Math.min(this._pk.vals.length - 1, Math.round(p.scrollLeft / IW))) : 0);
    p.addEventListener("scroll", () => {
      if (!this._pk) return;
      const i = idx();
      if (i !== this._pkIdx) { this._pkIdx = i; this._pkPaint(i); }
      if (this._pkProg) return;
      clearTimeout(this._pkT);
      this._pkT = setTimeout(() => this._pkSettle(i), 220);
    }, { passive: true });
    const user = () => { this._pkUser = true; clearTimeout(this._pkUT); this._pkUT = setTimeout(() => { this._pkUser = false; }, 2500); };
    ["pointerdown", "touchstart", "wheel"].forEach((ev) => p.addEventListener(ev, user, { passive: true }));
    p.addEventListener("click", (e) => {
      const n = e.target.closest(".pn"); if (!n) return;
      user(); this._pkProg = false; p.scrollTo({ left: Number(n.dataset.i) * IW, behavior: "smooth" });
    });
  }
  _pkSetup(o) {
    const a = o.attributes || {}, min = Number(a.min ?? 16), max = Number(a.max ?? 32), step = Number(a.step || 0.5), key = `${min}|${max}|${step}`;
    if (this._pkKey === key) return;
    const dec = (String(step).split(".")[1] || "").length, vals = [];
    for (let x = min; x <= max + step / 100; x += step) vals.push(Number(x.toFixed(dec)));
    this._pk = { vals, dec }; this._pkKey = key; this._pkIdx = -1;
    this._el.pkp.innerHTML = vals.map((x, i) => `<div class="pn" data-i="${i}">${x.toFixed(dec)}</div>`).join("");
    this._pkItems = [...this._el.pkp.children];
  }
  _pkPaint(i) {
    const { vals, dec } = this._pk;
    this._pkItems.forEach((n, k) => { n.classList.toggle("act2", k === i); n.classList.toggle("near", Math.abs(k - i) === 1); });
    this._el.pkv.textContent = vals[i].toFixed(dec);
    this._airTone(vals[i]);
    this._el.pk.classList.toggle("cold", vals[i] <= 20); this._el.pk.classList.toggle("hot", vals[i] >= 26);
  }
  _pkScroll(i, smooth) {
    this._pkProg = true; this._el.pkp.scrollTo({ left: i * 64, behavior: smooth ? "smooth" : "auto" });
    clearTimeout(this._pkPT); this._pkPT = setTimeout(() => { this._pkProg = false; }, smooth ? 450 : 150);
  }
  async _pkSettle(i) {
    this._pkUser = false;
    const o = this._tgt(); if (!o || !this._pk) return;
    const v = this._pk.vals[i], cur = parseFloat(o.state);
    if (Number.isFinite(cur) && Math.abs(cur - v) < 0.001) return;
    if (this._needTempConfirm()) { this._tpend = v; return this._askTemp(v); }
    this._tpend = v; clearTimeout(this._tTimer2);
    this._tTimer2 = setTimeout(() => { this._tpend = undefined; this._force(); }, 6000);
    this._force();
    try { await this._setTgt(v); }
    catch (err) { this._tpend = undefined; this._toast(err?.message ? T("Απέτυχε: {0}", err.message) : T("Η εντολή απέτυχε"), "error"); }
  }

  _renderVehicle(v) {
    const el = this._el, c = this._c, view = this._view === "seats" || this._view === "climate" ? this._view : "iso";
    el.vsheet.classList.toggle("show", this._vsheetOpen());
    this.shadowRoot.getElementById("vtitle").textContent = view === "iso" ? "Car View" : view === "climate" ? "Κλιματισμός" : "Καθίσματα & τιμόνι";
    if (!this._vsheetOpen()) { this._pkIdx = -1; return; }
    el.vtabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.vv === view));
    el.viso.hidden = view !== "iso"; el.vclim.hidden = view !== "climate"; el.vseats.hidden = view !== "seats";
    el.vextra.hidden = view !== "iso";
    if (view !== "climate") this._pkIdx = -1;
    if (view === "iso") {
      this._isoRender(v);
    } else if (view === "seats") {
      for (const [id, key, , , , , layer] of INT_SPOTS) {
        const lv = this._level(key), max = this._obj(key)?.attributes?.max ?? 3;
        const L = el.vseats.querySelector(`img[data-l="${layer}"]`);
        if (L) { L.classList.toggle("on", lv > 0); L.style.opacity = lv > 0 ? String(key.startsWith("switch.") ? 1 : 0.4 + 0.6 * (lv / max)) : ""; }
        for (const b of el.vseats.querySelectorAll(`[data-spot="${id}"]`)) {
          b.classList.toggle("lv", lv > 0);
          const bars = b.querySelectorAll(".lvl i"); bars.forEach((i, k) => i.classList.toggle("f", k < lv));
          const lvl = b.querySelector(".lvl"); if (lvl) lvl.hidden = key.startsWith("switch.");
          b.setAttribute("aria-pressed", String(lv > 0));
        }
      }
    } else {
      const on = this._climateIsOn(), steer = this._level("switch.steering_wheel_heating") > 0;
      const im = el.dash.querySelector("img"), k = steer ? "dash_off_steer" : "dash_off";
      if (im.dataset.key !== k) { im.dataset.key = k; im.dataset.i = "0"; im.style.visibility = ""; im.src = this._heroSrc(k, 0); }
      el.dash.classList.toggle("air", on);
      const fan = parseFloat(this._s("sensor.climate_fan_level"));
      this._airTone(this._tpend ?? parseFloat((this._tgt() || {}).state));
      el.dash.querySelector(".air").style.setProperty("--sp", String(Number.isFinite(fan) ? Math.min(1.9, Math.max(0.7, 0.65 + fan * 0.16)) : 1));
      const inside = this._n("sensor.inside_temperature"), fanTxt = this._s("sensor.climate_fan_level"), pend = !!this._pending.climate;
      el.vtctl.innerHTML = `<div class="crow"><div class="in"><b>${on ? "Ενεργός" : "Ανενεργός"}</b><br>${inside === null ? "" : `Μέσα ${this._fmtNum(inside, 1)}°C`}${fanTxt === null || !on ? "" : ` · ένταση ${esc(fanTxt)}`}</div>
        <button class="act ${on ? "on" : ""} ${pend ? "pending" : ""}" data-id="climate" aria-label="Κλιματισμός on/off">${ico("power")}${pend ? RING : ""}</button></div>`;
      const no = this._tgt();
      el.pk.hidden = !no;
      if (no) {
        this._pkSetup(no);
        const val = this._tpend ?? parseFloat(no.state);
        if (Number.isFinite(val) && !this._pkUser && this._pk) {
          let best = 0, bd = Infinity; this._pk.vals.forEach((x, i) => { const d = Math.abs(x - val); if (d < bd) { bd = d; best = i; } });
          if (best !== this._pkIdx) { this._pkIdx = best; this._pkPaint(best); this._pkScroll(best, false); }
        }
      }
    }
  }
}

