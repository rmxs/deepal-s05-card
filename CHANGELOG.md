# Changelog

## 1.4.0-beta.1

Top view and a taller hero. · Όψη από πάνω και πιο ψηλό hero. · Vista desde arriba y un hero más alto.

> **Beta.** Pre-release for testing; in HACS it appears only with *Show beta versions* on. · Δοκιμαστική έκδοση· στο HACS εμφανίζεται μόνο με ενεργό το *Show beta versions*. · Versión de prueba; en HACS solo aparece con *Show beta versions* activado.

**Added**

- **Top view** in the Car View hero. A button at the top right of the hero switches between the 3/4 view and a view from above, with live doors, bonnet, tailgate, windows and lights. *Settings → Vehicle → View* (`hero_view: iso | top`) chooses the view the card opens with; the button changes it on that device. While the charger is connected the translucent charging view is shown in either case. The project only ships the silver top view, so the other four colours are recoloured copies made by `tools/build_planta.py`, including the open doors, bonnet, tailgate and the frame of open windows (the red warning tint stays).
- **Lit door handles** when the vehicle is unlocked, in both views: amber handles with a soft pulsing glow (hidden while that door is open). The car is also centred exactly in the middle of the hero.

**Changed**

- The Car View hero is taller (aspect `7 / 5`, was the photo's ratio, about `16 / 9`), so the text at the top and the status line at the bottom no longer sit on the car. `image_aspect` still overrides it.
- Lighter on resources: only the images of the view you see are loaded and updated. A layer's image is fetched the first time it is needed (about a third of the Car View images at start-up instead of all of them), the hero photos are not loaded at all in Car View, the translucent charging view is built when the charger is first connected, and nothing is updated while another view is on screen.
- The charging text in Car View is anchored to the charge port, so it stays next to it at any card width and zoom (it used to drift away as the card got wider). The “AC” line lines up with the others, and the guide next to the text is a solid line.
- The title of the climate tile in the stepper style is on the same line as the title of the Energy tile (it was 2 px lower).

<details><summary>Ελληνικά</summary>

**Προστέθηκαν**

- **Όψη από πάνω** στο hero Car View. Ένα κουμπί πάνω δεξιά στο hero αλλάζει ανάμεσα στην όψη 3/4 και στην όψη από πάνω, με ζωντανές πόρτες, καπό, πορτμπαγκάζ, παράθυρα και φώτα. Το *Ρυθμίσεις → Όχημα → Προβολή* (`hero_view: iso | top`) ορίζει με ποια προβολή ανοίγει η κάρτα· το κουμπί την αλλάζει στη συσκευή σου. Όσο ο φορτιστής είναι συνδεδεμένος δείχνει πάντα η διάφανη όψη φόρτισης. Το project έχει μόνο την ασημί όψη από πάνω, οπότε τα άλλα τέσσερα χρώματα είναι ξαναχρωματισμένα αντίγραφα που φτιάχνει το `tools/build_planta.py`, μαζί με τις ανοιχτές πόρτες, το καπό, το πορτμπαγκάζ και το πλαίσιο των ανοιχτών παραθύρων (το κόκκινο της προειδοποίησης μένει).
- **Αναμμένες χειρολαβές** όταν το όχημα είναι ξεκλείδωτο, και στις δύο όψεις: κεχριμπαρένιες χειρολαβές με απαλή παλμική λάμψη (κρύβονται όσο η πόρτα είναι ανοιχτή). Το αμάξι κεντράρεται επίσης ακριβώς στη μέση του hero.

**Αλλαγές**

- Το hero στο Car View είναι πιο ψηλό (λόγος `7 / 5`, πριν ο λόγος της φωτογραφίας, περίπου `16 / 9`), ώστε το κείμενο πάνω και η γραμμή κατάστασης κάτω να μην πατάνε το αμάξι. Το `image_aspect` εξακολουθεί να υπερισχύει.
- Λιγότερη κατανάλωση πόρων: φορτώνονται και ενημερώνονται μόνο οι εικόνες της προβολής που βλέπεις. Η εικόνα ενός layer κατεβαίνει την πρώτη φορά που χρειάζεται (περίπου το ένα τρίτο των εικόνων του Car View στην εκκίνηση αντί για όλες), οι φωτογραφίες του hero δεν φορτώνουν καθόλου στο Car View, η διάφανη όψη φόρτισης χτίζεται όταν συνδεθεί για πρώτη φορά ο φορτιστής και τίποτα δεν ενημερώνεται όσο φαίνεται άλλη προβολή.
- Το κείμενο φόρτισης στο Car View δένεται πάνω στην πρίζα, ώστε να μένει δίπλα της σε κάθε πλάτος και μεγέθυνση (πριν απομακρυνόταν όσο πλάτυνε η κάρτα). Η γραμμή «AC» ευθυγραμμίζεται με τις άλλες και ο οδηγός δίπλα στο κείμενο είναι συμπαγής γραμμή.
- Ο τίτλος του tile Κλιματισμού στο στυλ stepper είναι στο ίδιο ύψος με τον τίτλο του tile Ενέργεια (ήταν 2 px πιο κάτω).

</details>

<details><summary>Español</summary>

**Añadido**

- **Vista desde arriba** en el hero Car View. Un botón arriba a la derecha del hero alterna entre la vista 3/4 y la vista desde arriba, con puertas, capó, portón, ventanillas y luces en vivo. *Ajustes → Vehículo → Vista* (`hero_view: iso | top`) elige con qué vista se abre la tarjeta; el botón la cambia en ese dispositivo. Mientras el cargador está conectado se muestra siempre la vista translúcida de carga. El proyecto solo trae la vista desde arriba en plata, así que los otros cuatro colores son copias recoloreadas hechas con `tools/build_planta.py`, incluidas las puertas, el capó, el portón abiertos y el marco de las ventanillas abiertas (el rojo de aviso se mantiene).
- **Manillas de las puertas iluminadas** cuando el vehículo está desbloqueado, en las dos vistas: manillas ámbar con un suave brillo pulsante (se ocultan mientras esa puerta está abierta). El coche también queda centrado exactamente en el medio del hero.

**Cambios**

- El hero del Car View es más alto (proporción `7 / 5`, antes la de la foto, unos `16 / 9`), para que el texto de arriba y la línea de estado de abajo no queden sobre el coche. `image_aspect` sigue teniendo prioridad.
- Menos recursos: solo se cargan y actualizan las imágenes de la vista que ves. La imagen de una capa se descarga la primera vez que hace falta (alrededor de un tercio de las imágenes del Car View al arrancar en vez de todas), las fotos del hero no se cargan en absoluto en Car View, la vista translúcida de carga se construye cuando se conecta el cargador por primera vez y no se actualiza nada mientras hay otra vista en pantalla.
- El texto de carga en Car View queda anclado al puerto de carga, así que se mantiene a su lado con cualquier ancho y zoom (antes se alejaba al ensanchar la tarjeta). La línea «AC» se alinea con las demás y la guía junto al texto es una línea continua.
- El título del tile de clima en el estilo stepper está a la misma altura que el del tile Energía (estaba 2 px más abajo).

</details>

## 1.3.1

Open windows in red. · Ανοιχτά παράθυρα με κόκκινο. · Ventanillas abiertas en rojo.

**Changed**

- In the Car View (popup and hero) an open window is now drawn in red, so you can see which windows are open at a glance. Windows on the far side of the car, which the body hides, show as a translucent red patch seen through the glass. Closed windows look as before.
- The **Tyres** button now reports only the tyres (lowest pressure, or a warning). It used to show “N open” when doors or windows were open; that is still shown by the Windows button, the status line on the hero and the Car View.
- On phones the confirmation sheet (unlock, lock, …) sits higher, clear of the bottom bar, and its buttons are bigger.
- With the *beside* charge text, the guide next to the time is now a solid line with a ring instead of dashes, so it no longer looks like the dashed flow on the cable.
- Tyre pressures in bar now show two decimals (`2.55 bar`), in the Car View and in the Tyres summary, matching the limits in Settings. Thanks to @Sunek0 (#3).

<details><summary>Ελληνικά</summary>

**Αλλαγές**

- Στο Car View (popup και hero) ένα ανοιχτό παράθυρο ζωγραφίζεται πλέον κόκκινο, ώστε να φαίνεται με μια ματιά ποια παράθυρα είναι ανοιχτά. Τα παράθυρα της απέναντι πλευράς, που τα κρύβει το αμάξι, φαίνονται ως ημιδιάφανο κόκκινο σημείο μέσα από τα τζάμια. Τα κλειστά φαίνονται όπως πριν.
- Το κουμπί **Ελαστικά** δείχνει πλέον μόνο τα ελαστικά (χαμηλότερη πίεση ή προειδοποίηση). Πριν έγραφε «N ανοιχτά» όταν υπήρχαν ανοιχτές πόρτες ή παράθυρα· αυτό φαίνεται ακόμα στο κουμπί Παράθυρα, στη γραμμή κατάστασης του hero και στο Car View.
- Στο κινητό το παράθυρο επιβεβαίωσης (ξεκλείδωμα, κλείδωμα, …) είναι πιο ψηλά, μακριά από την κάτω μπάρα, και τα κουμπιά του μεγαλύτερα.
- Με το κείμενο φόρτισης *beside*, ο οδηγός δίπλα στην ώρα είναι πλέον συμπαγής γραμμή με δαχτυλίδι αντί για παύλες, ώστε να μη μοιάζει με τις διακεκομμένες της ροής στο καλώδιο.
- Οι πιέσεις των ελαστικών σε bar δείχνουν πλέον δύο δεκαδικά (`2.55 bar`), στο Car View και στη σύνοψη Ελαστικών, όπως τα όρια στις Ρυθμίσεις. Ευχαριστώ τον @Sunek0 (#3).

</details>

<details><summary>Español</summary>

**Cambios**

- En el Car View (ventana y hero) una ventanilla abierta se dibuja ahora en rojo, para ver de un vistazo cuáles están abiertas. Las ventanillas del lado opuesto, que la carrocería oculta, se ven como una mancha roja translúcida a través del cristal. Las cerradas se ven como antes.
- El botón **Neumáticos** informa ahora solo de los neumáticos (presión más baja o un aviso). Antes mostraba «N abiertas» cuando había puertas o ventanillas abiertas; eso se sigue viendo en el botón Ventanillas, en la línea de estado del hero y en el Car View.
- En el móvil la hoja de confirmación (abrir, cerrar, …) queda más arriba, libre de la barra inferior, y sus botones son más grandes.
- Con el texto de carga *beside*, la guía junto a la hora es ahora una línea continua con un anillo en vez de guiones, para que no se parezca a los guiones del flujo del cable.
- Las presiones de los neumáticos en bar muestran ahora dos decimales (`2.55 bar`), en el Car View y en el resumen de Neumáticos, como los límites en Ajustes. Gracias a @Sunek0 (#3).

</details>

## 1.3.0

Car View hero and a new Vehicle tab. · Hero Car View και νέα καρτέλα Όχημα. · Hero Car View y nueva pestaña Vehículo.

**Added**

- **Hero style** (*Settings → Vehicle*, option `hero_style`): keep your own photos (default, unchanged) or use a live **Car View** render as the hero. It follows the car's colour setting and shows doors, bonnet, tailgate, windows and low beams in real time. It is centred, follows the card's zoom (`image_scale`) around the car and sits on a lighter floor with a soft shadow.
- **Charging view** for the Car View hero: while the charger is connected the car switches to a translucent side view (from the dec_deepal project) with a grey cable when plugged in and a green cable while charging. The same effects as the photo hero apply and follow *Charging effect*: energy flowing along the cable, glow and pulses at the charge port, light sweep. The new images live in `images/carga/`.
- New first settings tab **Vehicle** with the card name, entity prefix, vehicle type, hero style, zoom and aspect ratio, car colour and wheels. These settings moved here from *General*, *Images* and *Appearance*.

**Changed**

- The black car in the Car View (popup and hero) is darker and no longer bluish: the same tone curve is applied to every black layer, so shadows and mid-tones go deeper while reflections and edges stay as they were. The other colours are unchanged.
- New presentation images (hero styles, charging view, Vehicle tab) and regenerated existing ones.

<details><summary>Ελληνικά</summary>

**Προστέθηκαν**

- **Στυλ hero** (*Ρυθμίσεις → Όχημα*, επιλογή `hero_style`): κράτα τις δικές σου φωτογραφίες (προεπιλογή, αμετάβλητο) ή χρησιμοποίησε ζωντανό render **Car View** ως hero. Ακολουθεί το χρώμα του αμαξιού και δείχνει πόρτες, καπό, πορτμπαγκάζ, παράθυρα και φώτα σε πραγματικό χρόνο. Είναι κεντραρισμένο, ακολουθεί το ζουμ της κάρτας (`image_scale`) γύρω από το αμάξι και στέκεται σε πιο ανοιχτό δάπεδο με απαλή σκιά.
- **Όψη φόρτισης** για το hero Car View: όταν είναι συνδεδεμένος ο φορτιστής, το αμάξι αλλάζει σε διάφανη πλάγια όψη (από το έργο dec_deepal) με γκρι καλώδιο όταν είναι συνδεδεμένος και πράσινο όταν φορτίζει. Ισχύουν τα ίδια εφέ με το hero φωτογραφιών και ακολουθούν την επιλογή «Εφέ φόρτισης»: ροή ενέργειας στο καλώδιο, λάμψη και παλμοί στη θύρα, σάρωση φωτός. Οι νέες εικόνες είναι στο `images/carga/`.
- Νέα πρώτη καρτέλα ρυθμίσεων **Όχημα** με όνομα κάρτας, πρόθεμα οντοτήτων, τύπο οχήματος, στυλ hero, ζουμ και λόγο διαστάσεων, χρώμα αμαξιού και ζάντες. Οι ρυθμίσεις αυτές μεταφέρθηκαν από τις καρτέλες «Γενικά», «Εικόνες» και «Εμφάνιση».

**Αλλαγές**

- Το μαύρο αμάξι στο Car View (popup και hero) είναι πιο σκούρο και χωρίς μπλε απόχρωση: η ίδια καμπύλη τόνων εφαρμόζεται σε όλα τα layers του μαύρου, ώστε οι σκιές και τα μεσαία τόνα να βαθαίνουν ενώ οι αντανακλάσεις και οι άκρες μένουν όπως ήταν. Τα υπόλοιπα χρώματα δεν άλλαξαν.
- Νέες εικόνες παρουσίασης (στυλ hero, όψη φόρτισης, καρτέλα Όχημα) και ανανεωμένες οι υπάρχουσες.

</details>

<details><summary>Español</summary>

**Añadido**

- **Estilo del hero** (*Ajustes → Vehículo*, opción `hero_style`): conserva tus propias fotos (por defecto, sin cambios) o usa un render **Car View** en vivo como hero. Sigue el color del coche y muestra puertas, capó, portón, ventanillas y luces en tiempo real. Va centrado, sigue el zoom de la tarjeta (`image_scale`) alrededor del coche y se apoya en un suelo más claro con una sombra suave.
- **Vista de carga** para el hero Car View: con el cargador conectado, el coche cambia a una vista lateral translúcida (del proyecto dec_deepal) con cable gris al estar conectado y cable verde al cargar. Se aplican los mismos efectos que en el hero de fotos y siguen la opción «Efecto de carga»: flujo de energía por el cable, brillo y pulsos en el puerto, barrido de luz. Las imágenes nuevas están en `images/carga/`.
- Nueva primera pestaña de ajustes **Vehículo** con el nombre de la tarjeta, el prefijo de entidades, el tipo de vehículo, el estilo del hero, el zoom y la relación de aspecto, el color del coche y las llantas. Estos ajustes se movieron aquí desde «General», «Imágenes» y «Mostrar».

**Cambios**

- El coche negro del Car View (ventana y hero) es más oscuro y sin tono azulado: la misma curva de tonos se aplica a todas las capas del negro, de modo que las sombras y los tonos medios se profundizan mientras que los reflejos y los bordes quedan como estaban. Los demás colores no cambian.
- Imágenes de presentación nuevas (estilos de hero, vista de carga, pestaña Vehículo) y las existentes regeneradas.

</details>

## 1.2.6

Card picker. · Επιλογέας καρτών. · Selector de tarjetas.

**Changed**

- In the card picker the card is now called **Deepal S05 Control Panel**, with a clearer description, and it shows a live preview of the card instead of only text.

<details><summary>Ελληνικά</summary>

**Αλλαγές**

- Στον επιλογέα καρτών η κάρτα λέγεται πλέον **Deepal S05 Control Panel**, με πιο σαφή περιγραφή, και δείχνει ζωντανή προεπισκόπηση της κάρτας αντί για απλό κείμενο.

</details>

<details><summary>Español</summary>

**Cambios**

- En el selector de tarjetas la tarjeta se llama ahora **Deepal S05 Control Panel**, con una descripción más clara, y muestra una vista previa en vivo en lugar de solo texto.

</details>

## 1.2.5

Energy tile. · Πλακίδιο ενέργειας. · Mosaico de energía.

**Changed**

- The energy tile no longer shows "Not charging" when the car is idle. The status line appears only while charging.

<details><summary>Ελληνικά</summary>

**Αλλαγές**

- Το πλακίδιο ενέργειας δεν δείχνει πια «Δεν φορτίζει» όταν το όχημα δεν φορτίζει. Η γραμμή κατάστασης εμφανίζεται μόνο όταν φορτίζει.

</details>

<details><summary>Español</summary>

**Cambios**

- El mosaico de energía ya no muestra «No está cargando» cuando el coche está parado. La línea de estado aparece solo mientras carga.

</details>

## 1.2.4

Cleanup. · Τακτοποίηση. · Limpieza.

**Changed**

- The `lang/` folder now holds only the languages that load on demand (Spanish, and any you add). The English file moved to the source (`src/lang_en.js`) because it is built into the main file, so it is no longer installed twice.

<details><summary>Ελληνικά</summary>

**Αλλαγές**

- Ο φάκελος `lang/` έχει πλέον μόνο τις γλώσσες που φορτώνουν όταν χρειάζονται (ισπανικά και όσες προσθέσεις). Το αγγλικό αρχείο πέρασε στον πηγαίο κώδικα (`src/lang_en.js`) γιατί είναι ενσωματωμένο στο κύριο αρχείο, οπότε δεν εγκαθίσταται πια δύο φορές.

</details>

<details><summary>Español</summary>

**Cambios**

- La carpeta `lang/` contiene ahora solo los idiomas que se cargan cuando hacen falta (español y los que añadas). El archivo de inglés pasó al código fuente (`src/lang_en.js`) porque va integrado en el archivo principal, así que ya no se instala dos veces.

</details>

## 1.2.3

Language loading. · Φόρτωση γλωσσών. · Carga de idiomas.

**Changed**

- Only English is built into the main file now (it is the fallback language, so the card is never shown in Greek on a non-Greek Home Assistant, even if the `lang/` folder is missing). Spanish and every other language load from the `lang/` folder, like before 1.2.1. Greek is the language of the code itself, so it needs no file. The main file is about 30 KB smaller. If a language file cannot be loaded, the card shows English.

<details><summary>Ελληνικά</summary>

**Αλλαγές**

- Στο κύριο αρχείο είναι πλέον ενσωματωμένα μόνο τα αγγλικά (είναι η εφεδρική γλώσσα, οπότε η κάρτα δεν εμφανίζεται ποτέ στα ελληνικά σε μη ελληνικό Home Assistant, ακόμα κι αν λείπει ο φάκελος `lang/`). Τα ισπανικά και κάθε άλλη γλώσσα φορτώνουν από τον φάκελο `lang/`. Τα ελληνικά είναι η γλώσσα του ίδιου του κώδικα και δεν χρειάζονται αρχείο. Το κύριο αρχείο είναι περίπου 30 KB μικρότερο. Αν ένα αρχείο γλώσσας δεν φορτώσει, η κάρτα δείχνει αγγλικά.

</details>

<details><summary>Español</summary>

**Cambios**

- Ahora solo el inglés va integrado en el archivo principal (es el idioma de reserva, así que la tarjeta nunca aparece en griego en un Home Assistant que no sea griego, aunque falte la carpeta `lang/`). El español y cualquier otro idioma se cargan desde la carpeta `lang/`. El griego es el idioma del propio código y no necesita archivo. El archivo principal pesa unos 30 KB menos. Si un archivo de idioma no se puede cargar, la tarjeta muestra inglés.

</details>

## 1.2.2

HACS install fix. · Διόρθωση εγκατάστασης από το HACS. · Corrección de la instalación con HACS.

**Fixed**

- **HACS now installs the whole card, not just the `.js`.** The releases carried the `deepal-s05-card.js` file as an attachment, and when a release has that, HACS downloads only that one file and never looks at the `dist/` folder — so the `images/` (car photos, Car View, interior) and `lang/` folders were missing after a HACS install. Releases no longer carry the attachment, so HACS downloads everything in `dist/`, sub-folders included. If you installed 1.0.6–1.2.1 from HACS and see no car photos, update to 1.2.2 (or newer) in HACS.

<details><summary>Ελληνικά</summary>

**Διορθώσεις**

- **Το HACS εγκαθιστά πλέον ολόκληρη την κάρτα, όχι μόνο το `.js`.** Τα releases είχαν ως συνημμένο το αρχείο `deepal-s05-card.js` και, όταν ένα release το έχει, το HACS κατεβάζει μόνο αυτό και δεν κοιτάζει τον φάκελο `dist/` — έτσι έλειπαν οι φάκελοι `images/` (φωτογραφίες αυτοκινήτου, Car View, εσωτερικό) και `lang/` μετά από εγκατάσταση με HACS. Τα releases πλέον δεν έχουν συνημμένο, οπότε το HACS κατεβάζει ό,τι υπάρχει στο `dist/`, μαζί με τους υποφακέλους. Αν εγκατέστησες την 1.0.6–1.2.1 από το HACS και δεν βλέπεις φωτογραφίες, ενημέρωσε στην 1.2.2 (ή νεότερη) από το HACS.

</details>

<details><summary>Español</summary>

**Corregido**

- **HACS ahora instala toda la tarjeta, no solo el `.js`.** Las versiones llevaban el archivo `deepal-s05-card.js` como adjunto y, cuando una versión lo tiene, HACS descarga solo ese archivo y no mira la carpeta `dist/` — por eso faltaban las carpetas `images/` (fotos del coche, Car View, interior) y `lang/` tras instalar con HACS. Las versiones ya no llevan adjunto, así que HACS descarga todo lo que hay en `dist/`, subcarpetas incluidas. Si instalaste la 1.0.6–1.2.1 con HACS y no ves las fotos del coche, actualiza a la 1.2.2 (o posterior) en HACS.

</details>

## 1.2.1

Language fix. · Διόρθωση γλώσσας. · Corrección del idioma.

**Fixed**

- On a fresh install the card could appear in Greek even when Home Assistant was set to English or Spanish: the English and Spanish texts lived only in the `lang/` folder, and when that folder was not installed (for example by HACS, which may download only the `.js` file) the card fell back to Greek. English and Spanish are now built into the card file. Any other language still loads from `lang/`, and anything that is not available falls back to **English** — Greek is used only when Home Assistant itself is in Greek.

<details><summary>Ελληνικά</summary>

**Διορθώσεις**

- Σε νέα εγκατάσταση η κάρτα μπορούσε να εμφανιστεί στα ελληνικά ακόμα κι όταν το Home Assistant ήταν στα αγγλικά ή στα ισπανικά: τα αγγλικά και τα ισπανικά βρίσκονταν μόνο στον φάκελο `lang/` και, όταν ο φάκελος δεν εγκαθίσταται (π.χ. από το HACS, που μπορεί να κατεβάζει μόνο το `.js`), η κάρτα έπεφτε στα ελληνικά. Τα αγγλικά και τα ισπανικά είναι πλέον μέσα στο ίδιο το αρχείο της κάρτας. Κάθε άλλη γλώσσα φορτώνει ακόμα από το `lang/`, και ό,τι δεν υπάρχει πέφτει στα **αγγλικά** — τα ελληνικά μόνο όταν το ίδιο το Home Assistant είναι στα ελληνικά.

</details>

<details><summary>Español</summary>

**Corregido**

- En una instalación nueva la tarjeta podía aparecer en griego aunque Home Assistant estuviera en inglés o en español: los textos en inglés y español estaban solo en la carpeta `lang/` y, cuando esa carpeta no se instala (por ejemplo con HACS, que puede descargar solo el `.js`), la tarjeta recurría al griego. El inglés y el español están ahora dentro del propio archivo de la tarjeta. Cualquier otro idioma se sigue cargando desde `lang/`, y lo que no exista se muestra en **inglés** — el griego solo cuando el propio Home Assistant está en griego.

</details>

## 1.2.0

Summary of everything that changed since 1.1.0. · Συγκεντρωτικά όσα άλλαξαν από την 1.1.0. · Resumen de todo lo que cambió desde la 1.1.0.

**New**

- **Diagnostics redesigned.** Larger, solid dashboard-style icons (brakes, tyre pressure, 12 V and traction battery, power system, power limit, steering, key fob, oil, engine) coloured by status: green OK, amber warning, red critical, grey unavailable. Identical icons are grouped with a counter.
- **Diagnostics popup.** The **+N** chip now opens a list of *all* sensors — Problems, Unavailable, OK — instead of the settings. The number counts sensors, so icons + N always add up to the sensors that are active (or all of them in “always show” mode).
- **New sensors.** *Settings → Sensors → Search for new sensors* finds warnings of your vehicle that the card does not know yet and adds them; the popup also tells you when it finds some. Any Home Assistant icon (`mdi:…`) can be used for your own sensors.
- **Trunk button** with a side-view car and open tailgate (open and closed state).
- **Buttons:** main row + a small “More” chevron (`button_layout: split`, `button_primary`, `buttons_more`).
- **Climate tile:** target temperature with − / + (`climate_ui: steps`) or the classic large circle (`circle`). Changing the target while the climate is off no longer turns it on, and asks for confirmation when `climate` is in `confirm`.
- **Larger info tiles.** The Odometer, Fuel, Power, Charging… tiles (and your own) have bigger text and icons, all the same size. The diagnostic icons on the car photo are sized to fit the picture.
- **“No data” hint.** *Settings → Sensors → Info* now marks sensors that exist but report no value — for example *Petrol* (fuel volume) when the vehicle only reports the tank level in %.
- New presentation images, including two new ones (diagnostics and new sensors). `tools/make_images.js` rebuilds all of them from the real card.
- Offline banner, popups close with Escape, keep keyboard focus inside and can be swiped down on phones. “All good” line in the Car View.
- Fuel colour now matches the green of the battery at 100 %.

**Fixed**

- 15 sensors were shown as 10 icons: the four tyre alarms and the tyre-pressure warning, and the two power warnings, were merged without saying so.
- The **+N** chip opened Settings instead of showing the sensors.
- The `validate` workflow now declares read-only permissions.

<details><summary>Ελληνικά</summary>

**Νέα**

- **Νέος σχεδιασμός διαγνωστικών.** Μεγαλύτερα, γεμάτα εικονίδια τύπου ταμπλό (φρένα, πίεση ελαστικών, μπαταρία 12 V και έλξης, σύστημα ισχύος, περιορισμός ισχύος, τιμόνι, κλειδί, λάδι, κινητήρας) με χρώμα ανά κατάσταση: πράσινο OK, κεχριμπάρι προειδοποίηση, κόκκινο κρίσιμο, γκρι μη διαθέσιμο. Τα ίδια εικονίδια ομαδοποιούνται με μετρητή.
- **Popup διαγνωστικών.** Το **+N** ανοίγει πλέον λίστα με *όλους* τους αισθητήρες — Προβλήματα, Μη διαθέσιμοι, Εντάξει — αντί για τις ρυθμίσεις. Ο αριθμός μετράει αισθητήρες, άρα εικονίδια + N = οι ενεργοί αισθητήρες (ή όλοι, στη λειτουργία «Πάντα όλες»).
- **Νέοι αισθητήρες.** *Ρυθμίσεις → Αισθητήρες → Αναζήτηση νέων αισθητήρων* βρίσκει προειδοποιήσεις του οχήματος που η κάρτα δεν ξέρει και τις προσθέτει· το popup σε ειδοποιεί όταν βρει. Για τους δικούς σου αισθητήρες μπορείς να βάλεις οποιοδήποτε εικονίδιο του HA (`mdi:…`).
- **Κουμπί πορτμπαγκάζ** με αυτοκίνητο σε πλάγια όψη και ανοιχτή πόρτα αποσκευών (ανοιχτό και κλειστό).
- **Κουμπιά:** κύρια σειρά + μικρό βελάκι «Περισσότερα» (`button_layout: split`, `button_primary`, `buttons_more`).
- **Πλακίδιο κλιματισμού:** θερμοκρασία-στόχος με − / + (`climate_ui: steps`) ή ο κλασικός μεγάλος κύκλος (`circle`). Η αλλαγή στόχου με κλειστό κλιματισμό δεν τον ανοίγει πια και ζητά επιβεβαίωση όταν το `climate` είναι στο `confirm`.
- **Μεγαλύτερα πλακίδια πληροφοριών.** Τα πλακίδια Οδόμετρο, Καύσιμο, Ισχύς, Φόρτιση… (και τα δικά σου) έχουν μεγαλύτερο κείμενο και εικονίδια, όλα στο ίδιο μέγεθος. Τα εικονίδια διαγνωστικών πάνω στη φωτογραφία προσαρμόστηκαν στο μέγεθος της εικόνας.
- **Ένδειξη «Χωρίς δεδομένα».** Στις *Ρυθμίσεις → Αισθητήρες → Info* σημειώνονται οι αισθητήρες που υπάρχουν αλλά δεν δίνουν τιμή — π.χ. η *Βενζίνη* (λίτρα) όταν το όχημα στέλνει μόνο τη στάθμη σε %.
- Νέες εικόνες παρουσίασης, με δύο καινούργιες (διαγνωστικά και νέοι αισθητήρες). Το `tools/make_images.js` τις ξαναφτιάχνει όλες από την πραγματική κάρτα.
- Banner εκτός σύνδεσης, τα popups κλείνουν με Escape, κρατούν το πληκτρολόγιο μέσα τους και κλείνουν με σύρσιμο προς τα κάτω στο κινητό. Γραμμή «Όλα καλά» στο Car View.
- Το χρώμα της βενζίνης ταιριάζει πλέον με το πράσινο της μπαταρίας στο 100 %.

**Διορθώσεις**

- 15 αισθητήρες εμφανίζονταν ως 10 εικονίδια: οι τέσσερις συναγερμοί ελαστικών με την προειδοποίηση πίεσης, και οι δύο προειδοποιήσεις ισχύος, ενώνονταν χωρίς ένδειξη.
- Το **+N** άνοιγε τις Ρυθμίσεις αντί να δείχνει τους αισθητήρες.
- Το workflow `validate` δηλώνει πλέον δικαιώματα μόνο ανάγνωσης.

</details>

<details><summary>Español</summary>

**Novedades**

- **Diagnóstico rediseñado.** Iconos más grandes y rellenos, al estilo del tablero (frenos, presión de neumáticos, batería de 12 V y de tracción, sistema de potencia, límite de potencia, dirección, llave, aceite, motor) con color según el estado: verde correcto, ámbar advertencia, rojo crítico, gris no disponible. Los iconos iguales se agrupan con un contador.
- **Ventana de diagnóstico.** El chip **+N** abre ahora una lista de *todos* los sensores — Problemas, No disponibles, Correctos — en lugar de los ajustes. El número cuenta sensores, así que iconos + N siempre suman los sensores activos (o todos en el modo «Mostrar siempre»).
- **Sensores nuevos.** *Ajustes → Sensores → Buscar sensores nuevos* encuentra advertencias de tu vehículo que la tarjeta aún no conoce y las añade; la ventana también avisa cuando encuentra alguna. Para tus propios sensores puedes usar cualquier icono de Home Assistant (`mdi:…`).
- **Botón del maletero** con un coche de perfil y el portón abierto (estado abierto y cerrado).
- **Botones:** fila principal + una pequeña flecha «Más» (`button_layout: split`, `button_primary`, `buttons_more`).
- **Mosaico de climatización:** temperatura objetivo con − / + (`climate_ui: steps`) o el círculo grande clásico (`circle`). Cambiar el objetivo con la climatización apagada ya no la enciende y pide confirmación si `climate` está en `confirm`.
- **Mosaicos de información más grandes.** Los mosaicos Cuentakilómetros, Combustible, Potencia, Carga… (y los tuyos) tienen texto e iconos más grandes, todos del mismo tamaño. Los iconos de diagnóstico sobre la foto se ajustan al tamaño de la imagen.
- **Aviso «Sin datos».** *Ajustes → Sensores → Info* marca los sensores que existen pero no dan ningún valor — por ejemplo *Gasolina* (litros) cuando el vehículo solo informa del nivel del depósito en %.
- Imágenes de presentación nuevas, con dos más (diagnóstico y sensores nuevos). `tools/make_images.js` las regenera todas desde la tarjeta real.
- Banner sin conexión, las ventanas se cierran con Escape, mantienen el foco del teclado y se cierran deslizando hacia abajo en el móvil. Línea «Todo bien» en el Car View.
- El color del combustible coincide ahora con el verde de la batería al 100 %.

**Corregido**

- 15 sensores se mostraban como 10 iconos: las cuatro alarmas de neumáticos con el aviso de presión, y las dos advertencias de potencia, se fusionaban sin indicarlo.
- El chip **+N** abría los Ajustes en lugar de mostrar los sensores.
- El flujo `validate` declara ahora permisos de solo lectura.

</details>

## 1.1.0

Summary of everything that changed since 1.0.7. · Συγκεντρωτικά όσα άλλαξαν από την 1.0.7. · Resumen de todo lo que cambió desde la 1.0.7.

**New**

- **Car View** replaces the top view: a real 3/4 render of the car (front-left) made of layers. Doors, bonnet, tailgate, windows and headlights show live. The four tyre pressures are small labels connected to their wheels with lines (dashed for the wheels on the far side) — green with a check when OK, red with a note when not.
- **Car colour**: black, blue, grey, silver or white, and three wheel styles (20″ with covers, 20″ without, 18″ Pro) — *Settings → Show → Car colour* (`car_color`, `iso_wheels`). Only the selected colour is loaded, and only when the Car View is opened.
- **Climate airflow**: thin, swaying streams from the two middle vents and the two dashboard slits (the left one emerges from behind the steering wheel). The air is coloured by the target temperature — cool / mild / warm, 22 °C and 24 °C by default. Limits and colours are configurable (*Settings → Show → Air flow colors*: `air_t1`, `air_t2`, `air_c1`, `air_c2`, `air_c3`).
- New presentation images (Car View, car colours, climate, settings). Documentation in English, Greek and Spanish.

**Fixed**

- The climate picker and the airflow colour did not update when only the target temperature changed.
- Popups and Settings are centred as a full-page overlay on large screens.
- Tyre labels: a general tyre warning no longer turns all four red; the label of a single wheel with an alarm is shown correctly.
- Texts in Settings that still mentioned the removed charging picture.

**Removed**

- The top-view images (`images/top`), the Charging view of the popup and the `top_orientation` option (old configs keep working; the key is ignored).

**Other**

- New vehicle renders from dec_deepal (MIT) — see THIRD_PARTY_NOTICES.md. Copyright (c) 2026 L.K.

<details><summary>Ελληνικά</summary>

**Νέα**

- Το **Car View** αντικαθιστά την κάτοψη: πραγματικό render 3/4 του αμαξιού (μπροστά αριστερά) από layers. Πόρτες, καπό, πορτμπαγκάζ, παράθυρα και φώτα εμφανίζονται ζωντανά. Οι πιέσεις των τεσσάρων ελαστικών είναι μικρές ετικέτες συνδεδεμένες με γραμμές στους τροχούς (διακεκομμένες για τους τροχούς της μακρινής πλευράς) — πράσινες με ✓ όταν είναι OK, κόκκινες με σημείωση όταν όχι.
- **Χρώμα αμαξιού**: μαύρο, μπλε, γκρι, ασημί ή λευκό, και τρία στυλ ζαντών (20″ με τάπες, 20″ χωρίς, 18″ Pro) — *Ρυθμίσεις → Εμφάνιση → Χρώμα αμαξιού* (`car_color`, `iso_wheels`). Φορτώνεται μόνο το επιλεγμένο χρώμα και μόνο όταν ανοίξει το Car View.
- **Ροή αέρα κλιματισμού**: λεπτά ρεύματα που κυματίζουν από τους δύο μεσαίους αεραγωγούς και τις δύο σχισμές του ταμπλό (η αριστερή βγαίνει πίσω από το τιμόνι). Ο αέρας παίρνει χρώμα από τη θερμοκρασία-στόχο — δροσερό / μέτριο / ζεστό, αρχικά 22 °C και 24 °C. Τα όρια και τα χρώματα ρυθμίζονται (*Ρυθμίσεις → Εμφάνιση → Χρώμα αέρα κλιματισμού*).
- Νέες εικόνες παρουσίασης (Car View, χρώματα, κλιματισμός, ρυθμίσεις). Τεκμηρίωση στα Αγγλικά, Ελληνικά και Ισπανικά.

**Διορθώσεις**

- Ο επιλογέας του κλιματισμού και το χρώμα του αέρα δεν ενημερώνονταν όταν άλλαζε μόνο η θερμοκρασία-στόχος.
- Τα popups και οι Ρυθμίσεις ανοίγουν κεντραρισμένα σε ολόκληρη τη σελίδα στις μεγάλες οθόνες.
- Ετικέτες ελαστικών: μια γενική προειδοποίηση δεν κοκκινίζει πια και τα τέσσερα· εμφανίζεται σωστά ο ένας τροχός με συναγερμό.
- Κείμενα στις Ρυθμίσεις που ανέφεραν ακόμα την εικόνα φόρτισης που αφαιρέθηκε.

**Αφαιρέθηκαν**

- Οι εικόνες κάτοψης (`images/top`), η προβολή φόρτισης του popup και η επιλογή `top_orientation` (οι παλιές ρυθμίσεις συνεχίζουν να δουλεύουν· το κλειδί αγνοείται).

**Άλλα**

- Νέα renders του οχήματος από το dec_deepal (MIT) — δες THIRD_PARTY_NOTICES.md. Copyright (c) 2026 L.K.

</details>

<details><summary>Español</summary>

**Novedades**

- **Car View** sustituye a la vista cenital: un render 3/4 real del coche (delantero izquierdo) hecho con capas. Puertas, capó, portón, ventanillas y faros se muestran en vivo. Las presiones de los cuatro neumáticos son etiquetas pequeñas unidas a las ruedas con líneas (discontinuas para las ruedas del lado lejano): verdes con ✓ si están bien, rojas con una nota si no.
- **Color del coche**: negro, azul, gris, plata o blanco, y tres estilos de llantas (20″ con tapas, 20″ sin tapas, 18″ Pro) — *Ajustes → Mostrar → Color del coche* (`car_color`, `iso_wheels`). Solo se carga el color elegido y solo al abrir el Car View.
- **Flujo de aire del clima**: corrientes finas que ondean desde las dos salidas centrales y las dos ranuras del salpicadero (la izquierda sale por detrás del volante). El aire toma el color de la temperatura objetivo — fresco / templado / cálido, por defecto 22 °C y 24 °C. Los límites y los colores se configuran (*Ajustes → Mostrar → Colores del flujo de aire*).
- Nuevas imágenes de presentación (Car View, colores, clima, ajustes). Documentación en inglés, griego y español.

**Corregido**

- El selector de clima y el color del aire no se actualizaban cuando solo cambiaba la temperatura objetivo.
- Las ventanas emergentes y los Ajustes se abren centrados a pantalla completa en pantallas grandes.
- Etiquetas de neumáticos: un aviso general ya no pone los cuatro en rojo; se muestra bien la rueda con alarma.
- Textos de Ajustes que aún mencionaban la imagen de carga eliminada.

**Eliminado**

- Las imágenes cenitales (`images/top`), la vista de carga de la ventana emergente y la opción `top_orientation` (las configuraciones antiguas siguen funcionando; la clave se ignora).

**Otros**

- Nuevos renders del vehículo de dec_deepal (MIT) — véase THIRD_PARTY_NOTICES.md. Copyright (c) 2026 L.K.

</details>

## 1.0.7

- Charging details are shown once: the status row and the Energy tile no longer repeat the current, type and remaining time (they are on the hero photo next to the charge port).
- New presentation images (A/C target picker, settings, EV vs PHEV).

## 1.0.6

- Charging details (current, time remaining, type) are now plain green text on the hero photo, next to the charge port — no frame. Four styles (Settings → Charging → Style): `line` (default), `text`, `big`, `beside`.
- Top view uses the real top-down photo of the car. Tyre pressures are pills connected to the image: green with a check when OK, red with a "low"/"check" note otherwise.
- Tyre pressure check can follow the alerts the car sends itself (`tire_check: vehicle`, default), your own min/max limits (`limits`), or both. Min/max fields are entered in the selected unit (bar, kPa or psi).
- Settings are no longer written to the dashboard YAML on every click: while the settings are open nothing reloads, and the YAML is saved once when you close them (changes still apply instantly and are kept in your browser and HA account).
- Presentation images added to the README.

## 1.0.5

- The settings tab arrow buttons are now translated (English/Spanish). No other changes.

## 1.0.4

- Settings redesigned: eight tabs with icons (Sections, Buttons, Sensors, Charging, Tyres, Appearance, Images, General), grouped cards, segmented controls and colour swatches. Tabs have an opaque bar and arrow buttons (plus mouse drag), so they can be scrolled without a wheel.
- Battery/fuel level colours and thresholds are configurable (Settings → Charging); the charging effect now has exactly the colour of the bar.
- Battery/fuel gauge: the percentages map to the visible arc, the ring is cropped by the tile corner, and the numbers are larger. The tile title is "Energy" on PHEV.
- Images tab is back, limited to the hero/dashboard photos (the layer check lists were removed).
- Performance: effects behind a popup and off-screen are paused (60 fps instead of ~41 with Settings open while charging), translations are cached, and Settings no longer re-attaches its event listeners on every refresh (a bug that made controls act on stale values).
- Security: colour values are validated (`#rrggbb`), `url`/`navigate` tap actions accept only `http(s)` and local paths, saved settings keep only known keys, language codes are validated before loading `lang/<code>.js`.

## 1.0.3

- Spanish translation (`lang/es.js`).
- Popups slide up smoothly instead of jumping in.
- `card_padding: none`: tiles and buttons keep their border and rounded corners (3px from the edge).
- Missing English strings fixed (layer headings, climate messages, tooltips); raw sensor states such as `not_charging` are shown as readable text.
- Language list now includes Español.

## 1.0.2

- Battery/fuel gauge (PHEV): the centre now shows both the battery % and the fuel %.
- `card_padding: none` now makes the tiles and buttons edge to edge as well (popups keep their own margins).

## 1.0.1

- Messages are shown on the hero image (bottom or top, configurable) and stay longer (configurable).
- Pending status "Locking… / Unlocking…" instead of the stale state while waiting for the vehicle.
- Every action button can ask for confirmation (per-button switches in the settings).
- New margin options for the card (including edge-to-edge image) and for the popups.

## 1.0.0

- First public release.
- Hero photo with state variants, round control buttons, battery/fuel/temperature tiles, diagnostics, info tiles.
- Top-view and interior popups with climate picker, seat and steering-wheel heating.
- Charging status ("Charging now", current, time left), animated battery ring and charging effects on the car.
- English and Greek, following the Home Assistant language; additional languages via `dist/lang/<code>.js`.
- EV / PHEV support (`powertrain: auto | phev | ev`).
- Automatic detection of the entity prefix and of entities through the registry `translation_key`.
- Settings UI shared by all devices (saved in the card YAML).
