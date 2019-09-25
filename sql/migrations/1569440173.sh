#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/migrations/1569440173.sql
mysql $DB_NAME < sql/tables/team.sql
mysql $DB_NAME < sql/seed/team1.sql
mysql $DB_NAME < sql/seed/team2.sql