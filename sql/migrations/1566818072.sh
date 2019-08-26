#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/tables/season.sql
mysql $DB_NAME < sql/seed/season.sql