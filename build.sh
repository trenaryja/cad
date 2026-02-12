#!/usr/bin/env bash
set -euo pipefail

# Resolve OpenSCAD binary
if command -v openscad &>/dev/null; then
  OPENSCAD="openscad"
elif [[ -x "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD" ]]; then
  OPENSCAD="/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
else
  echo "Error: openscad not found" >&2
  exit 1
fi

build_project() {
  local dir="$1"
  local name=$(basename "$dir")

  # Find the .scad source (first non-.v* file in src/)
  local scad
  scad=$(find "$dir/src" -maxdepth 1 -name '*.scad' ! -name '*.v[0-9]*' | head -1)
  if [[ -z "$scad" ]]; then
    echo "Skip: $name (no .scad source found)"
    return
  fi

  echo "  $name.stl"
  "$OPENSCAD" -o "$dir/$name.stl" "$scad" 2>/dev/null
}

# Determine which projects to build
if [[ $# -gt 0 ]]; then
  projects=("$@")
else
  projects=()
  for dir in */src; do
    projects+=("$(dirname "$dir")")
  done
fi

cd "$(dirname "$0")"

for project in "${projects[@]}"; do
  if [[ ! -d "$project/src" ]]; then
    echo "Skip: $project (no src/ directory)"
    continue
  fi
  echo "Building $project..."
  build_project "$project"
done

echo "Done."
