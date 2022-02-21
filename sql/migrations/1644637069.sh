#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/migrations/1644637069.sql
