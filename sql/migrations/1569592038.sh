#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/migrations/1569592038.sql