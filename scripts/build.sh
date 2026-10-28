#!/usr/bin/env bash
# Concatenates src/*.js into dist/deepal-s05-card.js (single file, no dependencies).
set -euo pipefail
cd "$(dirname "$0")/.."
# Το HACS εγκαθιστά ολόκληρο το dist/ (κάρτα + lang/ + images/· το lang/ έχει τις γλώσσες εκτός από τα αγγλικά, που είναι στο src/lang_en.js και μπαίνουν στο κύριο αρχείο): αν λείπει κάτι, σταμάτα νωρίς.
test -f src/lang_en.js || { echo "missing src/lang_en.js" >&2; exit 1; }
test -f dist/lang/es.js || { echo "missing dist/lang/es.js" >&2; exit 1; }
test -d dist/images || { echo "missing dist/images" >&2; exit 1; }
# Μόνο τα αγγλικά μπαίνουν ΜΕΣΑ στο κύριο αρχείο (είναι η γλώσσα-εφεδρεία, δουλεύει πάντα). Τα ελληνικά είναι τα κλειδιά του κώδικα· τα ισπανικά και κάθε άλλη γλώσσα φορτώνουν από το lang/.
cat src/00_head.js src/02_telltales.js src/05_i18n.js src/lang_en.js src/10_data.js src/20_discover.js src/30_card.js src/40_settings.js src/50_end.js > dist/deepal-s05-card.js
node --check dist/deepal-s05-card.js
for f in dist/lang/*.js; do node --check "$f"; done
for c in blue grey silver white; do
  test -f "dist/images/car/hero_$c.jpg" || { echo "missing dist/images/car/hero_$c.jpg" >&2; exit 1; }
done
echo "built dist/deepal-s05-card.js ($(wc -c < dist/deepal-s05-card.js) bytes)"
