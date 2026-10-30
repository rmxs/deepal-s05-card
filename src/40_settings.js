/* ───────────────────────── Ρυθμίσεις (UI) ─────────────────────────
 * Ένα κοινό στοιχείο που χρησιμοποιείται και μέσα στην κάρτα (αποθήκευση στη συσκευή)
 * και στον επεξεργαστή του Home Assistant (αποθήκευση στο YAML της κάρτας). */
const INT_FILES_ALL = ["base", ...INT_LAYERS];
const ALL_FILES = { ...HERO_FILES, ...DASH_FILES };
const heroBases = (c) => (c.image_path ? [normPath(c.image_path)] : [`${SCRIPT_BASE}images/car/`]);

class DeepalS05Settings extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }); I18N.watch(this.shadowRoot);
    this.mode = "card"; this.tab = "vehicle"; this._form = { entity: "", label: "", icon: "info", mkey: "", ment: "", mdi: "" }; this._disc = null;
    this._sig = null; this._note = "";
  }
  set hass(h) { this._hass = h; }
  set cfg(c) {
    const s = JSON.stringify(c);
    if (s === this._sig) return;
    this._sig = s; this._cfg = c; this._render();
  }
  get cfg() { return this._cfg; }
  _emit(p) { this.onPatch && this.onPatch(p); }
  _setTab(t) { this.tab = t; this.onTab && this.onTab(t); this._render(); }

  _tabs() {
    const T = [["vehicle", "Όχημα", "carside"], ["sections", "Ενότητες", "eye"], ["buttons", "Κουμπιά", "power"], ["sensors", "Αισθητήρες", "gauge"], ["charge", "Φόρτιση", "bolt"], ["tires", "Ελαστικά", "tire"], ["look", "Εμφάνιση", "sliders"], ["images", "Εικόνες", "image"], ["general", "Γενικά", "info"]];
    return `<div class="tabbar"><button class="tn l" data-tn="-1" aria-label="Προηγούμενες καρτέλες" hidden>${ico("chevr")}</button><div class="tabs">${T.map(([k, l, i]) => `<button data-tab="${k}" class="${this.tab === k ? "on" : ""}">${ico(i)}<span>${l}</span></button>`).join("")}</div><button class="tn r" data-tn="1" aria-label="Επόμενες καρτέλες" hidden>${ico("chevr")}</button></div>`;
  }
  _orderList(all, order, hidden, labelOf, kind) {
    return `<div class="list">${order.map((id, i) => {
      const off = hidden.includes(id);
      return `<div class="row ${off ? "off" : ""}"><span>${esc(labelOf(id))}</span>
        <button class="mv" data-mv="${kind}|${id}|-1" ${i === 0 ? "disabled" : ""} aria-label="Πάνω">${ico("up")}</button>
        <button class="mv" data-mv="${kind}|${id}|1" ${i === order.length - 1 ? "disabled" : ""} aria-label="Κάτω">${ico("down")}</button>
        <button class="swb" data-vis="${kind}|${id}" aria-label="Εμφάνιση"><i class="sw ${off ? "" : "on"}"></i></button></div>`;
    }).join("")}</div>`;
  }
  _sel(name, val, opts) { return `<select data-set="${name}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(val) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`; }
  _num(name, val, step = "0.1") { return `<input type="number" step="${step}" data-set="${name}" data-num value="${esc(val)}">`; }
  _datalist() {
    const ids = Object.keys(this._hass?.states || {}).sort();
    return `<datalist id="ents">${ids.map((i) => `<option value="${esc(i)}"></option>`).join("")}</datalist>`;
  }
  _iconPick() {
    return `<div class="icons">${PICKABLE_ICONS.map((n) => `<button data-icon="${n}" class="${this._form.icon === n ? "on" : ""}" aria-label="${n}">${ico(n)}</button>`).join("")}</div>`;
  }
  _addForm(kind) {
    return `<div class="add"><label class="field">Οντότητα<input type="text" list="ents" data-f="entity" placeholder="π.χ. sensor.my_value" value="${esc(this._form.entity)}"></label>
      <label class="field">Ετικέτα (προαιρετικά)<input type="text" data-f="label" value="${esc(this._form.label)}"></label>
      <div class="field">Εικονίδιο${this._iconPick()}</div>
      <label class="field">Ή εικονίδιο του HA (προαιρετικά)<input type="text" data-f="mdi" placeholder="π.χ. mdi:car-brake-abs" value="${esc(this._form.mdi)}"></label>
      <button class="btn sm" data-add="${kind}">${ico("plus")} Προσθήκη</button></div>`;
  }
  _discHtml(c) {
    const ign = (c.diag_ignore || []).length, list = this._disc;
    const rows = list ? (list.length ? `<div class="list">${list.map((f) => `<div class="row">${icoBadge(f.icon)}<span>${esc(f.label)}<small>${esc(f.entity)}</small></span><button class="btn sm" data-dadd="${esc(f.entity)}">${ico("plus")} ${esc(T("Προσθήκη"))}</button></div>`).join("")}</div>
      ${list.length > 1 ? `<div class="btnrow"><button class="btn sm pl" data-daddall>${ico("plus")} ${esc(T("Προσθήκη όλων"))}</button></div>` : ""}` : `<p class="hint">✓ ${esc(T("Δεν βρέθηκαν νέοι αισθητήρες."))}</p>`) : "";
    return `<div id="sensors-disc"><div class="btnrow"><button class="btn sm" data-discover>${ico("refresh")} ${esc(T("Αναζήτηση νέων αισθητήρων"))}</button>${ign ? `<button class="btn sm" data-dreset>${esc(T("Εμφάνιση ξανά όσων αγνόησα"))} (${ign})</button>` : ""}</div>${rows}</div>`;
  }
  _customRows(arr, kind) {
    return arr.length ? `<div class="list">${arr.map((x, i) => `<div class="row">${ico(x.icon || "info")}<span>${esc(x.label || x.entity)}<small>${esc(x.entity)}</small></span>
      <button class="mv" data-del="${kind}|${i}" aria-label="Διαγραφή">${ico("trash")}</button></div>`).join("")}</div>` : "";
  }

  _tabSections(c) {
    return `<p class="hint">${T("Βάλε τις ενότητες με τη σειρά που θέλεις (π.χ. πρώτα κουμπιά, μετά η εικόνα, μετά η αυτονομία) και κρύψε όσες δεν χρειάζεσαι.")}</p>
      ${this._orderList(SECTIONS, c.order, c.hidden, (i) => SECTION_LABELS[i], "sec")}
      <h4>Πάνω στην εικόνα</h4>
      <div class="list">${HERO_SHOW_OPTS.map(([k, l]) => `<button class="row tg ${(c.hero_show || []).includes(k) ? "on" : ""}" data-hs="${k}"><span>${l}</span><i class="sw ${(c.hero_show || []).includes(k) ? "on" : ""}"></i></button>`).join("")}</div>`;
  }
  _tabButtons(c) {
    const conf = [["lock", "Κλείδωμα"], ["unlock", "Ξεκλείδωμα"], ["windows", "Άνοιγμα παραθύρων"], ["trunk", "Άνοιγμα πορτμπαγκάζ"], ["climate", "Κλιματισμός"], ["flash", "Φώτα"], ["honk", "Κόρνα"], ["find", "Εντοπισμός"], ["refresh", "Ανανέωση δεδομένων"]];
    return `<p class="hint">Σειρά και εμφάνιση των κουμπιών ελέγχου.</p>
      ${this._orderList(BUTTON_IDS, c.buttons, c.buttons_hidden, (i) => BUTTON_LABELS[i], "btn")}
      <h4>Εμφάνιση</h4>
      <label class="field inline">Διάταξη ${this._sel("button_layout", c.button_layout, [["split", "Κύρια κουμπιά + «Περισσότερα»"], ["grid", "Σειρές (5 ανά γραμμή)"], ["scroll", "Μία γραμμή με scroll"], ["fit", "Μία γραμμή (χωράνε όλα)"]])}</label>
      <label class="field inline">Κείμενα ${this._sel("button_labels", c.button_labels, [["none", "Χωρίς κείμενο"], ["status", "Μόνο κατάσταση"], ["title", "Μόνο τίτλος"], ["both", "Τίτλος + κατάσταση (2 γραμμές)"]])}</label>
      ${c.button_layout === "split" || !c.button_layout ? `${this._opt("Κύρια κουμπιά", this._seg("button_primary", String(c.button_primary || 4), [["3", "3"], ["4", "4"], ["5", "5"]]), "Τα πρώτα κουμπιά της λίστας μπαίνουν στην κύρια σειρά, τα υπόλοιπα στο «Περισσότερα».")}${this._opt("Τα υπόλοιπα", this._seg("buttons_more", c.buttons_more || "collapse", [["collapse", "Κρυμμένα"], ["show", "Πάντα ορατά"]]))}` : ""}
      ${this._opt("Πλακίδιο κλιματισμού", this._seg("climate_ui", c.climate_ui === "circle" ? "circle" : "steps", [["steps", "Στόχος με − / +"], ["circle", "Μεγάλος κύκλος"]]), "Στόχος με − / +: δείχνει τη θερμοκρασία και ρυθμίζεις τον στόχο. Μεγάλος κύκλος: το κλασικό πλακίδιο με το μεγάλο κουμπί on/off.")}
      ${this._opt("Μέγεθος", this._seg("button_size", c.button_size, [["s", "Μικρά"], ["m", "Μεσαία"], ["l", "Μεγάλα"]]))}
      <h4>Ζητά επιβεβαίωση</h4>
      <div class="list">${conf.map(([k, l]) => `<button class="row tg ${c.confirm.includes(k) ? "on" : ""}" data-conf="${k}"><span>${l}</span><i class="sw ${c.confirm.includes(k) ? "on" : ""}"></i></button>`).join("")}</div>`;
  }
  _tabSensors(c) {
    const selIds = Array.isArray(c.diag) ? c.diag : DIAG.map((d) => d[0]);
    const has = (k) => this._hass?.states?.[resolveId(this._hass, c, k)];
    const nod = (k) => { const st = has(k)?.state; return st === "unknown" || st === "unavailable" ? ` <small class="nod">Χωρίς δεδομένα</small>` : ""; };
    const dRows = DIAG.filter((d) => has(d[0])).map((d) => `<button class="row tg ${selIds.includes(d[0]) ? "on" : ""}" data-diag="${d[0]}">${icoBadge(d[2])}<span>${esc(d[1])}</span><i class="sw ${selIds.includes(d[0]) ? "on" : ""}"></i></button>`).join("");
    const iRows = INFO_IDS.filter((i) => has(INFO_ITEMS[i][0]) && (i !== "fuel_level" || hasFuel(this._hass, c))).map((i) => `<button class="row tg ${c.info.includes(i) ? "on" : ""}" data-info="${i}">${ico(INFO_ITEMS[i][2])}<span>${esc(INFO_ITEMS[i][1])}${nod(INFO_ITEMS[i][0])}</span><i class="sw ${c.info.includes(i) ? "on" : ""}"></i></button>`).join("");
    const ents = Object.entries(c.entities);
    return `${this._datalist()}
      <h4>Διαγνωστικά</h4>
      <div class="seg"><button data-dmode="alerts" class="${c.diag_mode === "alerts" ? "on" : ""}">Μόνο ειδοποιήσεις</button><button data-dmode="all" class="${c.diag_mode === "all" ? "on" : ""}">Πάντα όλες</button></div>
      <div class="list">${dRows}</div>
      <div class="btnrow"><button class="btn sm" data-dall="0">Καμία</button><button class="btn sm" data-dall="1">Όλες</button></div>
      <h4>Νέοι αισθητήρες</h4>
      <p class="hint">${T("Αν το integration προσθέσει νέες προειδοποιήσεις, η κάρτα μπορεί να τις βρει και να τις προσθέσει στα διαγνωστικά.")}</p>
      ${this._discHtml(c)}
      <h4>Δικά μου διαγνωστικά</h4>
      <p class="hint">${T("Οποιαδήποτε οντότητα. Θεωρείται ενεργή όταν είναι on / problem / alarm.")}</p>
      ${this._customRows(c.diag_custom, "diag_custom")}${this._addForm("diag_custom")}
      <h4>Πληροφορίες</h4>
      <div class="list">${iRows}</div>
      ${this._customRows(c.info_custom, "info_custom")}${this._addForm("info_custom")}
      <h4>Αντιστοίχιση οντοτήτων</h4>
      <p class="hint">${T("Αν κάποια οντότητα έχει διαφορετικό όνομα από το αναμενόμενο {0}, όρισε εδώ ποια να χρησιμοποιηθεί.", `<code>${esc(c.prefix)}_…</code>`)}</p>
      ${ents.length ? `<div class="list">${ents.map(([k, v]) => `<div class="row"><span>${esc(k)}<small>${esc(v)}</small></span><button class="mv" data-delent="${esc(k)}">${ico("trash")}</button></div>`).join("")}</div>` : ""}
      <div class="add"><label class="field">Κλειδί${this._sel("_mkey", this._form.mkey, [["", "— διάλεξε —"], ...uniq(OTHER_KEYS).map((k) => [k, k])])}</label>
        <label class="field">Οντότητα<input type="text" list="ents" data-f="ment" value="${esc(this._form.ment)}"></label>
        <button class="btn sm" data-addent>${ico("plus")} Αντιστοίχιση</button></div>`;
  }
  _tabImages(c) {
    return `<p class="hint">${T("Οι φωτογραφίες φορτώνονται από τον φάκελο {0} δίπλα στην κάρτα. Εδώ μπορείς να ορίσεις άλλον φάκελο ή άλλο αρχείο για κάθε φωτογραφία και να ελέγξεις ότι βρίσκεται.", "<code>images/car/</code>")}</p>
      <label class="field">Φάκελος φωτογραφιών hero (κενό = αυτόματα)<input type="text" data-set="image_path" data-text value="${esc(c.image_path || "")}" placeholder="${esc(SCRIPT_BASE)}images/car/"></label>
      <h4>Φωτογραφίες (hero & ταμπλό)</h4>
      <div class="list">${Object.keys(ALL_FILES).map((k) => `<div class="chk"><span class="th" data-probe-hero="${k}"></span><div style="min-width:0;flex:1"><div>${esc(HERO_LABELS[k])}</div><input type="text" data-img="${k}" value="${esc(c.images[k] || "")}" placeholder="${esc(ALL_FILES[k])}"></div><span class="st" data-st-hero="${k}">…</span></div>`).join("")}</div>`;
  }
  _probe() {
    const c = this._cfg, sr = this.shadowRoot, hb = heroBases(c);
    const test = (urls, cb) => { const im = new Image(); let i = 0; im.onload = () => cb(urls[i]); im.onerror = () => { i++; i < urls.length ? (im.src = urls[i]) : cb(null); }; im.src = urls[0]; };
    Object.keys(ALL_FILES).forEach((k) => {
      const f = c.images[k] || ALL_FILES[k];
      const urls = /^(https?:)?\/\/|^\//.test(f) ? [f] : hb.map((b) => b + f);
      test(urls, (u) => {
        const th = sr.querySelector(`[data-probe-hero="${k}"]`), st = sr.querySelector(`[data-st-hero="${k}"]`);
        if (th && u) th.style.backgroundImage = `url("${String(u).replace(/["\\\n\r()]/g, encodeURIComponent)}")`;
        if (st) { st.textContent = u ? "✓" : "✗"; st.className = `st ${u ? "ok" : "no"}`; }
      });
    });
  }
  /* helpers σχεδίασης */
  _seg(name, val, opts) { return `<div class="seg wide">${opts.map(([v, l]) => `<button data-sset="${name}|${v}" class="${String(v) === String(val) ? "on" : ""}">${esc(l)}</button>`).join("")}</div>`; }
  _opt(label, ctrl, sub) { return `<div class="opt"><div class="ol">${label}${sub ? `<small>${sub}</small>` : ""}</div>${ctrl}</div>`; }
  _tg(key, on, label, sub) { return `<button class="row tg ${on ? "on" : ""}" data-tgl="${key}"><span>${label}${sub ? `<small>${sub}</small>` : ""}</span><i class="sw ${on ? "on" : ""}"></i></button>`; }
  _tabGeneral(c) {
    const cfgOut = this._exportObj();
    return `<h4>Κάρτα</h4>
      ${this._opt("Γλώσσα", this._sel("language", c.language || "auto", [["auto", "Αυτόματα (γλώσσα του HA)"], ...I18N.available()]))}
      <label class="field">Κλιματισμός on-mode<input type="text" data-set="climate_on_mode" data-text value="${esc(c.climate_on_mode || "")}" placeholder="auto"></label>
      <h4>Ρυθμίσεις στην κάρτα</h4>
      ${this._tg("show_customize", c.show_customize !== false, "Κουμπί «Ρυθμίσεις» στην κάρτα", "Αν το κρύψεις, οι ρυθμίσεις ανοίγουν μόνο από τον επεξεργαστή της κάρτας (Επεξεργασία dashboard).")}
      <h4>Εξαγωγή / επαναφορά</h4>
      <p class="hint">${this.mode === "card" ? T("Οι ρυθμίσεις γράφονται αυτόματα στο YAML της κάρτας στο dashboard, άρα είναι κοινές σε όλες τις συσκευές και τους χρήστες. Αν το dashboard δεν επιτρέπει αποθήκευση (όχι διαχειριστής ή YAML mode), αποθηκεύονται στον λογαριασμό σου και μπορείς να αντιγράψεις το YAML παρακάτω.") : T("Οι ρυθμίσεις αποθηκεύονται στο YAML της κάρτας.")}</p>
      <textarea readonly id="yaml">${esc(toYaml(cfgOut))}</textarea>
      <div class="btnrow"><button class="btn sm" data-copy>${ico("copy")} Αντιγραφή YAML</button><button class="btn sm" data-reset>${ico("refresh")} Επαναφορά</button></div>
      <div class="note" id="note">${esc(this._note)}</div>`;
  }
  _tabCharge(c) {
    const hc = (k) => hexc(c[k], DEFAULTS[k]);
    const lv = (t1, t2, t3, top = "lvl_green") => { const a = Number(t1) || 0, b = Number(t2) || 0, d = Number(t3) || 0; return `background:linear-gradient(90deg, ${hc("lvl_red")} 0 ${a}%, ${hc("lvl_orange")} ${a}% ${b}%, ${hc("lvl_yellow")} ${b}% ${d}%, ${hc(top)} ${d}% 100%)`; };
    const sw = (k, l) => `<label class="sw-c"><input type="color" data-set="${k}" data-text value="${esc(hexc(c[k], DEFAULTS[k]))}"><span>${l}</span></label>`;
    const rowL = (k, l, bk, fk) => `<div class="lvrow">${sw(k, l)}${bk ? this._num(bk, c[bk], "1") : `<i class="dash">—</i>`}${fk ? this._num(fk, c[fk], "1") : `<i class="dash">—</i>`}</div>`;
    const fu = hasFuel(this._hass, c);
    return `<h4>Στοιχεία φόρτισης</h4>
      ${this._opt("Στυλ", this._seg("charge_style", c.charge_style || "line", [["line", "Γραμμή"], ["text", "Κείμενο"], ["big", "Μεγάλο"], ["beside", "Στη θύρα"]]), "Ρεύμα, χρόνος που απομένει και τύπος φόρτισης ως κείμενο πάνω στην εικόνα.")}
      <h4>Εφέ φόρτισης</h4>
      <label class="field">Εφέ φόρτισης πάνω στο αμάξι${this._sel("charge_fx", c.charge_fx || "flow_port", [["flow_port", "Ροή στο καλώδιο + παλμός στη θύρα"], ["flow", "Ροή ενέργειας στο καλώδιο"], ["port", "Παλμός στη θύρα φόρτισης"], ["sweep", "Σάρωση φωτός πάνω στο αμάξι"], ["none", "Κανένα"]])}</label>
      <h4>Χρώματα επιπέδων</h4>
      <p class="hint">Η μπάρα μπαταρίας και καυσίμου αλλάζει χρώμα ανάλογα με το ποσοστό. Όρισε τα όρια (κάτω από κάθε τιμή) και τα χρώματα.</p>
      <div class="lvhead"><span></span><span>Μπαταρία (%)</span><span>Καύσιμο (%)</span></div>
      ${rowL("lvl_red", "Κόκκινο", "bat_t1", "fuel_t1")}${rowL("lvl_orange", "Πορτοκαλί", "bat_t2", "fuel_t2")}${rowL("lvl_yellow", "Κίτρινο", "bat_t3", "fuel_t3")}${rowL("lvl_green", "Πράσινο", null, null)}
      <div class="lvbar" style="${lv(c.bat_t1, c.bat_t2, c.bat_t3)}"></div>
      ${fu ? `<div class="lvbar" style="${lv(c.fuel_t1, c.fuel_t2, c.fuel_t3)}"></div>
      <h4>Δεξαμενή</h4>
      ${this._opt("Δεξαμενή (km)", this._num("fuel_max", c.fuel_max, "1"), "Αυτονομία με γεμάτη δεξαμενή, για τον υπολογισμό του ποσοστού.")}` : ""}`;
  }
  _tabTires(c) {
    const u = c.tire_unit || "bar", k = u === "kPa" ? 100 : u === "psi" ? 14.5038 : 1, dp = u === "kPa" ? 0 : u === "psi" ? 1 : 2, shown = (b) => Number((Number(b) * k).toFixed(dp));
    const chk = c.tire_check || "vehicle";
    return `<h4>Ελαστικά</h4>
      ${this._opt("Μονάδα", this._seg("tire_unit", u, [["bar", "bar"], ["kPa", "kPa"], ["psi", "psi"]]))}
      ${this._opt("Έλεγχος πίεσης", this._seg("tire_check", chk, [["vehicle", "Από το όχημα"], ["limits", "Δικά μου όρια"], ["both", "Και τα δύο"]]), "«Από το όχημα»: η κατάσταση βγαίνει από τις ειδοποιήσεις των ελαστικών που στέλνει το ίδιο το αμάξι.")}
      ${chk === "vehicle" ? "" : `<div class="grid2"><label class="field">Ελάχιστη (${u})<input type="number" step="${dp ? 1 / 10 ** dp : 1}" data-set="tire_min" data-num data-conv value="${shown(c.tire_min)}"></label><label class="field">Μέγιστη (${u})<input type="number" step="${dp ? 1 / 10 ** dp : 1}" data-set="tire_max" data-num data-conv value="${shown(c.tire_max)}"></label></div>
      <p class="hint">Εκτός ορίων η πίεση εμφανίζεται ως «χαμηλή» ή «υψηλή».</p>`}`;
  }
  _tabVehicle(c) {
    const cc = CAR_COLORS.some((x) => x[0] === c.car_color) ? c.car_color : "black";
    return `<h4>Όχημα</h4>
      <label class="field">Όνομα κάρτας<input type="text" data-set="name" data-text value="${esc(c.name)}"></label>
      <label class="field">Πρόθεμα οντοτήτων (π.χ. s05)<input type="text" data-set="prefix" data-text value="${esc(c.prefix)}" list="dl-pfx"></label>
      <datalist id="dl-pfx">${pfxCandidates(this._hass).map((p) => `<option value="${esc(p)}"></option>`).join("")}</datalist>
      ${(() => { const e = effPrefix(this._hass, c); return e !== c.prefix ? `<p class="hint">${T("Το πρόθεμα {0} δεν βρέθηκε· χρησιμοποιείται αυτόματα το {1}. Πάτησε το πεδίο για να το αποθηκεύσεις.", `<code>${esc(c.prefix)}</code>`, `<code>${esc(e)}</code>`)}</p>` : ""; })()}
      ${this._opt("Τύπος οχήματος", this._seg("powertrain", c.powertrain || "auto", [["auto", "Αυτόματα"], ["phev", "Plug-in υβριδικό"], ["ev", "Ηλεκτρικό"]]), "Το «Αυτόματα» βρίσκει τον τύπο από τους αισθητήρες καυσίμου.")}
      <h4>Εικόνα αμαξιού (hero)</h4>
      ${this._opt("Στυλ", this._seg("hero_style", c.hero_style === "carview" ? "carview" : "photo", [["photo", "Φωτογραφίες (μαύρο)"], ["carview", "Car View (χρώματα)"]]), "Φωτογραφίες: οι μαύρες φωτογραφίες με τα εφέ φόρτισης. Car View: 3/4 render στο χρώμα που διαλέγεις, με ζωντανές πόρτες· στη φόρτιση εμφανίζεται η διάφανη όψη με τον φορτιστή.")}
      ${this._opt("Προβολή (Car View)", this._seg("hero_view", c.hero_view === "top" ? "top" : "iso", [["iso", "3/4"], ["top", "Από πάνω"]]), "Η προβολή που ανοίγει η κάρτα. Με το κουμπί πάνω δεξιά στο hero αλλάζεις προβολή με ένα πάτημα, για τη συσκευή που το πάτησες· το διάλεγμα εδώ ξαναορίζει την προεπιλογή. Στη φόρτιση δείχνει πάντα η διάφανη όψη.")}
      <div class="grid2"><label class="field">Μεγέθυνση εικόνας${this._num("image_scale", c.image_scale, "0.05")}</label>
        <label class="field">Λόγος διαστάσεων (π.χ. 16 / 9)<input type="text" data-set="image_aspect" data-text value="${esc(c.image_aspect || "")}" placeholder="auto"></label></div>
      <h4>Χρώμα αμαξιού</h4>
      <p class="hint">Για την εικόνα Car View (popup οχήματος και, αν το διαλέξεις, hero).</p>
      <div class="csw">${CAR_COLORS.map(([k, n, hex]) => `<button data-sset="car_color|${k}" class="${k === cc ? "on" : ""}" style="background:${hex}" title="${esc(T(n))}" aria-label="${esc(T(n))}"></button>`).join("")}</div>
      ${this._opt("Ζάντες (Car View)", this._seg("iso_wheels", c.iso_wheels || "cover", [["cover", "20″ με τάπες"], ["open", "20″ χωρίς τάπες"], ["pro", "18″ Pro"]]))}`;
  }
  _tabLook(c) {
    const hc = (k) => hexc(c[k], DEFAULTS[k]);
    const sw = (k, l) => `<label class="sw-c"><input type="color" data-set="${k}" data-text value="${esc(hc(k))}"><span>${l}</span></label>`;
    const a = Number(c.air_t1) || 22, b = Number(c.air_t2) || 24, lo = 16, hi = 30, pc = (v) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));
    return `<h4>Χρώμα αέρα κλιματισμού</h4>
      <p class="hint">Ο αέρας στην καρτέλα Κλιματισμού παίρνει χρώμα ανάλογα με τη θερμοκρασία-στόχο. Όρισε τα όρια και τα χρώματα.</p>
      <div class="lvhead"><span></span><span>Μέχρι (°C)</span><span></span></div>
      <div class="lvrow">${sw("air_c1", "Δροσερό")}${this._num("air_t1", c.air_t1, "0.5")}<i class="dash"></i></div>
      <div class="lvrow">${sw("air_c2", "Μέτριο")}${this._num("air_t2", c.air_t2, "0.5")}<i class="dash"></i></div>
      <div class="lvrow">${sw("air_c3", "Ζεστό")}<i class="dash">—</i><i class="dash"></i></div>
      <div class="lvbar" style="background:linear-gradient(90deg, ${hc("air_c1")} 0 ${pc(a)}%, ${hc("air_c2")} ${pc(a)}% ${pc(b)}%, ${hc("air_c3")} ${pc(b)}% 100%)"></div>
      <h4>Περιθώρια</h4>
      ${this._opt("Περιθώρια κάρτας", this._seg("card_padding", c.card_padding || "normal", [["normal", "Κανονικά"], ["half", "Μισά"], ["none", "Χωρίς"]]), "«Χωρίς»: η εικόνα πηγαίνει από άκρη σε άκρη.")}
      ${this._opt("Περιθώρια popup", this._seg("popup_padding", c.popup_padding || "normal", [["normal", "Κανονικά"], ["half", "Μισά"], ["none", "Χωρίς"]]))}
      <h4>Μηνύματα</h4>
      ${this._tg("toasts", c.toasts !== false, "Μηνύματα πάνω στην οθόνη")}
      ${this._opt("Θέση μηνυμάτων (πάνω στην εικόνα)", this._seg("toast_position", c.toast_position || "bottom", [["bottom", "Κάτω"], ["top", "Πάνω"]]))}
      ${this._opt("Διάρκεια μηνυμάτων", this._seg("toast_duration", String(c.toast_duration || 5), [["3", "3 δευτ."], ["5", "5 δευτ."], ["8", "8 δευτ."], ["12", "12 δευτ."]]))}`;
  }
  _exportObj() {
    const c = this._cfg, o = { type: this.yamlBase?.type || `custom:${TAG}` };
    for (const k of SETTING_KEYS) {
      
      if (JSON.stringify(c[k]) !== JSON.stringify(DEFAULTS[k])) o[k] = c[k];
    }
    return o;
  }

  _render() {
    const c = this._cfg;
    if (!c) return;
    if (!["vehicle", "general", "sections", "buttons", "sensors", "charge", "tires", "look", "images"].includes(this.tab)) this.tab = "vehicle";
    const body = { vehicle: () => this._tabVehicle(c), sections: () => this._tabSections(c), buttons: () => this._tabButtons(c), sensors: () => this._tabSensors(c), images: () => this._tabImages(c), general: () => this._tabGeneral(c), charge: () => this._tabCharge(c), tires: () => this._tabTires(c), look: () => this._tabLook(c) }[this.tab]();
    const parts = body.split("<h4>"), grouped = parts[0] + parts.slice(1).map((x) => `<section class="grp"><h4>${x}</section>`).join("");
    this.shadowRoot.innerHTML = `<style>${SETTINGS_CSS}</style><div class="wrap">${this._tabs()}${grouped}</div>`;
    this._bind(); this._wireTabs();
    if (this.tab === "images") this._probe();
  }

  _navUpd() {
    const sr = this.shadowRoot, tb = sr.querySelector(".tabs"); if (!tb) return;
    const l = sr.querySelector(".tn.l"), r = sr.querySelector(".tn.r"), max = tb.scrollWidth - tb.clientWidth;
    if (l) l.hidden = tb.scrollLeft < 4; if (r) r.hidden = max <= 4 || tb.scrollLeft > max - 4;
  }
  _wireTabs() {
    const tb = this.shadowRoot.querySelector(".tabs"); if (!tb) return;
    tb.scrollLeft = this._tx || 0;
    const on = tb.querySelector(".on");
    if (on && (on.offsetLeft < tb.scrollLeft || on.offsetLeft + on.offsetWidth > tb.scrollLeft + tb.clientWidth)) tb.scrollLeft = on.offsetLeft - (tb.clientWidth - on.offsetWidth) / 2;
    this._tx = tb.scrollLeft; this._navUpd();
    tb.addEventListener("scroll", () => { this._tx = tb.scrollLeft; this._navUpd(); }, { passive: true });
    // σύρσιμο με το ποντίκι (στην αφή το scroll δουλεύει από μόνο του)
    let down = null, moved = false;
    tb.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse") { down = { x: e.clientX, l: tb.scrollLeft }; moved = false; } });
    tb.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - down.x; if (Math.abs(dx) > 5) moved = true; if (moved) tb.scrollLeft = down.l - dx; });
    const end = () => { down = null; };
    tb.addEventListener("pointerup", end); tb.addEventListener("pointerleave", end);
    tb.addEventListener("click", (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    requestAnimationFrame(() => this._navUpd());
  }
  _bind() {
    const sr = this.shadowRoot;
    sr.querySelectorAll('select[data-set="_mkey"]').forEach((s) => s.addEventListener("change", () => (this._form.mkey = s.value)));
    if (this._bnd) return; this._bnd = true; // οι ακροατές μπαίνουν μία φορά· διαβάζουν πάντα την τρέχουσα ρύθμιση
    const c = new Proxy({}, { get: (_, k) => (this._cfg ? this._cfg[k] : undefined) });
    sr.addEventListener("click", (e) => {
      const t = e.target.closest("button,[data-tab]");
      if (!t) return;
      if (t.dataset.tn) { const tb = sr.querySelector(".tabs"); return tb && tb.scrollBy({ left: Number(t.dataset.tn) * Math.max(120, tb.clientWidth * 0.7), behavior: "smooth" }); }
      const d = t.dataset;
      if (d.tab) return this._setTab(d.tab);
      if (d.mv) {
        const [kind, id, dir] = d.mv.split("|");
        const key = kind === "sec" ? "order" : "buttons", arr = [...c[key]], i = arr.indexOf(id), j = i + Number(dir);
        if (i < 0 || j < 0 || j >= arr.length) return;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        return this._emit({ [key]: arr });
      }
      if (d.vis) {
        const [kind, id] = d.vis.split("|"), key = kind === "sec" ? "hidden" : "buttons_hidden", s = new Set(c[key]);
        s.has(id) ? s.delete(id) : s.add(id);
        return this._emit({ [key]: [...s] });
      }
      if (d.sset) { const i = d.sset.indexOf("|"); return this._emit({ [d.sset.slice(0, i)]: d.sset.slice(i + 1) }); }
      if (d.tgl) return this._emit({ [d.tgl]: c[d.tgl] === false });
      if (d.hs) { const x = new Set(c.hero_show || []); x.has(d.hs) ? x.delete(d.hs) : x.add(d.hs); return this._emit({ hero_show: HERO_SHOW_OPTS.map((o) => o[0]).filter((k) => x.has(k)) }); }
      if (d.conf) { const s = new Set(c.confirm); s.has(d.conf) ? s.delete(d.conf) : s.add(d.conf); return this._emit({ confirm: [...s] }); }
      if (d.diag) {
        const cur = new Set(Array.isArray(c.diag) ? c.diag : DIAG.map((x) => x[0]));
        cur.has(d.diag) ? cur.delete(d.diag) : cur.add(d.diag);
        return this._emit({ diag: [...cur] });
      }
      if (d.info) { const s = new Set(c.info); s.has(d.info) ? s.delete(d.info) : s.add(d.info); return this._emit({ info: INFO_IDS.filter((i) => s.has(i)) }); }
      if (d.discover !== undefined) { this._disc = discoverDiag(this._hass, this._cfg); return this._render(); }
      if (d.dadd !== undefined || d.daddall !== undefined) {
        const pick = (this._disc || []).filter((f) => d.daddall !== undefined || f.entity === d.dadd);
        this._disc = (this._disc || []).filter((f) => !pick.includes(f));
        return this._emit({ diag_custom: [...c.diag_custom, ...pick.map((f) => ({ entity: f.entity, label: f.label, icon: f.icon }))] });
      }
      if (d.dreset !== undefined) { this._disc = null; return this._emit({ diag_ignore: [] }); }
      if (d.dmode) return this._emit({ diag_mode: d.dmode });
      if (d.dall !== undefined) return this._emit({ diag: d.dall === "1" ? DIAG.map((x) => x[0]) : [] });
      if (d.icon) { this._form.icon = d.icon; return this._render(); }
      if (d.add !== undefined) {
        const f = this._form, ent = f.entity.trim();
        if (!/^[a-z_]+\.[\w]+$/.test(ent)) { this._note = T("Γράψε έγκυρο entity_id"); return this._render(); }
        const item = { entity: ent, label: f.label.trim(), icon: MDI_RE.test(f.mdi.trim()) ? f.mdi.trim() : f.icon };
        this._form = { ...this._form, entity: "", label: "", mdi: "" };
        return this._emit({ [d.add]: [...c[d.add], item] });
      }
      if (d.del) { const [k, i] = d.del.split("|"); const a = [...c[k]]; a.splice(Number(i), 1); return this._emit({ [k]: a }); }
      if (d.addent !== undefined) {
        const f = this._form; if (!f.mkey || !f.ment.trim()) return;
        const m = { ...c.entities, [f.mkey]: f.ment.trim() };
        this._form = { ...f, ment: "" };
        return this._emit({ entities: m });
      }
      if (d.delent) { const m = { ...c.entities }; delete m[d.delent]; return this._emit({ entities: m }); }
      if (d.copy !== undefined) {
        const txt = sr.getElementById("yaml").value;
        (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => (this._note = T("Αντιγράφηκε ✓")), () => { sr.getElementById("yaml").select(); this._note = T("Πάτα Ctrl/⌘+C"); }).then(() => this._render());
        return;
      }
      if (d.reset !== undefined) { this._note = ""; return this.onReset && this.onReset(); }
    });
    sr.addEventListener("change", (e) => {
      const t = e.target, d = t.dataset;
      if (d.set === "_mkey") return;
      if (d.set) {
        let v = t.value;
        if (d.num !== undefined) { v = parseFloat(v); if (!Number.isFinite(v)) return; }
        if (d.conv !== undefined) { const u = c.tire_unit; v = Number((u === "kPa" ? v / 100 : u === "psi" ? v / 14.5038 : v).toFixed(3)); }
        if (d.text !== undefined) { v = v.trim(); if (["image_path", "layers_path", "climate_on_mode", "image_aspect"].includes(d.set) && !v) v = null; if (["name", "prefix"].includes(d.set) && !v) return; }
        return this._emit({ [d.set]: v });
      }
      if (d.img) { const m = { ...c.images }; t.value.trim() ? (m[d.img] = t.value.trim()) : delete m[d.img]; return this._emit({ images: m }); }
    });
    sr.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.f) this._form[t.dataset.f] = t.value;
    });
  }
}

/* ───────────────────────── Επεξεργαστής του HA ───────────────────────── */
class DeepalS05CardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); I18N.watch(this.shadowRoot); this._tab = "vehicle"; }
  setConfig(config) { this._config = { ...config }; this._draw(); }
  set hass(h) { this._hass = h; if (this._s) this._s.hass = h; }
  _draw() {
    if (!this._s) {
      this._s = document.createElement(SETTINGS_TAG);
      this._s.mode = "editor";
      this._s.onTab = (t) => (this._tab = t);
      this._s.onPatch = (p) => {
        this._config = { ...this._config, ...p };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
        this._draw();
      };
      this._s.onReset = () => {
        const { type, prefix, name } = this._config;
        this._config = { type, ...(prefix ? { prefix } : {}), ...(name ? { name } : {}) };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
        this._draw();
      };
      this.shadowRoot.innerHTML = "";
      this.shadowRoot.appendChild(this._s);
    }
    this._s.tab = this._tab;
    this._s.hass = this._hass;
    this._s.yamlBase = this._config;
    this._s.cfg = mergeConfig(this._config, null);
  }
}

