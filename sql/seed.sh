#!/usr/bin/env bash

source .env
echo "Seeding..."
mysql -u "$DB_USER" -p"$DB_PASS" $DB_NAME < sql/seed.sql
echo "Database seeded."