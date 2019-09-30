#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/storedprocs/index.sql