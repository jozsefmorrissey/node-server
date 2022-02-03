# Cabinet Builder

## Build
- envs
  - local
  - dev
  - prod
- commands
<pre>
  node ./server.js ENV=[env]
  cd ./services/cabinet
  node ./watch.js ENV=[env]
</pre>


### watch.js
Simple watch bundler that builds your html and js files on change.
