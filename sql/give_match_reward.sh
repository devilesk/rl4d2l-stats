#!/usr/bin/env bash

# Usage: sql/give_match_reward.sh 0|1 <matchid> <amount> <startingamount>

if [ -z $1 ]; then
        echo "Mode not given."
        exit 0
fi

if [[ $1 != 0 && $1 != 1 ]]; then
        echo "Invalid mode value. Must be 0 or 1."
        exit 0
fi

if [ -z $2 ]; then
        echo "Match ID missing."
        exit 0
fi

if [ -z $3 ]; then
        echo "Amount missing."
        exit 0
fi

if [ -z $4 ]; then
        echo "Starting amount missing."
        exit 0
fi

source .env
echo $DB_NAME
mysql -u "$DB_USER" -p"$DB_PASS" $DB_NAME -e "call give_match_reward($1,$2,$3,$4)"
