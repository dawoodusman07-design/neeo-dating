#!/usr/bin/env bash
# Runs the RLS isolation tests against a throwaway local Postgres (no Docker).
# Usage: supabase/tests/run-rls-tests.sh   (requires Postgres 15+ binaries on PATH or in /usr/lib/postgresql/*/bin)
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PGBIN:$PATH"
tmp="$(mktemp -d)"
port=${PGPORT_TEST:-55432}
runas=()
if [ "$(id -u)" = "0" ]; then chown -R postgres "$tmp"; runas=(sudo -u postgres env "PATH=$PATH"); fi
"${runas[@]}" initdb -D "$tmp/data" -U postgres -A trust >/dev/null
"${runas[@]}" pg_ctl -D "$tmp/data" -o "-p $port -k $tmp" -l "$tmp/log" start >/dev/null
trap '"${runas[@]}" pg_ctl -D "$tmp/data" stop -m immediate >/dev/null; rm -rf "$tmp"' EXIT
psql=(psql -h "$tmp" -p "$port" -U postgres -v ON_ERROR_STOP=1 -q)
"${psql[@]}" -c 'create database neeo_test' >/dev/null
"${psql[@]}" -d neeo_test -f "$here/supabase_shim.sql" >/dev/null
for f in "$here"/../migrations/*.sql; do "${psql[@]}" -d neeo_test -f "$f" >/dev/null; done
"${psql[@]}" -d neeo_test -tA -f "$here/rls.test.sql" 2>&1 | grep -vE "^\s*$" | sed -E "s/^psql:[^ ]+ NOTICE:  //"
