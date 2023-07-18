#!/bin/bash
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "$DIR"
# Make sure first argument is given
if [ $# -eq 0 ]; then
    echo "Please provide a version tag to update to:"
    echo ""
    echo "    ./UPDATE_TO_VERSION_TAG.sh v3.7.1"
    echo ""
    exit 1
fi

tag=$1

git fetch --tags upstream "$tag"
git merge $tag --strategy-option theirs


cd - >/dev/null
