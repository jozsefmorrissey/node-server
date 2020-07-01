#!/bin/bash
dgGroup="pssst.sh.$(date +"%H:%M:%S")-$1"

# All functions will deal with the same following properties
#   @$1 - String Id
#   @$2 - Property Key
passServRelDir=$(dirname "${BASH_SOURCE[0]}")
source ${passServRelDir}/BashScripts/debugLogger.sh

dataDir=~/.opsc/pssst/$USER
propFile=$dataDir/pssst.properties
infoDir=$dataDir/info/

initFolders() {
  mkdir -p "$dataDir/sd"
  mkdir -p "$dataDir/na"
  mkdir -p "$dataDir/ca"
  mkdir -p "$infoDir"
}

#call: indent "[string]" "[indention count]"
indent() {
  trimedStr=$(echo -e "$1" | sed "s/^\s*\(.*\)\s*$/\1/")
  tabStr="\t"
  for (( i=1; i<$(($2)) ; i++ ))
  do
      tabStr="$tabStr\t"
  done
  echo -e "$(echo -e "$trimedStr" | sed "s/\(.*\)/$tabStr\1/g")"
}

configureGlobals() {
  if [ ! -f "$propFile" ]
  then
    _help
    exit
  fi
    password=$(grep -oP "password=.*" $propFile | sed "s/.*=\(.*\)/\1/")
    encFlags=$(grep -oP "encFlags=.*" $propFile | sed "s/.*=\(.*\)/\1/")
    infoMapFile=$(grep -oP "infoMapFile=.*" $propFile | sed "s/.*=\(.*\)/\1/")

    tempExt='.txt'
    encryptExt='.des3'
    backupLocation=$dataDir/backup/
    defaultPort=8080

    logId="log-history-unlikely-user-name"
}

tries=0;
first() {
  while [ -z "$1" ] && [ "$tries" -le 10 ]
  do
    shift
    let "tries+=1"
  done;
  echo -e "$1"
}

# TODO: Script needs to be fixed to accept flag args.
globalArgs() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  config=${flags['config']}
  if [ ! -z "$config" ]
  then
    host=$(getValue "$config" host)
    token=$(getValue "$config" token)
    group=$(getValue "$config" group)
    pstPin=$(getValue "$config" pst-pin)
  else
    host=${flags['host']}
    token=${flags['token']}
    group=${flags['group']}
    key=${flags['key']}
    value=${flags['value']}
    pstPin=${flags['pst-pin']}
  fi

  group=$(first "$group" "$2")
  key=$(first "$key" "$3")
  value=$(first "$value" "$4")

  if [ -z "$group" ]
  then
    group=$config
  fi

  if [ -z "$host" ]
  then
    host="http://localhost:3000"
  fi
	Logger trace "EXIT"
}

log() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  # halfPart=$(echo -n -e "------------------------- ")
  # oHalfPart=$(echo -n -e $halfPart | rev)
  # d=$(date +%F_%H-%M-%S)
  # lg=$(echo -n -e "\n\n$d\n$halfPart $1 $oHalfPart\n$2:$3\n$4")
  # Logger info $logId
  # appendToFile "$logId" "$lg"
	# Logger trace "EXIT"
}

getFileName() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  if [ $1 == 'infoMap' ]
  then
    file=$infoMapFile;
  else
    file=$(mapFile "$1")
  fi

  Logger debug "infoDir: $infoDir, file: $file"
  echo "$file"
	Logger trace "EXIT"
}

getTempName () {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  echo $dataDir/sd/$1'_temp'$tempExt
	Logger trace "EXIT"
}

getEncryptName() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  Logger debug "$(getFileName $1) -- $encryptExt"
  echo $infoDir"$(getFileName $1)$encryptExt"
	Logger trace "EXIT"
}

get-keys() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  decoded=$(decode "$1")
  value=$(echo "$decoded" | sed "s/\(.*\)\?=.*/\1/g" | sort)
  value=$(echo "$value" | sed -r '/^\s*$/d')
  if [ ! -z "$value" ]
  then
    echo -e "$value"
  fi
	Logger trace "EXIT"
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
	Logger trace "EXIT"
}

