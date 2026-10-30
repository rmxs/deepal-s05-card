#!/usr/bin/env node
/* Φτιάχνει τις εικόνες παρουσίασης docs/images/*.jpg (1600×1000) από την πραγματική κάρτα.
 * Χρήση:  node tools/make_images.js [όνομα …]      (χωρίς ορίσματα: όλες)
 * Χρειάζεται: playwright (chromium) και την γραμμένη dist/ (bash scripts/build.sh).
 * Η κάρτα τρέχει με ψεύτικο hass· τίποτα δεν μιλά σε πραγματικό Home Assistant. */
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, ".."), DIST = path.join(ROOT, "dist"), OUT = path.join(ROOT, "docs", "images");
const ONLY = process.argv.slice(2);

/* ───────── ψεύτικο hass ───────── */
const DIAGS = ["airbag_warning", "abs_warning", "brake_warning", "brake_fluid_warning", "12_v_battery_warning", "traction_battery_low_warning", "power_system_warning", "power_limit_warning", "power_steering_warning", "tire_pressure_warning", "front_left_tire_alarm", "front_right_tire_alarm", "rear_left_tire_alarm", "rear_right_tire_alarm", "key_fob_battery_low"];
function states(over = {}) {
  const S = {}, now = new Date().toISOString();
  const add = (id, state, attributes = {}) => (S[id] = { entity_id: id, state: String(state), attributes, last_changed: now, last_updated: now, context: {} });
  add("lock.s05_doors", "locked", { friendly_name: "S05 Doors" });
  add("sensor.s05_battery_level", 82, { unit_of_measurement: "%" }); add("sensor.s05_remaining_range", 120, { unit_of_measurement: "km" });
  add("sensor.s05_fuel_range", 610, { unit_of_measurement: "km" }); add("sensor.s05_fuel_level", 70, { unit_of_measurement: "%" });
  add("sensor.s05_total_odometer", 12345, { unit_of_measurement: "km" }); add("sensor.s05_license_plate", "IKA-1234");
  add("sensor.s05_inside_temperature", 25, { unit_of_measurement: "°C" });
  add("cover.s05_windows", "closed"); add("cover.s05_trunk", "closed");
  add("binary_sensor.s05_charging", "off"); add("binary_sensor.s05_charger_plugged", "off"); add("binary_sensor.s05_cloud_connection", "on");
  for (const p of ["front_left", "front_right", "rear_left", "rear_right"]) add(`sensor.s05_${p}_tire_pressure`, 2.5, { unit_of_measurement: "bar" });
  for (const p of ["front_left", "front_right", "rear_left", "rear_right"]) add(`binary_sensor.s05_${p}_door`, "off", { device_class: "door" });
  add("binary_sensor.s05_hood", "off", { device_class: "door" }); add("binary_sensor.s05_trunk", "off", { device_class: "door" });
  for (const d of DIAGS) add("binary_sensor.s05_" + d, "off", { device_class: "problem", friendly_name: "S05 " + d.replace(/_/g, " ") });
  for (const [k, v] of Object.entries(over)) { if (v === null) delete S[k]; else add(k, v.state ?? v, v.attributes || {}); }
  return S;
}
const prob = (name) => ({ state: "on", attributes: { device_class: "problem", friendly_name: "S05 " + name } });

