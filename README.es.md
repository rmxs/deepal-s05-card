# Deepal S05 Card

[English](README.md) · [Ελληνικά](README.el.md) · **Español**

Una tarjeta Lovelace para el **Deepal S05** (EV y PHEV) que se ve y funciona como la aplicación del fabricante.
Funciona con la integración [Deepal Alternative](https://github.com/Sunek0/ha-deepal-alternative) (dominio `deepal`).

> **No oficial.** Este proyecto no está afiliado a Deepal, Changan ni a los autores de la integración.
> Los botones envían **comandos reales a un vehículo real** (bloqueo/desbloqueo, ventanillas, maletero, clima, claxon…).
> Úsalos con el mismo cuidado que en la aplicación oficial.

![Deepal S05 Card](docs/screenshot.png)

## Galería

| | |
|---|---|
| ![Overview](docs/images/overview.jpg) | ![Charging](docs/images/charging.jpg) |
| ![Car View hero](docs/images/hero-carview.jpg) | ![Charging view](docs/images/charging-view.jpg) |
| ![Diagnostics](docs/images/diagnostics.jpg) | ![New sensors](docs/images/new-sensors.jpg) |
| ![Car View](docs/images/tyres.jpg) | ![Seats](docs/images/seats.jpg) |
| ![Climate](docs/images/climate.jpg) | ![Settings](docs/images/settings.jpg) |
| ![Sections](docs/images/sections.jpg) | ![Tyre settings](docs/images/settings-tyres.jpg) |
| ![Car colours](docs/images/car-colors.jpg) | ![EV and PHEV](docs/images/phev-ev.jpg) |

_(Las imágenes están en inglés.)_

## Características

- Foto del coche que cambia con el estado del vehículo (apagado, luces, desbloqueado, cargando, carga completa).
- **Estilo del hero** (*Ajustes → Vehículo*): tus propias fotos o un render **Car View** en vivo en negro, azul, gris, plata o blanco, con puertas, capó, portón, ventanillas y luces que siguen al coche, en 3/4 o **desde arriba** (un botón en el hero cambia la vista con un toque; *Ajustes → Vehículo → Vista* fija la predeterminada). Al conectar el cargador, el coche cambia a una vista lateral translúcida con cable gris (conectado) o cable verde con los mismos efectos de flujo de energía y pulso en el puerto (cargando).
- Botones de control redondos: bloqueo, ventanillas, maletero, clima, neumáticos, interior, destellos, claxon, localizar coche — disposición, etiquetas, tamaño, orden y visibilidad configurables.
- Anillos de autonomía y batería (y combustible en el PHEV); el anillo de la batería se anima mientras carga.
- Estado de carga: corriente, tiempo restante y tipo como texto junto al puerto de carga (4 estilos), más un efecto animado opcional sobre el coche (flujo en el cable / pulso en el puerto / barrido de luz).
- Ventana **Car View**: un render 3/4 real del coche en cinco colores con puertas, capó, portón, ventanillas y luces en vivo, y las cuatro presiones de los neumáticos unidas a sus ruedas (verde OK / rojo alerta).
- Ventana de clima con selector de temperatura y flujo de aire animado que toma el color de la temperatura objetivo, además de calefacción/ventilación de asientos y calefacción del volante.
- Diagnóstico con iconos grandes al estilo del tablero y color según el estado (airbag, ABS, frenos, neumáticos, batería de 12 V…). Pulsa «+N» para ver todos los sensores; los sensores nuevos se descubren con un botón.
- Tarjetas de información propias: añade cualquier sensor.
- **EV o PHEV**: los elementos de combustible se ocultan automáticamente si el coche no tiene sensores de combustible (o lo fuerzas en los ajustes).
- **Idiomas**: inglés, español y griego incluidos; sigue el idioma de Home Assistant. Un idioma nuevo es un archivo pequeño ([cómo](docs/LANGUAGES.md)).
- **Ajustes dentro de la tarjeta** (y en el editor de tarjetas). Se guardan en el YAML de la tarjeta, así que valen para todos los dispositivos y usuarios.
- Sin dependencias ni CDN: un archivo JavaScript + imágenes locales.

## Requisitos

- Home Assistant **2026.3.0** o posterior.
- La integración [Deepal Alternative](https://github.com/Sunek0/ha-deepal-alternative) con tu vehículo añadido.
- Los nombres de las entidades se detectan automáticamente — consulta [Cómo se encuentran las entidades](#cómo-se-encuentran-las-entidades).

## Instalación

### HACS (recomendado)

1. HACS → ⋮ → **Custom repositories** → añade `https://github.com/rmxs/deepal-s05-card`, categoría **Dashboard**.
2. Instala **Deepal S05 Card** y recarga el navegador (hard refresh).
3. HACS registra el recurso por ti. Si no lo hace, añádelo a mano:
   *Ajustes → Paneles → ⋮ → Recursos* → `/hacsfiles/deepal-s05-card/deepal-s05-card.js`, tipo **Módulo JavaScript**.

### Manual

1. Copia el contenido de la carpeta `dist/` en `/config/www/deepal-s05-card/` (de modo que `deepal-s05-card.js`, `lang/` e `images/` queden juntos).
2. Añade el recurso `/local/deepal-s05-card/deepal-s05-card.js` como **Módulo JavaScript** y haz un hard refresh del navegador.

## Uso

Añade la tarjeta desde el selector de tarjetas (**Deepal S05 Control Panel**) o en YAML:

```yaml
type: custom:deepal-s05-card
prefix: s05          # prefijo de las entidades, p. ej. sensor.s05_battery_level  (opcional, se detecta solo)
name: Deepal S05
```

Todo lo demás se cambia con el botón **Ajustes** al pie de la tarjeta, o desde el editor visual.
La lista completa de opciones está en [docs/CONFIG.md](docs/CONFIG.md).

## Cómo se encuentran las entidades

1. La tarjeta construye el id de la entidad a partir de `prefix` (`sensor.<prefix>_battery_level`, `lock.<prefix>_doors`, …).
2. Si el prefijo no coincide con nada, busca el prefijo que tiene los sensores del vehículo (p. ej. `mycar_`).
3. Si el id difiere del esperado (por ejemplo porque Home Assistant está en otro idioma y los nombres traducidos de la integración generan otros ids), la tarjeta encuentra la entidad a través del registro usando el `translation_key` estable de la integración.
4. Cualquier entidad puede reasignarse a mano en *Ajustes → Sensores → Asignación de entidades*.

El selector de temperatura objetivo usa directamente la entidad `climate.<prefix>_cabin_climate` — no hace falta ningún helper.

## Fotos y capas

La tarjeta muestra fotos de `images/car/` (hero), las capas del Car View de `images/iso/<color>/` las capas del interior de `images/interior/` la vista desde arriba de `images/top/<color>/` y la vista translúcida de carga de `images/carga/`, todo junto al archivo de la tarjeta (HACS lo instala con la tarjeta).
Las fotos hero están hechas para un **Deepal S05 negro**; el Car View está disponible en cinco colores (*Ajustes → Vehículo → Color del coche*) y también puede usarse como hero (*Ajustes → Vehículo → Estilo del hero*). Para otro modelo sustituye los archivos (mismos nombres) o indica a la tarjeta tu propia carpeta en *Ajustes → Imágenes*.
Consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) para el origen y las licencias de las imágenes.

## Solución de problemas

| Problema | Solución |
|---|---|
| «Vehicle images not found» | La carpeta `images/` no está junto al archivo de la tarjeta. Actualiza a la 1.2.2 o posterior con HACS (las versiones anteriores solo instalaban el archivo `.js`). Si las carpetas siguen sin aparecer tras actualizar, reinicia Home Assistant y usa HACS → la tarjeta → ⋮ → **Redownload**; o copia todo el contenido de `dist/`. |
| Todos los valores muestran `--` | Prefijo incorrecto. Define `prefix:` con la parte entre el dominio y el nombre del sensor (`sensor.`**`s05`**`_battery_level`). |
| Los ajustes no se guardan en el YAML | Necesita una cuenta de administrador y un panel gestionado desde la interfaz. Si no, se guardan en tu perfil y puedes copiar el YAML desde *Ajustes → General*. |
| Los botones no hacen nada | La integración indica que los comandos remotos del S05 son experimentales y requieren el PIN de control remoto. |
| Tras actualizar veo el aspecto antiguo | Haz un hard refresh (Ctrl+F5); si hace falta, borra la caché del navegador o de la app de HA. |

## Desarrollo

```bash
bash scripts/build.sh      # genera dist/deepal-s05-card.js a partir de src/
```

Edita los archivos de `src/`, ejecuta el build y haz commit de `src/` y `dist/`.
Las imágenes del Car View se convierten desde los renders de dec_deepal con `tools/build_iso.py`, la vista desde arriba (recoloreada a partir de la original plata) con `tools/build_planta.py`, la vista de carga con `tools/build_carga.py` y las capas del interior con `tools/build_layers.py` (consulta la cabecera de cada script).

## Licencia

MIT — Copyright (c) 2026 L.K. Consulta [LICENSE](LICENSE). Material de terceros: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
