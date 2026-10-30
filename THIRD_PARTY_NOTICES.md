# Third-party notices

## Vehicle layer images (`dist/images/iso`, `dist/images/interior`)

Derived from the **dec_deepal** project (<https://github.com/manuelem1984/dec_deepal>), distributed under the MIT License:

```
Copyright (c) 2026 Deepal Alternative contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in the
Software without restriction, including without limitation the rights to use, copy,
modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

The Car View layers (`dist/images/iso/<colour>`, front-left isometric view, 750×500) are the original renders of the five colours, converted from PNG to WebP (`tools/build_iso.py`) with one change: the layers of the black car go through the same tone curve (`deepen()` in `tools/build_iso.py`) that darkens shadows and mid-tones and removes the blue cast, leaving highlights and edges as they were; the other colours are unchanged. The red “open window” layers (`dist/images/iso/common/window_*_alert*.webp`) are recoloured copies of the glass layers made by `tools/build_iso.py`. The number plate layer is not used. The translucent charging view (`dist/images/carga`, 750×500: car, grey cable, green cable) comes from the same project (`vista_carga`) and is converted to WebP with `tools/build_carga.py`. The top view (`dist/images/top`, 750×750) comes from `vista_planta`: the project only has the silver paint, so every layer that shows paint (body, bonnet, tailgate, doors, their open states and the door frame of open windows) of the other four colours is a recoloured copy made by `tools/build_planta.py` (glass and shadows untouched; the red warning tint of the open-state layers is kept); only the low beam is used as it is. The interior layers were recoloured to black with `tools/build_layers.py`.

## Vehicle photos (`dist/images/car`)

Images of a black Deepal S05 used as the hero and dashboard images. They were created by the project author with an
AI image generator and are released under the same MIT licence as the rest of the project.
They depict a real vehicle model; Deepal and Changan names and designs remain the property of their owners.

## Trademarks

Deepal, Changan and related names are trademarks of their respective owners. This project is independent and
unaffiliated.
