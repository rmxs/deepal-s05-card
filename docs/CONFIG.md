# Configuration reference

Everything below can be changed from the card's **Settings** button or the visual editor.
The card writes the changed options into its own YAML, so you normally never edit them by hand.
Only options that differ from the defaults are written.

```yaml
type: custom:deepal-s05-card
prefix: s05
name: Deepal S05
```

| Option | Default | Description |
|---|---|---|
| `prefix` | `s05` | Entity prefix (`sensor.<prefix>_battery_level`). Auto-detected if nothing matches. |
| `name` | `Deepal S05` | Name shown on the hero image. |
| `powertrain` | `auto` | `auto` (fuel sensors present → PHEV), `phev`, `ev`. For `ev`, fuel range, fuel ring and fuel tile are hidden. |
| `fuel_max` | `941` | Total range on a full tank in km (used for the fuel ring if there is no `%` fuel sensor). |
| `language` | `auto` | `auto` (Home Assistant language), `el`, `en`, or any language file in `lang/`. |
| `toasts` | `true` | Show on-screen messages. |
| `show_customize` | `true` | Show the "Settings" button at the bottom of the card. When `false`, settings open only from the card editor. |
| `order` | all sections | Order of sections: `hero`, `actions`, `status`, `stats`, `info`, `diagnostics`, `charge`. |
| `hidden` | `[]` | Sections to hide. |
| `buttons` | all | Button order: `lock`, `windows`, `trunk`, `climate`, `tires`, `cabin`, `flash`, `honk`, `find`. |
| `buttons_hidden` | `[]` | Buttons to hide. |
| `button_layout` | `split` | `split` (main buttons + a small “More” row), `grid` (5 per row), `scroll` (one row, scrolls), `fit` (one row, all fit). |
| `button_primary` | `4` | `split` layout: how many buttons stay in the main row (3–5). The rest go behind the small “More” chevron. |
| `buttons_more` | `collapse` | `split` layout: `collapse` (the rest stay hidden until “More” is pressed) or `show` (always visible). |
| `climate_ui` | `steps` | Climate tile: `steps` (target temperature with − / +) or `circle` (large round on/off button). |
| `button_labels` | `both` | `none`, `status`, `title`, `both`. |
| `button_size` | `m` | `s`, `m`, `l`. |
| `confirm` | `unlock`, `trunk`, `windows` | Actions that ask for confirmation. Any of `lock`, `unlock`, `windows`, `trunk`, `climate`, `flash`, `honk`, `find`, `refresh`. |
| `card_padding` | `normal` | Card margins: `normal`, `half`, `none` (hero image edge-to-edge). |
| `popup_padding` | `normal` | Popup margins: `normal`, `half`, `none`. |
| `toast_position` | `bottom` | Message position on the image: `bottom` or `top`. |
| `toast_duration` | `5` | Seconds a message stays visible (errors +3). |
| `hero_show` | `name`, `plate`, `range` | What is shown on the hero image: `name`, `plate`, `range`, `cloud`, `updated`. |
| `lvl_red` / `lvl_orange` / `lvl_yellow` / `lvl_green` | `#f87171` / `#fb923c` / `#facc15` / `#34d399` | Colours of the battery and fuel level (`#rrggbb`). The charging effect uses the same colour as the bar. |
| `bat_t1` / `bat_t2` / `bat_t3` | `30` / `50` / `70` | Battery %: below `t1` red, below `t2` orange, below `t3` yellow, otherwise green. |
| `fuel_t1` / `fuel_t2` / `fuel_t3` | `10` / `25` / `40` | Same thresholds for the fuel level (% of the tank). |
| `charge_fx` | `flow_port` | Charging effect on the car: `flow_port`, `flow`, `port`, `sweep`, `none`. |
| `charge_style` | `line` | Charging details on the hero image: `line`, `text`, `big` or `beside`. |
| `diag` | all | List of diagnostic entities to watch (`null` = all known). |
| `diag_mode` | `alerts` | `alerts` (only active warnings) or `all`. |
| `diag_custom` | `[]` | Extra diagnostics: `{entity, label, icon}`. `icon` is one of the built-in names (`airbag`, `abs`, `brake`, `fluid`, `battery12`, `battery`, `evfault`, `turtle`, `steering`, `tirealert`, `engine`, `oil`, `key`, `alert`…) or any Home Assistant icon such as `mdi:car-brake-abs`. |
| `diag_ignore` | `[]` | Entities found by *Settings → Sensors → Search for new sensors* that you chose to ignore. |
| `info` | `odometer`, `fuel_level` | Built-in info tiles. |
| `info_custom` | `[]` | Extra tiles: `{entity, label, icon, unit, tap_action, hold_action}`. |
| `entities` | `{}` | Per-entity override, e.g. `sensor.battery_level: sensor.my_other_battery`. |
| `hero_style` | `photo` | Hero image: `photo` (your photos from `images/car/`) or `carview` (live 3/4 render in the chosen `car_color`; while the charger is connected it switches to the translucent charging view with the cable and the `charge_fx` effects). |
| `car_color` | `black` | Colour of the car in the Car View (popup and, with `hero_style: carview`, the hero): `black`, `blue`, `grey`, `silver`, `white`. |
| `iso_wheels` | `cover` | Wheels in the Car View: `cover` (20″ with covers), `open` (20″ without) or `pro` (18″). |
| `air_t1` / `air_t2` | `22` / `24` | Climate airflow colour limits (°C of the target): up to `t1` cool, up to `t2` mild, above warm. |
| `air_c1` / `air_c2` / `air_c3` | `#8ec5ff` / `#ffcc3d` / `#ff7a2e` | Airflow colours: cool, mild, warm. |
| `tire_unit` | `bar` | `bar`, `kPa`, `psi`. Pressures use two decimals for bar, one for psi and none for kPa, matching the limits in Settings. |
| `tire_min` / `tire_max` | `2.0` / `3.5` | Pressure range (bar) considered normal; used when `tire_check` is `limits` or `both`. |
| `tire_check` | `vehicle` | What marks a tyre as not OK: `vehicle` (the car's own alerts), `limits` (your min/max) or `both`. |
| `climate_on_mode` | auto | HVAC mode used to turn the climate on (default: detected from the entity). |
| `image_path` | `<card folder>/images/car/` | Folder with the hero photos. |
| `layers_path` | `<card folder>/images/` | Folder with the `iso/` (Car View), `carga/` (charging view) and `interior/` layers. |
| `images` | `{}` | Per-photo file name override. |
| `image_scale` | `1.2` | Zoom of the hero image (photos or Car View, around the centre of the car). |
| `image_aspect` | auto | Aspect ratio of the hero, e.g. `16 / 9`. |

## Tap and hold

Tiles and chips open the entity's *more info* dialog on tap and run the configured `hold_action` on long press.

## Entities used

The card reads and uses these entities (all prefixed with `<prefix>_`):
`lock.doors`, `cover.windows`, `cover.trunk`, `climate.cabin_climate`, `button.honk_horn`, `button.flash_lights`,
`button.flash_lights_and_honk`, `button.refresh_vehicle_data`, `switch.steering_wheel_heating`,
`number.*_seat_heating_level`, `number.*_seat_ventilation_level`, and sensors/binary sensors for battery,
range, fuel, charging, doors, windows, tyres, lamps and warnings. Missing entities are skipped.

## Diagnostics

Each diagnostic sensor has a colour: **green** (OK), **amber** (warning), **red** (critical, e.g. airbag, brakes, power system) and **grey** (unavailable).
Icons with the same symbol and state (for example four tyre alarms) are shown as one icon with a small counter; the **+N** chip counts the sensors that did not fit.
Tap the counter or **+N** to open the *Diagnostics* popup: every sensor, split into *Problems*, *Unavailable* and *OK*. Tap a sensor for its history.

**New sensors.** If the integration adds a warning the card does not know yet (a `binary_sensor` of your vehicle with device class `problem`/`safety`/`battery`, or a name ending in `_warning`, `_alarm`, `_fault`, `_error`, `_low`), the popup offers to add it. The same search runs on demand from *Settings → Sensors → Search for new sensors*. Added sensors are saved in `diag_custom`; ignored ones in `diag_ignore`.
