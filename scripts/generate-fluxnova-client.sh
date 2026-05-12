#!/bin/bash

FLUXNOVA_VERSION="2.0.0"
OPENAPI_GENERATOR_VERSION="7.14.0"
OUTPUT_DIR="apps/server/src/fluxnova/generated"
OPENAPI_VERSIONS_DIR="node_modules/@openapitools/openapi-generator-cli/versions"

show_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --fxn-artifact-repo REPO           Artifactory repository name"
  echo "  --fxn-artifact-repo-user USERNAME  Artifactory username (required for auth)"
  echo "  --fxn-artifact-repo-token TOKEN    Artifactory authentication token (preferred over password)"
  echo "  --fxn-artifact-repo-pass PASSWORD  Artifactory password (used if no token provided)"
  echo "  --fluxnova-version VERSION         Fluxnova version (default: $FLUXNOVA_VERSION)"
  echo "  --output-dir DIR                  Output directory (default: $OUTPUT_DIR)"
  echo "  -h, --help                        Show this help message"
}

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --fxn-artifact-repo)
      ARG_FXN_ARTIFACT_REPO="$2"
      shift 2
      ;;
    --fxn-artifact-repo-token)
      ARG_FXN_ARTIFACT_REPO_TOKEN="$2"
      shift 2
      ;;
    --fxn-artifact-repo-user)
      ARG_FXN_ARTIFACT_REPO_USER="$2"
      shift 2
      ;;
    --fxn-artifact-repo-pass)
      ARG_FXN_ARTIFACT_REPO_PASS="$2"
      shift 2
      ;;
    --fluxnova-version)
      FLUXNOVA_VERSION="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Set FXN variables - prioritize arguments, then environment variables
FXN_ARTIFACT_REPO=${ARG_FXN_ARTIFACT_REPO:-$FXN_ARTIFACT_REPO}
FXN_ARTIFACT_REPO_USER=${ARG_FXN_ARTIFACT_REPO_USER:-$FXN_ARTIFACT_REPO_USER}
FXN_ARTIFACT_REPO_TOKEN=${ARG_FXN_ARTIFACT_REPO_TOKEN:-$FXN_ARTIFACT_REPO_TOKEN}
FXN_ARTIFACT_REPO_PASS=${ARG_FXN_ARTIFACT_REPO_PASS:-$FXN_ARTIFACT_REPO_PASS}

if [ -d "$OPENAPI_VERSIONS_DIR" ]; then
  echo "Cleaning up previous OpenAPI Generator versions..."
  rm -rf "$OPENAPI_VERSIONS_DIR"/*
  if [ $? -eq 0 ]; then
    echo "Successfully cleaned up $OPENAPI_VERSIONS_DIR"
  else
    echo "Warning: Failed to clean up $OPENAPI_VERSIONS_DIR"
  fi
else
  echo "OpenAPI versions directory not found at $OPENAPI_VERSIONS_DIR (this is normal for first run)"
fi

TEMP_JAR=$(mktemp -t fluxnova-openapi-XXXXXX)

if [ -n "$FXN_ARTIFACT_REPO" ]; then
  REPO_BASE="$FXN_ARTIFACT_REPO"

  if [ -n "$FXN_ARTIFACT_REPO_USER" ]; then
    if [ -n "$FXN_ARTIFACT_REPO_TOKEN" ]; then
      echo "Configuring download using custom repository with token authentication..."
      AUTH_PREFIX="${FXN_ARTIFACT_REPO_USER}:${FXN_ARTIFACT_REPO_TOKEN}@"
    elif [ -n "$FXN_ARTIFACT_REPO_PASS" ]; then
      echo "Configuring download using custom repository with password authentication..."
      AUTH_PREFIX="${FXN_ARTIFACT_REPO_USER}:${FXN_ARTIFACT_REPO_PASS}@"
    else
      echo "Warning: Username provided without token or password. No authentication will be used."
    fi
  else
    echo "Configuring download using custom repository (no authentication)..."
  fi
else
  echo "Configuring download using default Maven repository..."
  REPO_BASE="repo1.maven.org/maven2"
fi

# Execute Download
FLUXNOVA_ARTIFACT_PATH="org/finos/fluxnova/bpm/fluxnova-engine-rest-openapi/$FLUXNOVA_VERSION/fluxnova-engine-rest-openapi-$FLUXNOVA_VERSION.jar"
FULL_URL="https://${AUTH_PREFIX}${REPO_BASE}/${FLUXNOVA_ARTIFACT_PATH}"
echo "Downloading Fluxnova OpenAPI spec version $FLUXNOVA_VERSION..."
curl -s "$FULL_URL" -o "$TEMP_JAR"

if [ $? -ne 0 ] || [ ! -s "$TEMP_JAR" ]; then
  echo "Failed to download JAR file or file is empty."
  rm -f "$TEMP_JAR"
  exit 1
fi

echo "Extracting OpenAPI spec from JAR..."
unzip -p "$TEMP_JAR" "openapi.json" > fluxnova-openapi.json
if [ $? -ne 0 ]; then
  echo "Failed to extract OpenAPI spec from JAR"
  rm "$TEMP_JAR"
  exit 1
fi

echo "Removing temporary JAR file..."
rm "$TEMP_JAR"

if [ -n "$FXN_ARTIFACT_REPO" ]; then
  DOWNLOAD_URL="https://${AUTH_PREFIX}${REPO_BASE}/org/openapitools/openapi-generator-cli/\${versionName}/openapi-generator-cli-\${versionName}.jar"
  echo "Generating openapitools.json with custom repository configuration..."
  cat > openapitools.json << EOF
{
  "\$schema": "./node_modules/@openapitools/openapi-generator-cli/config.schema.json",
  "spaces": 2,
  "generator-cli": {
    "version": "$OPENAPI_GENERATOR_VERSION",
    "repository": {
      "downloadUrl": "$DOWNLOAD_URL"
    }
  }
}
EOF
else
  echo "Generating openapitools.json with default repository..."
  cat > openapitools.json << EOF
{
  "\$schema": "./node_modules/@openapitools/openapi-generator-cli/config.schema.json",
  "spaces": 2,
  "generator-cli": {
    "version": "$OPENAPI_GENERATOR_VERSION"
  }
}
EOF
fi

echo "Generating Fluxnova client..."
npx openapi-generator-cli generate \
  -i fluxnova-openapi.json \
  -g typescript-axios \
  -o "$OUTPUT_DIR" \
  --additional-properties=useSingleRequestParameter=true \
  --parameter-name-mappings configuration=config

if [ $? -ne 0 ]; then
  echo "Failed to generate Fluxnova client"
  exit 1
fi

echo "Successfully generated Fluxnova client in $OUTPUT_DIR"
