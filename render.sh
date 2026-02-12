#!/usr/bin/env bash
set -euo pipefail

# Standard orthographic views: name, rotx, roty, rotz
# Composite layout (2x2): isometric | front
#                          top       | right
VIEWS=(
  "isometric 35.26 0 45"
  "front     90    0 0"
  "top       0     0 0"
  "right     90    0 90"
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

  # Stitch into 2x2 composite
  magick montage "${tiles[@]}" \
    -tile 2x2 -geometry 1024x1024+0+0 \
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
