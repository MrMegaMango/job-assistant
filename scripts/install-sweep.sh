#!/bin/zsh
# Installs (or refreshes) the launchd agent that runs scripts/nightly-sweep.sh hourly and at
# login, at background CPU and disk priority. Re-run after moving the repo or changing the
# Node.js installation. `launchctl bootout gui/$UID/com.high-match-job-assistant.sweep` removes it.
set -euo pipefail

REPO=${0:A:h:h}
LABEL=com.high-match-job-assistant.sweep
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/job-assistant-sweep.log"
NODE_DIR=${$(command -v node):h}

mkdir -p "${PLIST:h}" "${LOG:h}"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/zsh</string><string>$REPO/scripts/nightly-sweep.sh</string></array>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$NODE_DIR:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>StartInterval</key><integer>3600</integer>
  <key>RunAtLoad</key><true/>
  <key>ProcessType</key><string>Background</string>
  <key>LowPriorityIO</key><true/>
  <key>LowPriorityBackgroundIO</key><true/>
  <key>Nice</key><integer>10</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
PLIST
plutil -lint "$PLIST" >/dev/null
launchctl bootout "gui/$UID/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID" "$PLIST"
print -r -- "Installed $LABEL; log: $LOG"
