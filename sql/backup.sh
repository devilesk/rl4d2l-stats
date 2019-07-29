#!/bin/bash

echo 'Backing up databases...'

CURRDATE=$(date +"%F_%T")

mkdir -p /var/lib/mysql-files/backups/$CURRDATE/lfd2_season_2
mkdir -p /var/lib/mysql-files/backups/$CURRDATE/lfd2_season_3

chmod -R 777 /var/lib/mysql-files/backups/$CURRDATE/

mysqldump --tab /var/lib/mysql-files/backups/$CURRDATE/lfd2_season_2 lfd2_season_2
mysqldump --tab /var/lib/mysql-files/backups/$CURRDATE/lfd2_season_3 lfd2_season_3

echo 'Deleting old backups...'

find /var/lib/mysql-files/backups/* -type d -ctime +14 | xargs rm -rf

echo 'Done.'
