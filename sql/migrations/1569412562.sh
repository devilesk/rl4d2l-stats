#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/migrations/1569412562.sql