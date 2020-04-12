#!/bin/bash
find $1 -name '*.jpg' -exec cwebp -q 80 {} -o {}".webp" \;
find $1 -name '*.png' -exec cwebp -q 80 {} -o {}".webp" \;