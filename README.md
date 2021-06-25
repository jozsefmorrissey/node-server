
# Node server ready to go

# Quick Start
  git clone https://github.com/jozsefmorrissey/node-server.git

  cd ./node-server

  npm install

  node ./server.js

## Argument parser
### Format
  node ./server.js id1=value1 id2=value2...$

  id=[a-zA-Z.]*
  value=.*  

  <pre>Note: values will be assigned to global[id]</pre>

#### Value Types
  boolean=true|false
  number=[0-9]*
  array=^([^,]*(,|$)){1,} Example: hello,true,false,,444

### Existing bugs
## $t
- func().attr is not rendering properly
