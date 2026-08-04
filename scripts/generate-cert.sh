#!/usr/bin/env bash

set -euo pipefail
umask 077

certPath="apps/server/cert"
domain="fluxnova.finos.local"
locality="Burlingame"
org="FINOS"
outDir="."

# Parse named arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --outDir)
      if [[ -z "${2:-}" || "${2:0:2}" == "--" ]]; then
        echo "Error: --outDir requires a value." >&2
        exit 1
      fi
      outDir="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--outDir <path>]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--outDir <path>]"
      exit 1
      ;;
  esac
done

echo "Using path: $outDir/$certPath"
mkdir -p "$outDir/$certPath"
openssl version
# Generate unencrypted private key
echo "Generating unencrypted private key..."
openssl genrsa -out "$outDir/$certPath/$domain.key" 2048
# Generate CSR
echo "Generating certificate signing request..."
openssl req -new -key "$outDir/$certPath/$domain.key" -out "$outDir/$certPath/$domain.csr" -subj "/C=US/ST=CA/L=$locality/O=$org/OU=./CN=$domain"
# Generate self-signed certificate
echo "Generating self-signed certificate..."
openssl x509 -req -in "$outDir/$certPath/$domain.csr" -signkey "$outDir/$certPath/$domain.key" -out "$outDir/$certPath/$domain.crt"
