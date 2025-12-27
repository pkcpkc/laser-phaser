#!/bin/bash

# Convert all HEIC files in the current directory to JPEG
for f in *.heic; do
  sips -s format jpeg "$f" --out "${f%.heic}.jpeg" && rm "$f"
done