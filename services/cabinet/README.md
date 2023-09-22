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


### TODO
#### Urgent

#### Annoying
Parts3D display is not reflecting divider type on create (base:T is always full on creation)

#### When I get around to it
"Imperial (us)" does not add implicit multiplication stringMathEval
hover help/error text
Clean and seperate Object.(getSet|get|set);
figure out three-view hidden lines
ensure if new property is added existing configs updated with default value
StringMathEvaluator: Math.atan(3/4)* (180/Math.PI) works but Math.atan(3/4)*(180/Math.PI) does not
