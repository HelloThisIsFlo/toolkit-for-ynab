#!/bin/bash
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "$DIR"

git fetch upstream/main
git merge upstream/main --strategy-option theirs


cd - >/dev/null