/* ───────── στατικός server για την dist/ (εικόνες + lang) ───────── */
const MIME = { ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };
const server = http.createServer((q, r) => {
  const f = path.join(DIST, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": MIME[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(r);
});

let browser;
/* Ανοίγει την κάρτα· fn(page) κάνει ό,τι χρειάζεται και επιστρέφει τα PNG (Buffers) */
async function scene({ cfg = {}, over = {}, width = 428, height = 1000, lang = "en" } = {}, fn) {
  const ctx = await browser.newContext({ viewport: { width: width + 40, height }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.setContent(`<html><body style="margin:0;padding:20px;background:transparent;font-family:Inter,sans-serif;--card-background-color:#1c1f26;--primary-text-color:#fff;--secondary-text-color:#9aa4b2;--primary-color:#03a9f4;color:#fff"><div id="root" style="width:${width}px"></div></body></html>`);
  await p.addScriptTag({ url: `http://127.0.0.1:${PORT}/deepal-s05-card.js` });
  await p.evaluate(({ S, cfg, lang }) => {
    const card = document.createElement("deepal-s05-card"); window.__card = card; document.getElementById("root").appendChild(card);
    window.__S = S; window.__hass = { states: S, entities: {}, language: lang, locale: { language: lang }, callService: async () => {}, callWS: async () => ({}), config: { unit_system: { length: "km" } }, themes: {} };
    card.setConfig({ type: "custom:deepal-s05-card", prefix: "s05", name: "Deepal S05", ...cfg }); card.hass = window.__hass;
  }, { S: states(over), cfg, lang });
  await p.waitForTimeout(900);
  p.set = async (o) => { await p.evaluate((o) => { for (const [k, v] of Object.entries(o)) { if (v === null) delete window.__S[k]; else window.__S[k] = { entity_id: k, state: String(v.state ?? v), attributes: v.attributes || {}, last_changed: new Date().toISOString(), last_updated: new Date().toISOString(), context: {} }; } window.__hass = { ...window.__hass, states: { ...window.__S } }; window.__card.hass = window.__hass; }, o); await p.waitForTimeout(500); };
  p.card = () => p.locator("deepal-s05-card");
  p.box = () => p.locator("deepal-s05-card >> #box");
  p.vbox = () => p.locator("deepal-s05-card >> #vbox");
  p.js = (f, a) => p.evaluate(f, a);
  p.sh = (sel) => p.evaluate((s) => window.__card.shadowRoot.querySelector(s)?.click(), sel);
  const out = await fn(p);
  if (errs.length) console.log("  ⚠ σφάλματα:", errs.join(" | "));
  await ctx.close(); return out;
}
const shot = (loc, o = {}) => loc.screenshot({ omitBackground: true, ...o });

/* ───────── σύνθεση διαφάνειας 1600×1000 ───────── */
const BG = "background:#0a0c11; background-image: radial-gradient(1100px 700px at 0% 105%, rgba(28,74,120,.32), transparent 62%), radial-gradient(900px 520px at 100% -5%, rgba(18,96,82,.30), transparent 60%);";
const png = (b) => "data:image/png;base64," + b.toString("base64");
const pngSize = (b) => ({ w: b.readUInt32BE(16) / 2, h: b.readUInt32BE(20) / 2 });
async function slide(name, { eyebrow, title, desc, items, gap = 24, rowGap = gap, maxW = 940, maxH = 800, up = 1.15, align = "center", wrap = false, w = 0 }) {
  if (ONLY.length && !ONLY.includes(name)) return;
  const sz = items.map((it) => pngSize(it.buf)), tw = sz.reduce((a, s, i) => a + s.w * (items[i].k || 1), 0) + gap * (items.length - 1), mh = Math.max(...sz.map((s, i) => s.h * (items[i].k || 1)));
  const k = Math.min(up, maxW / tw, maxH / mh);
  const imgs = items.map((it, i) => `<div class="it">${it.tag ? `<div class="tag">${it.tag}</div>` : ""}<img src="${png(it.buf)}" style="${wrap ? "border-radius:14px;" : ""}width:${w ? w : Math.round(sz[i].w * (it.k || 1) * k)}px"></div>`).join("");
  const html = `<html><body style="margin:0;width:1600px;height:1000px;${BG};font-family:Inter,sans-serif;position:relative;overflow:hidden">
  <style>.l{position:absolute;left:90px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center}
  .e{color:#34d399;font-size:15px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;margin-bottom:22px}
  .t{color:#fff;font-size:62px;line-height:1.06;font-weight:800;letter-spacing:-.02em;margin:0 0 26px}.d{color:#8b95a5;font-size:23px;line-height:1.45;margin:0}
  .r{position:absolute;left:600px;right:60px;top:0;bottom:0;display:flex;align-items:${align};justify-content:center;gap:${rowGap}px ${gap}px;flex-wrap:${wrap ? 'wrap' : 'nowrap'};${wrap ? 'align-content:center;' : ''}}
  .it{position:relative;display:flex;flex-direction:column;align-items:center}.it img{display:block;filter:drop-shadow(0 18px 40px rgba(0,0,0,.55))}
  .tag{position:absolute;top:-34px;font-size:13px;font-weight:700;letter-spacing:.14em;color:#e5e7eb;background:#1c1f26;border:1px solid #3a4150;border-radius:999px;padding:5px 16px}</style>
  <div class="l"><div class="e">${eyebrow}</div><h1 class="t">${title}</h1><p class="d">${desc}</p></div><div class="r">${imgs}</div></body></html>`;
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 }), p = await ctx.newPage();
  await p.setContent(html); await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(OUT, name + ".jpg"), type: "jpeg", quality: 90 });
  await ctx.close(); console.log("✓", name + ".jpg");
}

