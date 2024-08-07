#!/bin/bash -xe

mkdir -p ./zkeys

URL=https://maci-develop-fra.s3.eu-central-1.amazonaws.com/v2.0.0/maci_artifacts_10-2-1-2_test.tar.gz
DIR_NAME="maci_keys.tar.gz"
OUT_DIR=./

echo "downloading $URL"
curl $URL -o "$OUT_DIR/$DIR_NAME"
tar -xvf "$OUT_DIR/$DIR_NAME" -C "$OUT_DIR"
rm "$OUT_DIR/$DIR_NAME"
