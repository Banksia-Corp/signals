#!/usr/bin/env bash
set -euo pipefail

# Publish packages with Changesets and provenance (OIDC Trusted Publishing)
pnpm exec changeset publish
