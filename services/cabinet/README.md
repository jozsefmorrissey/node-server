# Cabinet Builder

## Build And Run
- envs
  - local
  - dev
  - prod
- commands
<pre>
  node ./server.js ENV=[ENV] service=cabinet
</pre>


### watch.js
&nbsp;&nbsp;Simple watch bundler that builds your html and js files on change.

## Services

### public/js/utils/utils.js
&nbsp;&nbsp;This file is used to safely add to the standard library.

### public/js/utils/dom-utils.js
&nbsp;&nbsp;Dom reading and manipulation functions.

### public/js/utils/string-math-evaluator
&nbsp;&nbsp;Has a global and a local scope used to evaluate mathmatical expressions.

### public/js/utils/$t.js
&nbsp;&nbsp;Simple html templating function.

&nbsp;&nbsp;<b>Repeat Array</b>
&nbsp;&nbsp;&nbsp;&nbsp;<pre><[tag]:t repeat='[elem] in [array]'>[html]</[tag]:t></pre>

#### Repeat Object
<pre><[tag]:t repeat='key, [elem] in [array]'>[html]</[tag]:t></pre>

#### Repeat Over Indexes
<pre><[tag]:t repeat='[index] in [startIndex]..[endIndex]'>[html]</[tag]:t></pre>

#### Repeat Defined Template
<pre><[tag]:t repeat='[elem] in [array]' $t-id='[templateLocation]'></[tag]:t></pre>

### TODO
#### Urgent

#### Annoying
HTML build changes are only applied the next time server is started.
Parts3D display is not reflecting divider type on create (base:T is always full on creation)

#### When I get around to it
"Imperial (us)" does not add implicit multiplication stringMathEval
hover help/error text
Clean and seperate Object.(getSet|get|set);
figure out three-view hidden lines
ensure if new property is added existing configs updated with default value
StringMathEvaluator: Math.atan(3/4)* (180/Math.PI) works but Math.atan(3/4)*(180/Math.PI) does not
