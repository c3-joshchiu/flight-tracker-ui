#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REACT_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$(dirname "$REACT_DIR")")"
SPEC="$REPO_ROOT/openapi/flights-api.yaml"
OUTPUT="$REACT_DIR/src/api.generated.ts"

if [ ! -f "$SPEC" ]; then
  echo "ERROR: OpenAPI spec not found at $SPEC"
  echo "Make sure openapi/flights-api.yaml exists (copy from flight-tracker-api repo)"
  exit 1
fi

echo "Generating TypeScript types from $SPEC ..."
npx openapi-typescript "$SPEC" -o "$OUTPUT"
echo "Generated $OUTPUT"
