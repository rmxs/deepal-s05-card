/*!
 * deepal-s05-card
 * Copyright (c) 2026 L.K. — MIT License
 * Custom Lovelace card για Deepal S05 (και PHEV): hero με layers, κουμπιά ελέγχου,
 * Car View με ελαστικά, εσωτερικό (θέρμανση/αερισμός), διαγνωστικά, δικό της UI ρυθμίσεων.
 *
 * Χωρίς εξαρτήσεις και χωρίς CDN. Τα εικονίδια είναι δικά της (ενσωματωμένα).
 * Οι εικόνες των layers (Car View/εσωτερικό) προέρχονται από το έργο dec_deepal
 * (MIT) — δες THIRD_PARTY_NOTICES.md στον φάκελο της κάρτας.
 */
(() => {
const CARD_VERSION = "1.3.0";
const TAG = "deepal-s05-card";
const SETTINGS_TAG = "deepal-s05-settings";
const EDITOR_TAG = "deepal-s05-card-editor";
if (customElements.get(TAG)) return;

const BAD = ["unknown", "unavailable", "none", "None", "null", ""];
const TRANSITIONAL = ["locking", "unlocking", "opening", "closing"];
const CLIMATE_TURN_OFF = 128; // ClimateEntityFeature.TURN_OFF
const CLIMATE_TURN_ON = 256; // ClimateEntityFeature.TURN_ON

/* Ο φάκελος της κάρτας (εκεί που βρίσκεται αυτό το .js) — από εκεί φορτώνουν οι εικόνες. */
const SCRIPT_BASE = (() => {
  if (window.__DEEPAL_CARD_BASE) return window.__DEEPAL_CARD_BASE;
  try {
    const s = [...document.querySelectorAll("script[src]")].find((x) => /deepal-s05-card[^/]*\.js/.test(x.src));
    if (s) return new URL(".", s.src).href;
    const r = performance.getEntriesByType("resource").find((x) => /deepal-s05-card[^/]*\.js/.test(x.name));
    if (r) return new URL(".", r.name).href;
  } catch (_) {}
  return "/hacsfiles/deepal-s05-card/";
})();

/* ───────────────────────── Προεπιλογές ───────────────────────── */
const SECTIONS = ["hero", "actions", "status", "stats", "info", "diagnostics", "charge"];
const SECTION_LABELS = {
  hero: "Εικόνα οχήματος",
  actions: "Κουμπιά ελέγχου",
  status: "Κατάσταση (πάνω στην εικόνα)",
  stats: "Θερμοκρασία & μπαταρία",
  info: "Πληροφορίες",
  diagnostics: "Διαγνωστικά",
  charge: "Φόρτιση (όταν συνδέεται)",
};
const HERO_SHOW_OPTS = [["name", "Όνομα"], ["plate", "Πινακίδα"], ["range", "Συνολική αυτονομία"], ["cloud", "Σύνδεση με cloud"], ["updated", "Τελευταία ενημέρωση"]];
const BUTTON_IDS = ["lock", "windows", "trunk", "climate", "tires", "cabin", "flash", "honk", "find"];
const BUTTON_LABELS = {
  lock: "Κλείδωμα",
  windows: "Παράθυρα",
  trunk: "Πορτμπαγκάζ",
  climate: "Κλιματισμός",
  tires: "Ελαστικά",
  cabin: "Εσωτερικό",
  flash: "Φώτα",
  honk: "Κόρνα",
  find: "Φώτα + κόρνα",
  refresh: "Ανανέωση",
};

const DEFAULTS = {
  prefix: "s05",
  name: "Deepal S05",
  image_path: null, // φάκελος με τις φωτογραφίες hero (null = αυτόματα)
  layers_path: null, // φάκελος με τα layers (null = <φάκελος κάρτας>/images/)
  image_scale: 1.2,
  image_aspect: null,
  powertrain: "auto", // auto (από τους αισθητήρες καυσίμου) | phev | ev (μόνο ηλεκτρικό)
  fuel_max: 941,
  confirm: ["unlock", "trunk", "windows"],
  order: SECTIONS.slice(),
  hidden: [],
  buttons: BUTTON_IDS.slice(),
  buttons_hidden: [],
  button_layout: "split", // split (κύρια κουμπιά + «Περισσότερα») | grid (σειρές) | scroll (μία γραμμή με scroll) | fit (μία γραμμή, χωράνε όλα)
  climate_ui: "steps", // πλακίδιο κλιματισμού: steps (στόχος με − / + και μικρό power) | circle (κλασικό: μεγάλος κύκλος on/off)
  button_primary: 4, // split: πόσα κουμπιά (από την αρχή της λίστας) μπαίνουν στην κύρια σειρά
  buttons_more: "collapse", // split: collapse (κρυμμένα πίσω από το «Περισσότερα») | show
  button_labels: "both", // none | status | title | both
  button_size: "m", // s | m | l
  diag: null, // null = όλα
  diag_mode: "alerts", // alerts | all
  diag_custom: [],
  diag_ignore: [], // αισθητήρες που βρέθηκαν από την «Ανακάλυψη» και ο χρήστης αγνόησε
  hero_show: ["name", "plate", "range"], // τι φαίνεται πάνω στην εικόνα: name, plate, range, cloud, updated
  info: ["odometer", "fuel_level"],
  info_custom: [], // [{entity, label, icon, unit}]
  entities: {},
  images: {},
  climate_on_mode: null,
  tire_min: 2.0, // bar — κάτω από αυτό «χαμηλή»
  tire_max: 3.5, // bar — πάνω από αυτό «υψηλή»
  tire_unit: "bar", // bar | kPa | psi
  tire_check: "vehicle", // vehicle = μόνο οι ειδοποιήσεις του οχήματος · limits = τα δικά μου όρια · both = και τα δύο
  hero_style: "photo", // εικόνα hero: photo (οι μαύρες φωτογραφίες σου) | carview (3/4 render σε χρώμα· στη φόρτιση διάφανη όψη με καλώδιο)
  car_color: "black", // χρώμα αμαξιού στις εικόνα Car View: black · blue · grey · silver · white
  iso_wheels: "cover", // ζάντες στο Car View: cover (20" με τάπες) · open (20" χωρίς τάπες) · pro (18")
  charge_style: "line", // line · text · big · beside
  air_t1: 22, air_t2: 24, // κλιματισμός: μέχρι t1 δροσερός αέρας, μέχρι t2 μέτριος, πάνω ζεστός
  air_c1: "#8ec5ff", air_c2: "#ffcc3d", air_c3: "#ff7a2e", // χρώματα αέρα: δροσερό · μέτριο · ζεστό
  show_customize: true,
  language: "auto", // auto (γλώσσα του HA) | el | en | …
  charge_fx: "flow_port", // εφέ φόρτισης πάνω στο αμάξι: flow_port | flow | port | sweep | none
  toasts: true, // μηνύματα πάνω στην οθόνη
  card_padding: "normal", // normal | half | none (εικόνα από άκρη σε άκρη)
  popup_padding: "normal", // normal | half | none
  toast_position: "bottom", // πάνω στην εικόνα: bottom | top
  toast_duration: 5, // δευτερόλεπτα
  lvl_red: "#f87171", lvl_orange: "#fb923c", lvl_yellow: "#facc15", lvl_green: "#34d399", // χρώματα επιπέδων μπαταρίας/καυσίμου
  bat_t1: 30, bat_t2: 50, bat_t3: 70, // μπαταρία %: κάτω από t1 κόκκινο, t2 πορτοκαλί, t3 κίτρινο, αλλιώς πράσινο
  fuel_t1: 10, fuel_t2: 25, fuel_t3: 40, // καύσιμο % της δεξαμενής
};
// Κλειδιά που αλλάζουν από το UI ρυθμίσεων
/* Αυτόματη αναγνώριση προθέματος: αν το ορισμένο δεν βρίσκεται (π.χ. άλλο όνομα συσκευής: mycar_…), ψάχνουμε στο HA ποιο πρόθεμα έχει τους αισθητήρες του οχήματος */
const PFX_SIG = [["lock", "doors"], ["sensor", "battery_level"], ["sensor", "remaining_range"], ["cover", "trunk"], ["cover", "windows"], ["climate", "cabin_climate"], ["binary_sensor", "charging"], ["sensor", "total_odometer"], ["button", "honk_horn"]];
let _pfxCache = { key: "", t: 0, val: null, list: [] };
const pfxCandidates = (hass) => {
  const st = hass?.states || {}, score = {};
  for (const id of Object.keys(st)) {
    const i = id.indexOf("."), d = id.slice(0, i), n = id.slice(i + 1);
    for (const [sd, ss] of PFX_SIG) if (d === sd && n.endsWith("_" + ss) && n.length > ss.length + 1) { const p = n.slice(0, -(ss.length + 1)); (score[p] = score[p] || new Set()).add(sd + "." + ss); }
  }
  return Object.entries(score).map(([p, s]) => [p, s.size]).filter((x) => x[1] >= 3).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map((x) => x[0]);
};
const effPrefix = (hass, c) => {
  const st = hass?.states, p = c.prefix;
  if (!st || st[`sensor.${p}_battery_level`] || st[`lock.${p}_doors`] || st[`cover.${p}_windows`]) return p;
  const now = Date.now(), key = p;
  if (_pfxCache.key !== key || now - _pfxCache.t > 5000) { const l = pfxCandidates(hass); _pfxCache = { key, t: now, val: l[0] || null, list: l }; }
  return _pfxCache.val || p;
};
/* Ανεξάρτητα από τη γλώσσα του HA: το integration δίνει σε κάθε οντότητα σταθερό translation_key (π.χ. "remaining_range") στο registry,
   ενώ το entity_id παράγεται από το μεταφρασμένο όνομα. Αν δεν βρεθεί το αναμενόμενο entity_id, ψάχνουμε με translation_key. */
const TK_SPECIAL = {
  "binary_sensor.cloud_connection": "connected", "binary_sensor.key_fob_battery_low": "key_battery_low",
  "sensor.remaining_charge_time_h_mm": "remaining_charge_time_formatted", "sensor.charging_type": "charge_mode",
  "button.flash_lights_and_honk": "flash_and_honk", "sensor.climate_fan_level": "fan_level",
  "binary_sensor.tire_pressure_warning": "warning_tpms", "binary_sensor.abs_warning": "warning_abs", "binary_sensor.brake_warning": "warning_brake",
  "binary_sensor.brake_fluid_warning": "warning_brake_fluid", "binary_sensor.power_steering_warning": "warning_eps", "binary_sensor.power_limit_warning": "warning_power_limit",
  "binary_sensor.power_system_warning": "warning_power_system", "binary_sensor.traction_battery_low_warning": "warning_traction_battery_low",
  "binary_sensor.12_v_battery_warning": "warning_12v_battery", "binary_sensor.airbag_warning": "warning_airbag",
};
const tkOf = (key) => {
  if (TK_SPECIAL[key]) return TK_SPECIAL[key];
  const s = key.slice(key.indexOf(".") + 1);
  let m = s.match(/^(front_left|front_right|rear_left|rear_right)_(tire_pressure|tire_alarm|window_open|window_opening|seat_heating_level|seat_ventilation_level)$/);
  if (m) return `${m[2]}_${m[1]}`;
  m = s.match(/^(front_left|front_right|rear_left|rear_right)_door$/);
  return m ? `door_${m[1]}` : s;
};
let _tkCache = { reg: null, p: null, idx: null };
const tkIndex = (hass, p) => {
  const reg = hass?.entities;
  if (!reg) return null;
  if (_tkCache.reg === reg && _tkCache.p === p) return _tkCache.idx;
  const byDev = {};
  for (const e of Object.values(reg)) {
    if (e.platform !== "deepal" || !e.translation_key) continue;
    const eid = e.entity_id, d = e.device_id || "_";
    (byDev[d] = byDev[d] || {})[`${eid.slice(0, eid.indexOf("."))}.${e.translation_key}`] = eid;
  }
  const devs = Object.values(byDev);
  const idx = devs.find((m) => Object.values(m).some((eid) => eid.slice(eid.indexOf(".") + 1).startsWith(p + "_"))) || devs[0] || null;
  _tkCache = { reg, p, idx };
  return idx;
};
const resolveId = (hass, c, key) => {
  const ov = c.entities?.[key]; if (ov) return ov;
  const i = key.indexOf("."), p = effPrefix(hass, c), cand = `${key.slice(0, i)}.${p}_${key.slice(i + 1)}`;
  if (!hass?.states || hass.states[cand]) return cand;
  const idx = tkIndex(hass, p);
  return (idx && idx[`${key.slice(0, i)}.${tkOf(key)}`]) || cand;
};
const hasFuel = (hass, c) => c.powertrain === "ev" ? false : c.powertrain === "phev" ? true
  : !!hass?.states && ["fuel_range", "fuel_level"].some((k) => hass.states[resolveId(hass, c, `sensor.${k}`)]);
const SETTING_KEYS = Object.keys(DEFAULTS);

const HERO_FILES = {
  off: "hero_off.jpg",
  lights: "hero_lights.jpg",
  unlocked: "hero_unlocked.jpg",
  unlocked_lights: "hero_unlocked_lights.jpg",
  charging: "hero_charging.jpg",
  charging_unlocked: "hero_charging_unlocked.jpg",
  complete: "hero_charge_complete.jpg",
};
// Εικόνες ταμπλό (εσωτερικό): χωρίς / με θέρμανση τιμονιού. Ο αέρας των αεραγωγών είναι SVG animation.
const DASH_FILES = { dash_off: "dash_off.jpg", dash_off_steer: "dash_off_steer.jpg" };
const HERO_LABELS = {
  dash_off: "Ταμπλό (ο αέρας ζωγραφίζεται με SVG)",
  dash_off_steer: "Ταμπλό · θέρμανση τιμονιού",
  off: "Σβηστό · κλειδωμένο",
  lights: "Φώτα αναμμένα",
  unlocked: "Ξεκλείδωτο",
  unlocked_lights: "Ξεκλείδωτο + φώτα",
  charging: "Φόρτιση",
  charging_unlocked: "Φόρτιση + ξεκλείδωτο",
  complete: "Φόρτιση ολοκληρώθηκε",
};

/* ───────────────────────── Εικονίδια ─────────────────────────
 * Γλώσσα σχεδίασης: λεπτές γραμμές 1.6, στρογγυλές άκρες, πλέγμα 24×24, με μία
 * «τονισμένη» επιφάνεια (class a) όπως στις εφαρμογές κατασκευαστών. Τα σχήματα
 * παίρνουν από το S05: κεκλιμένη οροφή (fastback), λεπτή μπάρα φώτων στο μέτωπο,
 * στρογγυλεμένο άνοιγμα πόρτας. k = γεμάτο σχήμα, a = τονισμένη επιφάνεια. */
const WHEEL = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="1.9"/>`;
const BLADE = '<path d="M12 10.4C11.5 6.4 13.3 3.9 15.8 4.4 17.3 4.8 16.9 7.7 13.8 10.7"/>';
const FAN = `${BLADE}<g transform="rotate(120 12 12)">${BLADE}</g><g transform="rotate(240 12 12)">${BLADE}</g><circle cx="12" cy="12" r="1.4" class="k"/>`;
const SEAT = '<path d="M8.2 3.8c-1 0-1.6.9-1.3 1.8l2.2 7.6c.2.7.8 1.1 1.5 1.1h5.2c1 0 1.8.8 1.8 1.8V19"/><path class="a" d="M9.4 14.3h5.6c1.2 0 2 .9 2 2v.4H10.8c-.8 0-1.4-.5-1.6-1.2z"/><path d="M9.2 19.5h8.6"/>';
const TIRE = '<path d="M7.2 5.9A7.6 7.6 0 0 0 4.6 11.4c0 2.1.9 4 2.3 5.4.5.5 1.2.8 1.9.8h6.4c.7 0 1.4-.3 1.9-.8a7.6 7.6 0 0 0 2.3-5.4c0-2.2-1-4.2-2.6-5.5"/><path d="M12 8.4v4.2"/><path d="M12 15.1h.01" stroke-width="2.1"/>';
const CARBODY = '<path d="M3 17.2v-3c0-.9.6-1.6 1.4-1.8l1.9-.6 1.6-3.2c.3-.6.9-.9 1.5-.9h4.9c.6 0 1.1.3 1.5.7l2.4 3.2 1.4.4c.9.3 1.4 1 1.4 1.9v3.3h-1.4M14.8 17.2H9.2M5.2 17.2H3"/><circle cx="7.2" cy="17.2" r="2"/><circle cx="16.8" cy="17.2" r="2"/>';
const ICONS = {
  /* ── Κουμπιά ελέγχου ── */
  lock: '<rect class="a" x="5" y="10.4" width="14" height="9.8" rx="3.4"/><path d="M8.2 10.4V8.2a3.8 3.8 0 0 1 7.6 0v2.2"/><circle cx="12" cy="14.4" r="1.15" class="k"/><path d="M12 15v2"/>',
  unlock: '<rect class="a" x="5" y="10.4" width="14" height="9.8" rx="3.4"/><path d="M8.2 10.4V8.2a3.8 3.8 0 0 1 7.3-1.5"/><circle cx="12" cy="14.4" r="1.15" class="k"/><path d="M12 15v2"/>',
  windowclosed: '<path d="M4.6 20.2V9.2l3.5-4.4c.3-.4.8-.6 1.3-.6H18c.8 0 1.4.6 1.4 1.4v14.6z"/><path class="a" d="M8.2 9.4l2.3-3.2h7v8.4H8.2z"/><path d="M12.9 13.1V8.7M10.9 10.7l2-2 2 2"/>',
  windowopen: '<path d="M4.6 20.2V9.2l3.5-4.4c.3-.4.8-.6 1.3-.6H18c.8 0 1.4.6 1.4 1.4v14.6z"/><path class="a" d="M8.2 9.4l1.1-1.5h8.2v1.5z"/><path d="M12.9 12.2v4.6M10.9 14.8l2 2 2-2"/>',
  trunk: '<g transform="scale(0.02674)" stroke-width="34"><path d="M32 548V442Q34 408 92 388C170 362 262 338 336 314C420 252 480 214 560 190C650 164 800 162 1002 172L1012 180C1100 232 1200 268 1288 322Q1304 340 1312 372C1322 420 1322 480 1318 520L1300 546H1163A130 130 0 0 0 903 546H342A130 130 0 0 0 82 546Z"/><path d="M482 316Q562 262 648 228H660V316ZM716 228H866Q934 244 976 292L716 312Z"/><path d="M690 334Q696 430 692 505"/><path d="M1012 184C1100 226 1196 262 1262 306"/><circle cx="212" cy="567" r="93"/><circle cx="1033" cy="565" r="94"/><circle cx="212" cy="567" r="15" fill="currentColor" stroke="none"/><circle cx="1033" cy="565" r="15" fill="currentColor" stroke="none"/></g>',
  trunkopen: '<g transform="scale(0.02674)" stroke-width="34"><path d="M32 548V442Q34 408 92 388C170 362 262 338 336 314C420 252 480 214 560 190C650 164 800 162 1002 172L1012 180C1100 232 1200 268 1288 322Q1304 340 1312 372C1322 420 1322 480 1318 520L1300 546H1163A130 130 0 0 0 903 546H342A130 130 0 0 0 82 546Z"/><path d="M482 316Q562 262 648 228H660V316ZM716 228H866Q934 244 976 292L716 312Z"/><path d="M690 334Q696 430 692 505"/><path d="M1010 176L1180 22Q1330 -4 1476 62Q1468 100 1424 100L1290 100L1062 184ZM1120 160L1222 70Q1320 58 1400 84"/><circle cx="212" cy="567" r="93"/><circle cx="1033" cy="565" r="94"/><circle cx="212" cy="567" r="15" fill="currentColor" stroke="none"/><circle cx="1033" cy="565" r="15" fill="currentColor" stroke="none"/></g>',
  tirealert: '<path d="M7.2 5.9A7.6 7.6 0 0 0 4.6 11.4c0 2.1.9 4 2.3 5.4.5.5 1.2.8 1.9.8h6.4c.7 0 1.4-.3 1.9-.8a7.6 7.6 0 0 0 2.3-5.4c0-2.2-1-4.2-2.6-5.5"/><path d="M12 8.2v4.4"/><path d="M12 15.2h.01" stroke-width="2.2"/>',
  interioron: '<path d="M7.6 6.2c-1 0-1.7.9-1.4 1.9l1.4 5.4c.2.8.9 1.3 1.7 1.3h6.3"/><path class="a" d="M9.2 15.4h6.5c1.2 0 2.2 1 2.2 2.2v.3H9.9c-.9 0-1.6-.6-1.8-1.4z"/><path d="M8.8 20.6h9.2"/><path d="M13.6 3.4c-1.2 1 1.2 2 0 3M17.2 3.4c-1.2 1 1.2 2 0 3"/>',
  snow: '<path d="M12 3.2v17.6M4.4 7.6l15.2 8.8M4.4 16.4l15.2-8.8"/><path d="M9.7 4.9 12 6.8l2.3-1.9M9.7 19.1 12 17.2l2.3 1.9M5.5 10.2l2.9-.5-.8-2.8M18.5 13.8l-2.9.5.8 2.8M5.5 13.8l2.9.5-.8 2.8M18.5 10.2l-2.9-.5.8-2.8"/>',
  snowoff: '<path d="M12 3.2v17.6M4.4 7.6l15.2 8.8M4.4 16.4l15.2-8.8"/><path d="M9.7 4.9 12 6.8l2.3-1.9M9.7 19.1 12 17.2l2.3 1.9M5.5 10.2l2.9-.5-.8-2.8M18.5 13.8l-2.9.5.8 2.8M5.5 13.8l2.9.5-.8 2.8M18.5 10.2l-2.9-.5.8-2.8"/><path d="M4 4l16 16"/>',
  tireok: '<path d="M7.2 5.9A7.6 7.6 0 0 0 4.6 11.4c0 2.1.9 4 2.3 5.4.5.5 1.2.8 1.9.8h6.4c.7 0 1.4-.3 1.9-.8a7.6 7.6 0 0 0 2.3-5.4c0-2.2-1-4.2-2.6-5.5"/><path d="M12 8.2v4.4"/><path d="M12 15.2h.01" stroke-width="2.2"/>',
  fan: FAN,
  fanoff: FAN + '<path d="M4.5 4.5l15 15"/>',
  headlight: '<path class="a" d="M13.4 5.6a6.4 6.4 0 0 1 0 12.8h-1.6V5.6z"/><path d="M3.6 8.6h5.4M3.6 12h5.4M3.6 15.4h5.4"/>',
  horn: '<path class="a" d="M3.6 10.2h3.2l7.4-3.8v11.2l-7.4-3.8H3.6z"/><path d="M6.8 15.2l.9 3.4h2.2l-.9-3"/><path d="M17 9.4a3.6 3.6 0 0 1 0 5.2M19.6 7a7 7 0 0 1 0 10"/>',
  find: '<g transform="translate(0 2.6)">' + CARBODY + '</g><path d="M8.7 7.3a4.8 4.8 0 0 1 6.6 0M6 4.8a8.4 8.4 0 0 1 12 0"/>',
  refresh: '<path d="M19.6 12a7.6 7.6 0 1 1-2.3-5.5"/><path d="M19.7 4.4v4.3h-4.3"/>',
  /* ── Γενικά UI ── */
  check: '<path d="M5.2 12.6l4.3 4.3 9.3-9.6"/>',
  power: '<path d="M12 3.2v8.1"/><path d="M7.2 6.6a7.6 7.6 0 1 0 9.6 0"/>',
  alert: '<path d="M12 4.2 21 19.6H3z"/><path d="M12 10v4.1"/><path d="M12 16.9h.01" stroke-width="2.2"/>',
  info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5.2"/><path d="M12 7.9h.01" stroke-width="2.2"/>',
  close: '<path d="M6.2 6.2l11.6 11.6M17.8 6.2 6.2 17.8"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  minus: '<path d="M5.5 12h13"/>',
  up: '<path d="M6.5 14.5l5.5-5.5 5.5 5.5"/>',
  down: '<path d="M6.5 9.5l5.5 5.5 5.5-5.5"/>',
  chevd: '<path d="M6.5 9.5l5.5 5.5 5.5-5.5"/>',
  chevr: '<path d="M9.5 6.5l5.5 5.5-5.5 5.5"/>',
  sliders: '<path d="M4 7h8.2M17 7h3M4 17h3M12.2 17H20"/><circle cx="14.6" cy="7" r="2.3"/><circle cx="9.6" cy="17" r="2.3"/>',
  eye: '<path d="M2.8 12S6 6.2 12 6.2 21.2 12 21.2 12 18 17.8 12 17.8 2.8 12 2.8 12z"/><circle class="a" cx="12" cy="12" r="2.7"/>',
  eyeoff: '<path d="M4.5 8.2C3.4 9.5 2.8 12 2.8 12S6 17.8 12 17.8c1.4 0 2.6-.3 3.7-.8M9.7 6.5c.7-.2 1.5-.3 2.3-.3 6 0 9.2 5.8 9.2 5.8s-.7 1.3-2 2.7"/><path d="M4 4l16 16"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l.8 12h8.4L17 7"/><path d="M10.2 10.5v5.5M13.8 10.5v5.5"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="3"/><circle cx="9" cy="10" r="1.6" class="k"/><path d="M4 17l4.6-4.4 3.2 3 3-3L20 17"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5c0-1.1-.9-2-2-2h-7c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h2"/>',
  /* ── Κατάσταση / σύνδεση / φόρτιση ── */
  bolt: '<path class="a" d="M13.2 3 6.4 13.4h4.9L10.6 21l7-10.6h-5z"/>',
  plug: '<path d="M9 3v4.5M15 3v4.5"/><path class="a" d="M6.2 7.5h11.6v3.3a5.8 5.8 0 0 1-11.6 0z"/><path d="M12 16.6V21"/>',
  cloudcheck: '<path d="M7.6 18.4h9.1a3.9 3.9 0 0 0 .6-7.7A5.6 5.6 0 0 0 6.4 9.3a4.6 4.6 0 0 0 1.2 9.1z"/><path d="M9.6 13.7l1.8 1.8 3.1-3.2"/>',
  cloudoff: '<path d="M7.6 18.4h9.1a3.9 3.9 0 0 0 .6-7.7A5.6 5.6 0 0 0 6.4 9.3a4.6 4.6 0 0 0 1.2 9.1z"/><path d="M4 4l16 16"/>',
  /* ── Όχημα ── */
  carside: '<path d="M3.5 15.5v-2.2c0-.7.4-1.3 1-1.6l2.6-1.1 2.1-2.6c.3-.4.8-.6 1.3-.6h4.2c.5 0 1 .2 1.3.6l2 2.6 2.1.7c.6.2 1 .8 1 1.4v2.8"/><path class="a" d="M9.4 8.5l-1.3 2.6h8.2l-1.6-2.6"/><circle cx="7.6" cy="16" r="1.9"/><circle cx="16.6" cy="16" r="1.9"/><path d="M3.5 15.5h2.2M9.5 15.5h5.2M18.5 15.5h2"/>',
  cartop: '<path d="M8.2 3.8h7.6c1.1 0 2 .9 2 2v12.4c0 1.1-.9 2-2 2H8.2c-1.1 0-2-.9-2-2V5.8c0-1.1.9-2 2-2z"/><path class="a" d="M8.4 8.4h7.2l.6 4.1H7.8z"/><path d="M8.6 17.2h6.8"/><path d="M4.6 8.4v2M19.4 8.4v2"/>',
  interior: '<path d="M7.6 4.2c-1 0-1.7.9-1.4 1.9l1.6 6.4c.2.8.9 1.3 1.7 1.3h6.3"/><path class="a" d="M9.2 14.6h6.5c1.2 0 2.2 1 2.2 2.2v.3H9.9c-.9 0-1.6-.6-1.8-1.4z"/><path d="M8.8 20h9.2"/>',
  steering: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="1.9"/><path d="M3.9 12h6.2M13.9 12h6.2M12 14v6.2"/>',
  heatwave: '<path d="M8.5 4.5c-1.6 1.6 1.6 3.4 0 5s1.6 3.4 0 5M12.5 4.5c-1.6 1.6 1.6 3.4 0 5s1.6 3.4 0 5M16.5 4.5c-1.6 1.6 1.6 3.4 0 5s1.6 3.4 0 5"/><path d="M6 19h12"/>',
  seat: SEAT,
  door: '<path d="M8.4 4.8h7.4c1.1 0 2 .9 2 2v10.4c0 1.1-.9 2-2 2H8.4c-1.1 0-2-.9-2-2V6.8c0-1.1.9-2 2-2z"/><path class="a" d="M6.4 10.2 2.8 7.8v6.6l3.6 1.8z"/><path d="M9 9h6.2l.6 2.4H8.6z"/>',
  hood: '<path d="M3.2 17.6v-4.1l2.2-4.3h13.2l2.2 4.3v4.1z"/><path class="a" d="M7.4 9.2l.9-3.3h7.4l.9 3.3z"/><path d="M6 17.6v2M18 17.6v2"/>',
  /* ── Μετρήσεις ── */
  gauge: '<path d="M4.6 17.6a8.2 8.2 0 1 1 14.8 0"/><path class="a" d="M12 14.2l3.6-4.6 1 .8z"/><circle cx="12" cy="14.8" r="1.2" class="k"/>',
  thermo: '<path d="M10 14.2V5.9a2 2 0 1 1 4 0v8.3a3.9 3.9 0 1 1-4 0z"/><path d="M12 9.5v6.3" stroke-width="2"/>',
  drop: '<path class="a" d="M12 3.6s5.4 5.6 5.4 9.6a5.4 5.4 0 0 1-10.8 0c0-4 5.4-9.6 5.4-9.6z"/>',
  fuel: '<path d="M5 20V6.2C5 5.5 5.5 5 6.2 5h5.6c.7 0 1.2.5 1.2 1.2V20M4 20h10"/><path class="a" d="M7 7.6h4.2v3.4H7z"/><path d="M13 9.4h2.2c.8 0 1.5.7 1.5 1.5v4.7a1.5 1.5 0 0 0 3 0V8.3l-2.4-2.4"/>',
  battery: '<rect x="3" y="7.4" width="16.2" height="9.2" rx="2.4"/><path d="M21.4 10.6v2.8"/><path class="a" d="M5.6 10h5.2v4H5.6z"/>',
  battery12: '<rect x="3" y="8.2" width="18" height="11" rx="2.2"/><path d="M7 8.2V5.9h3v2.3M14 8.2V5.9h3v2.3"/><path d="M6.8 13.7h3.2M14.2 13.7h3.2M15.8 12.1v3.2"/>',
  leaf: '<path class="a" d="M5 19c0-8 4.6-13.4 14-14 .4 8.6-4.6 13.6-12.6 13.2"/><path d="M5 19c2.6-4.6 5.4-7 9-8.6"/>',
  road: '<path d="M8.4 3.6 5 20.4M15.6 3.6 19 20.4"/><path d="M12 5v2.6M12 10.7v2.6M12 16.4V19" stroke-width="1.8"/>',
  /* ── Διαγνωστικά (telltales) ── */
  airbag: '<circle cx="12" cy="12" r="9.6" stroke-width="1.7"/><circle cx="11.2" cy="9.1" r="2.4" class="k"/><circle cx="15.6" cy="7.6" r="1.25" class="k"/><path d="M7.9 16.5l3-4" stroke-width="1.8"/><path d="M12.7 13.5l3.1-3" stroke-width="2.3"/><path d="M13.7 14.8l.2 2.2" stroke-width="1.3"/><path d="M17.7 9.2l1-.5" stroke-width="1"/>',
  abs: '<circle cx="12" cy="12" r="9.6" stroke-width="1.7"/><text x="12" y="14.4" text-anchor="middle" font-size="6.6" font-weight="700" font-family="sans-serif" fill="currentColor" stroke="none">ABS</text>',
  brake: '<circle cx="12" cy="12" r="9.6" stroke-width="1.7"/><path d="M7.3 8.6c-1.3 2-1.3 4.8 0 6.8M16.7 8.6c1.3 2 1.3 4.8 0 6.8"/><path d="M12 8.6v3.8"/><path d="M12 15.3h.01" stroke-width="2.1"/>',
  fluid: '<path class="a" d="M12 3.8s5.2 5.4 5.2 9.2a5.2 5.2 0 0 1-10.4 0c0-3.8 5.2-9.2 5.2-9.2z"/><path d="M12 11v3"/><path d="M12 16.4h.01" stroke-width="2"/>',
  engine: '<path d="M4 10v5M20 10v5M6.4 7h2.5l1.2-1.6h4.4L15.7 7h2.4c.5 0 .9.4.9.9v8.4c0 .5-.4.9-.9.9H6.4c-.5 0-.9-.4-.9-.9V7.9c0-.5.4-.9.9-.9z"/><path class="a" d="M9.2 11h5.6v3H9.2z"/>',
  tire: '<circle cx="12" cy="12" r="8.4"/><circle class="a" cx="12" cy="12" r="3.3"/><path d="M12 8.7V3.6M12 20.4v-5.1M8.7 12H3.6M20.4 12h-5.1" stroke-width="1.4"/>',
  key: '<circle cx="7.9" cy="12" r="3.5"/><path d="M11.4 12H21M17.4 12v3.2M20.1 12v2.2"/>',
  speedlimit: '<path d="M4.6 17.6a8.2 8.2 0 1 1 14.8 0"/><path d="M12 14.4l-3.6-3.2"/><path d="M5 20h14" stroke-width="1.8"/>',
};
/* Εικονίδια από το HA: «mdi:car-brake-abs» κ.λπ. (Material Design Icons, Apache-2.0 — ήδη μέσα στο HA, χωρίς λήψη από το διαδίκτυο) */
const MDI_RE = /^[a-z][a-z0-9]*:[a-z0-9][a-z0-9-]*$/i;
const ICON_VB = { trunk: "-0.8 -0.8 41.6 19.8", trunkopen: "-0.8 -0.8 41.6 19.8" }; /* πλάγια όψη: ευρύ εικονίδιο */
const ico = (n, cls = "") => MDI_RE.test(n || "") ? `<ha-icon class="i ${cls}" icon="${n}"></ha-icon>`
  : !ICONS[n] && TT[n] ? tt(n, cls) : `<svg class="i ${ICON_VB[n] ? "w " : ""}${cls}" viewBox="${ICON_VB[n] || "0 0 24 24"}" aria-hidden="true">${ICONS[n] || ICONS.info}</svg>`;
/* Εικονίδια διαγνωστικών: γεμάτα εικονογράμματα ταμπλό (02_telltales.js). Ό,τι δεν έχει δικό του μπαίνει στον ίδιο δαχτυλίδι. */
const BADGE_NATIVE = new Set(["airbag", "abs"]); /* έχουν ήδη δικό τους δαχτυλίδι (όπως τα ήθελε ο χρήστης) */
const icoBadge = (n, cls = "") => TT[n] ? tt(n, cls) : BADGE_NATIVE.has(n) || MDI_RE.test(n || "") ? ico(n, cls)
  : `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.6" stroke-width="1.7"/><g transform="translate(12 12) scale(.58) translate(-12 -12)" stroke-width="2.7">${ICONS[n] || ICONS.info}</g></svg>`;
const ICON_NAMES = Object.keys(ICONS);
// Εικονίδια που προσφέρονται στον χρήστη για δικούς του αισθητήρες
const PICKABLE_ICONS = [
  "info", "alert", "gauge", "thermo", "drop", "fuel", "battery", "battery12", "bolt", "plug", "leaf", "road",
  "tire", "tirealert", "brake", "fluid", "engine", "key", "airbag", "abs", "evfault", "turtle", "oil", "door", "hood", "trunk", "seat", "steering",
  "heatwave", "fan", "headlight", "lock", "cartop", "cloudcheck", "speedlimit",
];



/* ───────────────────────── Ενδεικτικές λυχνίες (telltales) ─────────────────────────
 * Γεμάτα εικονογράμματα σε πλέγμα 32×32, σχεδιασμένα όπως οι λυχνίες του ταμπλό
 * (ISO 2575): airbag, ABS, φρένα, υγρά, μπαταρίες, τιμόνι, ελαστικό, κινητήρας κ.ά.
 * Χρώμα = currentColor (πράσινο / κεχριμπάρι / κόκκινο / γκρι ανάλογα με την κατάσταση).
 * s = γραμμή, χωρίς class = γεμάτο σχήμα. Οι «κοπές» γίνονται με mask. */
const TT_M = (id, shapes) => `<mask id="tm-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32"><rect width="32" height="32" fill="#fff"/>${shapes}</mask>`;
const TT_BANG = (x, y, h = 5.2, r = 1.4) => `<path class="s" d="M${x} ${y}v${h}"/><circle cx="${x}" cy="${y + h + 3.2}" r="${r}"/>`;
const TT = {
  /* φρένα: (!) μέσα σε παρενθέσεις */
  brake: `<circle class="s" cx="16" cy="16" r="7.6"/>${TT_BANG(16, 11.4, 4.6)}
    <path class="s" d="M7.2 9.4Q3 16 7.2 22.6M24.8 9.4Q29 16 24.8 22.6"/>`,
  /* υγρά φρένων: σταγόνα με ! */
  fluid: `${TT_M("fl", '<rect x="14.8" y="12" width="2.4" height="7.2" rx="1.2" fill="#000"/><circle cx="16" cy="22.4" r="1.5" fill="#000"/>')}
    <path mask="url(#tm-fl)" d="M16 3.6c5.2 5.8 8.4 9.8 8.4 14a8.4 8.4 0 0 1-16.8 0c0-4.2 3.2-8.2 8.4-14z"/>`,
  /* μπαταρία 12V */
  battery12: `<path class="s" d="M5.2 11.6h21.6a1.6 1.6 0 0 1 1.6 1.6v11.2a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V13.2a1.6 1.6 0 0 1 1.6-1.6z"/>
    <rect x="7" y="7.6" width="5.2" height="4" rx=".9"/><rect x="19.8" y="7.6" width="5.2" height="4" rx=".9"/>
    <path class="s" d="M8 18.6h5.4M10.7 15.9v5.4M18.8 18.6h5.4"/>`,
  /* μπαταρία έλξης χαμηλή */
  battery: `<rect class="s" x="3.4" y="9.6" width="22.6" height="12.8" rx="3"/><rect x="27.4" y="13.6" width="2.2" height="4.8" rx="1"/>
    <rect x="6.4" y="12.6" width="4.4" height="6.8" rx="1.2"/>${TT_BANG(18.6, 12.6, 3.8, 1.2)}`,
  /* σύστημα ισχύος: αυτοκίνητο με κεραυνό */
  evfault: `${TT_M("ev", '<circle cx="8.6" cy="22.4" r="4" fill="#000"/><circle cx="23.4" cy="22.4" r="4" fill="#000"/><path d="M17.6 10.6l-4.6 6.2h3.4l-1.4 5.2 5.6-7.2h-3.6z" fill="#000"/>')}
    <path mask="url(#tm-ev)" d="M2.6 22.4v-4.6c0-1 .6-1.9 1.6-2.2l3.8-1.3 2.7-4.1c.4-.7 1.2-1.1 2-1.1h6.4c.8 0 1.5.4 2 1l3.1 4.1 2.2.7c1 .3 1.7 1.2 1.7 2.3v5.2z"/>
    <circle cx="8.6" cy="22.6" r="2.6"/><circle cx="23.4" cy="22.6" r="2.6"/>`,
  /* περιορισμός ισχύος: χελώνα */
  turtle: `${TT_M("tu", '<path d="M16.4 12.4v9.2M10.8 15.4l2.8 6.2M22 15.4l-2.8 6.2M8.6 18.6h14.8" stroke="#000" stroke-width="1.5" stroke-linecap="round" fill="none"/>')}
    <path mask="url(#tm-tu)" d="M5.8 22.4c0-6.2 4.6-10.6 10.6-10.6s10.6 4.4 10.6 10.6z"/>
    <path d="M26.4 17.4c1.3-1.8 3.7-1.9 4.5-.3.6 1.3-.1 3-1.5 3.5l-3.2 1z"/>
    <path d="M9.2 22.4v3.6h3.6v-3.6M20.4 22.4v3.6H24v-3.6"/><path class="s" stroke-width="1.8" d="M6 21.4 3 23.6"/>`,
  /* υποβοήθηση τιμονιού: τιμόνι με ! */
  steering: `<circle class="s" cx="16" cy="15" r="11.2" stroke-width="2.6"/>
    <path class="s" stroke-width="3" d="M5.2 12.8Q16 17 26.8 12.8"/><circle cx="16" cy="15" r="2.2"/>
    <path class="s" stroke-width="2.3" d="M16 19.4v3.4"/><circle cx="16" cy="25.2" r="1.25"/>`,
  /* πίεση ελαστικών: τομή ελαστικού με ! */
  tirealert: `<path class="s" stroke-width="2.4" d="M9.2 7.6A10.4 10.4 0 0 0 5.2 16c0 3.2 1.3 6 3.3 8 .5.5 1.2.8 1.9.8h11.2c.7 0 1.4-.3 1.9-.8 2-2 3.3-4.8 3.3-8 0-3.3-1.5-6.3-4-8.4"/>
    <path class="s" stroke-width="2" d="M9.6 28.4l1.3-2 1.5 2 1.5-2 1.5 2 1.5-2 1.5 2 1.5-2 1.5 2"/>${TT_BANG(16, 11.2, 5)}`,
  /* μπαταρία κλειδιού */
  key: `<rect class="s" x="4.4" y="4.8" width="14.4" height="22.4" rx="5.6"/><circle class="s" cx="11.6" cy="9.8" r="2"/>
    <circle cx="11.6" cy="15.6" r="1.6"/><circle cx="8.2" cy="19.4" r="1.5"/><circle cx="15" cy="19.4" r="1.5"/><circle cx="11.6" cy="23" r="1.5"/>
    <rect class="s" x="21.4" y="17.6" width="7.4" height="10" rx="1.6" stroke-width="1.9"/><rect x="23.4" y="15.8" width="3.4" height="2" rx=".6"/><rect x="23.2" y="23.4" width="3.8" height="2.8" rx=".5"/>`,
  /* κινητήρας (check engine) */
  engine: `<path class="s" stroke-width="2.2" d="M13 8.2h6M16 8.2v3"/>
    <path class="s" stroke-width="2.2" d="M9.8 11.4h12.4l2.2 2.6h2.4v3.2h1.9v5.6h-1.9v2.6h-4.1l-1.7 2H11.2l-2.6-2.8V11.4z"/>
    <path class="s" stroke-width="2.2" d="M9.8 15.2H5.6v7.4h3"/><path class="s" stroke-width="1.8" d="M13.6 17.4h5.2M13.6 21h5.2"/>`,
  /* πορτμπαγκάζ ανοιχτό */
  trunk: `${TT_M("tk", '<path d="M12.2 5.6h7.6l1 4.2H11.2z" fill="#000"/><rect x="5.8" y="18.6" width="5.6" height="2.6" rx="1.1" fill="#000"/><rect x="20.6" y="18.6" width="5.6" height="2.6" rx="1.1" fill="#000"/><rect x="13.2" y="19" width="5.6" height="2.6" rx="1" fill="#000"/>')}
    <g mask="url(#tm-tk)"><path d="M7.4 11.8 10.2 3.8c.2-.6.7-1 1.4-1h8.8c.7 0 1.2.4 1.4 1l2.8 8z"/><rect x="3.2" y="14.4" width="25.6" height="10" rx="3.6"/></g>
    <rect x="5.6" y="24.2" width="5" height="3.6" rx="1.2"/><rect x="21.4" y="24.2" width="5" height="3.6" rx="1.2"/>`,
    /* πίεση / στάθμη λαδιού */
  oil: `<path d="M3.2 12.6l3.6 1.3v-2.4H5.2V9.7h7.8v1.8h-1.6v1.6h5.6l6.6-3 1.3 2.5-6.2 3v7.5c0 1.2-1 2.2-2.2 2.2H9c-1.2 0-2.2-1-2.2-2.2v-2.4L3.2 18.2z"/><path d="M27.6 15.6c1.4 1.8 2.2 3 2.2 4.2a2.2 2.2 0 0 1-4.4 0c0-1.2.8-2.4 2.2-4.2z"/>`,
  /* παράθυρο πάνω / κάτω */
  window: `<path class="s" stroke-width="2.2" d="M5 27V12.6L9.4 6.2c.4-.6 1-.9 1.7-.9H25c1 0 1.8.8 1.8 1.8V27z"/>
    <path class="s" stroke-width="2" d="M5 14.4h8.2"/>
    <path d="M18.6 11.8l-3.4 4.4h6.8zM18.6 24.2l-3.4-4.4h6.8z"/>`,
};
const tt = (n, cls = "") => `<svg class="tt ${cls}" viewBox="0 0 32 32" aria-hidden="true">${TT[n]}</svg>`;
/* ───────────────────────── Γλώσσες (i18n) ─────────────────────────
 * Τα κείμενα στον κώδικα είναι ελληνικά και λειτουργούν ως «κλειδιά». Κάθε άλλη γλώσσα
 * είναι ένα αρχείο lang/<κωδικός>.js δίπλα στην κάρτα, που αντιστοιχίζει ελληνικό κείμενο → μετάφραση:
 *   (window.__DEEPAL_S05_LANGS = window.__DEEPAL_S05_LANGS || {}).de = { name: "Deutsch", dict: { "Κλείδωμα": "Sperren", … } };
 * Η γλώσσα διαλέγεται αυτόματα από τη γλώσσα του HA (ή από τη ρύθμιση «Γλώσσα»). Τα ελληνικά είναι τα ίδια τα κλειδιά του κώδικα και τα αγγλικά είναι ενσωματωμένα
 * στο κύριο αρχείο (η εφεδρική γλώσσα, δουλεύει ακόμα κι αν λείπει ο φάκελος lang/)· τα ισπανικά και κάθε άλλη γλώσσα φορτώνουν από lang/<κωδικός>.js.
 * Αν λείπει η γλώσσα, χρησιμοποιείται το αγγλικό· τα ελληνικά μόνο όταν το HA είναι ελληνικό. Οι μεταφράσεις εφαρμόζονται σε όλο το DOM της κάρτας
 * (κείμενα + title/aria-label/placeholder), και με T() στις προτάσεις όπου μετράει η σειρά των λέξεων. */
const LANGS = (window.__DEEPAL_S05_LANGS = window.__DEEPAL_S05_LANGS || {});
const GL = "Ͱ-Ͽἀ-῿";
const I18N = {
  lang: "el", wanted: null, ready: true, dict: null, re: null, subs: new Set(), roots: new Set(),
  rec: new WeakMap(), arec: new WeakMap(), memo: new Map(), attrs: ["title", "aria-label", "placeholder", "alt"],
  norm(c) { return String(c || "el").toLowerCase().replace("_", "-"); },
  available() { const o = { el: "Ελληνικά", en: "English", es: "Español" }; for (const [k, v] of Object.entries(LANGS)) o[k] = v.name || k; return Object.entries(o); },
  numLocale() { return this.lang === "el" ? "el-GR" : this.lang; },
  _load(code) {
    return new Promise((res) => {
      if (LANGS[code]) return res(true);
      const s = document.createElement("script");
      s.src = `${SCRIPT_BASE}lang/${code}.js?v=${CARD_VERSION}`; s.async = true;
      s.onload = () => res(!!LANGS[code]); s.onerror = () => res(false);
      document.head.appendChild(s);
    });
  },
  _set(code, table) {
    this.lang = code; this.memo.clear();
    if (!table) { this.dict = null; this.tdict = null; this.re = null; return; }
    const d = {}, cp = (s, f) => (s ? f(s[0]) + s.slice(1) : s);
    for (const [k, v] of Object.entries(table.dict || {})) {
      if (/\{\d+\}/.test(k)) continue; // τα κλειδιά με {0} είναι μόνο για το T()
      d[k] = v;
      const ku = cp(k, (c) => c.toUpperCase()), kl = cp(k, (c) => c.toLowerCase());
      if (!(ku in d)) d[ku] = cp(v, (c) => c.toUpperCase());
      if (!(kl in d)) d[kl] = cp(v, (c) => c.toLowerCase());
    }
    this.dict = Object.assign(d, {}); this.tdict = table.dict;
    const keys = Object.keys(d).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    this.re = keys.length ? new RegExp(`(?<![${GL}])(?:${keys.join("|")})(?![${GL}])`, "g") : null;
  },
  request(want) {
    const code = this.norm(want);
    if (code === this.wanted) return;
    if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(code)) return; // ασφάλεια: ο κωδικός γλώσσας μπαίνει σε διαδρομή αρχείου
    this.wanted = code;
    const base = code.split("-")[0];
    if (base === "el") { this._set("el", null); this.ready = true; this.changed(); return; }
    this.ready = false;
    (async () => {
      let use = null;
      for (const c of [...new Set([code, base, "en"])]) { if (await this._load(c)) { use = c; break; } }
      if (this.wanted !== code) return;
      this._set(use || "el", use ? LANGS[use] : null); this.ready = true; this.changed();
    })();
  },
  changed() { this.roots.forEach((r) => this.node(r)); this.subs.forEach((c) => { try { c._built = false; c._sig = null; c._force && c._force(); } catch (_) {} }); },
  tr(s) {
    if (!this.re) return s;
    let o = this.memo.get(s);
    if (o === undefined) { o = s.replace(this.re, (m) => this.dict[m]); if (this.memo.size > 3000) this.memo.clear(); this.memo.set(s, o); }
    return o;
  },
  t(s, a) { let o = (this.tdict && this.tdict[s]) ?? s; return a && a.length ? o.replace(/\{(\d+)\}/g, (m, i) => (a[i] ?? "")) : o; },
  text(n) {
    if (!this.re && !this.rec.has(n)) return;
    const cur = n.nodeValue, r = this.rec.get(n), src = r && r.out === cur ? r.src : cur;
    if (!r && !GREEK.test(cur)) return;
    const out = this.tr(src); this.rec.set(n, { src, out }); if (out !== cur) n.nodeValue = out;
  },
  attr(el, name) {
    if (!this.re && !this.arec.has(el)) return;
    const cur = el.getAttribute(name); if (cur == null) return;
    const m = this.arec.get(el) || {}, r = m[name], src = r && r.out === cur ? r.src : cur;
    if (!r && !GREEK.test(cur)) return;
    const out = this.tr(src); m[name] = { src, out }; this.arec.set(el, m); if (out !== cur) el.setAttribute(name, out);
  },
  node(n) {
    if (n.nodeType === 3) return this.text(n);
    if (n.nodeType !== 1 && n.nodeType !== 11) return;
    if (n.nodeType === 1) { if (/^(STYLE|SCRIPT|TEXTAREA)$/.test(n.tagName)) return; for (const a of this.attrs) if (n.hasAttribute(a)) this.attr(n, a); }
    for (let c = n.firstChild; c; c = c.nextSibling) this.node(c);
  },
  watch(root) {
    if (this.roots.has(root)) return;
    this.roots.add(root);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "childList") m.addedNodes.forEach((n) => this.node(n));
        else if (m.type === "characterData") { if (!m.target.parentNode || m.target.parentNode.tagName !== "TEXTAREA") this.text(m.target); }
        else if (m.type === "attributes") this.attr(m.target, m.attributeName);
      }
    }).observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: this.attrs });
    this.node(root);
  },
};
const GREEK = new RegExp(`[${GL}]`);
const T = (s, ...a) => I18N.t(s, a);

