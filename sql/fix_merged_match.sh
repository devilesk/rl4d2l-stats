#!/usr/bin/env bash

# Usage: sql/fix_merged_match.sh 0|1 <matchid> <roundstart> <roundend>

if [ -z $1 ]; then
        echo "Mode not given."
        exit 0
fi

if [[ $1 != 0 && $1 != 1 ]]; then
        echo "Invalid mode value. Must be 0 or 1."
        exit 0
fi

if [ -z $2 ]; then
        echo "Match ID not given."
        exit 0
fi

if [ -z $3 ]; then
        echo "Round start not given."
        exit 0
fi

if [ -z $4 ]; then
        echo "Round end not given."
        exit 0
fi

source .env
echo $DB_NAME
mysql -u "$DB_USER" -p"$DB_PASS" $DB_NAME -e "call fix_merged_match($1,$2,$3,$4)"
