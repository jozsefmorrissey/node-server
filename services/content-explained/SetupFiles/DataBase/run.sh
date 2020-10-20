#!/bin/bash

# If you want to use my bash password script. It can be found here @
# https://github.com/jozsefmorrissey/BashScripts/blob/master/confidentalInfo.sh
source ./commandParser.sh
source ./futil.sh

if [ -z "${flags[rootPassword]}" ] | [ -z "${flags[type]}" ]
then
  echo "required: user password rootPassword type"
  echo "optional: simple"
  echo "mySql: host database"
  echo "Oracle: url"
  echo "examples:"
  echo -e "\trun -type mySql -user user -password \$(call service) -host localhost -database UserService"
  echo -e "\trun -type oracle -url localhost:1521/xe -user USER_SRVC -password \$(call service)"
  exit
fi

declare -A array
array[user]=${flags[user]}
array[password]=${flags[password]}
array[host]=${flags[host]}
array[database]=${flags[database]}

mkdir -p ./sql/ 2>/dev/null
cat ./${flags[type]}/*.sql | replace -array array > ./sql/temp.sql
cat ./sql/temp.sql ./${flags[type]}/PopulateData/*.sql | replace -array array > ./sql/tempPopulate.sql

if [ "${flags[type]}" == "mySql" ]
then
  if [ "${booleans[simple]}" != "true" ]
  then
    echo -e "echo source ./sql/tempPopulate.sql | mysql -u root -p${flags[rootPassword]}"
    echo source ./sql/tempPopulate.sql | mysql -u root -p${flags[rootPassword]}
  else
    echo source ./sql/temp.sql | mysql -u root -p${flags[rootPassword]}
  fi
fi

if [ "${flags[type]}" == "Oracle" ]
then
  if [ "${booleans[simple]}" != "true" ]
  then
    echo exit | sqlplus system/${flags[rootPassword]}@${flags[url]} @./sql/tempPopulate.sql
    echo "echo exit | sqlplus system/${flags[rootPassword]}@${flags[url]} @./sql/OracleDBPopulateData.sql"
  else
    echo exit | sqlplus system/${flags[rootPassword]}@${flags[url]} @./sql/temp.sql
  fi
fi

if [ -z "${flags[d]}" ]
then
  rm ./sql/*
fi
