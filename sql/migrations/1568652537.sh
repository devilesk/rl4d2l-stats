#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/storedprocs/audit.sql
mysql $DB_NAME < sql/storedprocs/fix_round.sql