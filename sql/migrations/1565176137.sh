#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/migrations/1565176137.sql