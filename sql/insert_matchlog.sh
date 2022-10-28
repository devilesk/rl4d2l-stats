#!/usr/bin/env bash

# Usage: sql/insert_matchlog.sh 0|1 <matchid>

if [ -z $1 ]; then
        echo "Mode not given."
        exit 0
fi

if [[ $1 != 0 && $1 != 1 ]]; then
        echo "Invalid mode value. Must be 0 or 1."
        exit 0
fi

if [ -z $2 ]; then
        echo "Match ID."
        exit 0
fi

source .env
echo $DB_NAME
mysql -u "$DB_USER" -p"$DB_PASS" $DB_NAME -e "call insert_matchlog($1,$2)"