/* Αγγλικά (English) — κλειδί: ελληνικό κείμενο της κάρτας, τιμή: μετάφραση. Τα {0}, {1} είναι τιμές που βάζει η κάρτα. */
(window.__DEEPAL_S05_LANGS = window.__DEEPAL_S05_LANGS || {}).en = {
 "name": "English",
 "dict": {
  "Άνοιγμα παραθύρων;": "Open the windows?",
  "Άνοιγμα παραθύρων": "Open windows",
  "Άνοιγμα πορτμπαγκάζ;": "Open the trunk?",
  "Άνοιγμα πορτμπαγκάζ": "Open trunk",
  "Έξω": "Outside",
  "Έτοιμο": "Done",
  "Όλα τα παράθυρα θα ανοίξουν.": "All windows will open.",
  "Όλες": "All",
  "Όλες οι ενδείξεις": "All indicators",
  "Όνομα κάρτας": "Card name",
  "Όνομα": "Name",
  "Όχημα": "Vehicle",
  "Αερισμός οδηγού": "Driver seat ventilation",
  "Αερισμός συνοδηγού": "Passenger seat ventilation",
  "Κλείδωμα οχήματος;": "Lock the vehicle?",
  "Το όχημα θα κλειδώσει.": "The vehicle will lock.",
  "Αλλαγή κλιματισμού;": "Change climate?",
  "Θα σταλεί εντολή στον κλιματισμό του οχήματος.": "A command will be sent to the vehicle climate.",
  "Αναλαμπή φώτων;": "Flash the lights?",
  "Τα φώτα του οχήματος θα αναβοσβήσουν.": "The vehicle lights will flash.",
  "Ηχητικό σήμα;": "Sound the horn?",
  "Η κόρνα του οχήματος θα ηχήσει.": "The vehicle horn will sound.",
  "Εντοπισμός οχήματος;": "Locate the vehicle?",
  "Τα φώτα θα αναβοσβήσουν και η κόρνα θα ηχήσει.": "The lights will flash and the horn will sound.",
  "Ανανέωση δεδομένων;": "Refresh data?",
  "Θα ζητηθούν νέα δεδομένα από το όχημα.": "New data will be requested from the vehicle.",
  "Ξεκλειδώνει…": "Unlocking…",
  "Κλειδώνει…": "Locking…",
  "Αναμονή επιβεβαίωσης από το όχημα": "Waiting for confirmation from the vehicle",
  "Θέση μηνυμάτων (πάνω στην εικόνα)": "Message position (on the image)",
  "Διάρκεια μηνυμάτων": "Message duration",
  "Κάτω": "Down",
  "Πάνω": "Up",
  "3 δευτ.": "3 s",
  "5 δευτ.": "5 s",
  "8 δευτ.": "8 s",
  "12 δευτ.": "12 s",
  "Κόρνα": "Horn",
  "Εντοπισμός": "Locate",
  "Ανανέωση δεδομένων": "Refresh data",
  "Κλείδωμα": "Lock",
  "Περιθώρια κάρτας": "Card margins",
  "Περιθώρια popup": "Popup margins",
  "Κανονικά": "Normal",
  "Μισά": "Half",
  "Χωρίς (εικόνα από άκρη σε άκρη)": "None (edge-to-edge image)",
  "Χωρίς": "None",
  "Layers κάτοψης": "Top-view layers",
  "Layers εσωτερικού": "Interior layers",
  "Κλιματισμός on/off": "Climate on/off",
  "Ο κλιματισμός δεν έχει εντολή απενεργοποίησης σε αυτή την οντότητα": "This entity has no turn-off command for climate",
  "Ο κλιματισμός δεν έχει εντολή ενεργοποίησης σε αυτή την οντότητα": "This entity has no turn-on command for climate",
  "Ενεργό": "On",
  "Ανενεργό": "Off",
  "Άγνωστο": "Unknown",
  "Στάθμευση": "Parked",
  "Οδήγηση": "Driving",
  "Κλειδωμένο": "Locked",
  "Ανοιχτό": "Open",
  "Κλειστό": "Closed",
  "Ενέργεια": "Energy",
  "Στοιχεία φόρτισης": "Charging details",
  "Πάνω στην εικόνα": "On the image",
  "Πάνελ κάτω": "Panel below",
  "Ρεύμα, χρόνος που απομένει και τύπος φόρτισης ως κείμενο πάνω στην εικόνα.": "Current, time remaining and charging type as text on the image.",
  "Στυλ": "Style",
  "Κείμενο": "Text",
  "Γραμμή": "Line",
  "Μεγάλο": "Large",
  "Στη θύρα": "At the port",
  "Έλεγχος πίεσης": "Pressure check",
  "Από το όχημα": "From the vehicle",
  "Δικά μου όρια": "My own limits",
  "Και τα δύο": "Both",
  "Ελάχιστη": "Minimum",
  "Μέγιστη": "Maximum",
  "«Από το όχημα»: η κατάσταση βγαίνει από τις ειδοποιήσεις των ελαστικών που στέλνει το ίδιο το αμάξι.": "“From the vehicle”: the status comes from the tyre alerts the car itself sends.",
  "Προηγούμενες καρτέλες": "Previous tabs",
  "Επόμενες καρτέλες": "Next tabs",
  "Εφέ φόρτισης": "Charging effect",
  "Κόκκινο": "Red",
  "Πορτοκαλί": "Orange",
  "Κίτρινο": "Yellow",
  "Πράσινο": "Green",
  "Δεξαμενή": "Tank",
  "Αυτονομία με γεμάτη δεξαμενή, για τον υπολογισμό του ποσοστού.": "Range on a full tank, used to calculate the percentage.",
  "Εκτός ορίων η πίεση εμφανίζεται ως «χαμηλή» ή «υψηλή».": "Outside the limits the pressure is shown as “low” or “high”.",
  "Περιθώρια": "Margins",
  "«Χωρίς»: η εικόνα πηγαίνει από άκρη σε άκρη.": "“None”: the image goes edge to edge.",
  "Μηνύματα": "Messages",
  "Κάρτα": "Card",
  "Το «Αυτόματα» βρίσκει τον τύπο από τους αισθητήρες καυσίμου.": "“Automatic” detects the type from the fuel sensors.",
  "Αυτόματα": "Automatic",
  "Plug-in υβριδικό": "Plug-in hybrid",
  "Ηλεκτρικό": "Electric",
  "Ρυθμίσεις στην κάρτα": "Settings on the card",
  "Μπαταρία (%)": "Battery (%)",
  "Καύσιμο (%)": "Fuel (%)",
  "Χρώματα επιπέδων": "Level colors",
  "Η μπάρα μπαταρίας και καυσίμου αλλάζει χρώμα ανάλογα με το ποσοστό. Όρισε τα όρια (κάτω από κάθε τιμή) και τα χρώματα.": "The battery and fuel bars change color with the percentage. Set the thresholds (below each value) and the colors.",
  "Κόκκινο (χρώμα)": "Red (color)",
  "Πορτοκαλί (χρώμα)": "Orange (color)",
  "Κίτρινο (χρώμα)": "Yellow (color)",
  "Πράσινο (χρώμα)": "Green (color)",
  "Μπαταρία: κόκκινο κάτω από (%)": "Battery: red below (%)",
  "Καύσιμο: κόκκινο κάτω από (%)": "Fuel: red below (%)",
  "Μπαταρία: πορτοκαλί κάτω από (%)": "Battery: orange below (%)",
  "Καύσιμο: πορτοκαλί κάτω από (%)": "Fuel: orange below (%)",
  "Μπαταρία: κίτρινο κάτω από (%)": "Battery: yellow below (%)",
  "Καύσιμο: κίτρινο κάτω από (%)": "Fuel: yellow below (%)",
  "Οι φωτογραφίες φορτώνονται από τον φάκελο {0} δίπλα στην κάρτα. Εδώ μπορείς να ορίσεις άλλον φάκελο ή άλλο αρχείο για κάθε φωτογραφία και να ελέγξεις ότι βρίσκεται.": "Photos are loaded from the {0} folder next to the card. Here you can set another folder or another file for each photo and check that it exists.",
  "Αισθητήρες": "Sensors",
  "Ακύρωση": "Cancel",
  "Αν κάποια οντότητα έχει διαφορετικό όνομα από το αναμενόμενο {0}, όρισε εδώ ποια να χρησιμοποιηθεί.": "If an entity has a different name than the expected {0}, choose here which one to use.",
  "Αναμονή…": "Waiting…",
  "Ανανέωση δεδομένων · {0}": "Refresh data · {0}",
  "Ανανέωση": "Refresh",
  "Ανενεργός": "Off",
  "Ανοιχτά:": "Open:",
  "Ανοιχτά": "Open",
  "Αντιγράφηκε ✓": "Copied ✓",
  "Αντιγραφή": "Copy",
  "Αντιστοίχιση οντοτήτων": "Entity mapping",
  "Αντιστοίχιση": "Map",
  "Απέτυχε: {0}": "Failed: {0}",
  "Απέτυχε": "Failed",
  "Απομένουν": "Remaining",
  "Αυτόματα (γλώσσα του HA)": "Automatic (HA language)",
  "Βάλε τις ενότητες με τη σειρά που θέλεις (π.χ. πρώτα κουμπιά, μετά η εικόνα, μετά η αυτονομία) και κρύψε όσες δεν χρειάζεσαι.": "Put the sections in the order you want (e.g. buttons first, then the image, then the range) and hide the ones you don't need.",
  "Τύπος οχήματος": "Vehicle type",
  "Αυτόματα (από τους αισθητήρες καυσίμου)": "Automatic (from the fuel sensors)",
  "Plug-in υβριδικό (ρεύμα + βενζίνη)": "Plug-in hybrid (electric + petrol)",
  "Μόνο ηλεκτρικό": "Electric only",
  "Κουμπί «Ρυθμίσεις» στην κάρτα": "“Settings” button on the card",
  "Αν το κρύψεις, οι ρυθμίσεις ανοίγουν μόνο από τον επεξεργαστή της κάρτας (Επεξεργασία dashboard).": "If you hide it, settings can only be opened from the card editor (Edit dashboard).",
  "αυτονομία": "range",
  "Μπαταρία": "Battery",
  "Το πρόθεμα {0} δεν βρέθηκε· χρησιμοποιείται αυτόματα το {1}. Πάτησε το πεδίο για να το αποθηκεύσεις.": "Prefix {0} was not found; {1} is being used automatically. Edit the field to save it.",
  "{0}ώ {1}λ": "{0}h {1}m",
  "Φορτίζει τώρα": "Charging now",
  "Δεν φορτίζει": "Not charging",
  "Εφέ φόρτισης πάνω στο αμάξι": "Charging effect on the car",
  "Ροή στο καλώδιο + παλμός στη θύρα": "Cable flow + port pulse",
  "Ροή ενέργειας στο καλώδιο": "Energy flow along the cable",
  "Παλμός στη θύρα φόρτισης": "Pulse at the charge port",
  "Σάρωση φωτός πάνω στο αμάξι": "Light sweep across the car",
  "Κανένα": "None",
  "Βενζίνη": "Petrol",
  "Γενικά": "General",
  "Γλώσσα": "Language",
  "Γράψε έγκυρο entity_id": "Enter a valid entity_id",
  "Δεν βρέθηκαν οι εικόνες οχήματος. Αντέγραψε τον φάκελο {0} δίπλα στο αρχείο της κάρτας (δες Ρυθμίσεις → Εικόνες).": "Vehicle images not found. Copy the {0} folder next to the card file (see Settings → Images).",
  "Δεν γράφτηκε στο YAML του dashboard (θέλει διαχειριστή και dashboard που να επεξεργάζεται από το UI) — αποθηκεύτηκε στον λογαριασμό σου": "Could not write to the dashboard YAML (needs an admin and a dashboard editable from the UI) — saved to your account instead",
  "Δεν επιβεβαιώθηκε από το όχημα": "Not confirmed by the vehicle",
  "Δεν υπάρχει επικοινωνία με το Deepal Cloud": "No connection to Deepal Cloud",
  "Δεξαμενή (km)": "Fuel range (km)",
  "Διάταξη": "Layout",
  "Διαγνωστικά": "Diagnostics",
  "Διαγραφή": "Delete",
  "Δικά μου διαγνωστικά": "My diagnostics",
  "Εικονίδιο": "Icon",
  "Εικόνα οχήματος": "Vehicle image",
  "Εικόνες": "Images",
  "Εκτός σύνδεσης": "Offline",
  "Ελάχιστη (bar)": "Minimum (bar)",
  "Ελαστικά & ανοίγματα": "Tyres & openings",
  "Ελαστικά": "Tyres",
  "Ελαστικό εμπρός αριστερά": "Front left tyre",
  "Ελαστικό εμπρός δεξιά": "Front right tyre",
  "Ελαστικό πίσω αριστερά": "Rear left tyre",
  "Ελαστικό πίσω δεξιά": "Rear right tyre",
  "Ελληνικά": "Ελληνικά",
  "Εμπρός αριστερή πόρτα": "Front left door",
  "Εμπρός δεξιά πόρτα": "Front right door",
  "Πίσω αριστερή πόρτα": "Rear left door",
  "Πίσω δεξιά πόρτα": "Rear right door",
  "Εμπρός αριστερό παράθυρο": "Front left window",
  "Εμπρός δεξί παράθυρο": "Front right window",
  "Πίσω αριστερό παράθυρο": "Rear left window",
  "Πίσω δεξί παράθυρο": "Rear right window",
  "Εμπρός αριστερά": "Front left",
  "Εμπρός δεξιά": "Front right",
  "Πίσω αριστερά": "Rear left",
  "Πίσω δεξιά": "Rear right",
  "Εμφάνιση": "Show",
  "Ενεργός": "On",
  "Ενημερώθηκε {0}": "Updated {0}",
  "Ενημερώθηκε": "Updated",
  "Ενότητες": "Sections",
  "Εξαγωγή / επαναφορά": "Export / reset",
  "Επαναφορά": "Reset",
  "Επιβεβαίωση": "Confirm",
  "Εσωτερικό": "Interior",
  "Ετικέτα (προαιρετικά)": "Label (optional)",
  "Ζητά επιβεβαίωση": "Ask for confirmation",
  "Ζητήθηκε ανανέωση δεδομένων": "Data refresh requested",
  "π.χ. sensor.my_value": "e.g. sensor.my_value",
  "Η ενέργεια απέτυχε": "The action failed",
  "Η ενέργεια δεν υποστηρίζεται": "The action is not supported",
  "Η ενέργεια εστάλη": "Action sent",
  "Η εντολή απέτυχε": "The command failed",
  "Η φόρτιση ξεκίνησε": "Charging started",
  "Η φόρτιση σταμάτησε": "Charging stopped",
  "Θέρμανση οδηγού": "Driver seat heating",
  "Θέρμανση συνοδηγού": "Passenger seat heating",
  "Θέρμανση τιμονιού": "Steering wheel heating",
  "Θερμοκρασία & μπαταρία": "Temperature & battery",
  "Θερμοκρασία": "Temperature",
  "Ισχύς": "Power",
  "Κάθετη": "Vertical",
  "Κάρτα οχήματος": "Vehicle card",
  "Κάτι έμεινε ανοιχτό: {0}": "Something was left open: {0}",
  "Κάτοψη οχήματος": "Vehicle top view",
  "Κάτοψη": "Top view",
  "Καθίσματα & τιμόνι": "Seats & steering wheel",
  "Καθίσματα": "Seats",
  "Καμία": "None",
  "Καπό": "Bonnet",
  "Κατάσταση (πάνω στην εικόνα)": "Status (on the image)",
  "Καύσιμο": "Fuel",
  "Κείμενα": "Labels",
  "Κλείσιμο": "Close",
  "Κλειδί": "Key",
  "Κλιματισμός": "Climate",
  "Κουμπιά ελέγχου": "Control buttons",
  "Κουμπιά": "Buttons",
  "Λάθος υπηρεσία στο action": "Invalid service in action",
  "Λείπει το config": "Missing config",
  "Λόγος διαστάσεων (π.χ. 16 / 9)": "Aspect ratio (e.g. 16 / 9)",
  "Μέγεθος": "Size",
  "Μέγιστη (bar)": "Maximum (bar)",
  "Μέσα": "Inside",
  "Μία γραμμή (χωράνε όλα)": "One row (everything fits)",
  "Μία γραμμή με scroll": "One row with scroll",
  "Μεγάλα": "Large",
  "Μεγέθυνση εικόνας": "Image zoom",
  "Μεσαία": "Medium",
  "Μηνύματα πάνω στην οθόνη": "On-screen messages",
  "Μικρά": "Small",
  "Μονάδα": "Unit",
  "Μπαταρία & καύσιμο": "Battery & fuel",
  "Μπαταρία 12V": "12V battery",
  "Μπαταρία κλειδιού": "Key battery",
  "Μόνο ειδοποιήσεις": "Alerts only",
  "Μόνο κατάσταση": "Status only",
  "Μόνο τίτλος": "Title only",
  "Να συνεχίσω;": "Continue?",
  "Ξεκλείδωμα οχήματος;": "Unlock the vehicle?",
  "Ξεκλείδωμα": "Unlock",
  "Ξεκλείδωτο + φώτα": "Unlocked + lights",
  "Ξεκλείδωτο": "Unlocked",
  "Ο κλιματισμός άνοιξε": "Climate turned on",
  "Ο κλιματισμός έσβησε": "Climate turned off",
  "Ο φορτιστής αποσυνδέθηκε": "Charger disconnected",
  "Ο φορτιστής συνδέθηκε": "Charger connected",
  "Οι ρυθμίσεις αποθηκεύονται στο YAML της κάρτας.": "Settings are stored in the card YAML.",
  "Οι ρυθμίσεις γράφονται αυτόματα στο YAML της κάρτας στο dashboard, άρα είναι κοινές σε όλες τις συσκευές και τους χρήστες. Αν το dashboard δεν επιτρέπει αποθήκευση (όχι διαχειριστής ή YAML mode), αποθηκεύονται στον λογαριασμό σου και μπορείς να αντιγράψεις το YAML παρακάτω.": "Settings are written automatically to the card YAML in the dashboard, so they are shared across all devices and users. If the dashboard cannot be saved (not an admin, or YAML mode), they are stored in your account and you can copy the YAML below.",
  "Οι ρυθμίσεις δεν αποθηκεύτηκαν στο HA — ισχύουν μόνο σε αυτή τη συσκευή": "Settings could not be saved to HA — they only apply on this device",
  "Οι φωτογραφίες και τα layers φορτώνονται από τον φάκελο {0} δίπλα στην κάρτα. Το ανέβασμα αρχείων γίνεται από τον φάκελο, όχι από την κάρτα — εδώ μπορείς να ορίσεις άλλες διαδρομές και να ελέγξεις ότι βρίσκονται.": "Photos and layers are loaded from the {0} folder next to the card. Files are uploaded to that folder, not through the card — here you can set other paths and check that the files are found.",
  "Οντότητα": "Entity",
  "Οποιαδήποτε οντότητα. Θεωρείται ενεργή όταν είναι on / problem / alarm.": "Any entity. It counts as active when it is on / problem / alarm.",
  "Οριζόντια": "Horizontal",
  "Πάντα όλες": "Always all",
  "Πάτα Ctrl/⌘+C": "Press Ctrl/⌘+C",
  "Πίεση ελαστικών": "Tyre pressure",
  "Παράθυρα": "Windows",
  "Περιορισμός ισχύος": "Power limited",
  "Πινακίδα": "Plate",
  "Πληροφορίες": "Info",
  "Πορτμπαγκάζ": "Trunk",
  "Προσθήκη": "Add",
  "Πρόθεμα οντοτήτων (π.χ. s05)": "Entity prefix (e.g. s05)",
  "Ρεύμα": "Current",
  "Ρυθμίσεις κάρτας": "Card settings",
  "Ρυθμίσεις": "Settings",
  "Σβηστό · κλειδωμένο": "Off · locked",
  "Σειρά και εμφάνιση των κουμπιών ελέγχου.": "Order and visibility of the control buttons.",
  "Σειρές (5 ανά γραμμή)": "Rows (5 per row)",
  "Στάλθηκε εντολή για τα παράθυρα": "Windows command sent",
  "Στάλθηκε εντολή για το πορτμπαγκάζ": "Trunk command sent",
  "Στάλθηκε εντολή κλειδώματος": "Lock command sent",
  "Στάλθηκε εντολή κλιματισμού": "Climate command sent",
  "Στάλθηκε εντολή ξεκλειδώματος": "Unlock command sent",
  "Στάλθηκε εντολή: κόρνα": "Command sent: horn",
  "Στάλθηκε εντολή: φώτα + κόρνα": "Command sent: lights + horn",
  "Στάλθηκε εντολή: φώτα": "Command sent: lights",
  "Στόχος": "Target",
  "Συνδεδεμένο": "Connected",
  "Συνολική αυτονομία": "Total range",
  "Σύνδεση με cloud": "Cloud connection",
  "Σύστημα ισχύος": "Power system",
  "Τίτλος + κατάσταση (2 γραμμές)": "Title + status (2 lines)",
  "Τα δεδομένα του οχήματος ανανεώθηκαν": "Vehicle data refreshed",
  "Τα παράθυρα άνοιξαν": "Windows opened",
  "Τα παράθυρα έκλεισαν": "Windows closed",
  "Ταμπλό (ο αέρας ζωγραφίζεται με SVG)": "Dashboard (air is drawn with SVG)",
  "Ταμπλό · θέρμανση τιμονιού": "Dashboard · steering wheel heating",
  "Τελευταία ενημέρωση": "Last update",
  "Το πορτμπαγκάζ άνοιξε": "Trunk opened",
  "Το πορτμπαγκάζ έκλεισε": "Trunk closed",
  "Το πορτμπαγκάζ θα ανοίξει.": "The trunk will open.",
  "Το όχημα θα ξεκλειδώσει.": "The vehicle will unlock.",
  "Το όχημα κλειδώθηκε": "Vehicle locked",
  "Το όχημα ξεκλειδώθηκε": "Vehicle unlocked",
  "Τύπος": "Type",
  "Υγρά φρένων": "Brake fluid",
  "Υγρασία": "Humidity",
  "Υποβοήθηση τιμονιού": "Power steering",
  "Φάκελος layers: {0}": "Layers folder: {0}",
  "Φάκελος layers (κενό = images/ δίπλα στην κάρτα)": "Layers folder (empty = images/ next to the card)",
  "Φάκελος φωτογραφιών hero (κενό = αυτόματα)": "Hero photos folder (empty = automatic)",
  "Φορτίζει": "Charging",
  "Φορτιστής συνδεδεμένος": "Charger connected",
  "Φρένα": "Brakes",
  "Φωτογραφίες (hero & ταμπλό)": "Photos (hero & dashboard)",
  "Φόρτιση (όταν συνδέεται)": "Charging (when plugged in)",
  "Φόρτιση + ξεκλείδωτο": "Charging + unlocked",
  "Φόρτιση ολοκληρώθηκε": "Charge complete",
  "Φόρτιση": "Charging",
  "Φώτα + κόρνα": "Lights + horn",
  "Φώτα αναμμένα": "Lights on",
  "Φώτα": "Lights",
  "Χαμηλή μπαταρία έλξης": "Low traction battery",
  "Χιλιόμετρα": "Odometer",
  "Χωρίς κείμενο": "No labels",
  "Χωρίς σύνδεση": "Offline",
  "{0} ανοιχτά": "{0} open",
  "{0} προειδοποίηση": "{0} warning",
  "{0} προειδοποιήσεις": "{0} warnings",
  "απομένουν {0}": "{0} left",
  "πριν {0} λ.": "{0} min ago",
  "πριν {0} ώ.": "{0} h ago",
  "πριν {0} ημ.": "{0} d ago",
  "μόλις τώρα": "just now",
  "έλεγξε πίεση": "check pressure",
  "ένταση": "level",
  "αερ.": "vent",
  "αναλαμπή": "flash",
  "ανενεργός": "off",
  "αποθηκεύτηκε": "saved",
  "διάλεξε": "choose",
  "ενεργός": "on",
  "εντοπισμός": "locate",
  "ηχητικό σήμα": "sound signal",
  "θέρμ.": "heat",
  "κενό": "empty",
  "κλειδωμένο": "locked",
  "κλειστά": "closed",
  "κλειστό": "closed",
  "μη διαθέσιμο": "unavailable",
  "ξεκλείδωτο": "unlocked",
  "προειδοποίηση": "warning",
  "προειδοποιήσεις": "warnings",
  "στόχος": "target",
  "συναγερμός": "alarm",
  "συνολική αυτονομία": "total range",
  "ταμπλό": "dashboard",
  "τιμόνι": "steering",
  "υψηλή": "high",
  "χαμηλή": "low",
  "Κλειστά": "Closed",
  "Χρώμα αέρα κλιματισμού": "Air flow colors",
  "Ο αέρας στην καρτέλα Κλιματισμού παίρνει χρώμα ανάλογα με τη θερμοκρασία-στόχο. Όρισε τα όρια και τα χρώματα.": "The airflow in the Climate tab is colored by the target temperature. Set the limits and the colors.",
  "Μέχρι (°C)": "Up to (°C)",
  "Δροσερό": "Cool",
  "Μέτριο": "Mild",
  "Ζεστό": "Warm",
  "Μαύρο": "Black",
  "Μπλε": "Blue",
  "Γκρι": "Grey",
  "Ασημί": "Silver",
  "Λευκό": "White",
  "Χρώμα αμαξιού": "Car color",
  "Για την εικόνα Car View στο popup του οχήματος.": "Used by the Car View image in the vehicle popup.",
  "Ζάντες (Car View)": "Wheels (Car View)",
  "20″ με τάπες": "20″ with covers",
  "20″ χωρίς τάπες": "20″ without covers",
  "18″ Pro": "18″ Pro",
  "Συνδεδεμένο, δεν φορτίζει": "Plugged in, not charging",
  "Δεν είναι συνδεδεμένο": "Not plugged in",
  "Δεν βρέθηκε το όχημα": "Vehicle not found",
  "Έλεγξε το πρόθεμα στις Ρυθμίσεις → Αισθητήρες": "Check the prefix in Settings → Sensors",
  "Τελευταία ενημέρωση {0}": "Last update {0}",
  "Μείωση θερμοκρασίας": "Lower temperature",
  "Αύξηση θερμοκρασίας": "Raise temperature",
  "Περισσότερα": "More",
  "Κύρια κουμπιά + «Περισσότερα»": "Main buttons + “More”",
  "Κύρια κουμπιά": "Main buttons",
  "Τα πρώτα κουμπιά της λίστας μπαίνουν στην κύρια σειρά, τα υπόλοιπα στο «Περισσότερα».": "The first buttons in the list go in the main row, the rest under “More”.",
  "Τα υπόλοιπα": "The rest",
  "Κρυμμένα": "Hidden",
  "Πάντα ορατά": "Always visible",
  "Όλα καλά": "All good",
  "όλα κλειστά, πιέσεις εντάξει": "everything closed, pressures OK",
  "Ενεργοποίηση κλιματισμού;": "Turn on climate?",
  "Η αλλαγή θερμοκρασίας θα ενεργοποιήσει τον κλιματισμό του οχήματος.": "Changing the temperature will turn on the car's climate.",
  "Πλακίδιο κλιματισμού": "Climate tile",
  "Στόχος με − / +": "Target with − / +",
  "Μεγάλος κύκλος": "Large circle",
  "Στόχος με − / +: δείχνει τη θερμοκρασία και ρυθμίζεις τον στόχο. Μεγάλος κύκλος: το κλασικό πλακίδιο με το μεγάλο κουμπί on/off.": "Target with − / +: shows the temperature and lets you adjust the target. Large circle: the classic tile with the big on/off button.",
  "Πρόβλημα": "Problem",
  "Προειδοποίηση": "Warning",
  "Μη διαθέσιμο": "Unavailable",
  "Εντάξει": "OK",
  "Προβλήματα": "Problems",
  "Μη διαθέσιμοι": "Unavailable",
  "{0} αισθητήρες": "{0} sensors",
  "{0} εντάξει": "{0} OK",
  "{0} πρόβλημα": "{0} problem",
  "{0} προβλήματα": "{0} problems",
  "{0} μη διαθέσιμοι": "{0} unavailable",
  "Βρέθηκε {0} νέος αισθητήρας": "{0} new sensor found",
  "Βρέθηκαν {0} νέοι αισθητήρες": "{0} new sensors found",
  "Αγνόηση": "Ignore",
  "Ρυθμίσεις αισθητήρων": "Sensor settings",
  "Δεν υπάρχουν αισθητήρες διαγνωστικών. Πρόσθεσέ τους από τις Ρυθμίσεις.": "There are no diagnostic sensors. Add them from Settings.",
  "Νέοι αισθητήρες": "New sensors",
  "Αν το integration προσθέσει νέες προειδοποιήσεις, η κάρτα μπορεί να τις βρει και να τις προσθέσει στα διαγνωστικά.": "If the integration adds new warnings, the card can find them and add them to the diagnostics.",
  "Δεν βρέθηκαν νέοι αισθητήρες.": "No new sensors found.",
  "Αναζήτηση νέων αισθητήρων": "Search for new sensors",
  "Προσθήκη όλων": "Add all",
  "Εμφάνιση ξανά όσων αγνόησα": "Show the ones I ignored again",
  "Ή εικονίδιο του HA (προαιρετικά)": "Or a Home Assistant icon (optional)",
  "Χωρίς δεδομένα": "No data",
  "Εικόνα αμαξιού (hero)": "Car image (hero)",
  "Φωτογραφίες (μαύρο)": "Photos (black)",
  "Car View (χρώματα)": "Car View (colours)",
  "Φωτογραφίες: οι μαύρες φωτογραφίες με τα εφέ φόρτισης. Car View: 3/4 render στο χρώμα που διαλέγεις, με ζωντανές πόρτες· στη φόρτιση εμφανίζεται η διάφανη όψη με τον φορτιστή.": "Photos: the black photos with the charging effects. Car View: a 3/4 render in the colour you choose, with live doors; while charging it switches to the translucent view with the charger.",
  "Για την εικόνα Car View (popup οχήματος και, αν το διαλέξεις, hero).": "Used by the Car View image (vehicle popup and, if you choose it, the hero)."
 }
};
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
const CARGA_PTS = [[705, 370], [677, 365], [640, 359], [613, 353], [597, 347], [588, 338], [583, 325], [580, 310], [578, 295], [576, 278], [574, 262], [572, 248], [570, 238]];
const CARGA_PORT = [566, 236];
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
.cvi { position:absolute; left:50%; top:50%; width:100%; aspect-ratio: 750 / 500; transform-origin: 51.5% 52.7%; transform: translate(-51.5%, -52.7%) scale(var(--ds-cvs, 1.08)); } /* το κέντρο του αμαξιού (386,263 στα 750×500) πάει στο κέντρο του hero και η μεγέθυνση γίνεται γύρω από αυτό */
.cva, .cvb { position:absolute; inset:0; transition: opacity .6s ease; }
.cvb { opacity:0; transform: translate(2.5%, 5.9%); } /* η διάφανη όψη έχει άλλο κάδρο: μετατοπίζεται ώστε το αμάξι να μένει στο ίδιο κέντρο */ .hcv.chg .cva { opacity:0; } .hcv.chg .cvb { opacity:1; }
.cva img, .cvb > img:not(.sweep) { position:absolute; inset:0; width:100%; height:100%; opacity:0; transition: opacity .35s ease; }
.cva img.on, .cvb > img.on:not(.sweep) { opacity:1; }
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
.t2.temp .tt { grid-column:1; grid-row:1; align-self:center; }
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
.chgbox .c { font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; opacity:.9; }
.chgbox.line { flex-direction:row; align-items:center; gap:6px; font-size:13.5px; font-weight:700; } .chgbox .i { --is:15px; } .chgbox i { font-style:normal; opacity:.5; }
.chgbox.text, .chgbox.big { top:46px; left: min(calc(50% + 29.8% * var(--ds-scale, 1.2) - 16px), calc(100% - 20px)); }
.chgbox.big .a { font-size:34px; font-weight:800; line-height:1; } .chgbox.big .a small { font-size:16px; font-weight:700; margin-left:2px; }
.chgbox.beside { top: calc(50% - 7.9% * var(--ds-scale, 1.2) - 10px); transform: translate(-100%, -50%); left: calc(50% + 29.8% * var(--ds-scale, 1.2) - 24px); }
.chgbox.beside::after { content:""; position:absolute; right:-20px; top:50%; width:16px; border-top:1.5px dashed rgba(var(--ds-ok), .8); }
.chgline { position:absolute; z-index:8; left: calc(50% + 29.8% * var(--ds-scale, 1.2)); top:74px; width:0; height: max(0px, calc(50% - 7.9% * var(--ds-scale, 1.2) - 84px)); border-left:1.5px dashed rgba(var(--ds-ok), .75); filter: drop-shadow(0 0 3px rgba(var(--ds-ok), .6)); }
.chgline.s-text, .chgline.s-big, .chgline.s-beside { display:none; }
.chgbox[hidden], .chgline[hidden] { display:none; }
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
.box h3 { margin:0; font-size:16px; font-weight:600; color: var(--ds-fg); } .box p.c { margin:6px 0 12px; font-size:13px; color: var(--ds-fg2); text-align:center; }
.confirm { text-align:center; }
.hd { flex:none; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.x { flex:none; width:30px; height:30px; display:grid; place-items:center; border-radius:50%; border:1px solid var(--ds-line); background: var(--ds-soft); cursor:pointer; padding:0; } .x .i { --is: 16px; }
.box deepal-s05-settings { flex:1 1 auto; min-height:0; display:block; overflow-y:auto; overflow-x:hidden; }
@keyframes ds-up { from { transform: translateY(110%) } to { transform:none } }
@keyframes ds-fade { from { opacity:0 } to { opacity:1 } }
@media (prefers-reduced-motion: reduce) { .fx *, .act, .act .ring rect, .gauge .fp, .fxs *, .stage img, .bar b, .box, .l { animation: none !important; transition: none !important; } }
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



/* ───────────────────────── Ανακάλυψη νέων αισθητήρων ─────────────────────────
 * Αν το integration προσθέσει νέα προειδοποίηση (π.χ. binary_sensor.s05_engine_warning), η κάρτα δεν την ξέρει.
 * Εδώ ψάχνουμε στο HA για binary_sensor του ίδιου οχήματος που μοιάζουν με προειδοποίηση και δεν είναι ήδη στη λίστα. */
const DISC_CLASSES = new Set(["problem", "safety", "tamper", "battery", "smoke", "gas", "carbon_monoxide"]);
const DISC_SKIP = new Set(["lock", "door", "window", "plug", "light", "heat", "cold", "connectivity", "battery_charging", "power", "opening", "garage_door", "running", "moving", "presence", "occupancy", "motion", "vibration", "update"]);
const DISC_NAME = /(warning|alarm|fault|error|alert|failure|malfunction|_low)$/;
const guessDiagIcon = (s) => {
  const t = String(s).toLowerCase();
  const m = [[/airbag/, "airbag"], [/abs/, "abs"], [/fluid/, "fluid"], [/brake/, "brake"], [/tire|tyre|tpms/, "tirealert"], [/steer|eps/, "steering"], [/12_?v|aux/, "battery12"],
    [/traction|hv_|high_voltage/, "battery"], [/battery|soc/, "battery"], [/oil/, "oil"], [/engine|motor|emission/, "engine"], [/power_limit|derat|limit/, "turtle"], [/power|system|inverter|drive/, "evfault"], [/key|fob/, "key"], [/trunk|tailgate/, "trunk"]];
  for (const [re, ic] of m) if (re.test(t)) return ic;
  return "alert";
};
const discoverDiag = (hass, c) => {
  const st = hass?.states; if (!st) return [];
  const p = effPrefix(hass, c);
  const known = new Set([...DIAG.map((d) => resolveId(hass, c, d[0])), ...OPEN_ITEMS.map((o) => resolveId(hass, c, o[0])), ...OTHER_KEYS.map((k) => resolveId(hass, c, k)),
    ...(c.diag_custom || []).map((x) => x.entity), ...(c.info_custom || []).map((x) => x.entity), ...(c.diag_ignore || [])]);
  const mine = new Set(), pre = `binary_sensor.${p}_`;
  for (const id of Object.keys(st)) if (id.startsWith(pre)) mine.add(id);
  const reg = hass.entities, dev = reg && reg[resolveId(hass, c, "lock.doors")]?.device_id;
  if (reg && dev) for (const e of Object.values(reg)) if (e.device_id === dev && e.entity_id.startsWith("binary_sensor.") && !e.hidden_by && !e.disabled_by) mine.add(e.entity_id);
  const out = [];
  for (const id of mine) {
    const o = st[id]; if (!o || known.has(id)) continue;
    const dc = o.attributes?.device_class, name = id.slice(id.indexOf(".") + 1);
    if (!(DISC_CLASSES.has(dc) || (!DISC_SKIP.has(dc) && DISC_NAME.test(name)))) continue;
    const fn = String(o.attributes?.friendly_name || name), label = fn.replace(new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
    out.push({ entity: id, label: label.charAt(0).toUpperCase() + label.slice(1), icon: guessDiagIcon(name), on: String(o.state).toLowerCase() === "on" });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
};
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


customElements.define(SETTINGS_TAG, DeepalS05Settings);
customElements.define(EDITOR_TAG, DeepalS05CardEditor);
customElements.define(TAG, DeepalS05Card);

window.customCards = window.customCards || [];
if (!window.customCards.some((x) => x.type === TAG)) {
  window.customCards.push({ type: TAG, name: "Deepal S05 Control Panel", description: "Control panel for the Deepal S05 (EV/PHEV): lock and climate controls, charging, tyres, doors and windows, interior, trip and fuel data, and a diagnostics page. Works with the Deepal Alternative integration.", preview: true, documentationURL: "https://github.com/rmxs/deepal-s05-card" });
}
console.info(`%c DEEPAL-S05-CARD %c v${CARD_VERSION} `, "background:#E20074;color:#fff;border-radius:4px 0 0 4px;padding:2px 4px", "background:#222;color:#fff;border-radius:0 4px 4px 0;padding:2px 4px");
})();
