#!/usr/bin/env bash

group=info-directory
pstPin=$(( $RANDOM % 10 + 1 ))$(( $RANDOM % 10 + 1 ))$(( $RANDOM % 10 + 1 ))$(( $RANDOM % 10 + 1 ))
pst update $group pst-pin $(echo $pstPin)
pst update $group token
pst update $group url $(pwgen 256 1)
