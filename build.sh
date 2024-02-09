#!/usr/bin/env bash

exiftool -all= artworks/full/*

# https://imagemagick.org/script/escape.php

echo "## thumbnails"
identify -format '<img src="%i" data-pycs-width="%w" data-pycs-height="%h" class="picture"\n' artworks/thumbnails/*

convert "artworks/full/*.jpg[x640]" -set filename:base "%[basename]" "artworks/thumbnails/%[filename:base].jpg"

# python -m http.server
