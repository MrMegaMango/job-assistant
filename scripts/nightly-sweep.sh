#!/bin/zsh
# Runs the nightly source sync on this Mac and publishes the jobs snapshot the hosted preview
# loads on a cold start (see src/lib/server/jobs-snapshot.ts). The launchd agent from scripts/install-sweep.sh runs it
# hourly and at login at background priority. It sweeps only when the published results are
# stale, and while they are less than FORCE_HOURS old it waits for AC power, no Low Power Mode
# and a light system load. `--force` runs immediately; `--publish-only` republishes the last
# snapshot without sweeping.
set -euo pipefail

REPO=${0:A:h:h}
DATA_DIR="$HOME/Library/Application Support/Job Assistant Sweep"
SITE_DIR="$DATA_DIR/site"
STATE_FILE="$DATA_DIR/last-published"
LOCK_DIR="$DATA_DIR/lock"
STALE_HOURS=20
FORCE_HOURS=36
MAX_LOAD_SHARE=0.7
DATA_PROJECT=job-assistant-data
SCOPE=zuos-projects

log() { print -r -- "$(date '+%Y-%m-%d %H:%M:%S') $*" }

mkdir -p "$SITE_DIR"
force=0
publish_only=0
[[ ${1:-} == --force ]] && force=1
[[ ${1:-} == --publish-only ]] && force=1 && publish_only=1
now=$(date +%s)
last=$(cat "$STATE_FILE" 2>/dev/null || print 0)
age=$(( now - last ))

# Most hourly checks find fresh results and exit silently.
(( force || age >= STALE_HOURS * 3600 )) || exit 0

if (( !force && age < FORCE_HOURS * 3600 )); then
  if ! pmset -g batt | grep -q "AC Power"; then
    log "Waiting: running on battery."
    exit 0
  fi
  if pmset -g | grep -Eq "lowpowermode[[:space:]]+1"; then
    log "Waiting: Low Power Mode is on."
    exit 0
  fi
  cores=$(sysctl -n hw.ncpu)
  load=$(sysctl -n vm.loadavg | awk '{print $2}')
  if (( load > cores * MAX_LOAD_SHARE )); then
    log "Waiting: system load $load on $cores cores."
    exit 0
  fi
fi

# One sweep at a time; a lock older than three hours belongs to a sweep that died.
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  if [[ -n $(find "$LOCK_DIR" -maxdepth 0 -mmin +180 2>/dev/null) ]]; then
    rmdir "$LOCK_DIR" && mkdir "$LOCK_DIR"
  else
    exit 0
  fi
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null' EXIT

if (( !publish_only )); then
  log "Sweep starting (results $(( age / 3600 ))h old)."
  cd "$REPO"
  node scripts/sweep.mjs "$DATA_DIR"
fi
[[ -f "$SITE_DIR/jobs.json" ]] || { log "No snapshot to publish."; exit 1; }

cat > "$SITE_DIR/vercel.json" <<'JSON'
{
  "headers": [
    {
      "source": "/jobs.json",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" }
      ]
    }
  ]
}
JSON
# Publish only the snapshot and its headers, never link tokens or stray files.
print -rl -- '*' '!jobs.json' '!vercel.json' > "$SITE_DIR/.vercelignore"

# The CLI reads vercel.json from the working directory, so publish from inside the site folder.
cd "$SITE_DIR"
if [[ ! -f .vercel/project.json ]]; then
  npx --yes vercel project inspect "$DATA_PROJECT" --scope "$SCOPE" >/dev/null 2>&1 ||
    npx --yes vercel project add "$DATA_PROJECT" --scope "$SCOPE"
  npx --yes vercel link --yes --project "$DATA_PROJECT" --scope "$SCOPE"
fi
rm -f .env.local .env
npx --yes vercel deploy --prod --yes --scope "$SCOPE" >/dev/null
print -r -- "$now" > "$STATE_FILE"
log "Published https://$DATA_PROJECT.vercel.app/jobs.json"
