/* ───────────────────────── Δεδομένα ───────────────────────── */
/* Εφέ φόρτισης: συντεταγμένες πάνω στις φωτογραφίες 500×278 (καλώδιο από την πρίζα προς τη θύρα φόρτισης) */
const CHG_PTS = [[500, 248], [480, 246], [440, 243], [400, 241], [376, 237], [367, 231], [370, 226], [390, 222], [430, 220], [470, 217], [486, 213], [486, 209], [470, 205], [454, 201], [442, 190], [434, 168], [430, 146], [424, 126], [417, 115]];
const CHG_PORT = [399, 117];
const smoothPath = (p) => {
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
    d += `C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0]} ${c[1]}`;
  }
  return d;
};
const CHG_D = smoothPath(CHG_PTS);
/* Όψη φόρτισης Car View (750×500, dec_deepal vista_carga): καλώδιο από το έδαφος προς το φις, και θέση της θύρας */
const FAR_ALERT = 0.55; // αδιαφάνεια του κόκκινου στα παράθυρα της απέναντι πλευράς
const CARGA_PTS = [[705, 370], [677, 365], [640, 359], [613, 353], [597, 347], [588, 338], [583, 325], [580, 310], [578, 295], [576, 278], [574, 262], [572, 248], [570, 238]];
const CARGA_PORT = [566, 236];
const CV_ASPECT = "7 / 5"; // λόγος διαστάσεων του hero στο Car View (ψηλότερος από 16 / 9): το αμάξι μένει στο κέντρο με αέρα γύρω του
/* Χειρολαβές που ανάβουν κεχριμπαρένιες όταν το όχημα είναι ξεκλείδωτο: [πόρτα, x, y, γωνία] στις συντεταγμένες των layers (3/4: 750×500, μόνο η ορατή πλευρά· από πάνω: 750×750, και οι 4 πόρτες) */
const HDL_ISO = [["front_left", 505, 207, -12], ["rear_left", 577, 191.5, -12]];
const HDL_TOP = [["front_left", 266, 395], ["rear_left", 266, 515], ["front_right", 484, 395], ["rear_right", 484, 515]];
const CARGA_D = smoothPath(CARGA_PTS);
const OPEN_ITEMS = [
  ["binary_sensor.front_left_door", "Εμπρός αριστερή πόρτα"],
  ["binary_sensor.front_right_door", "Εμπρός δεξιά πόρτα"],
  ["binary_sensor.rear_left_door", "Πίσω αριστερή πόρτα"],
  ["binary_sensor.rear_right_door", "Πίσω δεξιά πόρτα"],
  ["binary_sensor.front_left_window_open", "Εμπρός αριστερό παράθυρο"],
  ["binary_sensor.front_right_window_open", "Εμπρός δεξί παράθυρο"],
  ["binary_sensor.rear_left_window_open", "Πίσω αριστερό παράθυρο"],
  ["binary_sensor.rear_right_window_open", "Πίσω δεξί παράθυρο"],
  ["binary_sensor.hood", "Καπό"],
  ["binary_sensor.trunk", "Πορτμπαγκάζ"],
];
// [κλειδί, ετικέτα, εικονίδιο, σοβαρότητα: r = κόκκινο όταν ενεργό (κρίσιμο), y = κεχριμπάρι (προειδοποίηση)]
const DIAG = [
  ["binary_sensor.airbag_warning", "Airbag", "airbag", "r"],
  ["binary_sensor.abs_warning", "ABS", "abs", "y"],
  ["binary_sensor.brake_warning", "Φρένα", "brake", "r"],
  ["binary_sensor.brake_fluid_warning", "Υγρά φρένων", "fluid", "r"],
  ["binary_sensor.12_v_battery_warning", "Μπαταρία 12V", "battery12", "y"],
  ["binary_sensor.traction_battery_low_warning", "Χαμηλή μπαταρία έλξης", "battery", "y"],
  ["binary_sensor.power_system_warning", "Σύστημα ισχύος", "evfault", "r"],
  ["binary_sensor.power_limit_warning", "Περιορισμός ισχύος", "turtle", "y"],
  ["binary_sensor.power_steering_warning", "Υποβοήθηση τιμονιού", "steering", "y"],
  ["binary_sensor.tire_pressure_warning", "Πίεση ελαστικών", "tirealert", "y"],
  ["binary_sensor.front_left_tire_alarm", "Ελαστικό εμπρός αριστερά", "tirealert", "y"],
  ["binary_sensor.front_right_tire_alarm", "Ελαστικό εμπρός δεξιά", "tirealert", "y"],
  ["binary_sensor.rear_left_tire_alarm", "Ελαστικό πίσω αριστερά", "tirealert", "y"],
  ["binary_sensor.rear_right_tire_alarm", "Ελαστικό πίσω δεξιά", "tirealert", "y"],
  ["binary_sensor.key_fob_battery_low", "Μπαταρία κλειδιού", "key", "y"],
];
// Έτοιμες «πληροφορίες»: id → [κλειδί, ετικέτα, εικονίδιο, δεκαδικά]
const INFO_ITEMS = {
  odometer: ["sensor.total_odometer", "Χιλιόμετρα", "road", 0],
  outside_temp: ["sensor.outside_temperature", "Έξω", "thermo", 1],
  inside_temp: ["sensor.inside_temperature", "Μέσα", "thermo", 1],
  humidity: ["sensor.cabin_humidity", "Υγρασία", "drop", 0],
  fuel_level: ["sensor.fuel_level", "Καύσιμο", "fuel", 0],
  fuel_volume: ["sensor.fuel_volume", "Βενζίνη", "fuel", 0],
  power_status: ["sensor.power_status", "Ισχύς", "engine", null],
  charge_status: ["sensor.charge_status", "Φόρτιση", "plug", null],
};
const INFO_IDS = Object.keys(INFO_ITEMS);

const OTHER_KEYS = [
  "lock.doors", "sensor.battery_level", "sensor.remaining_range", "sensor.fuel_range", "sensor.inside_temperature",
  "sensor.last_updated", "sensor.remaining_charge_time_h_mm", "sensor.ac_charge_current", "sensor.charge_current",
  "sensor.dc_charge_current", "sensor.charging_type", "sensor.license_plate", "binary_sensor.charging",
  "binary_sensor.charger_plugged", "binary_sensor.cloud_connection", "binary_sensor.position_lamp",
  "binary_sensor.low_beam", "binary_sensor.high_beam", "binary_sensor.climate_on", "cover.windows", "cover.trunk",
  "climate.cabin_climate", "button.honk_horn", "button.flash_lights", "button.flash_lights_and_honk",
  "button.refresh_vehicle_data", "switch.steering_wheel_heating",
  "binary_sensor.steering_wheel_heater",
  ...["front_left", "front_right", "rear_left", "rear_right"].flatMap((p) => [`sensor.${p}_tire_pressure`]),
  ...["front_left", "front_right"].flatMap((p) => [`number.${p}_seat_heating_level`, `number.${p}_seat_ventilation_level`]),
];
const TIRES = [ // px/py: θέση της ετικέτας στην εικόνα Car View (%)· wx/wy: θέση του τροχού (%)· hid: ο τροχός δεν φαίνεται στην εικόνα (εκτιμώμενη θέση)
  { id: "front_left", px: 15, py: 88, wx: 49.3, wy: 65, hid: false, name: "Εμπρός αριστερά" },
  { id: "front_right", px: 15, py: 12, wx: 27, wy: 60, hid: true, name: "Εμπρός δεξιά" },
  { id: "rear_left", px: 86, py: 88, wx: 83, wy: 57, hid: false, name: "Πίσω αριστερά" },
  { id: "rear_right", px: 86, py: 12, wx: 60.5, wy: 52, hid: true, name: "Πίσω δεξιά" },
];
/* Car View: layers 750×500 (πηγή: github.com/manuelem1984/dec_deepal, MIT) */
const CAR_COLORS = [["black", "Μαύρο", "#1b1c22"], ["blue", "Μπλε", "#4a86b8"], ["grey", "Γκρι", "#6b6d72"], ["silver", "Ασημί", "#b9bcc0"], ["white", "Λευκό", "#f1f2f4"]];
const ISO_DOORS = [["rear", "right"], ["front", "right"], ["rear", "left"], ["front", "left"]];
const INT_SIZE = { w: 745, h: 560 };
// hotspots εσωτερικού: [id, κλειδί, εικονίδιο, ετικέτα, x%, y%, layer]
const INT_SPOTS = [
  ["sh_l", "number.front_left_seat_heating_level", "seat", "Θέρμανση οδηγού", 19, 64, "seat_heat_driver_on"],
  ["sv_l", "number.front_left_seat_ventilation_level", "fan", "Αερισμός οδηγού", 35, 64, "seat_vent_driver_on"],
  ["st", "switch.steering_wheel_heating", "steering", "Θέρμανση τιμονιού", 27, 33, "steering_wheel_heat_on"],
  ["sh_r", "number.front_right_seat_heating_level", "seat", "Θέρμανση συνοδηγού", 65, 64, "seat_heat_passenger_on"],
  ["sv_r", "number.front_right_seat_ventilation_level", "fan", "Αερισμός συνοδηγού", 81, 64, "seat_vent_passenger_on"],
];
const INT_LAYERS = ["seat_heat_driver_on", "seat_heat_passenger_on", "seat_vent_driver_on", "seat_vent_passenger_on", "steering_wheel_heat_on"];

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const STATE_TX = { not_charging: "Δεν φορτίζει", charging: "Φορτίζει", charge_complete: "Φόρτιση ολοκληρώθηκε", charged: "Φόρτιση ολοκληρώθηκε", fully_charged: "Φόρτιση ολοκληρώθηκε", on: "Ενεργό", off: "Ανενεργό", locked: "Κλειδωμένο", unlocked: "Ξεκλείδωτο", open: "Ανοιχτό", closed: "Κλειστό", unknown: "Άγνωστο", unavailable: "μη διαθέσιμο", parked: "Στάθμευση", driving: "Οδήγηση" };
const stateText = (s) => { const k = String(s).trim().toLowerCase().replace(/[\s-]+/g, "_"); return STATE_TX[k] || cap(String(s).replace(/_/g, " ")); };
const CONFIRM_TEXT = {
  unlock: ["Ξεκλείδωμα οχήματος;", "Το όχημα θα ξεκλειδώσει."],
  trunk: ["Άνοιγμα πορτμπαγκάζ;", "Το πορτμπαγκάζ θα ανοίξει."],
  windows: ["Άνοιγμα παραθύρων;", "Όλα τα παράθυρα θα ανοίξουν."],
  lock: ["Κλείδωμα οχήματος;", "Το όχημα θα κλειδώσει."],
  climate: ["Αλλαγή κλιματισμού;", "Θα σταλεί εντολή στον κλιματισμό του οχήματος."],
  climate_temp: ["Ενεργοποίηση κλιματισμού;", "Η αλλαγή θερμοκρασίας θα ενεργοποιήσει τον κλιματισμό του οχήματος."],
  flash: ["Αναλαμπή φώτων;", "Τα φώτα του οχήματος θα αναβοσβήσουν."],
  honk: ["Ηχητικό σήμα;", "Η κόρνα του οχήματος θα ηχήσει."],
  find: ["Εντοπισμός οχήματος;", "Τα φώτα θα αναβοσβήσουν και η κόρνα θα ηχήσει."],
  refresh: ["Ανανέωση δεδομένων;", "Θα ζητηθούν νέα δεδομένα από το όχημα."],
};
const onlySettings = (o) => { const r = {}; if (o && typeof o === "object" && !Array.isArray(o)) for (const k of SETTING_KEYS) if (Object.prototype.hasOwnProperty.call(o, k)) r[k] = o[k]; return r; }; // ασφάλεια: από αποθηκευμένα δεδομένα περνούν μόνο γνωστά κλειδιά
const hexc = (h, d) => (/^#[0-9a-f]{6}$/i.test(String(h || "").trim()) ? String(h).trim() : d); // μόνο #rrggbb: οι τιμές χρωμάτων μπαίνουν σε style
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
const lsRead = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (_) { return null; } };
const lsWrite = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} };

