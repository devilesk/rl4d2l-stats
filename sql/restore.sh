#!/usr/bin/env bash

# Usage: sql/restore.sh lfd2_test /var/lib/mysql-files/backups/2019-08-02_09:41:47/lfd2_season_3

if [ -z $1 ]; then
        echo "Database name not given."
        exit 0
fi
if [ -z $2 ]; then
        echo "Backup directory not given."
        exit 0
fi

source .env
DBNAME="$1"
BACKUP_DIR="$2"
mysql -u "$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS $DBNAME; CREATE DATABASE $DBNAME;"
echo "Created $DBNAME database."
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < $BACKUP_DIR/infected.sql
mysqlimport $DBNAME $BACKUP_DIR/infected.txt
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < $BACKUP_DIR/maps.sql
mysqlimport $DBNAME $BACKUP_DIR/maps.txt
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < $BACKUP_DIR/matchlog.sql
mysqlimport $DBNAME $BACKUP_DIR/matchlog.txt
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < $BACKUP_DIR/players.sql
mysqlimport $DBNAME $BACKUP_DIR/players.txt
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < $BACKUP_DIR/pvp_ff.sql
mysqlimport $DBNAME $BACKUP_DIR/pvp_ff.txt
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < $BACKUP_DIR/pvp_infdmg.sql
mysqlimport $DBNAME $BACKUP_DIR/pvp_infdmg.txt
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < $BACKUP_DIR/round.sql
mysqlimport $DBNAME $BACKUP_DIR/round.txt
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < $BACKUP_DIR/survivor.sql
mysqlimport $DBNAME $BACKUP_DIR/survivor.txt
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < sql/functions/index.sql
mysql -u "$DB_USER" -p"$DB_PASS" $DBNAME < sql/storedprocs/index.sql
echo "Restored $DBNAME database."