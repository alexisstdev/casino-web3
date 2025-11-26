#!/bin/bash
# Genera iconos PWA desde un SVG base
# Requiere: imagemagick (brew install imagemagick / apt install imagemagick)

SVG_SOURCE="favicon.svg"
OUTPUT_DIR="."

# Crear SVG base si no existe
if [ ! -f "$SVG_SOURCE" ]; then
cat > "$SVG_SOURCE" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#1a1625"/>
  <circle cx="256" cy="256" r="180" fill="#0f0c18" stroke="#a855f7" stroke-width="8"/>
  <text x="256" y="300" font-size="180" text-anchor="middle" fill="#a855f7">🎰</text>
</svg>
EOF
fi

# Iconos estándar
convert -background none -density 300 "$SVG_SOURCE" -resize 16x16 "$OUTPUT_DIR/icon-16.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 32x32 "$OUTPUT_DIR/icon-32.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 192x192 "$OUTPUT_DIR/icon-192.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 512x512 "$OUTPUT_DIR/icon-512.png"

# iOS Apple Touch Icons
convert -background none -density 300 "$SVG_SOURCE" -resize 180x180 "$OUTPUT_DIR/apple-touch-icon.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 152x152 "$OUTPUT_DIR/apple-touch-icon-152.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 167x167 "$OUTPUT_DIR/apple-touch-icon-167.png"
convert -background none -density 300 "$SVG_SOURCE" -resize 180x180 "$OUTPUT_DIR/apple-touch-icon-180.png"

echo "✅ Iconos generados!"
ls -la *.png