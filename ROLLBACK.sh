#!/bin/sh
set -eu
target="${1:-rollback-copy.js}"
git show HEAD^:server/src/index.js > "$target"
node --check "$target"
printf '%s\n' "restored $target from HEAD^ source"
