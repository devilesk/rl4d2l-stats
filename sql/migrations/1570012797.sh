#!/usr/bin/env bash

source .env
mysql $DB_NAME < sql/tables/bet.sql
mysql $DB_NAME < sql/tables/wager.sql
mysql $DB_NAME < sql/tables/bankroll.sql
mysql $DB_NAME < sql/tables/transaction.sql
mysql $DB_NAME < sql/seed/bankroll.sql
mysql $DB_NAME < sql/seed/bet.sql
mysql $DB_NAME < sql/seed/wager.sql
mysql $DB_NAME < sql/seed/transaction1.sql
mysql $DB_NAME < sql/seed/transaction2.sql
mysql $DB_NAME < sql/seed/transaction3.sql
mysql $DB_NAME < sql/seed/transaction4.sql
mysql $DB_NAME < sql/seed/transaction5.sql