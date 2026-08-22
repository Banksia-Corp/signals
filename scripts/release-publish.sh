#!/usr/bin/env bash
set -euo pipefail

# Publish to npm using native npm CLI with provenance (OIDC Trusted Publishing)
npx --yes npm@latest publish --access public --provenance
