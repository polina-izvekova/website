#!/usr/bin/env bash

# sudo pacman -S perl-image-exiftool

exiftool -all= artworks/full/*.jpg

for img in artworks/full/*.jpg; do
  magick "$img" -resize x640 "artworks/thumbnails/$(basename "$img")"
done

for img in artworks/thumbnails/*.jpg; do
  identify -format '{\n  file: "%i",\n  thumbnailWidth: %w,\n  thumbnailHeight: %h\n},\n' "$img"
done


# snippets

exiftool -all= ./*.jpg
rm ./*.jpg_original

f=filename
jpegtran -rotate 90 -outfile "$f-r.jpg" "$f.jpg"