decode() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  encryptName="$(getEncryptName $1)"
  if [ -f "$encryptName" ];
  then
    Logger debug "flags: '$encFlags', group: $1, encName: $encryptName :encEnd"
    cmd="openssl des3 $encFlags -d < \"$encryptName\" -pass pass:$password"
    # Unlock -> decrypt -> Lock.... TODO: Find a way to simplify this.
    decoded=$(chmod +r $encryptName && openssl des3 $encFlags -d < $encryptName -pass pass:$password 2>/dev/null && chmod go-rwx $encryptName)
    echo "$decoded"
  else
    echo "";
  fi
	Logger trace "EXIT"
}

setupTemp() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  tempName=$(getTempName $1)
  encryptName=$(getEncryptName $1)
  touch $tempName
  touch $encryptName
  echo "$(decode $1)" > $tempName
	Logger trace "EXIT"
}

backup() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  mkdir -p "$backupLocation"
  backupFileName=./$1.txt
  touch $backupFileName
  Logger debug "$backupFileName"
  echo "$(decode $1)" > $backupFileName
  t=10
  if [ ! -z $2 ]
  then
    t=$2
  fi
  sleep $(($t)) && rm $backupFileName &
	Logger trace "EXIT"
}

backup-all() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  keys=$(pst get-keys infoMap)
  t=10
  if [ ! -z $1 ]
  then
    t=$1
  fi
  expiration=$(date -d "today" +"%Y-%m-%d %H:%M" --date="+$t minutes")
  backupZipDir=$(getZipDirectory "$expiration")
  backupZipFile="$backupZipDir"/backup.zip
  currentDirectory=$(pwd)
  cd "$backupZipDir"
  for key in ${keys[@]}
  do
    logger debug "$key"
    backup "$key"
  done
  zip "$backupZipFile" *
  cd "$currentDirectory"
  sleep $((($t + 1) * 60)) && rm -r -f "$backupZipDir" &
	Logger trace "EXIT"
}

getZipDirectory() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  expirationDate=$1
  zipDir="$backupLocation$expirationDate"
  mkdir -p "$zipDir"
  echo $zipDir
	Logger trace "EXIT"
}

restore() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  expirationDate=$1
  zipDir=$(getZipDirectory "$expirationDate")
  unzip "$zipDir/backup.zip" -d "$zipDir"
  find "$zipDir" -name "*.txt" -type f -print0 | while IFS= read -r -d '' restorFilename; do
    group=$(echo "$restorFilename" | sed 's/^.*\/\(.*\).txt$/\1/')
    updateFileContents "$group" "$restorFilename"
  done
	Logger trace "EXIT"
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
    for fn in $filenames
    do
      if [ "$newName$encryptExt" == "$fn" ]
      then
        found=1
      fi
    done
  done
  echo $newName
	Logger trace "EXIT"
}

mapFile() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  mapFilename=$(getValue infoMap "$1")
  Logger debug "$mapFilename"
  if [[ -z "$mapFilename" ]] && [ $1 != "infoMap" ]
  then
    genValue=$(getNewFileName)
    mapFilename="$genValue"
    touch $infoDir$mapFilename$encryptExt
    appendToFile "infoMap" "$1=$mapFilename"
  fi

  Logger debug "\"$mapFilename\""
  echo "$mapFilename"
	Logger trace "EXIT"
}

updateFileContents() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  encryptName=$(getEncryptName $1)
  touch "$encryptName"
  Logger debug "EncName: $encryptName"
  Logger debug "source: $2"
  chmod +rw $encryptName && openssl des3 $encFlags < "$2" > "$encryptName" -pass pass:$password && chmod go-rwx $encryptName
	Logger trace "EXIT"
}

saveAndRemoveTemp () {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  tempName=$(getTempName $1)
  # Unlock -> encrypt -> Lock.... TODO: Find a way to simplify this.
  updateFileContents "$1" "$tempName"
  rm $tempName
	Logger trace "EXIT"
}

cleanFile() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  sed -i '/^[[:space:]]*$/d' $1
  sort $1 > ${1}_ && cp ${1}_ $1 && rm ${1}_
	Logger trace "EXIT"
}

