#!/usr/bin/env bash
# Writes public/content/card-set.json from the shipped defaults.
#
# Seeds the shared file so a fresh clone has something to read. Day to day the
# file is replaced by an export from the editor — running this again would
# discard whatever has been published.
set -euo pipefail
cd "$(dirname "$0")/.."
npx esbuild src/rules/defaults.ts --bundle --format=esm --platform=node \
  --outfile=node_modules/.cache/defaults.mjs --log-level=error
mkdir -p public/content
node --input-type=module -e "
import { defaultSet } from './node_modules/.cache/defaults.mjs'
import { writeFileSync } from 'node:fs'
writeFileSync('public/content/card-set.json', JSON.stringify(defaultSet, null, 2) + '\n')
"
echo "Wrote public/content/card-set.json"