/* Μικρός serializer YAML για την εξαγωγή ρυθμίσεων */
const yamlScalar = (v) => (typeof v === "string" ? (/^[\w./-]+$/.test(v) && !/^(true|false|null|\d.*)$/.test(v) ? v : JSON.stringify(v)) : String(v));
function toYaml(v, ind = 0) {
  const pad = " ".repeat(ind);
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return v.map((x) => (x && typeof x === "object" ? `${pad}-\n${toYaml(x, ind + 4).replace(/^\s+/, " ".repeat(ind + 2))}`.replace(/\n\s*$/, "") : `${pad}- ${yamlScalar(x)}`)).join("\n");
  }
  if (v && typeof v === "object") {
    const ks = Object.keys(v);
    if (!ks.length) return "{}";
    return ks
      .map((k) => {
        const x = v[k];
        if (x && typeof x === "object" && (Array.isArray(x) ? x.length : Object.keys(x).length)) return `${pad}${k}:\n${toYaml(x, ind + 2)}`;
        return `${pad}${k}: ${x && typeof x === "object" ? (Array.isArray(x) ? "[]" : "{}") : yamlScalar(x)}`;
      })
      .join("\n");
  }
  return `${pad}${yamlScalar(v)}`;
}

/* ───────────────────────── Στυλ ───────────────────────── */
const BASE_CSS = `
[hidden], [data-off] { display:none !important; }
button, input, select { font: inherit; color: inherit; }
.i { width: var(--is, 20px); height: var(--is, 20px); fill: none; stroke: currentColor; stroke-width: 1.6;
  stroke-linecap: round; stroke-linejoin: round; flex: none; }
.tt { width: var(--is, 30px); height: var(--is, 30px); fill: currentColor; stroke: none; flex:none; } .tt .s { fill:none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
ha-icon.i { --mdc-icon-size: var(--is, 20px); width: var(--is, 20px); height: var(--is, 20px); display:inline-flex; color: inherit; }
.btn.sm:has(.i), .btn.sm:has(.tt) { display:inline-flex; align-items:center; justify-content:center; gap:6px; } .btn.sm .i { --is:16px; }
.btn.pl { background: rgba(var(--ds-info), .18); border-color: rgba(var(--ds-info), .55); }
.row > .tt { --is:24px; color: var(--ds-fg2); } .row.tg.on > .tt { color: rgb(var(--ds-info)); }
.i.w { width: calc(var(--is, 20px) * 1.5); height: auto; overflow: visible; }
.i .a { fill: currentColor; fill-opacity: .2; }
.i .k { fill: currentColor; stroke: none; }
.seg { display:flex; padding:3px; gap:3px; border-radius:14px; background: var(--ds-soft); border:1px solid var(--ds-line); }
.seg button { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:7px 6px; border-radius:11px;
  border:0; background:transparent; cursor:pointer; font-size:12.5px; font-weight:600; color: var(--ds-fg2); white-space:nowrap; }
.seg button .i { --is:16px; }
.seg button.on { background: rgba(var(--ds-info), .2); color: var(--ds-fg); }
.btn { padding:10px 12px; border-radius:14px; border:1px solid var(--ds-line); background: var(--ds-soft); cursor:pointer; font-size:13.5px; font-weight:600; }
.btn.go { background: rgba(var(--ds-warn), .18); border-color: rgba(var(--ds-warn), .5); }
.btn.sm { padding:6px 10px; font-size:12.5px; border-radius:11px; }
.btnrow { display:flex; gap:8px; } .btnrow > * { flex:1; }
.mv { width:30px; height:30px; display:grid; place-items:center; border-radius:10px; border:1px solid var(--ds-line);
  background:transparent; cursor:pointer; color: var(--ds-fg2); flex:none; padding:0; }
.mv .i { --is: 16px; } .mv[disabled] { opacity:.25; cursor:default; }
.sw { position:relative; width:34px; height:20px; border-radius:999px; background: var(--ds-line); transition: background .2s; flex:none; display:block; }
.sw::after { content:""; position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition: transform .2s; }
.on > .sw, .sw.on { background: rgb(var(--ds-info)); } .on > .sw::after, .sw.on::after { transform: translateX(14px); }
`;
const VARS = `
  --ds-r: 22px; --ds-ok: 52,211,153; --ds-warn: 251,191,36; --ds-bad: 248,113,113; --ds-info: 56,189,248; --ds-ev: 52,211,153; --ds-fu: 52,211,153;
  --ds-fg: var(--primary-text-color, #fff); --ds-fg2: rgba(255,255,255,.72); --ds-fg2: color-mix(in srgb, var(--primary-text-color, #fff) 72%, transparent);
  --ds-line: rgba(var(--rgb-primary-text-color, 255,255,255), .12); --ds-soft: rgba(var(--rgb-primary-text-color, 255,255,255), .06);
`;

