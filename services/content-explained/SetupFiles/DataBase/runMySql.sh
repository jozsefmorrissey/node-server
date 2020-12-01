#!/bin/bash

source ./commandParser.sh
source ./properties.sh

user=$(pst value ce-mysql user)
password=$(pst value ce-mysql password)
unset flags[password]
unset flags[user]

echo $user/$password
rootPassword=$(pst value system mysql)

propFile=./mysql.properties
echo ${booleans[test]}
if [ ${booleans[test]} ]
then
  password=$(getValue mysql.test.password $propFile)
  database=$(getValue mysql.database $propFile)
  host=$(getValue mysql.host $propFile)
  user=$(getValue mysql.test.user $propFile)
else
  host=$(getValue mysql.host $propFile)
  database=$(getValue mysql.database $propFile)
fi

echo -e "user $user\npassword $password\ndatabase $database"
./run.sh -type mySql -host $host -database $database -user $user \
          -password $password -rootPassword $rootPassword  $(boolStr) $(flagStr)
