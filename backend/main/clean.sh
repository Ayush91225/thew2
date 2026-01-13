#!/bin/bash
# Clean all serverless deployment artifacts
rm -rf .serverless*
find . -maxdepth 2 -name "*cloudformation*" -type f -delete
find . -maxdepth 2 -name "*template*" -type f -delete
echo "Cleaned deployment artifacts"