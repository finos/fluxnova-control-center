#!/usr/bin/env bash

set -euo pipefail
umask 077

# Unified certificate configuration for both Keycloak and Control Center
domain="localhost"
certName="fluxnova-local"
sans="DNS:localhost,DNS:host.docker.internal,DNS:keycloak,IP:127.0.0.1"
locality="Burlingame"
org="FINOS"
state="CA"
country="US"
outDir="."
certPath="docker/certs"

# Parse arguments
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
      cat << EOF
Usage: $0 [--outDir <path>]

Generates a unified self-signed certificate for both Keycloak and Control Center.

Options:
  --outDir <path>    Root output directory (default: .)

Certificate Details:
  - Common Name: localhost
  - Output filename: fluxnova-local
  - Subject Alternative Names: DNS:localhost, DNS:host.docker.internal, DNS:keycloak, IP:127.0.0.1
  - Output path: <outDir>/docker/certs/

EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run with --help for usage information."
      exit 1
      ;;
  esac
done

fullPath="$outDir/$certPath"

echo "Generating unified certificate for both Keycloak and Control Center..."
echo "Output path: $fullPath/$certName.{crt,key}"
echo ""

mkdir -p "$fullPath"
openssl version

# Generate private key and self-signed certificate with SANs in one step
echo "Generating private key and self-signed certificate..."
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$fullPath/$certName.key" \
  -out "$fullPath/$certName.crt" \
  -days 365 \
  -subj "/C=$country/ST=$state/L=$locality/O=$org/OU=./CN=$domain" \
  -addext "subjectAltName=$sans"


echo ""
echo "✅ Certificate generated successfully!"
echo "   Key:  $fullPath/$certName.key"
echo "   Cert: $fullPath/$certName.crt"
echo ""
echo "To view certificate details:"
echo "  openssl x509 -in $fullPath/$certName.crt -text -noout"
