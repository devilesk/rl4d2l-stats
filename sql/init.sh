#!/usr/bin/env bash

source .env
echo "Creating $DB_NAME database..."
mysql -u "$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME;"
echo "Creating tables..."
mysql -u "$DB_USER" -p"$DB_PASS" $DB_NAME < seed/init.sql
echo "Database created."