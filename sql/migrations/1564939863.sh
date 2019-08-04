#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/storedprocs/index.sql
sql/fix_round.sh 1
sql/fix_merged_match.sh 1 1564888474 5 9
sql/fix_round.sh 1