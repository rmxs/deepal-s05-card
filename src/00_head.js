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
const CARD_VERSION = "1.3.1";
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


