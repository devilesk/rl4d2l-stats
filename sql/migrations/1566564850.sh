#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/storedprocs/delete_unfinished.sql