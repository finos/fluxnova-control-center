#!/bin/sh
env | grep NO_PROXY
echo "Adding HOST_IP ($HOST_IP) to NO_PROXY and setting OTEL_EXPORTER_OTLP_ENDPOINT"
export no_proxy=$no_proxy,$HOST_IP
export NO_PROXY=$no_proxy
export OTEL_EXPORTER_OTLP_ENDPOINT="http://$HOST_IP:4318"
env | grep NO_PROXY
env | grep OTEL_EXPORTER_OTLP_ENDPOINT

if [ "$FXN_OTEL_ENABLED" = "true" ]; then
  node --require /app/server/otel-register.js /app/server/main.js
else
  node /app/server/main.js
fi
