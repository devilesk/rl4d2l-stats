#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/migrations/1565052790.sql