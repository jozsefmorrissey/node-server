#!/bin/bash

# All functions will deal with the same following properties
#   @$1 - String Id
#   @$2 - Property Key
passServRelDir=$(dirname "${BASH_SOURCE[0]}")
source ${passServRelDir}/BashScripts/debugLogger.sh

dataDir=~/.opsc/pssst
infoDir=$dataDir/info/
propFile=$dataDir/pssst.properties
password=$(grep -oP "password=.*" $propFile | sed "s/.*=\(.*\)/\1/")
tempExt='.txt'
encryptExt='.des3'
logId="log-history-unlikely-user-name"
defaultPort=8080
mapFile=$(grep -oP "mapFile=.*" $propFile | sed "s/.*=\(.*\)/\1/")

log() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  halfPart=$(echo -n -e "------------------------- ")
  oHalfPart=$(echo -n -e $halfPart | rev)
  d=$(date +%F_%H-%M-%S)
  lg=$(echo -n -e "\n\n$d\n$halfPart $1 $oHalfPart\n$2:$3\n$4")
  appendToFile "$logId" "$lg"
}

getFileName() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  if [ $1 == 'infoMap' ]
  then
    file=$mapFile;
  else
    file=$(getValue infoMap $1)
  fi

  Logger debug "$file"
  if [ "$file" ]
  then
    echo $infoDir$file
  fi
}

getTempName () {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  echo $dataDir/sd/$1'_temp'$tempExt
}

getEncryptName() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  echo $(getFileName $1)$encryptExt
}

getKeys() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  decoded=$(decode "$1")
  value=$(echo "$decoded" | sed "s/\(.*\)\?=.*/\1/g" | sort)
  value=$(echo "$value" | sed -r '/^\s*$/d')
  if [ ! -z "$value" ]
  then
    echo -e "$value"
  fi
}

getValue() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  decoded=$(decode "$1")
  value=$(echo "$decoded" | grep -oP "^$2=.*" | sed "s/.*=//g")
  if [ "$2" == "token" ]
  then
    updateTokens=$(getValue $1 updateTokens)
    if [ "$updateTokens" == "true" ] || [ -z "$value" ]
    then
      update "$1" token
      decoded=$(decode "$1")
      value=$(echo "$decoded" | grep -oP "$2=.*" | sed "s/.*=//g")
    fi
  fi

  if [ ! -z "$value" ]
  then
    echo $value
  fi
}

decode() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  encryptName=$(getEncryptName $1)
  if [ -f "$encryptName" ];
  then
    cmd="openssl des3 -d < $encryptName -pass pass:$password"
    # Unlock -> decrypt -> Lock.... TODO: Find a way to simplify this.
    decoded=$(chmod +r $encryptName && openssl des3 -d < $encryptName -pass pass:$password && chmod go-rwx $encryptName)
    echo "$decoded"
  else
    echo "";
  fi
}

setupTemp() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  tempName=$(getTempName $1)
  encryptName=$(getEncryptName $1)
  touch $tempName
  touch $encryptName
  echo "$(decode $1)" > $tempName
}

getNewFileName() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  found=1
  newName=here
  while [ $found == 1 ]
  do
    found=0
    newName=$(pwgen 30 1)
    filenames=$(ls $dataDir/info/)
    for filename in $filenames
    do
      if [ "$newName$encryptExt" == "$filename" ]
      then
        found=1
      fi
    done
  done
  echo $newName
}

mapFile() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  getValue infoMap "$1"
  filename=$(getValue infoMap "$1")
  if [[ -z $filename ]] && [ $1 != "infoMap" ]
  then
    genValue=$(getNewFileName)
    filename="$genValue"
    touch $infoDir$filename$encryptExt
    appendToFile "infoMap" "$1=$filename"
  fi

  echo $filename
}

saveAndRemoveTemp () {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  tempName=$(getTempName $1)
  encryptName=$(getEncryptName $1)
  # Unlock -> encrypt -> Lock.... TODO: Find a way to simplify this.
  chmod +rw $encryptName && openssl des3 < $tempName > $encryptName -pass pass:$password && chmod go-rwx $encryptName
  rm $tempName
}

cleanFile() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  sed -i '/^[[:space:]]*$/d' $1
  sort $1 > ${1}_ && cp ${1}_ $1 && rm ${1}_
}

viewFile() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  filename=$(mapFile "$1")
  temporaryName=$(getTempName "$1")
  setupTemp "$1"
  cleanFile "$temporaryName"
  editor=gedit
  eval "$editor $temporaryName" && saveAndRemoveTemp "$1" && echo true
}

