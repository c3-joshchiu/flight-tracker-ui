#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REACT_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$(dirname "$REACT_DIR")")"
SPEC_LOCAL="$REPO_ROOT/openapi/flights-api.yaml"
OUTPUT="$REACT_DIR/src/api.generated.ts"

API_REPO_SPEC="$REPO_ROOT/../flightTrackerApi/openapi/flights-api.yaml"

# Step 1: Mirror spec from API repo if available
if [ -f "$API_REPO_SPEC" ]; then
  if ! diff -q "$API_REPO_SPEC" "$SPEC_LOCAL" > /dev/null 2>&1; then
    echo "Mirroring updated spec from API repo..."
    cp "$API_REPO_SPEC" "$SPEC_LOCAL"
  else
    echo "Spec is already in sync with API repo."
  fi
else
  echo "Warning: API repo spec not found at $API_REPO_SPEC"
  echo "Using existing local spec."
fi

if [ ! -f "$SPEC_LOCAL" ]; then
  echo "ERROR: OpenAPI spec not found at $SPEC_LOCAL"
  exit 1
fi

# Step 2: Generate TypeScript types
echo "Generating TypeScript types from $SPEC_LOCAL ..."
npx openapi-typescript "$SPEC_LOCAL" -o "$OUTPUT"
echo "Generated $OUTPUT"

# Step 3: Type check
echo "Running type check..."
cd "$REACT_DIR"
if npx tsc --noEmit; then
  echo "Type check passed."
else
  echo ""
  echo "Type errors found. Fix them before committing."
  exit 1
fi