viewFile() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  filename=$(mapFile "$1")
  temporaryName=$(getTempName "$1")
  setupTemp "$1"
  cleanFile "$temporaryName"
  editor=gedit
  eval "$editor $temporaryName" && saveAndRemoveTemp "$1" && echo true
	Logger trace "EXIT"
}

appendToFile () {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  tempFileName=$(getTempName "$1")
  Logger debug "tempFileName: $tempFileName"
  setupTemp "$1"
  Logger debug "after setup: $tempFileName"
  echo "$2" >> $tempFileName
  saveAndRemoveTemp $1
	Logger trace "EXIT"
}

update () {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  newVal=$3

  if [ -z "$newVal" ]
  then
    newVal=$(pwgen 30 1)
  fi
  ifDebugging "debuggui keyValue 'updated $2' 'from $(getValue "$1" "$2") to $newVal' -group '$dgGroup' -id '${flags[dg-id]}'"
  _rm "$@"
  appendToFile "$1" "$2=$newVal"
  if [ "$2" == "token" ] || [ "$2" == "pst-pin" ]
  then
    echo $newVal
  fi
	Logger trace "EXIT"
}

remove-group() {
  _rm 'infoMap' "$1"
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
	Logger trace "EXIT"
}

replace() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  value=$(getValue $1 $2)
  sed -i -re "s/_\{$2\}_/$value/g" $3
	Logger trace "EXIT"
}

remove() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  value=$(getValue $1 $2)
  sed -i -re "s/$value/_{$2}_/g" $3
	Logger trace "EXIT"
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
	Logger trace "EXIT"
}

getWithToken() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  validateToken "$@";
  value=$(getValue $1 $2)
  echo $value
	Logger trace "EXIT"
}

validateToken() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  token=$(getValue $1 token)
  pstPin=$(getValue $1 pst-pin)
  adminToken=$(getValue 'admin' token)
  adminPin=$(getValue 'admin' pst-pin)
  if [ "$1" == "admin" ] && [ "$3" != "$adminPin" ]
  then
    echo '[Error:CI] Your not supposed to be here...'
    exit 1;
  fi

  if [ "$2" == "$adminToken" ] && [ "$1" != "admin" ]
  then
    validateToken admin "$2" "$3"
    exit 0
  fi
  if [ "$token" != "$2" ]
  then
    echo '[Error:CI] Your not supposed to be here...'
    exit 1;
  fi
  Logger debug "booolean: "
  if [ "yes" == "$(pst requires-pin $1)" ] &&
      [ "$3" != "$pstPin" ]
  then
    echo '[Error:CI] Your not supposed to be here...'
    exit 1;
  fi
	Logger trace "EXIT"
}

requiresPin() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  pstPin=$(getValue $1 pst-pin)
  if [ -z "$pstPin" ]
  then
    echo no
  else
    echo yes
  fi
	Logger trace "EXIT"
}

getServerPid() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  netstat -plten | grep $1 | awk '{print $9}' | sed "s/\(.*\)\/.*/\1/"
	Logger trace "EXIT"
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
	Logger trace "EXIT"
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
	Logger trace "EXIT"
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
	Logger trace "EXIT"
}

confirmGenerateProperties() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  areYouSure "Are you sure you want to regnerate Properties?(YES to proceed)\nAll Passwords will be lost."
  areYouSure "Seriosly there is no going back.... You have been warned?(YES to proceed)"
  generateProperties
}

generateProperties() {
  rm $propFile
  pass=$(pwgen 30)
  infoMapFile=$(pwgen 30)
  echo $propFile
  echo -e "password=$pass\ninfoMapFile=$infoMapFile\nencFlags=${flags['encFlags']}" > $propFile
	Logger trace "EXIT"
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
	Logger trace "EXIT"
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
	Logger trace "EXIT"
}

naFp() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  echo $dataDir/na/$1.txt
	Logger trace "EXIT"
}

to-json() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  json="{\n"
  while read line
  do
    reg='^.*=.*$'
    if [[ "$line" =~ $reg ]]
    then
      json+=$(echo "$line" | sed 's/^\(.*\?\)=\(.*\)/\t\"\1\": "\2",/g')"\n"
    fi
  done
  echo -e "${json:0:-3}\n}"
	Logger trace "EXIT"
}