/* ───────── σενάρια ───────── */
const CHARGING = { "binary_sensor.s05_charging": "on", "binary_sensor.s05_charger_plugged": "on", "sensor.s05_ac_charge_current": { state: 55, attributes: { unit_of_measurement: "A" } }, "sensor.s05_remaining_charge_time_h_mm": "1:30", "sensor.s05_charging_type": "DC", "sensor.s05_battery_level": { state: 64, attributes: { unit_of_measurement: "%" } } };
const SEATS = { "number.s05_front_left_seat_heating_level": { state: 2, attributes: { min: 0, max: 3, friendly_name: "Seat heating" } }, "number.s05_front_right_seat_ventilation_level": { state: 1, attributes: { min: 0, max: 3 } }, "number.s05_front_left_seat_ventilation_level": { state: 0, attributes: { min: 0, max: 3 } }, "number.s05_front_right_seat_heating_level": { state: 0, attributes: { min: 0, max: 3 } } };
const CLIM = (t, mode = "cool", cur = 24.5) => ({ "climate.s05_cabin_climate": { state: mode, attributes: { hvac_modes: ["off", "cool", "heat", "auto"], temperature: t, current_temperature: cur, min_temp: 16, max_temp: 32, target_temp_step: 0.5, supported_features: 1 | 384 } } });

const BTN = { "binary_sensor.s05_position_lamp": "off", "binary_sensor.s05_low_beam": "off", "binary_sensor.s05_high_beam": "off", "button.s05_honk_horn": "unknown", "button.s05_flash_lights": "unknown", "button.s05_flash_lights_and_honk": "unknown", "button.s05_refresh_vehicle_data": "unknown", "switch.s05_steering_wheel_heating": "off" };
const BASE = { ...BTN, ...SEATS, ...CLIM(22, "off") };
const open = async (p, view) => { await p.js((v) => { const c = window.__card; c._view = v; c._force(); }, view); await p.waitForTimeout(1100); };
const settings = async (p, tab) => { await p.js((t) => { const c = window.__card; c._stab = t; c._customize = true; c._force(); }, tab); await p.waitForTimeout(900); };
const tyresOver = { "sensor.s05_rear_left_tire_pressure": { state: 1.7, attributes: { unit_of_measurement: "bar" } }, "binary_sensor.s05_rear_left_tire_alarm": prob("rear left tire alarm"), "sensor.s05_rear_right_tire_pressure": { state: 2.6, attributes: { unit_of_measurement: "bar" } }, "sensor.s05_front_right_tire_pressure": { state: 2.6, attributes: { unit_of_measurement: "bar" } }, "binary_sensor.s05_front_left_door": { state: "on", attributes: { device_class: "door" } }, "binary_sensor.s05_low_beam": "on" };
const PROBLEMS = { "binary_sensor.s05_brake_fluid_warning": prob("brake fluid warning"), "binary_sensor.s05_abs_warning": prob("abs warning"), "binary_sensor.s05_tire_pressure_warning": prob("tire pressure warning"), "binary_sensor.s05_key_fob_battery_low": "unavailable" };
const NEWSENS = { "binary_sensor.s05_engine_warning": prob("engine warning") };

