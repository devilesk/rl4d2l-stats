#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/migrations/1569930070.sql