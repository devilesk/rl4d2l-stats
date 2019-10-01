#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/storedprocs/set_derived_columns.sql
mysql $DB_NAME < sql/migrations/1569930070.sql