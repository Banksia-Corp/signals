#!/usr/bin/env bash
set -euo pipefail

# Ensure npm is updated to latest (npm 11+) to support OIDC trusted publishing
npm install -g npm@latest

# Publish packages with Changesets and provenance (OIDC Trusted Publishing)
pnpm exec changeset publish