const jobs = {
  async overview() {
    const a = await scene({ cfg: { diag_mode: "all" }, over: { ...BASE, ...SEATS } }, (p) => shot(p.card()));
    const b = await scene({ cfg: { diag_mode: "all" }, over: { ...BASE, ...SEATS, ...CHARGING } }, (p) => shot(p.card()));
    await slide("overview", { eyebrow: "Deepal S05 for Home Assistant", title: "Your whole car<br>on one card", desc: "Lock, windows, climate, charging and tyres — range, battery and fuel at a glance, with a live car photo that follows the real state.", items: [{ buf: a }, { buf: b }] });
  },
  async diagnostics() {
    const o = { ...BASE, ...PROBLEMS };
    const a = await scene({ cfg: { diag_mode: "all" }, over: o }, (p) => shot(p.card()));
    const b = await scene({ cfg: { diag_mode: "all" }, over: o, height: 1100 }, async (p) => { await p.sh("[data-diag-open]"); await p.waitForTimeout(1000); return shot(p.box()); });
    await slide("diagnostics", { eyebrow: "Diagnostics", title: "Every warning,<br>at a glance", desc: "Dashboard-style icons coloured by status — green OK, amber warning, red fault. Tap +N for the full list: problems first, then unavailable, then everything that is OK.", items: [{ buf: a }, { buf: b }], up: 1.1 });
  },
  async "new-sensors"() {
    const o = { ...BASE, ...PROBLEMS, ...NEWSENS };
    const a = await scene({ cfg: { diag_mode: "all" }, over: o, height: 1100 }, async (p) => { await p.sh("[data-diag-open]"); await p.waitForTimeout(1000); return shot(p.box()); });
    const b = await scene({ cfg: { diag_mode: "all" }, over: o, height: 1100 }, async (p) => {
      await settings(p, "sensors");
      await p.js(() => { const r = window.__card.shadowRoot.querySelector("deepal-s05-settings")?.shadowRoot || window.__card.shadowRoot; r.querySelector("[data-discover]")?.click(); });
      await p.waitForTimeout(600);
      await p.js(() => { const r = window.__card.shadowRoot.querySelector("deepal-s05-settings")?.shadowRoot || window.__card.shadowRoot; const h = r.querySelector("[data-discover]"); h && h.scrollIntoView({ block: "center" }); });
      await p.waitForTimeout(500); return shot(p.box());
    });
    await slide("new-sensors", { eyebrow: "New sensors", title: "Finds new<br>warnings itself", desc: "If your integration adds a warning the card does not know yet, it tells you in the diagnostics list. Settings → Sensors → Search for new sensors adds it with a fitting icon.", items: [{ buf: a }, { buf: b }], up: 1.1 });
  },
  async charging() {
    const a = await scene({ cfg: { diag_mode: "all" }, over: { ...BASE, ...SEATS, ...CHARGING } }, (p) => shot(p.card()));
    await slide("charging", { eyebrow: "Charging", title: "Charging you<br>can see", desc: "Current, time remaining and charge type next to the charge port, with an animated cable flow on the car.", items: [{ buf: a }], up: 1.12 });
  },
  async climate() {
    const mk = (t, m) => scene({ over: { ...BASE, ...CLIM(t, m, 24.5), "binary_sensor.s05_climate_on": "on" }, height: 1000 }, async (p) => { await open(p, "climate"); return shot(p.vbox()); });
    const a = await mk(20, "cool"), b = await mk(26, "heat");
    await slide("climate", { eyebrow: "Climate", title: "Air that shows<br>its temperature", desc: "Cool, mild or warm: the airflow is coloured by the target temperature and moves across the real cabin. Start or stop the A/C and glide the target with the picker.", items: [{ buf: a }, { buf: b }] });
  },
  async tyres() {
    const a = await scene({ over: { ...BASE, ...tyresOver }, height: 1000 }, async (p) => { await open(p, "iso"); return shot(p.vbox()); });
    await slide("tyres", { eyebrow: "Car View", title: "Every tyre and<br>opening,<br>connected", desc: "A real 3/4 render of the car. Doors, bonnet, tailgate, windows and lights show live; each tyre pressure is linked to its wheel — green when OK, red with an alert.", items: [{ buf: a }], up: 1.2 });
  },
  async seats() {
    const a = await scene({ over: { ...BASE, ...SEATS }, height: 1000 }, async (p) => { await open(p, "seats"); return shot(p.vbox()); });
    await slide("seats", { eyebrow: "Seats", title: "Heating and<br>ventilation,<br>seat by seat", desc: "Set the level of each seat and the steering-wheel heating from the real interior.", items: [{ buf: a }], up: 1.2 });
  },
  async sections() {
    const mk = (t) => scene({ over: { ...BASE }, height: 1100 }, async (p) => { await settings(p, t); return shot(p.box()); });
    const a = await mk("sections"), b = await mk("buttons");
    await slide("sections", { eyebrow: "Everything optional", title: "Show only what<br>you need", desc: "Turn sections, buttons, sensors and tiles on or off, reorder them, rename — the card is yours.", items: [{ buf: a }, { buf: b }] });
  },
  async "settings-tyres"() {
    const a = await scene({ over: { ...BASE }, height: 1100 }, async (p) => { await settings(p, "tires"); return shot(p.box()); });
    await slide("settings-tyres", { eyebrow: "Tyres", title: "Your limits,<br>your units", desc: "Follow the alerts the car sends, set your own min/max, and choose bar, kPa or psi.", items: [{ buf: a }], up: 1.2 });
  },
  async settings() {
    const a = await scene({ cfg: { hero_style: "carview" }, over: { ...BASE }, height: 1250 }, async (p) => { await settings(p, "vehicle"); return shot(p.box()); });
    const b = await scene({ over: { ...BASE }, height: 1250 }, async (p) => { await settings(p, "look"); return shot(p.box()); });
    await slide("settings", { eyebrow: "Settings", title: "Configured in a<br>few taps", desc: "Tabbed settings with segmented controls, colour pickers and thresholds — vehicle name and hero image, car colour, air-flow colours, charging levels — saved to your dashboard.", items: [{ buf: a }, { buf: b }] });
  },
  async "car-colors"() {
    const items = [];
    for (const col of ["black", "blue", "grey", "silver", "white"]) items.push({ buf: await scene({ cfg: { car_color: col }, over: { ...BASE, "sensor.s05_front_left_tire_pressure": { state: 2.5, attributes: { unit_of_measurement: "bar" } } }, height: 1000 }, async (p) => { await open(p, "iso"); return shot(p.locator("deepal-s05-card >> #viso")); }) });
    await slide("car-colors", { eyebrow: "Car colour", title: "Make it your<br>colour", desc: "Pick black, blue, grey, silver or white, and the wheel style. The Car View follows your choice.", items, wrap: true, w: 290, gap: 16 });
  },
  async "hero-carview"() {
    const hero = (p) => shot(p.locator("deepal-s05-card >> #hero"));
    const cv = (c, o = {}, cfg = {}) => scene({ cfg: { hero_style: "carview", car_color: c, diag_mode: "all", ...cfg }, over: { ...BASE, ...o } }, hero);
    const items = [
      { buf: await cv("black"), tag: "BLACK" },
      { buf: await cv("white", { "binary_sensor.s05_front_left_door": "on", "binary_sensor.s05_low_beam": "on" }), tag: "DOOR OPEN, LIGHTS ON" },
      { buf: await cv("blue", { "binary_sensor.s05_trunk": "on", "binary_sensor.s05_hood": "on" }), tag: "BONNET &amp; TAILGATE" },
      { buf: await cv("silver"), tag: "SILVER" },
      { buf: await cv("blue", { "binary_sensor.s05_hood": "on", "binary_sensor.s05_rear_right_window_open": "on" }, { hero_view: "top" }), tag: "TOP VIEW, BONNET &amp; WINDOW OPEN" },
      { buf: await cv("white", {}, { hero_view: "top" }), tag: "TOP VIEW" },
    ];
    await slide("hero-carview", { eyebrow: "Car View hero", title: "Your car,<br>live and in colour", desc: "Choose the hero image: your own photos, or a Car View render in black, blue, grey, silver or white, in 3/4 or from above (one tap on the button in the hero). Doors, bonnet, tailgate, windows and lights follow the real state of the car.", items, wrap: true, w: 330, gap: 18, rowGap: 50 });
  },
  async "charging-view"() {
    const c = { hero_style: "carview", car_color: "white", diag_mode: "all" };
    const a = await scene({ cfg: c, over: { ...BASE, "binary_sensor.s05_charger_plugged": "on", "binary_sensor.s05_charging": "off" } }, (p) => shot(p.card()));
    const b = await scene({ cfg: c, over: { ...BASE, ...CHARGING } }, (p) => shot(p.card()));
    await slide("charging-view", { eyebrow: "Charging view", title: "The car goes<br>see-through", desc: "In Car View the hero switches to a translucent side view when the charger is connected: grey cable when plugged in, green cable with the live energy flow and port pulse while charging.", items: [{ buf: a, tag: "PLUGGED IN" }, { buf: b, tag: "CHARGING" }] });
  },
  async "phev-ev"() {
    const o = { ...BASE, ...SEATS, ...CHARGING };
    const a = await scene({ cfg: { powertrain: "phev" }, over: o }, (p) => shot(p.card()));
    const b = await scene({ cfg: { powertrain: "ev" }, over: { ...o, "sensor.s05_remaining_range": { state: 120, attributes: { unit_of_measurement: "km" } } } }, (p) => shot(p.card()));
    await slide("phev-ev", { eyebrow: "EV &amp; PHEV", title: "Adapts to your<br>car", desc: "The card detects the powertrain. A PHEV shows battery and fuel — two rings, electric and fuel range, tank level. A pure EV shows a clean single battery ring.", items: [{ buf: a, tag: "PHEV" }, { buf: b, tag: "EV" }], maxH: 790 });
  },
};

/* docs/screenshot.png: μόνο η κάρτα, σε σκούρο φόντο (εικόνα για το HACS / README) */
jobs.screenshot = async () => {
  const buf = await scene({ cfg: { diag_mode: "all" }, over: { ...BASE } }, async (p) => {
    await p.js(() => { document.body.style.background = "#0b0d12"; });
    const r = await p.card().boundingBox();
    return p.screenshot({ clip: { x: r.x - 20, y: r.y - 20, width: r.width + 40, height: r.height + 40 } });
  });
  fs.writeFileSync(path.join(ROOT, "docs", "screenshot.png"), buf);
  require("child_process").execFileSync("convert", [path.join(ROOT, "docs", "screenshot.png"), "-resize", "630x", path.join(ROOT, "docs", "screenshot.png")]);
  console.log("✓ screenshot.png");
};

let PORT;
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r)); PORT = server.address().port;
  browser = await chromium.launch();
  for (const [n, f] of Object.entries(jobs)) { if (ONLY.length && !ONLY.includes(n)) continue; try { await f(); } catch (e) { console.log("✗", n, e.message); } }
  await browser.close(); server.close();
})();