client-config() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  config=${flags['config']}
  host=${flags['host']}
  token=${flags['token']}
  group=${flags['group']}
  pstPin=${flags['pst-pin']}
  pst update $config token $token
  pst update $config group $group
  pst update $config host $host
  if [ ! -z $pstPin ]
  then
    pst update $config pst-pin $pstPin
  fi
	Logger trace "EXIT"
}

client() {
  xdg-open "$host/pssst/client?host=$host&token=$token&group=$group";
	Logger trace "EXIT"
}

getCaCertPath() {
  echo "$dataDir/ca/$1.ca-bundle"
}

getValidCaCertPath() {
  host=$1
  dontTest=$2
  subDomain=$(echo "$host" | sed 's/.*\?\/\/\(.*\?\.\|\)\([^\/^.]\{1,\}\.[^\/^.]\{1,\}\)\(\/\|$\).*/\1\2/');
  subDomainCert=$(getCaCertPath "$subDomain")
  domain=$(echo "$host" | sed 's/.*\?\/\/\(.*\?\.\|\)\([^\/^.]\{1,\}\.[^\/^.]\{1,\}\)\(\/\|$\).*/\2/');
  domainCert=$(getCaCertPath "$domain")
  defaultCert=$(getCaCertPath "default");
  Logger debug "subDomain : path: '$subDomain' : '$subDomainCert'"
  Logger debug "domain : path: '$domain' : '$domainCert'"

  if [ "$dontTest" == "0" ]; then
    echo "$subDomainCert"
  elif [ "$dontTest" == "1" ]; then
    echo "$domainCert"
  elif [ "$dontTest" == "2" ]; then
    echo "$defaultCert"
  elif [ -f "$subDomainCert" ]; then
    echo "$subDomainCert"
  elif [ -f "$domainCert" ]; then
    echo "$domainCert"
  elif [ -f "$defaultCert" ]; then
    echo "$defaultCert"
  fi;
}

getCurlCertArg() {
  certPath=$(getValidCaCertPath "$1")
  if [ ! -z "$certPath" ]; then
    echo "--cacert '$certPath'"
  fi;
}

remote() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  caCertArg=$(getCurlCertArg "$host")
  Logger debug "curl caCertArg: '$caCertArg'"
  callContext="--silent $caCertArg -X POST -H 'Content-Type: application/json'"
  callData="'{\"group\": \"$group\",\"token\": \"$token\",\"pst-pin\": \"$pstPin\"}'"
  curlCmd="curl $callContext -d $callData '$host/pssst/get/json'"
  json=$(eval "$curlCmd")
  if [ "$?" != "0" ]; then
    validLocations=$(pst printCertLocs "$host")
    formattedLocs=$(indent "$validLocations" "1")
    echo -e "The following curl command threw and error:\n\t$curlCmd"
    echo -e "\nTest and debug this command outside of pst."
    echo -e "\nIf it is a trust issue the correct ca-bundle can be placed at any of the following locations:\n$formattedLocs"
  fi;
  key=${flags['key']}
  if [ ! -z "$key" ]
  then
    echo "$json" | grep -zoP "\"$key\":\s*\"\K[^\s,]*(?=\s*\")";
  else
    echo "$json"
  fi
  Logger trace "EXIT"
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
	Logger trace "EXIT"
}

key-values() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  group=${flags[group]}
  if [ -z "$group" ]
  then
    group=infoMap
  fi
  keys=$(pst get-keys $group)
  for key in ${keys[@]}
  do
    if [ "$key" != "log-history-unlikely-user-name" ]
    then
      if [ "$key" != "mapInfo" ]
      then
        value=$(getValue $group $key)
        echo $key=$value
      fi
    fi
  done
	Logger trace "EXIT"
}

key-array() {
  list=$(echo -e "$(get-keys "$1")" | sed 's/"/\\"/g' | sed "s/^\(.*\)$/\"\\1\",/g")
  echo -e "[${list:0:-1}]"
}

stop-server() {
  echo port: $1
  sudo kill -9 $(getServerPid $1)
}