appendToFile () {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  tempFileName=$(getTempName "$1")
  filename=$(mapFile "$1")
  setupTemp "$1"
  echo "$2" >> $tempFileName
  saveAndRemoveTemp $1
}

update () {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  _rm "$@"
  newVal=$3

  if [ -z "$newVal" ]
  then
    newVal=$(pwgen 30 1)
  fi
  appendToFile "$1" "$2=$newVal"
}

_rm () {
  Logger trace "$(sepArguments "Argurments: '" "', '" "$@")'"
  if [ ! -z "$2" ]
  then
    silence=$(mapFile "$1")
    tempFileName=$(getTempName "$1")

    setupTemp "$1"
    old=$(grep -oP "$2=.*" $tempFileName | sed "s/.*=\(.*\)/\1/")
    sed -i "s/^$2=.*//g" $tempFileName
    log "$1" "$2" "$old" "Updated"
    saveAndRemoveTemp $1
  fi
}

replace() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  value=$(getValue $1 $2)
  sed -i -re "s/_\{$2\}_/$value/g" $3
}

remove() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  value=$(getValue $1 $2)
  sed -i -re "s/$value/_{$2}_/g" $3
}

determinePort() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  numRe='^[0-9]{1,}$'
  if [[ $1 =~ $numRe ]]; then
    port=$1
  else
    savedPort=$(getValue pssst port)
    if [[ $savedPort =~ $numRe ]]; then
      port=$savedPort
    else
      port=$defaultPort
    fi
  fi
  update pssst port $port 1>/dev/null
  echo $port
}

getWithToken() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  validateToken "$@";
  value=$(getValue $1 $2)
  echo $value
}

validateToken() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  token=$(getValue $1 token)
  if [ "$token" != "$2" ];then
    echo '[Error:CI] Your not supposed to be here...'
    exit 1;
  fi
}

getServerPid() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  netstat -plten | grep $1 | awk '{print $9}' | sed "s/\(.*\)\/.*/\1/"
}

startServer() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  port=$(determinePort $1)
  serverPid=$(getServerPid $port)
  confInfoToken=$(getValue pssst token)
  if [ -z $serverPid ]; then
    node ${passServRelDir}/password-server.js $port $confInfoToken
    echo Password server running on port: $port
  fi
}

declare -A cmdHelp
declare -A moreDetail

openHelpDoc() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  port=$(determinePort $2)
  serverPid=$(getServerPid $port)
  startServer
  url="xdg-open http://localhost:$port/help.html";
  echo -e "URL:\n\t"$url"\n"
  su jozsef -c "$url"
}

areYouSure() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  echo -e "$1"
  read -p "" yes
  echo $yes
  if [ "$yes" != "YES" ]
  then
    exit
  fi
}

generateProperties() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  areYouSure "Are you sure you want to regnerate Properties?(YES to proceed)\nAll Passwords will be lost."
  areYouSure "Seriosly there is no going back.... You have been warned?(YES to proceed)"
  rm $propFile
  pass=$(pwgen 30)
  mapFile=$(pwgen 30)
  echo -e "password=$pass\nmapFile=$mapFile" > $propFile
}

adminCheck() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  if  ! touch $propFile 2>/dev/null; then
    echo Must have admin privaliges to run this application.
    if [ "$1" != "true" ]
    then
      exit
    fi
  fi
}

selfDistruct() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  t=60
  if [ ! -z $2 ]
  then
    t=$2
  fi
  filepath=$(getTempName "$1")
  setupTemp "$1"
  sleep $t && rm $filepath &
}

naFp() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  echo $dataDir/na/$1.txt
}

toJson() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  json="{\n"
  while read line
  do
    json+=$(echo "$line" | sed 's/^\(.*\?\)=\(.*\)/\t\"\1\": "\2",/g')"\n"
  done
  echo -e "${json:0:-3}\n}"
}

clientConfig() {
  config=${flags['config']}
  host=${flags['host']}
  token=${flags['token']}
  group=${flags['group']}
  pst update $config token $token
  pst update $config group $group
  pst update $config host $host
}

client() {
  config=${flags['config']}
  if [ ! -z "$config" ]
  then
    host=$(getValue "$config" host)
    token=$(getValue "$config" token)
    group=$(getValue "$config" group)
  else
    host=${flags['host']}
    token=${flags['token']}
    group=${flags['group']}
  fi

  xdg-open "$host/pssst/client?host=$host&token=$token&group=$group";
  # json=$(pst tokens | pst toJson)
  # script="\n\t<script type='text/javascript' src="http://localhost:3000/pssst/js/pssst-client.js"></script>\n\t"
  # echo -e "<html><head>$script</head><body><pssst>$json</pssst></body></html>"
}

