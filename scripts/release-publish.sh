#!/usr/bin/env bash
set -euo pipefail

# Publish to npm using native npm CLI with provenance (OIDC Trusted Publishing)
npm publish --access public --provenance
