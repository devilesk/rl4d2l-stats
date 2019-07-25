#!/usr/bin/env bash

echo "Creating and seeding test database..."
mysql < seed/init.sql
mysql < seed/seed.sql
echo "Creating public/data dir..."
rm -rf public/data
mkdir -p public/data/matches
mkdir -p public/data/players
mkdir -p public/data/league
echo "Done."