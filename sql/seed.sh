#!/usr/bin/env bash

source .env
echo "Seeding..."
mysql -u "$DB_USER" -p"$DB_PASS" $DB_NAME < seed/seed.sql
echo "Database seeded."