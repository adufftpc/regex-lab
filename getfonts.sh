#!/usr/bin/env bash

# ─────────────────────────────────────────────────────────────
# RegexLab — font downloader
# Run this once from the regexlab/ directory:
#   chmod +x get-fonts.sh && ./get-fonts.sh
#
# Downloads JetBrains Mono and Syne from Google Fonts CDN
# into ./fonts/ so the app works fully offline afterwards.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

FONTS_DIR="$(cd "$(dirname "$0")" && pwd)/fonts"
mkdir -p "$FONTS_DIR"

UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 \
(KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# ── Helper: download one woff2 file ──────────────────────────
fetch() {
  local url="$1"
  local dest="$2"
  echo "  ↓ $(basename "$dest")"
  curl -fsSL -A "$UA" "$url" -o "$dest"
}

echo ""
echo "RegexLab font downloader"
echo "========================"
echo "Saving to: $FONTS_DIR"
echo ""

# ── Step 1: ask Google Fonts for the woff2 CSS ───────────────
#   Using a modern UA so Google returns woff2 (not ttf/woff).
echo "Fetching font manifests from Google Fonts…"

JB_CSS=$(curl -fsSL -A "$UA" \
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap")

SYNE_CSS=$(curl -fsSL -A "$UA" \
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&display=swap")

# ── Step 2: extract woff2 URLs and map to local filenames ─────
#   Google's CSS returns @font-face blocks; we pull the src URL
#   and the font-weight for each block, then name the file
#   accordingly.

parse_and_download() {
  local css="$1"
  local family="$2"

  # Extract lines like:  src: url(https://...woff2) format('woff2');
  # and the weight line directly above them.
  local weight=""
  while IFS= read -r line; do
#    echo "line: $line"
    if [[ "$line" =~ font-weight:[[:space:]]*([0-9]+) ]]; then
      weight="${BASH_REMATCH[1]}"
      echo "weight: $weight"
    fi
    if [[ "$line" =~ url\((https://.*\.woff2)\) ]]; then
      local url="${BASH_REMATCH[1]}"
      echo "url: $url"
      # Map numeric weight to a name suffix
      case "$weight" in
        400) suffix="Regular"  ;;
        500) suffix="Medium"   ;;
        600) suffix="SemiBold" ;;
        700) suffix="Bold"     ;;
        *)   suffix="W${weight}" ;;
      esac
      fetch "$url" "$FONTS_DIR/${family}-${suffix}.woff2"
    fi
  done <<< "$css"
}

echo ""
echo "Downloading JetBrains Mono…"
parse_and_download "$JB_CSS" "JetBrainsMono"

echo ""
echo "Downloading Syne…"
parse_and_download "$SYNE_CSS" "Syne"

echo ""
echo "Done! Files in $FONTS_DIR:"
ls -lh "$FONTS_DIR"
echo ""
echo "Open index.html in your browser — no internet needed."