edit() {
  oldContents=$(viewFile "$1")
  log "$1" "" "" "$oldContents"
  saveAndRemoveTemp "$1"
}

view() {
  viewFile "$1"
  temporaryName=$(getTempName "$1")
  rm "$temporaryName"
}

printCertLocs() {
  primary=$(getValidCaCertPath "$1" "0")
  secondary=$(getValidCaCertPath "$1" "1")
  default=$(getValidCaCertPath "$1" "2")
  echo "Primary: '$primary'"
  echo "Secondary: '$secondary'"
  echo "Default: '$default'"
}

_help() {
  echo -e "For debuggui output use flag -dg-id \"[id]\"\n"

  cat $passServRelDir/pssst.sh |
  tr "\n" " " |
  tr "\t" " " |
  grep -oP "[a-zA-Z-]*\).*?;;" |
  sed 's/ \{1,\}/ /g' |
  sed 's/\([a-zA-Z-]\{2,\}\)) [a-zA-Z\_-]*\(.\{2,\}\?\) ;;/pst \1 \2\n/g' |
  sort |
  sed 's/ \{1,\}/ /g' |
  grep -oP "^pst.*"
}

insecureFunctions() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  case "$1" in
    install)
      initFolders
    ;;
    dir)
      echo $passServRelDir
    ;;
    value)
      output=$(valueNonAdmin "$group" "$key")
      ifDebugging "debuggui keyValue 'Return Value' '$output' -group '$dgGroup' -id '${flags[dg-id]}'"
      echo -e "$output"
    ;;
    help)
      _help
    ;;
    validateToken)
      validateToken "$group" "$key" "$value"
    ;;
    retTemp)
      retTemp "$group" "$key"
    ;;
    to-json)
      to-json "$group"
    ;;
  esac
	Logger trace "EXIT"
}

secureFunctions() {
  Logger trace "$(sepArguments "Argurments: " ", " "$@")"
  case "$1" in
    replace)
      replace "$group" "$key" "$value"
    ;;
    remove)
      remove "$group" "$key" "$value"
    ;;
    edit)
      edit "$group"
    ;;
    rm)
      _rm "$group" "$key"
    ;;
    append)
      appendToFile "$group" "$key"
    ;;
    update)
      update "$group" "$key" "$value"
    ;;
    map)
      mapFile "$group"
    ;;
    view)
      view "$group"
    ;;
    generateProperties)
      confirmGenerateProperties
    ;;
    start-server)
      startServer "$group"
    ;;
    stop-server)
      stop-server "$2"
    ;;
    defaultPort)
      determinePort "$group"
    ;;
    selfDistruct)
      selfDistruct "$group" "$key"
    ;;
    get-keys)
      get-keys "$group"
    ;;
    key-array)
      key-array "$group"
    ;;
    key-values)
      key-values
    ;;
    client)
      client
    ;;
    url)
      url
    ;;
    remote)
      remote
    ;;
    client-config)
      client-config
    ;;
    backup-all)
      backup-all "$group"
    ;;
    restore)
      restore "$group"
    ;;
    requires-pin)
      requiresPin "$group"
    ;;
    remove-group)
      remove-group "$group"
    ;;
    printCertLocs)
      printCertLocs "$2" #Host
    ;;
  esac
	Logger trace "EXIT"
}

if [ "${booleans['-help']}" == 'true' ] || [ -z "${args[0]}" ]
then
  _help
else
  ifDebugging "debuggui keyValue command '$1' -group '$dgGroup' -id '${flags[dg-id]}'"
  ifDebugging "debuggui keyValue 'arg1(probably group)' '$2' -group '$dgGroup' -id '${flags[dg-id]}'"
  ifDebugging "debuggui keyValue 'arg2(probably key)' '$3' -group '$dgGroup' -id '${flags[dg-id]}'"
  ifDebugging "debuggui keyValue 'arg3(probably value)' '$4' -group '$dgGroup' -id '${flags[dg-id]}'"
  if [ "$1" == "install" ]
  then
    initFolders
    generateProperties
    exit
  fi
  configureGlobals "$@"
  globalArgs "$@"
  insecureFunctions "$@"
  secureFunctions "$@"
fi