const CSS = `
:host { display:block; }
ha-card { ${VARS}
  position: relative; overflow: hidden; padding: 14px; border-radius: 28px; display: flex; flex-direction: column; gap: 16px;
  font-variant-numeric: tabular-nums;
  background: radial-gradient(90% 60% at 0% 0%, rgba(var(--ds-ev), .10), transparent 60%),
    radial-gradient(90% 60% at 100% 0%, rgba(var(--ds-fu), .08), transparent 60%),
    var(--ha-card-background, var(--card-background-color, #1c1c1c)); }
ha-card[data-pad="half"] { padding:7px; gap:12px; }
ha-card[data-pad="none"] { padding:0 0 8px; gap:8px; }
ha-card[data-pad="none"] > :not(.hero):not(.sheet) { margin-inline:3px; }
ha-card[data-pad="none"] > .hero { border-radius:0; }
ha-card[data-ppad="half"] .sheet { padding:5px; } ha-card[data-ppad="half"] .box { padding:8px 7px 6px; }
ha-card[data-ppad="none"] .sheet { padding:0; } ha-card[data-ppad="none"] .box { padding:8px 4px 4px; border-radius:24px 24px 0 0; border-inline:0; border-bottom:0; }
${BASE_CSS}

/* Hero */
.hero { position: relative; overflow: hidden; background: #000; border-radius: var(--ds-r); aspect-ratio: var(--ds-aspect, 16 / 9); isolation: isolate; }
.stage { position:absolute; inset:0; }
.stage img { position:absolute; inset:0; width:100%; height:100%; object-fit: cover; opacity:0; transition: opacity .55s ease;
  transform: scale(var(--ds-scale, 1.2)); transform-origin: center center; }
.stage img.on { opacity:1; }
/* Hero «Car View»: 3/4 render με layers· στη φόρτιση αλλάζει με τη διάφανη όψη και το καλώδιο */
.hcv { position:absolute; inset:0; display:none; z-index:1; }
.hero[data-style="carview"] .stage, .hero[data-style="carview"] .fxs, .hero[data-style="carview"] .fx-handles { display:none !important; }
.hero[data-style="carview"] .hcv { display:block; }
.hero[data-style="carview"] .shade-left { width:46%; background: linear-gradient(90deg, rgba(0,0,0,.6), rgba(0,0,0,.28) 60%, transparent); }
.hero[data-style="carview"] { background: radial-gradient(ellipse 72% 60% at 56% 76%, #3b4654 0%, #1a1e25 58%, #0e0f13 100%); }
.cva::before, .cvb::before { content:""; position:absolute; pointer-events:none; background: radial-gradient(ellipse at center, rgba(0,0,0,.72), rgba(0,0,0,.3) 45%, transparent 72%); filter: blur(6px); }
.cva::before { left:12%; right:8%; top:68%; height:14%; }
.cvb::before { left:11%; right:20%; top:64%; height:12%; }
.cvi { position:absolute; left:50%; top:50%; width:100%; aspect-ratio: 750 / 500; transform-origin: 50.93% 50.3%; transform: translate(-50.93%, -50.3%) scale(var(--ds-cvs, 1.08)); } /* το ορατό κέντρο του αμαξιού (382,251.5 στα 750×500) πάει ακριβώς στο κέντρο του hero και η μεγέθυνση γίνεται γύρω από αυτό */
.cvi[hidden], .cvt[hidden] { display:none; }
.cvi:not([hidden]), .cvt:not([hidden]) { animation: ds-fade .4s ease-out; }
/* Από πάνω: το αμάξι (layers 750×750, κέντρο 359.5,385.5) γυρίζει 90° ώστε να κοιτάει αριστερά σαν το 3/4 και να γεμίζει το πλατύ hero */
.cvt { position:absolute; left:50%; top:50%; width: calc(100% * var(--ds-tvs, .96)); aspect-ratio:1; transform-origin: 49.93% 51.2%; transform: translate(-49.93%, -51.2%) rotate(-90deg); } /* ορατό κέντρο του αμαξιού (374.5,384 στα 750×750) στο κέντρο του hero */
.cvt::before { content:""; position:absolute; inset:5% 24% 3%; pointer-events:none; background: radial-gradient(ellipse at center, rgba(0,0,0,.6), rgba(0,0,0,.28) 48%, transparent 72%); filter: blur(10px); }
.cvt img { position:absolute; inset:0; width:100%; height:100%; opacity:0; transition: opacity .3s ease; }
.cvt img.on { opacity:1; }
.cva, .cvb { position:absolute; inset:0; transition: opacity .6s ease; }
.cvb { opacity:0; transform: translate(2%, 3.5%); } /* η διάφανη όψη έχει άλλο κάδρο: μετατοπίζεται ώστε το αμάξι να μένει στο ίδιο κέντρο */ .hcv.chg .cva { opacity:0; } .hcv.chg .cvb { opacity:1; }
.cva img, .cvb > img:not(.sweep) { position:absolute; inset:0; width:100%; height:100%; opacity:0; transition: opacity .35s ease; }
.cva img.on, .cvb > img.on:not(.sweep) { opacity:1; }
/* Ξεκλείδωτο: οι χειρολαβές ανάβουν (κεχριμπαρένιες, με απαλή παλμική λάμψη) */
.hdl { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; opacity:0; transition: opacity .4s ease; filter: drop-shadow(0 0 2px rgba(var(--ds-warn), .95)) drop-shadow(0 0 7px rgba(var(--ds-warn), .6)); }
.hero.unlocked .hdl { opacity:1; }
.hdl rect { fill: rgb(var(--ds-warn)); animation: ds-hdl 2.4s ease-in-out infinite; } .hdl rect.off { display:none; }
@keyframes ds-hdl { 0%, 100% { opacity:.72; } 50% { opacity:1; } }
.cvb > svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
.cvb path, .cvb circle { fill:none; visibility:hidden; }
.cvb .cb { stroke-width:5.6; filter: blur(2.4px); }
.cvb .cf { stroke-width:3.4; stroke-dasharray: 7 30; animation: ds-cab2 1.2s linear infinite; }
@keyframes ds-cab2 { to { stroke-dashoffset: -37; } }
.cvb .pr { stroke-width:2; }
.cvb .sweep { object-fit: fill; }
.shade-top, .shade-bot { position:absolute; left:0; right:0; pointer-events:none; z-index:5; }
.shade-top { top:0; height:38%; background: linear-gradient(180deg, rgba(0,0,0,.72), transparent); }
.shade-left { position:absolute; left:0; top:0; bottom:0; width:62%; pointer-events:none; z-index:5; background: linear-gradient(90deg, rgba(0,0,0,.78), rgba(0,0,0,.45) 55%, transparent); }
.shade-bot { bottom:0; height:30%; background: linear-gradient(0deg, rgba(0,0,0,.55), transparent); }
.hero-top { position:absolute; top:0; left:0; right:0; z-index:8; display:flex; justify-content:space-between; align-items:flex-start; padding: 16px 18px; color:#fff; }
.title { font-size: 15px; font-weight: 600; letter-spacing: -.01em; line-height: 1.15; display:flex; align-items:baseline; gap:8px; }
.plate { font-size: 11px; font-weight:500; opacity:.6; letter-spacing:.05em; }
.total { margin-top: 8px; }
.total .big { font-size: 40px; font-weight: 300; letter-spacing: -.03em; line-height: .92; text-shadow: 0 2px 14px rgba(0,0,0,.5); }
.total .big small { font-size: 16px; font-weight: 400; margin-left:4px; opacity:.8; letter-spacing:0; }
.total .cap { margin-top: 3px; font-size: 12.5px; opacity:.8; }
.total .split { margin-top: 6px; display:flex; gap:10px; font-size: 12px; color: rgba(255,255,255,.85); }
.total .split span { display:inline-flex; align-items:center; gap:4px; } .total .split .i { --is: 14px; }
.total .split .e .i { color: rgb(var(--ds-ev)); } .total .split .f .i { color: rgb(var(--ds-fu)); }
.rfs { position:relative; flex:none; width:30px; height:30px; padding:0; border-radius:50%; display:grid; place-items:center; cursor:pointer; color: rgba(255,255,255,.8);
  background: rgba(10,11,15,.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border:1px solid rgba(255,255,255,.16); -webkit-tap-highlight-color: transparent; transition: transform .14s ease; }
.rfs[hidden] { display:none; } .rfs .i { --is:15px; } .rfs:active { transform: scale(.9); } .rfs.success { color: rgb(var(--ds-ok)); } .rfs.error { color: rgb(var(--ds-bad)); }
.rfs .ring { position:absolute; inset:-3px; width: calc(100% + 6px); height: calc(100% + 6px); pointer-events:none; overflow:visible; }
.rfs .ring rect { fill:none; stroke: rgba(255,255,255,.85); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 20 80; animation: ds-dash 1.2s linear infinite; }
.meta { display:flex; align-items:center; gap:6px; margin: -4px -6px 0 0; }
.cloud { display:inline-grid; place-items:center; height:30px; padding:0 2px; border:0; background:none; cursor:pointer; filter: drop-shadow(0 1px 5px rgba(0,0,0,.6)); }
.cloud .i { --is: 21px; } .cloud.ok .i { color: rgb(var(--ds-ok)); } .cloud.bad .i { color: rgb(var(--ds-bad)); }
.fx { position:absolute; inset:0; pointer-events:none; display:none; }
.hero.unlocked .fx-handles { display:block; }
.fx-handles { z-index:3; --fx:66.2%; --fy:41.2%; --rx:79.6%; --ry:38.5%; }
.fx-handles .halo, .fx-handles .core { position:absolute; inset:0; }
.fx-handles .halo { filter: blur(4px); animation: ds-glow 2.2s ease-in-out infinite;
  background: radial-gradient(ellipse 4.6% 1.8% at var(--fx) var(--fy), rgba(255,35,15,.95) 0%, rgba(255,25,10,.75) 25%, rgba(255,15,5,.38) 48%, rgba(255,0,0,.12) 70%, rgba(255,0,0,0) 100%),
    radial-gradient(ellipse 4.6% 1.8% at var(--rx) var(--ry), rgba(255,35,15,.95) 0%, rgba(255,25,10,.75) 25%, rgba(255,15,5,.38) 48%, rgba(255,0,0,.12) 70%, rgba(255,0,0,0) 100%); }
.fx-handles .core { filter: blur(1.5px); animation: ds-core 2.2s ease-in-out infinite;
  background: radial-gradient(ellipse 2.3% .7% at var(--fx) var(--fy), rgba(255,130,100,.95) 0%, rgba(255,50,25,.65) 35%, transparent 100%),
    radial-gradient(ellipse 2.3% .7% at var(--rx) var(--ry), rgba(255,130,100,.95) 0%, rgba(255,50,25,.65) 35%, transparent 100%); }
.fxs { position:absolute; inset:0; z-index:3; pointer-events:none; display:none; transform: scale(var(--ds-scale, 1.2)); transform-origin:center center; }
.hero[data-fx]:not([data-fx=""]) .fxs { display:block; }
.fxs svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; } .fxs path, .fxs circle { fill:none; visibility:hidden; }
.cb { stroke: rgb(52,211,153); stroke-width:3.4; opacity:.22; filter: blur(1.6px); }
.cf { stroke: rgb(120,245,190); stroke-width:2.2; stroke-linecap:round; stroke-dasharray: 5 20; filter: drop-shadow(0 0 2px rgb(52,211,153)); animation: ds-cab 1.2s linear infinite; }
@keyframes ds-cab { to { stroke-dashoffset: -25; } }
.pr { stroke: rgb(120,245,190); stroke-width:1.4; transform-box: fill-box; transform-origin:center; opacity:0; animation: ds-ring 2.2s ease-out infinite; } .pr.r2 { animation-delay:1.1s; }
@keyframes ds-ring { 0% { transform: scale(.5); opacity:.95; } 100% { transform: scale(3); opacity:0; } }
.pg { fill: rgb(52,211,153) !important; filter: blur(3px); animation: ds-pg 2.2s ease-in-out infinite; }
@keyframes ds-pg { 0%,100% { opacity:.25; } 50% { opacity:.8; } }
.hero[data-fx~="flow"] .cb, .hero[data-fx~="flow"] .cf, .hero[data-fx~="port"] .pr, .hero[data-fx~="port"] .pg { visibility:visible; }
.sweep { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; mix-blend-mode: screen; opacity:.85;
  filter: brightness(2.4) sepia(1) hue-rotate(78deg) saturate(6);
  -webkit-mask-image: linear-gradient(105deg, transparent 45%, #000 50%, transparent 55%); mask-image: linear-gradient(105deg, transparent 45%, #000 50%, transparent 55%);
  -webkit-mask-size: 300% 100%; mask-size: 300% 100%; -webkit-mask-repeat:no-repeat; mask-repeat:no-repeat; animation: ds-sweep 3.4s ease-in-out infinite; }
.hero[data-fx~="sweep"] .sweep { display:block; }
@keyframes ds-sweep { from { -webkit-mask-position: 100% 0; mask-position: 100% 0; } to { -webkit-mask-position: 0% 0; mask-position: 0% 0; } }
@keyframes ds-glow { 0%,100% { opacity:.30 } 50% { opacity:1 } }
@keyframes ds-core { 0%,100% { opacity:.25 } 55% { opacity:1 } }
.toast { position:absolute; left:50%; top:14px; bottom:auto; z-index:40; transform: translate(-50%, -8px); max-width: calc(100% - 28px); padding: 8px 14px; border-radius: 999px;
  font-size: 12.5px; font-weight: 500; color:#fff; opacity:0; pointer-events:none; background: rgba(20,20,24,.82); border:1px solid rgba(255,255,255,.16);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: opacity .2s ease, transform .2s ease; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
.toast.pos-bottom { top:auto; bottom:62px; transform: translate(-50%, 8px); }
.toast.show { opacity:1; transform: translate(-50%, 0); } .toast.warn { border-color: rgba(var(--ds-warn), .55); } .toast.error { border-color: rgba(var(--ds-bad), .55); } .toast.ok { border-color: rgba(var(--ds-ok), .55); }

/* Κουμπιά (κυκλικά, σαν της εφαρμογής) */
.actions { --bs: 52px; container-type: inline-size; padding: 2px 0; }
.actions.sz-s { --bs: 42px; } .actions.sz-l { --bs: 62px; }
.actions.grid { display:grid; grid-template-columns: repeat(5, 1fr); gap: 18px 4px; }
.actions.scroll { display:flex; gap: 12px; overflow-x:auto; scrollbar-width:none; padding: 2px 2px 4px; scroll-snap-type:x proximity; }
.actions.scroll::-webkit-scrollbar { display:none; }
.actions.scroll[data-r] { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 34px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 34px), transparent); }
.actions.scroll[data-l] { -webkit-mask-image: linear-gradient(90deg, transparent, #000 34px); mask-image: linear-gradient(90deg, transparent, #000 34px); }
.actions.scroll[data-l][data-r] { -webkit-mask-image: linear-gradient(90deg, transparent, #000 34px, #000 calc(100% - 34px), transparent); mask-image: linear-gradient(90deg, transparent, #000 34px, #000 calc(100% - 34px), transparent); }
.actions.scroll .cell { flex:none; width: calc(var(--bs) + 22px); scroll-snap-align:start; }
.actions.fit { display:flex; gap:4px; justify-content:space-between; }
.actions.fit .cell { flex:1 1 0; } .actions.fit .act { --bs: clamp(32px, 11cqw, 52px); }
.cell { --c: var(--ds-info); display:flex; flex-direction:column; align-items:center; gap:6px; min-width:0; }
.cell.warn { --c: var(--ds-warn); } .cell.bad { --c: var(--ds-bad); }
.cell .cap { max-width:100%; font-size:12px; line-height:1.15; text-align:center; color: var(--ds-fg2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cell .cap.t { color: var(--ds-fg); font-weight:600; font-size:12.5px; }
.cell.warn .cap.s, .cell.bad .cap.s { color: rgb(var(--c)); }
.act { --c: var(--ds-info); position:relative; flex:none; display:grid; place-items:center; width: var(--bs); height: var(--bs); padding:0; cursor:pointer; border-radius:50%;
  border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg);
  -webkit-tap-highlight-color: transparent; transition: transform .14s ease, background .25s ease, border-color .25s ease, box-shadow .25s ease; }
.act .i { width: 46%; height: 46%; color: var(--ds-fg); transition: color .25s ease; } .act .i.w { width: 72%; height: auto; }
.act.ok { --c: var(--ds-ok); } .cell.ok { --c: var(--ds-ok); }
.act.warn { --c: var(--ds-warn); } .act.bad { --c: var(--ds-bad); }
.act.warn:not(.on), .act.bad:not(.on) { border-color: rgba(var(--c), .55); } .act.warn:not(.on) .i, .act.bad:not(.on) .i { color: rgb(var(--c)); }
.act.on { background: rgb(var(--c)); border-color: transparent; box-shadow: 0 6px 18px rgba(var(--c), .35); }
.act.on .i { color:#fff; } .act.on.warn .i { color:#1d1400; }
.act:active:not([disabled]) { transform: scale(.92); } .act:focus-visible { outline: 2px solid rgb(var(--c)); outline-offset: 2px; }
.act[disabled] { opacity:.4; cursor:not-allowed; }
.act .dot { position:absolute; top:5px; right:5px; width:7px; height:7px; border-radius:50%; background: rgb(var(--c)); }
.act.on .dot { background:#fff; }
.act .ring { position:absolute; inset:-3px; width: calc(100% + 6px); height: calc(100% + 6px); pointer-events:none; overflow:visible; }
.act .ring rect { fill:none; stroke: rgb(var(--c)); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 20 80; animation: ds-dash 1.2s linear infinite; }
@keyframes ds-dash { to { stroke-dashoffset: -100; } }
.act.success { --c: var(--ds-ok); } .act.error { --c: var(--ds-bad); animation: ds-shake .35s ease; }
@keyframes ds-shake { 25% { transform: translateX(-3px) } 75% { transform: translateX(3px) } }

/* Κατάσταση πάνω στην εικόνα */
.status { position:absolute; left:18px; bottom:16px; z-index:8; max-width: 62%; display:flex; align-items:center; gap:10px; color:#fff; text-shadow: 0 1px 10px rgba(0,0,0,.65); }
.status .i { --is: 24px; color: rgb(var(--st)); filter: drop-shadow(0 1px 6px rgba(0,0,0,.6)); }
.status .t { font-size: 14px; font-weight: 600; line-height:1.2; } .status .s { font-size: 11.5px; opacity:.78; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.status > div { min-width:0; }

/* Πλακίδια θερμοκρασίας / μπαταρίας */
.stats { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.t2 { position:relative; overflow:hidden; min-height:118px; padding: 10px 14px 12px; border-radius: 22px; background: var(--ds-soft); border:1px solid var(--ds-line); text-align:left; color: var(--ds-fg); }
.t2[data-open] { cursor:pointer; -webkit-tap-highlight-color: transparent; transition: transform .14s ease; } .t2[data-open]:active { transform: scale(.985); }
.t2 .tt { position:relative; z-index:1; font-size: 14.5px; font-weight: 600; letter-spacing:-.01em; }
.t2 .ts { margin-top: 4px; font-size: 12.5px; color: var(--ds-fg2); line-height:1.35; }
.t2 .ts b { font-weight:600; color: var(--ds-fg); font-size: 13px; }
.t2 .ts.chg, .t2 .ts.chg b { color: rgb(var(--ds-ok)); } .t2.batt .ts { max-width: 58%; } .t2 .ts .sub { font-size: 12px; color: var(--ds-fg2); }
.gauge .fg { stroke: rgb(var(--ds-ev)); opacity:.28; }
.gauge .fp { stroke: rgb(var(--ds-ev)); filter: drop-shadow(0 0 3px rgba(var(--ds-ev), .9)); animation: ds-chgflow 2.4s cubic-bezier(.45,.05,.55,.95) infinite, ds-chgfade 2.4s linear infinite; }
@keyframes ds-chgflow { from { stroke-dashoffset: var(--fs); } to { stroke-dashoffset: var(--fe); } }
@keyframes ds-chgfade { 0% { opacity: 0; } 15% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
.t2 .lg { margin-top: 10px; display:flex; flex-direction:column; gap:3px; font-size:12px; }
.t2 .lg span { display:flex; align-items:center; gap:4px; } .t2 .lg .i { --is: 14px; } .t2 .lg b { color: var(--ds-fg); font-weight:600; }
.t2 .lg small { color: var(--ds-fg2); font-size: 11.5px; }
/* πλακίδιο Κλιματισμός: θερμοκρασία μέσα, στόχος με ± και κουμπί on/off */
.t2.temp { display:grid; grid-template-columns: 1fr auto; grid-template-rows: auto 1fr auto; align-items:start; min-height:132px; }
.t2.temp .tt { grid-column:1; grid-row:1; align-self:start; } /* ίδιο ύψος τίτλου με το tile Ενέργεια (πριν ήταν 2px πιο κάτω λόγω του κουμπιού) */
.tpw { --kc: var(--ds-info); grid-column:2; grid-row:1; position:relative; width:40px; height:40px; margin:-6px -8px 0 0; border-radius:50%; border:1px solid var(--ds-line); background: var(--ds-soft); display:grid; place-items:center; padding:0; cursor:pointer; color: var(--ds-fg2); -webkit-tap-highlight-color: transparent; transition: background .25s ease, color .25s ease, transform .14s ease, box-shadow .25s ease; }
.tpw .i { --is:18px; } .tpw:active { transform: scale(.92); } .tpw[disabled] { opacity:.4; cursor:not-allowed; }
.tpw.on { background: rgb(var(--kc)); border-color: transparent; color:#fff; box-shadow: 0 4px 14px rgba(var(--kc), .4); }
.tpw:focus-visible, .cs:focus-visible { outline: 2px solid rgb(var(--ds-info)); outline-offset: 2px; }
.tpw .ring { position:absolute; inset:-3px; width: calc(100% + 6px); height: calc(100% + 6px); pointer-events:none; overflow:visible; }
.tpw .ring rect { fill:none; stroke: rgb(var(--kc)); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 20 80; animation: ds-dash 1.2s linear infinite; }
.t2.temp .ct { grid-column:1 / -1; grid-row:2; align-self:center; display:flex; align-items:baseline; gap:8px; padding-top:2px; }
.t2.temp .cur { font-size:38px; font-weight:300; letter-spacing:-.03em; line-height:1; color: var(--ds-fg); }
.t2.temp .lbl { font-size:12px; color: var(--ds-fg2); }
.cstep { grid-column:1 / -1; grid-row:3; display:flex; align-items:center; justify-content:space-between; gap:6px; margin-top:6px; padding:3px; border-radius:999px; background: rgba(0,0,0,.22); border:1px solid var(--ds-line); }
.cstep.idle .cv b { color: var(--ds-fg2); }
.cs { width:34px; height:34px; flex:none; border-radius:50%; border:0; display:grid; place-items:center; padding:0; cursor:pointer; background: var(--ds-soft); color: var(--ds-fg); -webkit-tap-highlight-color: transparent; transition: transform .12s ease, background .2s ease; }
.cs .i { --is:16px; } .cs:active { transform: scale(.9); background: rgba(var(--ds-info), .25); } .cs[disabled] { opacity:.4; }
.cv { display:flex; flex-direction:column; align-items:center; line-height:1.1; min-width:0; } .cv small { font-size:11px; color: var(--ds-fg2); } .cv b { font-size:15px; font-weight:600; color: rgb(var(--ds-info)); }
.gauge { position:absolute; right:-35px; bottom:-35px; width: 150px; height: 150px; pointer-events:none; }
.gauge svg { width:100%; height:100%; overflow:visible; }
.gauge circle { fill:none; stroke-linecap:round; } .gauge .tr { stroke: var(--ds-line); }
.gauge .ev { stroke: rgb(var(--ds-ev)); filter: drop-shadow(0 0 4px rgba(var(--ds-ev), .5)); transition: stroke-dasharray .8s ease; }
.gauge .fu { stroke: rgb(var(--ds-fu)); transition: stroke-dasharray .8s ease; }
.gauge .c { position:absolute; inset:0; display:grid; place-items:center; font-size:29px; font-weight:700; letter-spacing:-.03em; color: var(--ds-fg); }
.gauge .c { display:flex; flex-direction:column; justify-content:center; align-items:center; line-height:1.05; }
.gauge .c .gf { display:inline-flex; align-items:center; gap:2px; font-size:15px; font-weight:700; letter-spacing:-.02em; margin-top:2px; } .gauge .c .gf svg.i { width:14px; height:14px; transform:none; overflow:visible; }
.gauge .c small { font-size:12px; font-weight:500; color: var(--ds-fg2); }
.knob { --kc: var(--ds-info); position:absolute; right:-18px; bottom:-16px; width: 112px; height: 112px; border-radius:50%; border:0; cursor:pointer; padding:0;
  display:grid; place-items:center; box-sizing:border-box;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.16), rgba(255,255,255,.05) 70%); box-shadow: inset 0 0 0 1px var(--ds-line), 0 10px 24px rgba(0,0,0,.25);
  -webkit-tap-highlight-color: transparent; transition: background .3s ease, transform .14s ease, box-shadow .3s ease; }
.knob .i { --is: 32px; color: var(--ds-fg2); transition: color .3s ease; }
.knob.on { background: radial-gradient(circle at 35% 30%, rgba(var(--kc), .95), rgba(var(--kc), .7)); box-shadow: 0 10px 28px rgba(var(--kc), .4); } .knob.on .i { color:#fff; }
.knob:active { transform: scale(.94); } .knob[disabled] { opacity:.4; }
.knob .ring { position:absolute; inset:-2px; width: calc(100% + 4px); height: calc(100% + 4px); pointer-events:none; overflow:visible; }
.knob .ring rect { fill:none; stroke: rgb(var(--kc)); stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: 20 80; animation: ds-dash 1.2s linear infinite; }
.t2.batt { container-type: inline-size; }
@container (max-width: 175px) { .gauge { width:116px; height:116px; right:-28px; bottom:-28px; } .gauge .c { font-size:22px; } .gauge .c .gf { font-size:12px; } .gauge .c small { font-size:10px; } .t2.batt .ts { max-width: 100%; } .t2.batt .lg { margin-top:6px; } }

/* Όχημα */
.veh { display:flex; flex-direction:column; gap:10px; flex:1 1 auto; min-height:0; overflow-y:auto; overflow-x:hidden; scrollbar-width:none; } .veh::-webkit-scrollbar { display:none; }
.box.wide { padding-bottom:14px; }
.dash { position:relative; width:100%; aspect-ratio: 510 / 285; background:#000; border-radius: var(--ds-r); overflow:hidden; }
.dash img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition: opacity .5s ease; }
.dash .air { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; opacity:0; transition: opacity .6s ease; }
.dash.air .air { opacity:1; }
.air { --sp: 1; --a0:#eaf6ff; --a1:#b9dcff; --a2:#8ec5ff; }
.air .st { fill:none; stroke-linecap:round; stroke-dasharray: 62 38; transform-box: fill-box; transform-origin: 50% 0%; animation: ds-flow calc(var(--t, 2.4s) / var(--sp)) linear infinite, ds-sway calc(var(--w, 3.6s) / var(--sp)) ease-in-out infinite; animation-delay: var(--d, 0s), var(--d, 0s); }
@keyframes ds-sway { 0%,100% { transform: translateX(-2.2px) skewX(-5deg); } 50% { transform: translateX(2.2px) skewX(5deg); } }
.air .gl { fill:none; stroke-linecap:round; }
.air .bg { opacity:.85; animation: ds-air 3.2s ease-in-out infinite; animation-delay: var(--d, 0s); mix-blend-mode: screen; }
@keyframes ds-flow { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
@keyframes ds-air { 0%,100% { opacity:.62 } 50% { opacity:1 } }
.dash .ttl, .seatsttl { font-size:12px; color: var(--ds-fg2); }
.seatsttl { margin:2px 2px 0; }
.dash .spot { z-index:2; }
.vmiss { padding:18px 12px; text-align:center; font-size:12.5px; color: var(--ds-fg2); }
.ipane .sbtn { position:absolute; transform: translate(-50%,-50%); width:54px; padding:9px 0 7px; gap:5px; border-radius:18px; background: rgba(14,15,20,.66); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color:#fff; border-color: rgba(255,255,255,.2); }
.ipane .sbtn:active { transform: translate(-50%,-50%) scale(.94); } .ipane .sbtn .nm { display:none; } .ipane .sbtn .i { --is:28px; }
.sbtn { --c: var(--ds-info); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; padding:12px 2px 9px; min-width:0; border-radius:20px; cursor:pointer; color: var(--ds-fg2);
  border:1px solid var(--ds-line); background: var(--ds-soft); -webkit-tap-highlight-color: transparent; transition: transform .12s ease, background .2s ease, border-color .2s ease; }
.sbtn.hot { --c: 251,113,60; } .sbtn.cool { --c: 56,189,248; } .sbtn:active { transform: scale(.94); }
.sbtn .i { --is: 30px; } .sbtn .nm { font-size:10.5px; line-height:1.15; text-align:center; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sbtn.lv { border-color: rgba(var(--c), .7); background: rgba(var(--c), .16); color: var(--ds-fg); } .ipane .sbtn.lv { background: rgba(14,15,20,.74); } .sbtn.lv .i { color: rgb(var(--c)); }
.sbtn .lvl { display:flex; gap:3px; height:4px; } .sbtn .lvl i { width:10px; height:4px; border-radius:2px; background: var(--ds-line); } .sbtn .lvl i.f { background: rgb(var(--c)); }
.sbtn .lvl[hidden] { display:flex !important; visibility:hidden; }
.isop { container-type: inline-size; border-radius: var(--ds-r); overflow:hidden; position:relative; width:100%; aspect-ratio: 750 / 500; background: radial-gradient(ellipse 70% 55% at 50% 72%, #3b4654 0%, #181b21 62%, #0e0f13 100%); }
.isop.noimg { display:none; }
.isop svg.tl { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:1; } .isop svg.tl line { stroke-width:1.2; stroke-linecap:round; opacity:.6; } .isop svg.tl line.hid { stroke-dasharray: 5 5; opacity:.45; } .isop svg.tl .halo { opacity:.25; } .isop svg.tl circle.hid { fill:none; stroke-width:1.4; stroke-dasharray: 3 3; opacity:.7; }
.isop .tp { position:absolute; z-index:2; transform: translate(-50%,-50%); min-width:11.5cqw; padding:.5cqw 1.2cqw .6cqw; border-radius:1.9cqw; border:1px solid; background: rgba(14,15,20,.52); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); text-align:center; line-height:1.15; font-weight:700; white-space:nowrap; }
.isop .tp .n { font-size:1.45cqw; font-weight:600; color: var(--ds-fg2); letter-spacing:.02em; } .isop .tp .v { font-size:2.35cqw; } .isop .tp .s { font-size:1.55cqw; font-weight:600; }
.isop .tp.ok { border-color: rgb(var(--ds-ok)); color: rgb(var(--ds-ok)); background: rgba(var(--ds-ok), .14); } .isop .tp.bad { border-color: rgb(var(--ds-bad)); color: rgb(var(--ds-bad)); background: rgba(var(--ds-bad), .18); animation: ds-pill 1.8s ease-in-out infinite; } .isop .tp.na { border-color: rgba(148,163,184,.7); color: rgb(148,163,184); }
.isop svg.tl .ok { stroke: rgb(var(--ds-ok)); fill: rgb(var(--ds-ok)); } .isop svg.tl .bad { stroke: rgb(var(--ds-bad)); fill: rgb(var(--ds-bad)); } .isop svg.tl .na { stroke: rgb(148,163,184); fill: rgb(148,163,184); } .isop svg.tl circle:not(.hid) { stroke:none; }
@keyframes ds-pill { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
.isop img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; opacity:0; transition: opacity .3s ease; pointer-events:none; } .isop img.on { opacity:1; }
#vtabs button .tx { white-space:nowrap; } @media (max-width:430px) { #vtabs button:not(.on) .tx { display:none; } }
.ipane { border-radius: var(--ds-r); overflow:hidden; position:relative; width:100%; aspect-ratio: ${INT_SIZE.w} / ${INT_SIZE.h}; background:#0b0c10; }
.ipane img { position:absolute; inset:0; width:100%; height:100%; transition: opacity .35s ease; }
.ipane img.l { opacity:0; } .ipane img.l.on { opacity:1; }
.spot { --c: var(--ds-info); position:absolute; transform: translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:3px; padding:6px 8px; min-width:44px;
  border-radius:16px; cursor:pointer; border:1px solid rgba(255,255,255,.16); background: rgba(14,15,20,.62); color:#fff;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); -webkit-tap-highlight-color: transparent; transition: transform .12s ease, border-color .2s ease; }
.spot.lv { border-color: rgba(var(--c), .65); } .spot.hot { --c: 251,113,60; } .spot.cool { --c: 56,189,248; }
.spot .i { --is: 20px; } .spot.lv .i { color: rgb(var(--c)); } .spot:active { transform: translate(-50%,-50%) scale(.93); }
.spot .lvl { display:flex; gap:2px; } .spot .lvl i { width:7px; height:3px; border-radius:2px; background: rgba(255,255,255,.25); } .spot .lvl i.f { background: rgb(var(--c)); }
.spot .nm { font-size:9.5px; opacity:.75; white-space:nowrap; }
.vcol { display:flex; flex-direction:column; gap:10px; }
.crow { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.crow .in { font-size:12px; color: var(--ds-fg2); line-height:1.4; } .crow .in b { color: var(--ds-fg); font-weight:600; font-size:13px; }
.crow .act { --bs: 46px; }
/* Number picker (προσαρμογή του deepal-number-picker) */
.pk { position:relative; padding: 12px 0 10px; border-radius:18px; background: var(--ds-soft); border:1px solid var(--ds-line); user-select:none; -webkit-user-select:none; --pkbg: var(--ha-card-background, var(--card-background-color, #1c1c1c)); }
.pk .pt { text-align:center; font-size:12px; color: var(--ds-fg2); }
.pk .pv { display:flex; justify-content:center; align-items:flex-start; height:46px; font-size:38px; font-weight:500; line-height:44px; color: var(--ds-fg); letter-spacing:-.02em; }
.pk .pv small { font-size:16px; margin:3px 0 0 3px; }
.pk .pw { position:relative; height:52px; overflow:hidden; }
.pk .pp { --iw: 64px; display:flex; align-items:center; height:52px; overflow-x:auto; overflow-y:hidden; box-sizing:border-box; padding: 0 calc(50% - var(--iw) / 2);
  scroll-snap-type:x mandatory; scrollbar-width:none; touch-action:pan-x; -webkit-overflow-scrolling:touch; }
.pk .pp::-webkit-scrollbar { display:none; }
.pk .pn { flex:0 0 var(--iw); text-align:center; scroll-snap-align:center; scroll-snap-stop:always; color: rgba(var(--rgb-primary-text-color, 255,255,255), .3); font-size:16px; font-weight:500; transform:scale(.88); cursor:pointer;
  transition: transform .16s ease, color .16s ease; }
.pk .pn.near { color: rgba(var(--rgb-primary-text-color, 255,255,255), .55); transform:scale(.95); }
.pk .pn.act2 { color: var(--ds-fg); font-size:21px; font-weight:700; transform:scale(1); }
.pk .pc { position:absolute; left:50%; bottom:0; width:28px; height:3px; transform:translateX(-50%); border-radius:3px; background: rgb(var(--ds-info)); pointer-events:none; }
.pk .pf { position:absolute; top:0; bottom:0; width:56px; z-index:2; pointer-events:none; }
.pk .pf.l { left:0; background: linear-gradient(to right, var(--pkbg), transparent); } .pk .pf.r { right:0; background: linear-gradient(to left, var(--pkbg), transparent); }
.pk.cold .pc { background: rgb(56,189,248); } .pk.hot .pc { background: rgb(251,146,60); }
.vline { display:flex; flex-wrap:wrap; gap:6px; font-size:12px; color: var(--ds-fg2); }
.vline b { color: rgb(var(--c)); font-weight:600; }

[data-ent], .t2[data-open] { cursor:pointer; -webkit-tap-highlight-color: transparent; -webkit-touch-callout:none; user-select:none; -webkit-user-select:none; }
.tile[data-ent]:active, .chip[data-ent]:active, .t2[data-ent]:active, .total[data-ent]:active { transform: scale(.97); }
.status[data-ent], .total[data-ent] { cursor:pointer; }

/* Πληροφορίες */
.info { display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; } .info::-webkit-scrollbar { display:none; }
.tile { flex:1 0 auto; min-width: 88px; display:flex; align-items:center; gap:11px; padding:12px 15px; border-radius:18px; background: var(--ds-soft); border:1px solid var(--ds-line); }
.tile .i { --is: 24px; color: rgb(var(--ds-info)); } .tile .v { font-size:16px; font-weight:600; color: var(--ds-fg); white-space:nowrap; } .tile .l { font-size:13px; color: var(--ds-fg2); white-space:nowrap; }
.tells { position:absolute; right:14px; bottom:14px; z-index:8; display:flex; align-items:center; gap:4px; } .tells[hidden] { display:none; }
.tell { --c: var(--ds-bad); position:relative; width:36px; height:36px; padding:0; border:0; background:none; display:grid; place-items:center; cursor:pointer;
  color: rgb(var(--c)); filter: drop-shadow(0 0 8px rgba(var(--c), .5)) drop-shadow(0 1px 4px rgba(0,0,0,.75)); -webkit-tap-highlight-color: transparent; }
.tell .i, .tell .tt { --is: 32px; } .tell.ok { --c: var(--ds-ok); } .tell.warn { --c: var(--ds-warn); } .tell.bad { --c: var(--ds-bad); } .tell.na { --c: 148,163,184; } .tell:active { transform: scale(.92); }
.tell .n { position:absolute; right:-1px; top:-1px; min-width:16px; height:16px; padding:0 4px; box-sizing:border-box; border-radius:8px; display:grid; place-items:center; font-size:10px; font-weight:700; line-height:1; color:#111; background: rgb(var(--c)); filter:none; }
.tell.more { width:auto; min-width:34px; height:28px; padding:0 9px; border-radius:14px; font-size:13px; font-weight:700; color:#fff; filter:none; background: rgba(15,18,24,.62); border:1px solid rgba(255,255,255,.28); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); }
/* popup διαγνωστικών */
.box.dg { min-height:0; max-height:86%; } .box.dg .hd { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.dgsum { margin:4px 2px 10px; font-size:13px; font-weight:600; color: var(--ds-fg2); } .dgsum.ok { color: rgb(var(--ds-ok)); } .dgsum.bad { color: rgb(var(--ds-bad)); }
.dgbody { flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding-right:2px; }
.dgh { display:flex; align-items:center; gap:7px; margin:12px 2px 6px; font-size:11.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color: var(--ds-fg2); } .dgh em { font-style:normal; font-weight:600; padding:1px 7px; border-radius:9px; background: var(--ds-soft); letter-spacing:0; }
.dgh.bad { color: rgb(var(--ds-bad)); } .dgh.ok { color: rgb(var(--ds-ok)); }
.dglist { display:grid; grid-template-columns: 1fr; gap:6px; } .dglist.ok, .dglist.na { grid-template-columns: 1fr 1fr; }
.dgrow { --c: var(--ds-ok); display:flex; align-items:center; gap:10px; padding:8px 10px; min-height:52px; border-radius:14px; border:1px solid rgba(var(--c), .3); background: rgba(var(--c), .09); color: var(--ds-fg); text-align:left; cursor:pointer; font:inherit; -webkit-tap-highlight-color: transparent; }
.dgrow .tt, .dgrow .i { --is: 34px; color: rgb(var(--c)); } .dgrow > span { min-width:0; display:flex; flex-direction:column; gap:1px; } .dgrow b { font-size:13px; font-weight:600; line-height:1.2; overflow-wrap:anywhere; }
.dgrow small { font-size:11.5px; color: rgb(var(--c)); } .dgrow.warn { --c: var(--ds-warn); } .dgrow.bad { --c: var(--ds-bad); } .dgrow.na { --c: 148,163,184; }
.dgrow.bad, .dgrow.warn { background: rgba(var(--c), .14); border-color: rgba(var(--c), .55); } .dgrow.ok .tt, .dgrow.ok .i { --is: 28px; } .dgrow:active { transform: scale(.985); }
.dgnew { display:flex; flex-direction:column; gap:8px; margin:0 0 6px; padding:10px 12px; border-radius:14px; border:1px dashed rgba(var(--ds-info), .6); background: rgba(var(--ds-info), .1); } .dgnew b { display:block; font-size:13px; } .dgnew small { display:block; margin-top:2px; font-size:11.5px; color: var(--ds-fg2); }
.dgnew .btnrow { margin:0; justify-content:flex-end; } .dgfoot { margin-top:10px; justify-content:center; }
.tile.bad .i { color: rgb(var(--ds-bad)); }

/* Διαγνωστικά */
.diag { display:flex; align-items:flex-start; gap:8px; } .diag[data-empty-diag] { display:none; }
.chips { display:flex; flex-wrap:wrap; gap:6px; flex:1; min-width:0; }
.chip { display:inline-flex; align-items:center; gap:5px; padding: 5px 10px 5px 8px; border-radius:999px; font-size:12px; font-weight:500; color: var(--ds-fg);
  border:1px solid rgba(var(--c), .35); background: rgba(var(--c), .12); } .chip .i { --is: 15px; color: rgb(var(--c)); }
.gear { flex:none; width:30px; height:30px; display:grid; place-items:center; border-radius:50%; cursor:pointer; border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg2); padding:0; }
.gear .i { --is: 16px; }
.chgbox { position:absolute; z-index:8; top:50px; left: min(calc(50% + 29.8% * var(--ds-scale, 1.2) + 1px), calc(100% - 20px)); transform: translateX(-100%); display:flex; flex-direction:column; align-items:flex-end; gap:1px; white-space:nowrap; text-align:right; font-variant-numeric: tabular-nums; color: rgb(var(--ds-ok)); text-shadow: 0 1px 7px rgba(0,0,0,.9), 0 0 14px rgba(var(--ds-ok), .4); }
.chgbox .a { font-size:21px; font-weight:800; line-height:1.05; letter-spacing:-.01em; }
.chgbox .b { font-size:12.5px; font-weight:600; } .chgbox .b em { font-style:normal; font-weight:500; opacity:.8; text-transform:lowercase; }
.chgbox .c { font-size:11px; font-weight:700; letter-spacing:.08em; margin-right:-.08em; text-transform:uppercase; opacity:.9; } /* το αρνητικό margin ακυρώνει το κενό που αφήνει το letter-spacing μετά το τελευταίο γράμμα: το δεξί άκρο ευθυγραμμίζεται με τις άλλες γραμμές */
.chgbox.line { flex-direction:row; align-items:center; gap:6px; font-size:13.5px; font-weight:700; } .chgbox .i { --is:15px; } .chgbox i { font-style:normal; opacity:.5; }
.chgbox.text, .chgbox.big { top:46px; left: min(calc(50% + 29.8% * var(--ds-scale, 1.2) - 16px), calc(100% - 20px)); }
.chgbox.big .a { font-size:34px; font-weight:800; line-height:1; } .chgbox.big .a small { font-size:16px; font-weight:700; margin-left:2px; }
.chgbox.beside { top: calc(50% - 7.9% * var(--ds-scale, 1.2) - 10px); transform: translate(-100%, -50%); left: calc(50% + 29.8% * var(--ds-scale, 1.2) - 24px); }
/* ο οδηγός του κειμένου δεν είναι διακεκομμένος: ώστε να μη μοιάζει με τα διακεκομμένα της ροής στο καλώδιο */
.chgbox.beside::after { content:""; position:absolute; right:-24px; top:50%; width:20px; height:2px; margin-top:-1px; border-radius:2px; background: linear-gradient(90deg, rgba(var(--ds-ok), .9), rgba(var(--ds-ok), .15)); }
.chgbox.beside::before { content:""; position:absolute; right:-28px; top:50%; width:6px; height:6px; margin-top:-3px; border-radius:50%; background: rgba(var(--ds-ok), .35); border:1.5px solid rgb(var(--ds-ok)); box-sizing:border-box; }
.chgline { position:absolute; z-index:8; left: calc(50% + 29.8% * var(--ds-scale, 1.2)); top:74px; width:2px; margin-left:-1px; border-radius:2px; height: max(0px, calc(50% - 7.9% * var(--ds-scale, 1.2) - 84px)); background: linear-gradient(180deg, rgba(var(--ds-ok), .85), rgba(var(--ds-ok), .15)); filter: drop-shadow(0 0 3px rgba(var(--ds-ok), .6)); }
.chgline.s-text, .chgline.s-big, .chgline.s-beside { display:none; }
.chgbox[hidden], .chgline[hidden] { display:none; }
/* Car View: η πρίζα είναι σε άλλο σημείο από τις φωτογραφίες και κινείται με το πλάτος και τη μεγέθυνση· το κείμενο φόρτισης δένεται πάνω της (cqw = 1% του πλάτους του hero) */
.hero[data-style="carview"] { --ds-px: calc(50% + var(--ds-cvs, 1.08) * 26.47cqw); --ds-py: calc(50% + var(--ds-cvs, 1.08) * .27cqw); }
.hero[data-style="carview"] .chgbox { top: calc(var(--ds-py) - 55px); left: min(calc(var(--ds-px) + 1px), calc(100% - 20px)); }
.hero[data-style="carview"] .chgbox.text, .hero[data-style="carview"] .chgbox.big { top: calc(var(--ds-py) - 58px); left: min(calc(var(--ds-px) - 16px), calc(100% - 20px)); }
.hero[data-style="carview"] .chgbox.beside { top: calc(var(--ds-py) - 10px); left: calc(var(--ds-px) - 24px); }
.hero[data-style="carview"] .chgline { left: var(--ds-px); top: calc(var(--ds-py) - 37px); height: 27px; }
.hero { container-type: inline-size; }
@container (max-width: 370px) { .chgbox.line { font-size:12.5px; } .chgbox .a { font-size:18px; } .chgbox.big .a { font-size:28px; } }
.charge { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; padding: 12px; border-radius:18px; border:1px solid rgba(var(--ds-ok), .28); background: linear-gradient(145deg, rgba(var(--ds-ok), .10), var(--ds-soft)); }
.charge > div { min-width:0; } .charge .l { font-size:11.5px; color: var(--ds-fg2); }
.charge .v { margin-top:3px; font-size:15px; font-weight:600; color: var(--ds-fg); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.foot { align-self:center; display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border:0; border-radius:999px; background:transparent; cursor:pointer; color: var(--ds-fg2); font-size:11.5px; opacity:.75; }
.foot .age { margin-right:4px; } .foot .age.old { color: rgb(var(--ds-warn)); } .foot:not(.nosets) .age:not([hidden])::after { content:'·'; margin-left:10px; } .foot:hover, .foot:focus-visible { opacity:1; } .foot .i { --is: 14px; } .foot .sets { display:inline-flex; align-items:center; gap:6px; } .foot.nosets { cursor:default; pointer-events:none; } .foot.nosets .sets { display:none; }

/* Φύλλο */
.sheet { position:fixed; inset:0; z-index:100000; display:none; align-items:flex-end; justify-content:center; padding:10px; background: rgba(0,0,0,.62); }
/* ρευστή απόδοση: όσο ανοιχτό είναι παράθυρο ή η κάρτα είναι εκτός οθόνης, παγώνουν τα εφέ από πίσω */
ha-card:has(.sheet.show) *:not(.sheet):not(.sheet *), ha-card.off *, ha-card.off *::before, ha-card.off *::after { animation-play-state: paused !important; }
.sheet.show { display:flex; animation: ds-fade .3s ease-out; }
@media (min-width:640px) { .sheet { align-items:center; } }
.box { width:100%; max-width:560px; max-height:70%; min-height:min(300px, 100%); box-sizing:border-box; display:flex; flex-direction:column; padding:16px 14px 12px; border-radius:24px; background: var(--ha-card-background, var(--card-background-color, #222)); border:1px solid var(--ds-line); animation: ds-up .42s cubic-bezier(.22,.8,.3,1); overflow:hidden; }
.box.wide { overflow:hidden; max-height:94%; } .box.confirm { min-height:0; }
/* κινητό: το παράθυρο επιβεβαίωσης δεν κολλάει στο κάτω άκρο (κάτω μπάρα/χειρονομίες) – ανεβαίνει και τα κουμπιά μεγαλώνουν */
@media (max-width:639px) {
  .sheet:has(.box.confirm) { padding-bottom: calc(max(10px, env(safe-area-inset-bottom, 0px)) + 84px); }
  .box.confirm { padding-bottom:16px; }
  .box.confirm h3 { font-size:18px; } .box.confirm p.c { font-size:14px; margin:8px 0 16px; }
  .box.confirm .btnrow { gap:10px; } .box.confirm .btn { min-height:54px; font-size:16px; border-radius:16px; }
}
.box h3 { margin:0; font-size:16px; font-weight:600; color: var(--ds-fg); } .box p.c { margin:6px 0 12px; font-size:13px; color: var(--ds-fg2); text-align:center; }
.confirm { text-align:center; }
.hd { flex:none; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.x { flex:none; width:30px; height:30px; display:grid; place-items:center; border-radius:50%; border:1px solid var(--ds-line); background: var(--ds-soft); cursor:pointer; padding:0; } .x .i { --is: 16px; }
.box deepal-s05-settings { flex:1 1 auto; min-height:0; display:block; overflow-y:auto; overflow-x:hidden; }
@keyframes ds-up { from { transform: translateY(110%) } to { transform:none } }
@keyframes ds-fade { from { opacity:0 } to { opacity:1 } }
@media (prefers-reduced-motion: reduce) { .fx *, .act, .act .ring rect, .gauge .fp, .fxs *, .stage img, .bar b, .box, .l, .hdl rect { animation: none !important; transition: none !important; } }
/* αριθμοί σταθερού πλάτους */
.total .big, .gauge .c, .t2 .lg b, .t2 .ts b, .tile .v, .cur, .cv b, .tp .v, .picker, .pk * { font-variant-numeric: tabular-nums; }

/* κουμπιά: κύρια σειρά + «Περισσότερα» */
.actions.split { --bs: 60px; display:block; padding:2px 0 4px; }
.actions.split.sz-s { --bs: 50px; } .actions.split.sz-l { --bs: 68px; }
.actions.split .prow { display:grid; grid-template-columns: repeat(var(--np, 4), 1fr); gap: 4px; }
.actions.split .mrow { display:flex; flex-wrap:wrap; justify-content:center; gap: 14px 4px; padding: 0; transition: padding .28s ease; }
.actions.split.moreopen .mrow { padding: 12px 0 8px; }
.actions.split .mrow .cell { flex: 0 0 calc((100% - (var(--np, 4) - 1) * 4px) / var(--np, 4)); }
.actions.split .mwrap { display:grid; grid-template-rows: 0fr; transition: grid-template-rows .28s ease, opacity .2s ease; opacity:0; }
.actions.split.moreopen .mwrap { grid-template-rows: 1fr; opacity:1; }
.actions.split .mrow { min-height:0; overflow:hidden; }
.actions.split .mrow .cap.t { font-size:12.5px; }
.morebtn { position:relative; display:flex; align-items:center; justify-content:center; margin:0 auto; padding:0; width:52px; height:22px; min-height:0; border-radius:999px; border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg2); cursor:pointer; -webkit-tap-highlight-color: transparent; }
.morebtn::before { content:""; position:absolute; inset:-12px -14px; } /* μεγάλη περιοχή αφής, αόρατη */
.morebtn > span:not(.mdot) { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
.actions.split .morebtn { margin-top:6px; margin-bottom:2px; } .actions.split .morebtn:hover { color: var(--ds-fg); }
.morebtn .i { --is:16px; transition: transform .25s ease; } .actions.moreopen .morebtn .i { transform: rotate(180deg); }
.morebtn:focus-visible { outline: 2px solid rgb(var(--ds-info)); outline-offset: 2px; }
.morebtn .mdot { position:absolute; top:3px; right:9px; width:7px; height:7px; border-radius:50%; background: rgb(var(--ds-warn)); }
.actions.offline .cell { opacity:.42; filter: grayscale(1); } .actions.offline .act { cursor:default; }

@media (max-width:639px) { .box::before { content:""; flex:none; display:block; width:38px; height:4px; margin:-8px auto 10px; border-radius:3px; background: var(--ds-line); } .box.confirm::before { margin-bottom:6px; } }
.box:focus { outline:none; }
/* Car View: απαλή σκιά δαπέδου και μήνυμα «όλα καλά» */
.isop::before { content:""; position:absolute; left:20%; right:14%; bottom:19%; height:9%; background: radial-gradient(ellipse at center, rgba(0,0,0,.6), transparent 70%); filter: blur(5px); pointer-events:none; }
.vline.good { color: var(--ds-fg2); }
`;

