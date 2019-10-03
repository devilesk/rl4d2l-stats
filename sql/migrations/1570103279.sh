#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/storedprocs/give_match_reward.sql