valueNonAdmin() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  filepathSd=$(getTempName "$1")
  filepathNa=$(naFp "$1")
  valSd=$(grep -oP "^$2=.*" $filepathSd 2>/dev/null | sed "s/^$2=\(.*\)/\1/")
  valNa=$(grep -oP "^$2=.*" $filepathNa 2>/dev/null | sed "s/^$2=\(.*\)/\1/")
  [ ! -z $valSd ] && [ ! -z $valNa ] &&
    Logger warn 'There is a secure and insecure Property with the same collection and identifier. One of these needs to be renamed'

  [ -z "$valSd" ] && [ -z "$valNa" ] && [ "${booleans[a]}" != "true" ] && getValue "$1" "$2" && exit
  # Logger fatal "$valSd : $valNa" - $filepathNa
  [ ! -z "$valNa" ] && echo $valNa && Logger info "Insecure value returned" && exit

  [ ! -z "$valSd" ] && echo $valSd && Logger info "Secure value returned" && exit

  Logger info "Property not found $1 - $2"
  echo "[Error:CI] Property '$2' not found. - You may need to run selfDistruct with admin privaliges before execution."
  exit
}

updateNonAdmin() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  adminErr=$(adminCheck "true")
  if [ ! -z "$adminErr" ]
  then
    val=$3
    if [ -z $val ]
    then
      val=$(pwgen 30 1)
    fi
    filepath=$(naFp $1)
    mkdir -p $(dirname $filepath)
    sed -i "s/^$2=.*//" $filepath
    echo $2=$val >> $filepath
    cleanFile $filepath
    exit
  fi
}

tokens() {
  groups=$(pst getKeys infoMap)
  for group in ${groups[@]}
  do
    if [ "$group" != "log-history-unlikely-user-name" ]
    then
      if [ "$group" != "mapInfo" ]
      then
        token=$(getValue $group token)
        echo $group=$token
      fi
    fi
  done
}

insecureFunctions() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  case "$1" in
    dir)
      echo $passServRelDir
    ;;
    value)
      valueNonAdmin "$2" "$3"
    ;;
    update)
      updateNonAdmin "$2" "$3" "$4"
    ;;
    --help)
      openHelpDoc "$2"
    ;;
    -help)
      openHelpDoc "$2"
    ;;
    help)
      openHelpDoc "$2"
    ;;
    validateToken)
      validateToken "$2" "$3"
    ;;
    retTemp)
      retTemp "$2" "$3"
    ;;
    toJson)
      toJson "$2"
    ;;
  esac
}

secureFunctions() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  case "$1" in
    replace)
      adminCheck
      replace $2 $3 $4
    ;;
    remove)
      adminCheck
      remove $2 $3 $4
    ;;
    edit)
      adminCheck
      oldContents=$(viewFile "$2")
      log $2 "" "" "$oldContents"
      saveAndRemoveTemp "$2"
    ;;
    rm)
      _rm "$2" "$3"
    ;;
    append)
      adminCheck
      appendToFile "$2" "$3"
    ;;
    update)
      adminCheck
      update "$2" "$3" "$4"
    ;;
    map)
      adminCheck
      mapFile "$2"
    ;;
    view)
      adminCheck
      viewFile "$2"
      temporaryName=$(getTempName "$2")
      rm "$temporaryName"
    ;;
    generateProperties)
      adminCheck
      generateProperties
    ;;
    setup-server)
      adminCheck
      update "$2" "$3" "$4"
      update "$2" "token"
    ;;
    log)
      adminCheck
      $oldContents=$(viewFile "$logId")
      saveAndRemoveTemp "$logId"
    ;;
    start-server)
      adminCheck
      startServer $2
    ;;
    stop-server)
      adminCheck
      port=$(determinePort $2)
      kill -9 $(getServerPid $port)
    ;;
    defaultPort)
      adminCheck
      determinePort $2
    ;;
    selfDistruct)
      selfDistruct "$2" "$3"
    ;;
    getKeys)
      getKeys "$2"
    ;;
    tokens)
      tokens
    ;;
    client)
      client
    ;;
    clientConfig)
      clientConfig
    ;;
  esac
}

insecureFunctions "$@"
secureFunctions "$@"
