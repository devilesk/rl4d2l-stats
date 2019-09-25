#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/tables/team.sql
mysql $DB_NAME < sql/tables/leaguematchlog.sql
mysql $DB_NAME < sql/storedprocs/index.sql
mysql $DB_NAME < sql/seed/team1.sql
mysql $DB_NAME < sql/seed/team2.sql
mysql $DB_NAME < sql/seed/leaguematchlog1.sql
mysql $DB_NAME < sql/seed/leaguematchlog2.sql