const SETTINGS_CSS = `
.csw { display:flex; gap:14px; flex-wrap:wrap; padding:6px 2px 10px; } .csw button { flex:none; width:46px; height:46px; min-width:46px; border-radius:50%; padding:0; border:2px solid var(--ds-line); cursor:pointer; box-shadow: inset 0 0 0 2px rgba(0,0,0,.28); transition: transform .15s ease; } .csw button:active { transform: scale(.92); } .csw button.on { border-color: rgb(var(--ds-info)); box-shadow: 0 0 0 3px rgba(var(--ds-info), .4), inset 0 0 0 2px rgba(0,0,0,.28); }
:host { display:block; ${VARS} color: var(--ds-fg); }
${BASE_CSS}
.wrap { display:flex; flex-direction:column; gap:10px; }
.tabbar { position:sticky; top:0; z-index:5; display:flex; align-items:center; gap:6px; padding:2px 0 8px; background: var(--ha-card-background, var(--card-background-color, #222)); }
.tabs { position:relative; flex:1; min-width:0; display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; cursor:grab; } .tabs::-webkit-scrollbar { display:none; }
.tn { flex:none; width:32px; height:32px; display:grid; place-items:center; padding:0; border-radius:50%; border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg); cursor:pointer; } .tn[hidden] { display:none; } .tn .i { --is:16px; } .tn.l .i { transform: scaleX(-1); }
.tabs button { flex:none; user-select:none; display:inline-flex; align-items:center; gap:6px; padding:8px 13px 8px 10px; border-radius:999px; border:1px solid var(--ds-line); background:transparent; cursor:pointer; font-size:12.5px; font-weight:600; color: var(--ds-fg2); transition: background .2s, color .2s, border-color .2s; }
.tabs button .i { --is:16px; }
.tabs button.on { background: rgba(var(--ds-info), .18); color: rgb(var(--ds-info)); border-color: rgba(var(--ds-info), .45); }
.tabs button.on span { color: var(--ds-fg); }
.hint { margin:0; font-size:12px; color: var(--ds-fg2); line-height:1.4; }
h4 { margin:0 0 2px; font-size:11.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color: var(--ds-fg2); }
.grp { display:flex; flex-direction:column; gap:10px; padding:13px; border-radius:20px; background: var(--ds-soft); border:1px solid var(--ds-line); }
.grp .row, .grp .chk { background: rgba(var(--rgb-primary-text-color, 255,255,255), .05); }
.grp input[type=text], .grp input[type=number], .grp select, .grp textarea { background: rgba(var(--rgb-primary-text-color, 255,255,255), .06); }
.opt { display:flex; flex-direction:column; gap:7px; } .opt .ol { font-size:13.5px; } .opt .ol small { display:block; margin-top:2px; font-size:11.5px; color: var(--ds-fg2); line-height:1.35; }
.seg.wide { width:100%; box-sizing:border-box; } .seg.wide button { flex:1; }
.sw-c { display:flex; align-items:center; gap:10px; font-size:13.5px; color: var(--ds-fg); } .sw-c span { flex:1; }
.sw-c input[type=color] { -webkit-appearance:none; appearance:none; width:30px; height:30px; padding:0; border:2px solid var(--ds-line); border-radius:50%; background:none; cursor:pointer; flex:none; order:-1; }
.sw-c input[type=color]::-webkit-color-swatch-wrapper { padding:0; } .sw-c input[type=color]::-webkit-color-swatch { border:0; border-radius:50%; } .sw-c input[type=color]::-moz-color-swatch { border:0; border-radius:50%; }
.lvhead, .lvrow { display:grid; grid-template-columns: 1fr 86px 86px; gap:8px; align-items:center; } .lvhead { font-size:11px; color: var(--ds-fg2); text-align:center; }
.lvrow input[type=number] { width:100%; text-align:center; } .lvrow .dash { text-align:center; color: var(--ds-fg2); font-style:normal; }
.lvbar { height:10px; border-radius:999px; box-shadow: inset 0 0 0 1px var(--ds-line); }

.list { display:flex; flex-direction:column; gap:4px; }
.row { display:flex; align-items:center; gap:8px; padding:7px 8px 7px 11px; border-radius:13px; background: var(--ds-soft); min-height:44px; }
.row > span { flex:1; min-width:0; font-size:13.5px; overflow:hidden; text-overflow:ellipsis; } .row > span small { display:block; font-size:11px; color: var(--ds-fg2); }
.row.off > span { opacity:.45; } .row > .i { color: var(--ds-fg2); }
.row.tg { cursor:pointer; text-align:left; border:0; width:100%; } .row.tg.on > .i { color: rgb(var(--ds-info)); }
.swb { border:0; background:transparent; padding:6px 2px 6px 6px; cursor:pointer; display:grid; place-items:center; }
.field { display:flex; flex-direction:column; gap:4px; font-size:12px; color: var(--ds-fg2); }
.field.inline { flex-direction:row; align-items:center; justify-content:space-between; gap:10px; }
input[type=text], input[type=number], select { width:100%; box-sizing:border-box; padding:9px 11px; border-radius:11px; border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg); font-size:13.5px; min-width:0; }
input[type=number] { width:90px; }
input[type=color] { padding:0; }
select option { color:#000; }
.grid2 { display:grid; grid-template-columns: 1fr 1fr; gap:8px; }
.add { padding:10px; border-radius:14px; border:1px dashed var(--ds-line); display:flex; flex-direction:column; gap:8px; }
.icons { display:flex; flex-wrap:wrap; gap:4px; } .icons button { width:34px; height:34px; display:grid; place-items:center; border-radius:10px; border:1px solid var(--ds-line); background:transparent; cursor:pointer; color: var(--ds-fg2); padding:0; }
.icons button.on { border-color: rgb(var(--ds-info)); color: rgb(var(--ds-info)); background: rgba(var(--ds-info), .12); } .icons .i { --is: 18px; }
.chk { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:11px; background: var(--ds-soft); font-size:12.5px; }
.chk .th { width:54px; height:34px; border-radius:8px; background:#000 center/cover no-repeat; flex:none; border:1px solid var(--ds-line); }
.chk code { font-size:11px; color: var(--ds-fg2); } .chk .st { margin-left:auto; font-weight:600; } .chk .st.ok { color: rgb(var(--ds-ok)); } .chk .st.no { color: rgb(var(--ds-bad)); }
.chk input { flex:1; min-width:0; padding:6px 8px; font-size:12px; }
textarea { width:100%; box-sizing:border-box; min-height:150px; padding:10px; border-radius:12px; border:1px solid var(--ds-line); background: var(--ds-soft); color: var(--ds-fg); font:12px/1.45 ui-monospace, Menlo, monospace; }
.note { font-size:12px; color: rgb(var(--ds-ok)); min-height:16px; }
`;


