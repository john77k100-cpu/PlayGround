#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT

run_timed() {
  printf '[timing]'
  printf ' %q' "$@"
  printf '\n'
  /usr/bin/time -p "$@"
}

run_timed npm ci --no-audit --no-fund
run_timed npm run build

metadata_dir="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
run_timed mkdir -p "$metadata_dir"
METADATA_DIR="$metadata_dir" run_timed node -e 'const fs=require("node:fs"); const path=require("node:path"); const project=process.cwd(); const directory=path.join(project,"dist"); fs.writeFileSync(path.join(process.env.METADATA_DIR,"deployment-output.json"),JSON.stringify({project,directory}));'

run_timed npm run preview -- --host 0.0.0.0 --port "$PORT" --strictPort
