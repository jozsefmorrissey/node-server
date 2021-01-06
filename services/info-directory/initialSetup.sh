#!/usr/bin/env bash

group=info-directory
pstPin=$(( $RANDOM % 10 + 1 ))$(( $RANDOM % 10 + 1 ))$(( $RANDOM % 10 + 1 ))$(( $RANDOM % 10 + 1 ))

dataDir=~/.opsc/info-directory/ && mkdir -p "$dataDir"

echo '[{"Title": "", "Description": "", "Link" "id": 0}]' > "$dataDir/info-directory.json"
echo '{"Introduction": {"votes": 0}}' > "$dataDir/requested-topics.json"

pst update $group pst-pin $(echo $pstPin)
pst update $group token
pst update $group url $(pwgen 512 1)
