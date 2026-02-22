#!/usr/bin/env bash
set -euo pipefail

# 9 views in 3x3 grid: 3 tetrahedral isometrics + 6 orthographic
# Isometric angles use tetrahedral vertices (109.47° apart) for
# maximum angular spread, covering all 6 faces with minimum overlap.
#
# Layout (3x3):  iso-A (top+front+left) | front  | iso-B (top+back+right)
#                left                   | top    | right
#                iso-C (bot+front+right)| bottom | back
VIEWS=(
  "front   90    0 0"
  "back    90    0 180"
  "iso-A   54.74 0 315"
  "bottom  180   0 0"
  "top     0     0 0"
  "iso-B   54.74 0 135"
  "left    90    0 270"
  "right   90    0 90"
  "iso-C   125.26 0 45"
)

IMGSIZE="1024,1024"
COLORSCHEME="Starnight"

# Resolve OpenSCAD binary
if command -v openscad &>/dev/null; then
  OPENSCAD="openscad"
elif [[ -x "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD" ]]; then
  OPENSCAD="/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
else
  echo "Error: openscad not found" >&2
  exit 1
fi

render_project() {
  local dir="$1"
  local name=$(basename "$dir")

  # Find the .scad source (first non-.v* file in src/)
  local scad
  scad=$(find "$dir/src" -maxdepth 1 -name '*.scad' ! -name '*.v[0-9]*' | head -1)
  if [[ -z "$scad" ]]; then
    echo "Skip: $name (no .scad source found)"
    return
  fi

  local tmpdir
  tmpdir=$(mktemp -d)

  # Render each view to a temp file
  local tiles=()
  for view in "${VIEWS[@]}"; do
    read -r vname rx ry rz <<< "$view"
    local tmp="$tmpdir/${vname}.png"
    echo "  $name/$vname"
    "$OPENSCAD" --preview --projection=ortho \
      --imgsize="$IMGSIZE" --viewall --autocenter \
      --colorscheme="$COLORSCHEME" \
      --camera="0,0,0,$rx,$ry,$rz,0" \
      -o "$tmp" "$scad" 2>/dev/null
    tiles+=("$tmp")
  done

  # Stitch into 3x3 composite
  magick montage "${tiles[@]}" \
    -tile 3x3 -geometry 1024x1024+0+0 \
    "$dir/render.png" 2>/dev/null

  rm -rf "$tmpdir"
}

# Determine which projects to render
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
  echo "Rendering $project..."
  render_project "$project"
done

echo "Done."
