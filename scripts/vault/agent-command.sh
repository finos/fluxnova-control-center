#!/bin/sh

# This script is used by the vault agent to run
# tests after the vault agent has been started.

read -p "What test target do you want to run? " target
pnpm $target
