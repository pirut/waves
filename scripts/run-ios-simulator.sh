#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
SIMULATOR_NAME="${IOS_SIMULATOR_NAME:-iPhone 17 Pro}"
DERIVED_DATA_PATH="${IOS_DERIVED_DATA_PATH:-${TMPDIR:-/tmp}/waves-ios-build}"
APP_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/MakeWaves.app"
BUNDLE_ID="com.anonymous.make-waves"
METRO_PORT="${RCT_METRO_PORT:-8081}"

if ! xcrun simctl list devices available | grep -Fq "$SIMULATOR_NAME"; then
  echo "Simulator '$SIMULATOR_NAME' is not available." >&2
  exit 1
fi

open -a Simulator
xcrun simctl boot "$SIMULATOR_NAME" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$SIMULATOR_NAME" -b

if ! lsof -iTCP:"$METRO_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Starting Metro on port $METRO_PORT..."
  (
    cd "$ROOT_DIR"
    npx expo start --dev-client --port "$METRO_PORT"
  ) >/tmp/waves-expo-ios.log 2>&1 &
fi

cd "$ROOT_DIR/ios"
xcodebuild \
  -workspace MakeWaves.xcworkspace \
  -scheme MakeWaves \
  -configuration Debug \
  -destination "platform=iOS Simulator,name=$SIMULATOR_NAME" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  build

xcrun simctl install booted "$APP_PATH"
xcrun simctl launch booted "$BUNDLE_ID"
