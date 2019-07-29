#!/bin/bash

# Usage: sql/restore.sh lfd2_test2 /var/lib/mysql-files/backups/2019-07-29_07:47:04/lfd2_season_3

if [ -z $1 ]; then
        echo "Database name not given."
        exit 0
fi
if [ -z $2 ]; then
        echo "Backup directory not given."
        exit 0
fi

DBNAME="$1"
BACKUP_DIR="$2"
mysql -e "DROP DATABASE IF EXISTS $DBNAME; CREATE DATABASE $DBNAME;"
mysql $DBNAME < $BACKUP_DIR/infected.sql
mysqlimport $DBNAME $BACKUP_DIR/infected.txt
mysql $DBNAME < $BACKUP_DIR/maps.sql
mysqlimport $DBNAME $BACKUP_DIR/maps.txt
mysql $DBNAME < $BACKUP_DIR/matchlog.sql
mysqlimport $DBNAME $BACKUP_DIR/matchlog.txt
mysql $DBNAME < $BACKUP_DIR/players.sql
mysqlimport $DBNAME $BACKUP_DIR/players.txt
mysql $DBNAME < $BACKUP_DIR/pvp_ff.sql
mysqlimport $DBNAME $BACKUP_DIR/pvp_ff.txt
mysql $DBNAME < $BACKUP_DIR/pvp_infdmg.sql
mysqlimport $DBNAME $BACKUP_DIR/pvp_infdmg.txt
mysql $DBNAME < $BACKUP_DIR/round.sql
mysqlimport $DBNAME $BACKUP_DIR/round.txt
mysql $DBNAME < $BACKUP_DIR/survivor.sql
mysqlimport $DBNAME $BACKUP_DIR/survivor.txt