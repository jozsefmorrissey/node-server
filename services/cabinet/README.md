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


TODO's
fix data save filename
requireJS to properly formatJson files
"Imperial (us)" does not add implicit multiplication stringMathEval
hover help/error text
Clean and seperate Object.(getSet|get|set);
figure out three-view hidden lines
orient parts correctly for tree-view
