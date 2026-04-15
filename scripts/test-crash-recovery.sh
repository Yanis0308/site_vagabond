#!/usr/bin/env bash
# NOTE: Les prochains scripts de test devraient être écrits en zx
# (https://github.com/google/zx) — bash en Node.js, plus simple à maintenir
# pour une équipe JS.
#
# Test the crash recovery mechanism by injecting a fake pending photo.
#
# Usage:
#   ./scripts/test-crash-recovery.sh <visitedPoiId> [ios|android]
#
# Examples:
#   ./scripts/test-crash-recovery.sh 1391          # auto-detects platform
#   ./scripts/test-crash-recovery.sh 1391 ios      # force iOS simulator
#   ./scripts/test-crash-recovery.sh 1391 android  # force Android device via adb
#
# The script injects a minimal JPEG as {visitedPoiId}.jpg into the app's
# photo-uploads/queue directory, simulating a crash that happened after POI
# validation but before the upload completed.
# Restart the app to trigger useStartupPhotoRecovery.

set -euo pipefail

BUNDLE_ID="${BUNDLE_ID:-dev.com.vagabond.explore.tourism}"
VISITED_POI_ID="${1:-}"
PLATFORM="${2:-auto}"

if [[ -z "$VISITED_POI_ID" ]]; then
  echo "Usage: $0 <visitedPoiId> [ios|android]"
  echo "  visitedPoiId  ID of an existing visited_poi row that has no imageKey yet"
  exit 1
fi

# ---------------------------------------------------------------------------
# Generate a minimal 1x1 white JPEG in a temp file
# ---------------------------------------------------------------------------
TMP_JPEG=$(mktemp /tmp/pending-upload-XXXXXX.jpg)
trap 'rm -f "$TMP_JPEG"' EXIT

python3 - "$TMP_JPEG" <<'EOF'
import sys

data = bytes([
    0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,
    0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,
    0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,0x07,0x07,0x07,0x09,
    0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
    0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,
    0x24,0x2E,0x27,0x20,0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,
    0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,0x39,0x3D,0x38,0x32,
    0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x01,
    0x00,0x01,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,
    0x01,0x05,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,
    0x09,0x0A,0x0B,0xFF,0xC4,0x00,0xB5,0x10,0x00,0x02,0x01,0x03,
    0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7D,
    0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,
    0x13,0x51,0x61,0x07,0x22,0x71,0x14,0x32,0x81,0x91,0xA1,0x08,
    0x23,0x42,0xB1,0xC1,0x15,0x52,0xD1,0xF0,0x24,0x33,0x62,0x72,
    0x82,0x09,0x0A,0x16,0x17,0x18,0x19,0x1A,0x25,0x26,0x27,0x28,
    0x29,0x2A,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x43,0x44,0x45,
    0x46,0x47,0x48,0x49,0x4A,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
    0x5A,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x73,0x74,0x75,
    0x76,0x77,0x78,0x79,0x7A,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
    0x8A,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9A,0xA2,0xA3,
    0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xB2,0xB3,0xB4,0xB5,0xB6,
    0xB7,0xB8,0xB9,0xBA,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,
    0xCA,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xE1,0xE2,
    0xE3,0xE4,0xE5,0xE6,0xE7,0xE8,0xE9,0xEA,0xF1,0xF2,0xF3,0xF4,
    0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFF,0xDA,0x00,0x08,0x01,0x01,
    0x00,0x00,0x3F,0x00,0xFB,0xD3,0xFF,0xD9
])
with open(sys.argv[1], 'wb') as f:
    f.write(data)
EOF

# ---------------------------------------------------------------------------
# Auto-detect platform
# ---------------------------------------------------------------------------
if [[ "$PLATFORM" == "auto" ]]; then
  if adb devices 2>/dev/null | grep -q "device$"; then
    PLATFORM="android"
  else
    PLATFORM="ios"
  fi
  echo "ℹ️  Auto-detected platform: $PLATFORM"
fi

# ---------------------------------------------------------------------------
# iOS simulator
# ---------------------------------------------------------------------------
inject_ios() {
  APP_DATA_DIR=$(xcrun simctl get_app_container booted "$BUNDLE_ID" data 2>/dev/null || true)

  if [[ -z "$APP_DATA_DIR" ]]; then
    echo "❌  Could not find app container for bundle '$BUNDLE_ID' on the booted simulator."
    echo "   Make sure the simulator is running and the app is installed."
    echo "   Override with: BUNDLE_ID=your.bundle.id $0 <visitedPoiId>"
    exit 1
  fi

  QUEUE_DIR="$APP_DATA_DIR/Documents/photo-uploads/queue"
  mkdir -p "$QUEUE_DIR"
  cp "$TMP_JPEG" "$QUEUE_DIR/${VISITED_POI_ID}.jpg"

  echo "✅  Injected into iOS simulator:"
  echo "   $QUEUE_DIR/${VISITED_POI_ID}.jpg"
  echo ""
  echo "Next steps:"
  echo "  1. Force-quit the app (Cmd+Shift+H twice, then swipe up)"
  echo "  2. Relaunch the app"
  echo "  3. Watch for [crashRecovery] logs in the console"
}

# ---------------------------------------------------------------------------
# Android device via adb
# ---------------------------------------------------------------------------
inject_android() {
  if ! command -v adb &>/dev/null; then
    echo "❌  adb not found. Install Android SDK Platform Tools and add to PATH."
    exit 1
  fi

  DEVICE=$(adb devices | grep "device$" | head -1 | cut -f1)
  if [[ -z "$DEVICE" ]]; then
    echo "❌  No Android device connected. Run 'adb devices' to check."
    exit 1
  fi
  echo "ℹ️  Using device: $DEVICE"

  # Push to a world-readable temp location first
  adb -s "$DEVICE" push "$TMP_JPEG" /data/local/tmp/pending-upload.jpg >/dev/null

  # Use run-as to copy into the app's private files dir (requires debug build).
  # All commands are grouped under sh -c so they run as the app user, not the outer shell.
  adb -s "$DEVICE" shell "run-as $BUNDLE_ID sh -c 'mkdir -p files/photo-uploads/queue && cp /data/local/tmp/pending-upload.jpg files/photo-uploads/queue/${VISITED_POI_ID}.jpg && echo OK'" | grep -q "OK" || {
    echo "❌  run-as failed. Make sure:"
    echo "   - The app is a debug/development build (Expo dev client)"
    echo "   - USB debugging is enabled on the device"
    echo "   - Bundle ID matches: $BUNDLE_ID"
    echo "   Override with: BUNDLE_ID=your.bundle.id $0 <visitedPoiId> android"
    exit 1
  }

  echo "✅  Injected into Android device ($DEVICE):"
  echo "   /data/data/$BUNDLE_ID/files/photo-uploads/queue/${VISITED_POI_ID}.jpg"
  echo ""
  echo "Next steps:"
  echo "  1. Force-quit the app on the device"
  echo "  2. Relaunch the app"
  echo "  3. Watch for [crashRecovery] logs in the Expo console"
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
case "$PLATFORM" in
  ios)     inject_ios ;;
  android) inject_android ;;
  *)
    echo "❌  Unknown platform '$PLATFORM'. Use 'ios' or 'android'."
    exit 1
    ;;
esac
