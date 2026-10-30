# Deepal S05 Card

**English** · [Ελληνικά](README.el.md) · [Español](README.es.md)

A Lovelace card for the **Deepal S05** (EV and PHEV) that looks and feels like the manufacturer's mobile app.
It works with the [Deepal Alternative](https://github.com/Sunek0/ha-deepal-alternative) integration (`deepal` domain).

> **Unofficial.** This project is not affiliated with Deepal, Changan or the integration authors.
> Buttons send **real commands to a real vehicle** (lock/unlock, windows, trunk, climate, horn…).
> Use them with the same care as in the official app.

![Deepal S05 Card](docs/screenshot.png)

## Gallery

| | |
|---|---|
| ![Overview](docs/images/overview.jpg) | ![Charging](docs/images/charging.jpg) |
| ![Car View hero](docs/images/hero-carview.jpg) | ![Charging view](docs/images/charging-view.jpg) |
| ![Diagnostics](docs/images/diagnostics.jpg) | ![New sensors](docs/images/new-sensors.jpg) |
| ![Car View](docs/images/tyres.jpg) | ![Seats](docs/images/seats.jpg) |
| ![Climate](docs/images/climate.jpg) | ![Settings](docs/images/settings.jpg) |
| ![Sections](docs/images/sections.jpg) | ![Tyre settings](docs/images/settings-tyres.jpg) |
| ![Car colours](docs/images/car-colors.jpg) | ![EV and PHEV](docs/images/phev-ev.jpg) |

## Features

- Hero photo that changes with the vehicle state (off, lights, unlocked, charging, charge complete).
- **Hero style** (*Settings → Vehicle*): your own photos, or a live **Car View** render in black, blue, grey, silver or white, with doors, bonnet, tailgate, windows and lights that follow the car, in 3/4 or **from above** (a button in the hero switches the view with one tap; *Settings → Vehicle → View* sets the default). When the charger is connected the car switches to a translucent side view with a grey cable (plugged in) or a green cable with the same energy-flow and port-pulse effects (charging).
- Round control buttons: lock, windows, trunk, climate, tyres, interior, flash lights, horn, find car — layout, labels, size, order and visibility are configurable.
- Range, battery (and fuel for PHEV) rings; the battery ring animates while charging.
- Charging status: current, time remaining and type as text next to the charge port (4 styles), plus an optional animated effect on the car (cable flow / charge-port pulse / light sweep).
- **Car View** popup: a real 3/4 render of the car in five colours with live doors, bonnet, tailgate, windows (open ones in red) and lights, and the four tyre pressures connected to their wheels (green OK / red alert).
- Climate popup with a temperature picker and animated airflow coloured by the target temperature, plus seat heating/ventilation and steering-wheel heating.
- Diagnostics shown as large, status-coloured dashboard icons (airbag, ABS, brakes, tyres, 12 V battery…). Tap “+N” for the full list of sensors; new sensors can be discovered with one button.
- Custom info tiles: add any sensor.
- **EV or PHEV**: fuel items are hidden automatically when the car has no fuel sensors (or force it in settings).
- **Languages**: English, Spanish and Greek included, follows the Home Assistant language. More languages = one small file ([how](docs/LANGUAGES.md)).
- **Settings UI** inside the card (and in the card editor). Settings are saved in the card YAML so they are shared by every device and user.
- No dependencies, no CDN, one JavaScript file + local images.

## Requirements

- Home Assistant **2026.3.0** or newer.
- The [Deepal Alternative](https://github.com/Sunek0/ha-deepal-alternative) integration, with your vehicle added.
- Entity names are detected automatically — see [How entities are found](#how-entities-are-found).

## Installation

### HACS (recommended)

1. HACS → ⋮ → **Custom repositories** → add `https://github.com/rmxs/deepal-s05-card`, category **Dashboard**.
2. Install **Deepal S05 Card** and reload the browser (hard refresh).
3. HACS registers the resource for you. If it does not, add it manually:
   *Settings → Dashboards → ⋮ → Resources* → `/hacsfiles/deepal-s05-card/deepal-s05-card.js`, type **JavaScript module**.

### Manual

1. Copy the contents of the `dist/` folder to `/config/www/deepal-s05-card/` (so that `deepal-s05-card.js`, `lang/` and `images/` sit next to each other).
2. Add the resource `/local/deepal-s05-card/deepal-s05-card.js` as **JavaScript module** and hard-refresh the browser.

## Usage

Add the card from the card picker (**Deepal S05 Control Panel**) or in YAML:

```yaml
type: custom:deepal-s05-card
prefix: s05          # entity prefix, e.g. sensor.s05_battery_level  (optional, auto-detected)
name: Deepal S05
```

Everything else is changed from the **Settings** button at the bottom of the card, or from the visual editor.
The full list of options is in [docs/CONFIG.md](docs/CONFIG.md).

## How entities are found

1. The card builds the entity id from `prefix` (`sensor.<prefix>_battery_level`, `lock.<prefix>_doors`, …).
2. If the prefix does not match anything, it looks for the prefix that has the vehicle's sensors (e.g. `mycar_`).
3. If the entity id differs from the expected one (for example because Home Assistant was installed in another language, so the integration's translated names produce different ids), the card finds it through the entity registry using the integration's stable `translation_key`.
4. Any single entity can still be remapped manually in *Settings → Sensors → Entity mapping*.

The target temperature picker uses the `climate.<prefix>_cabin_climate` entity directly — no helper is needed.

## Photos and layers

The card shows photos from `images/car/` (hero), the Car View layers from `images/iso/<colour>/` and the interior layers from `images/interior/`, the top view from `images/top/<colour>/`, the translucent charging view from `images/carga/`, all next to the card file (HACS installs them with the card).
The hero photos are made for a **black Deepal S05**; the Car View is available in five colours (*Settings → Vehicle → Car colour*) and can also be used as the hero (*Settings → Vehicle → Hero style*). For another model replace the files (same names) or point the card to your own folder in *Settings → Images*.
See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the origin and licences of the images.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Vehicle images not found" | The `images/` folder is not next to the card file. Update to 1.2.2 or later via HACS (earlier HACS installs only got the `.js` file). If the folders are still missing after the update, restart Home Assistant and use HACS → the card → ⋮ → **Redownload**; or copy the whole `dist/` content by hand. |
| All values show `--` | Wrong prefix. Set `prefix:` to the part between the domain and the sensor name (`sensor.`**`s05`**`_battery_level`). |
| Settings are not saved to YAML | Needs an administrator account and a UI-managed dashboard. Otherwise they are stored in your user profile and you can copy the YAML from *Settings → General*. |
| Buttons do nothing | The integration documents that remote commands on the S05 are experimental and need the remote-control PIN. |

## Development

```bash
bash scripts/build.sh      # builds dist/deepal-s05-card.js from src/
```

Edit the files in `src/`, run the build, commit both `src/` and `dist/`.
The Car View images are converted from the dec_deepal renders with `tools/build_iso.py`, the top view (recoloured from the silver original) with `tools/build_planta.py`, the charging view with `tools/build_carga.py` and the interior layers with `tools/build_layers.py` (see the header of each script).

## License

MIT — Copyright (c) 2026 L.K. See [LICENSE](LICENSE). Third-party material: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
