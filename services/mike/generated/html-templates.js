
exports['550500469'] = (get, $t) => 
		`<span > <input list='auto-fill-list-` +
		$t.clean(get("input").id() +
		get("willFailCheckClassnameConstruction")()) +
		` expand-list-` +
		$t.clean(get("type")()) +
		`-input' id='` +
		$t.clean(get("input").id()) +
		`' placeholder='` +
		$t.clean(get("input").placeholder) +
		`' type='text'> <datalist id="auto-fill-list-` +
		$t.clean(get("input").id()) +
		`"> ` +
		$t.clean( new $t('-1921787246').render(get("input").autofill(), 'option', get)) +
		` </datalist> </span>`

exports['559079503'] = (get, $t) => 
		`<span class='decision-input-array-cnt pad ` +
		$t.clean(get("class")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("input").html()) +
		` <div class='children-recurse-cnt' value='` +
		$t.clean(get("input").value()) +
		`'> ` +
		$t.clean(get("childrenHtml")(get("$index"))) +
		` </div> </span>`

exports['564755780'] = (get, $t) => 
		`<span class='decision-input-array-cnt pad ` +
		$t.clean(get("class")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("input").html()) +
		` <div class='children-recurse-cnt tab' value='` +
		$t.clean(get("input").value()) +
		`'> ` +
		$t.clean(get("childrenHtml")(get("$index"))) +
		` </div> </span>`

exports['1447370576'] = (get, $t) => 
		`<div class="expandable-list-body" key='` +
		$t.clean(get("key")) +
		`'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'>X</button> <div class="expand-header ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'> ` +
		$t.clean(get("getHeader")(get("item"), get("key"))) +
		` </div> <div class="expand-body ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'> ` +
		$t.clean(get("getBody") && get("getBody")(get("item"), get("key"))) +
		` </div> </div> </div>`

exports['1591500900'] = (get, $t) => 
		`<td > <input type='` +
		$t.clean(get("type")()) +
		`' name='` +
		$t.clean(get("id")()) +
		`-` +
		$t.clean(get("row")) +
		`'> </td>`

exports['1835219150'] = (get, $t) => 
		`<option value='` +
		$t.clean(get("isArray")() ? get("value") : get("key")) +
		`' ` +
		$t.clean(get("selected")(get("isArray")() ? get("value") : get("key")) ? 'selected' : '') +
		`> ` +
		$t.clean(get("value")) +
		` </option>`

exports['auto-save'] = (get, $t) => 
		`<div> <button type="button" class='auto-save-btn' name="button">Auto Save</button> <span class='status'></span> </div> `

exports['expandable/input-repeat'] = (get, $t) => 
		`<div> ` +
		$t.clean( new $t('550500469').render(get("inputs")(), 'input', get)) +
		` <button ex-list-id='` +
		$t.clean(get("id")()) +
		`' class='expandable-list-add-btn' ` +
		$t.clean(get("hideAddBtn") ? 'hidden' : '') +
		`> Add ` +
		$t.clean(get("listElemLable")()) +
		` here </button> <div class='error' id='` +
		$t.clean(get("ERROR_CNT_ID")) +
		`'></div> </div> `

exports['-1921787246'] = (get, $t) => 
		`<option value="` +
		$t.clean(get("option")) +
		`" ></option>`

exports['expandable/pill'] = (get, $t) => 
		` <div class="expandable-list ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`'> <div class="expand-list-cnt ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`'> ` +
		$t.clean( new $t('-2108278621').render(get("list")(), 'key, item', get)) +
		` <div class='input-open-cnt'><button>Add ` +
		$t.clean(get("listElemLable")()) +
		`</button></div> </div> <div> <div class='expand-input-cnt' hidden>` +
		$t.clean(get("inputHtml")()) +
		`</div> <br> <div class='error' id='` +
		$t.clean(get("ERROR_CNT_ID")()) +
		`'></div> </div> <div class='expand-tab'> <div class="expand-body ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'></div> </div> </div> `

exports['-2108278621'] = (get, $t) => 
		`<div key='` +
		$t.clean(get("key")) +
		`'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'>X</button> </div> <div class="expand-header ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'> ` +
		$t.clean(get("getHeader")(get("item"), get("key"))) +
		` </div> </div> </div>`

exports['input/data-list'] = (get, $t) => 
		`` +
		$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
		` `

exports['-994603408'] = (get, $t) => 
		`<option value="` +
		$t.clean(get("item")) +
		`" ></option>`

exports['expandable/sidebar'] = (get, $t) => 
		` <div class="expandable-list ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`'> <div class="expand-list-cnt ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`'> ` +
		$t.clean( new $t('-688234735').render(get("list")(), 'key, item', get)) +
		` <div class='expand-input-cnt' hidden>` +
		$t.clean(get("inputHtml")()) +
		`</div> <div class='input-open-cnt'><button>Add ` +
		$t.clean(get("listElemLable")()) +
		`</button></div> </div> <div> </div> <div class="expand-body ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'> Hello World! </div> </div> `

exports['-688234735'] = (get, $t) => 
		`<div class="expandable-list-body" key='` +
		$t.clean(get("key")) +
		`'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'>X</button> </div> <div class="expand-header ` +
		$t.clean(get("type")()) +
		` ` +
		$t.clean(get("activeKey")() === get("key") ? ' active' : '') +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`' key='` +
		$t.clean(get("key")) +
		`'> ` +
		$t.clean(get("getHeader")(get("item"), get("key"))) +
		` </div> </div> </div>`

exports['expandable/list'] = (get, $t) => 
		` <div class="expandable-list ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`'> ` +
		$t.clean( new $t('1447370576').render(get("list")(), 'key, item', get)) +
		` <div class='expand-input-cnt' hidden has-input-tree='` +
		$t.clean(get("hasInputTree")()) +
		`'>` +
		$t.clean(get("inputHtml")()) +
		`</div> <div class='input-open-cnt'><button>Add ` +
		$t.clean(get("listElemLable")()) +
		`</button></div> </div> `

exports['expandable/top-add-list'] = (get, $t) => 
		` <div class="expandable-list ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")()) +
		`'> <div class='expand-input-cnt' hidden has-input-tree='` +
		$t.clean(get("hasInputTree")()) +
		`'>` +
		$t.clean(get("inputHtml")()) +
		`</div> <div class='input-open-cnt'><button>Add ` +
		$t.clean(get("listElemLable")()) +
		`</button></div> ` +
		$t.clean( new $t('1447370576').render(get("list")(), 'key, item', get)) +
		` </div> `

exports['input/decision/decision-modification'] = (get, $t) => 
		` <` +
		$t.clean(get("tag")()) +
		` class='decision-input-cnt mod' node-id='` +
		$t.clean(get("id")()) +
		`' ` +
		$t.clean(get("reachable")() ? '' : 'hidden') +
		`> <span node-id='` +
		$t.clean(get("id")()) +
		`'> ` +
		$t.clean( new $t('-327218816').render(get("inputArray")(), 'input', get)) +
		` </span> <div class='modification-add-input tab'> ` +
		$t.clean(get("inputTree")().html()) +
		` </div> </` +
		$t.clean(get("tag")()) +
		`> `

exports['-2142270891'] = (get, $t) => 
		`<span class='decision-input-array-cnt pad ` +
		$t.clean(get("class")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("input").html()) +
		` <span> <button class='conditional-button' target-id='` +
		$t.clean(get("input").id()) +
		`'> If ` +
		$t.clean(get("input").name()) +
		` = ` +
		$t.clean(get("input").value()) +
		` </button> <div class='condition-input-tree tab'></div> <div class='children-recurse-cnt' value='` +
		$t.clean(get("input").value()) +
		`'>` +
		$t.clean(get("childrenHtml")(get("$index"), true)) +
		`</div> </span> <br> </span>`

exports['input/decision/decision'] = (get, $t) => 
		` <` +
		$t.clean(get("tag")()) +
		` class='decision-input-cnt' node-id='` +
		$t.clean(get("id")()) +
		`' ` +
		$t.clean(get("reachable")() ? '' : 'hidden') +
		`> <span id='` +
		$t.clean(get("id")()) +
		`'> ` +
		$t.clean( new $t('564755780').render(get("inputArray")(), 'input', get)) +
		` </span> </` +
		$t.clean(get("tag")()) +
		`> `

exports['input/decision/decisionTree'] = (get, $t) => 
		`<div class='` +
		$t.clean(get("DecisionInputTree").class) +
		`' tree-id='` +
		$t.clean(get("node").tree().id()) +
		`'> ` +
		$t.clean(get("inputHtml")) +
		` <button class='` +
		$t.clean(get("DecisionInputTree").buttonClass) +
		`' tree-id='` +
		$t.clean(get("node").tree().id()) +
		`' ` +
		$t.clean(get("node").tree().hideButton ? 'hidden' : '') +
		`> ` +
		$t.clean(get("node").root().inputTree().buttonText()) +
		` </button> </div> `

exports['input/input'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		`> <label>` +
		$t.clean(get("label")()) +
		`</label> <input class='` +
		$t.clean(get("class")()) +
		`' list='input-list-` +
		$t.clean(get("id")()) +
		`' id='` +
		$t.clean(get("id")()) +
		`' placeholder='` +
		$t.clean(get("placeholder")()) +
		`' type='` +
		$t.clean(get("type")()) +
		`' name='` +
		$t.clean(get("name")()) +
		`' ` +
		$t.clean(get("attrString")()) +
		`> <datalist id="input-list-` +
		$t.clean(get("id")()) +
		`"> ` +
		$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
		` </datalist> <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`' hidden>` +
		$t.clean(get("errorMsg")()) +
		`</div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['input/measurement'] = (get, $t) => 
		`<div class='fit input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		`> <label>` +
		$t.clean(get("label")()) +
		`</label> <input class='measurement-input ` +
		$t.clean(get("class")()) +
		`' id='` +
		$t.clean(get("id")()) +
		`' value='` +
		$t.clean(get("value")() ? get("value")() : "") +
		`' placeholder='` +
		$t.clean(get("placeholder")()) +
		`' type='` +
		$t.clean(get("type")()) +
		`' name='` +
		$t.clean(get("name")()) +
		`'> <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`' hidden>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `

exports['input/multiple-entries'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt multi'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		`> <label>` +
		$t.clean(get("label")()) +
		`</label> <div class='multiple-entry-cnt tab ` +
		$t.clean(get("inline")() ? 'inline' : '') +
		`' id='` +
		$t.clean(get("id")()) +
		`'> ` +
		$t.clean( new $t('-1306926582').render(get("list")(), 'inputArray', get)) +
		` </div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['-1306926582'] = (get, $t) => 
		`<div index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("setHtml")(get("$index"))) +
		` </div>`

exports['input/one-entry'] = (get, $t) => 
		`<span class='one-entry-cnt'> ` +
		$t.clean(get("html")()) +
		` </span> `

exports['input/radio'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		`> <label>` +
		$t.clean(get("label")()) +
		`</label> <br> <div class='tab'> ` +
		$t.clean( new $t('-1983906216').render(get("list")(), 'key, val', get)) +
		` </div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['-1983906216'] = (get, $t) => 
		`<span > <label>` +
		$t.clean(get("isArray")() ? get("val") : get("key")) +
		`</label> <input type='radio' ` +
		$t.clean((get("isArray")() ? get("val") : get("key")) === get("value")() ? 'checked' : '') +
		` class='` +
		$t.clean(get("class")()) +
		`' id='` +
		$t.clean(get("id")()) +
		`' name='` +
		$t.clean(get("name")()) +
		`'> </span>`

exports['input/select'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		`> <label>` +
		$t.clean(get("label")()) +
		`</label> <select class='` +
		$t.clean(get("class")()) +
		`' id='` +
		$t.clean(get("id")()) +
		`' name='` +
		$t.clean(get("name")()) +
		`' value='` +
		$t.clean(get("value")()) +
		`'> ` +
		$t.clean( new $t('1835219150').render(get("list")(), 'key, value', get)) +
		` </select> <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`' hidden>` +
		$t.clean(get("errorMsg")()) +
		`</div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['input/table'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		`> <label>` +
		$t.clean(get("label")()) +
		`</label> <br> <div class='tab'> <table> <tbody> <tr> <td></td> ` +
		$t.clean( new $t('-1250012283').render(get("columns")(), 'col', get)) +
		` </tr> ` +
		$t.clean( new $t('-302235087').render(get("rows")(), 'rowIndex, row', get)) +
		` </tbody> </table> </div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['-706519867'] = (get, $t) => 
		`<td >col</td>`

exports['-498428047'] = (get, $t) => 
		`<tr > <td>row</td> ` +
		$t.clean( new $t('1591500900').render(get("columns")(), 'colIndex, col', get)) +
		` </tr>`

exports['input/textarea'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		`> <label>` +
		$t.clean(get("label")()) +
		`</label> <br> <textarea class='` +
		$t.clean(get("class")()) +
		`' list='input-list-` +
		$t.clean(get("id")()) +
		`' id='` +
		$t.clean(get("id")()) +
		`' placeholder='` +
		$t.clean(get("placeholder")()) +
		`' type='` +
		$t.clean(get("type")()) +
		`' name='` +
		$t.clean(get("name")()) +
		`' ` +
		$t.clean(get("attrString")()) +
		`></textarea> <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`' hidden>` +
		$t.clean(get("errorMsg")()) +
		`</div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['configure'] = (get, $t) => 
		`<div id='config-body'></div> <div id='test-ground'></div> `

exports['index'] = (get, $t) => 
		`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <script type="text/javascript" src='/mike/js/index.js'></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/mike/styles/mike.css"> <title></title> </head> <body> ` +
		$t.clean(get("header")) +
		` ` +
		$t.clean(get("main")) +
		` ` +
		$t.clean(get("footer")) +
		` </body> </html> `

exports['reports'] = (get, $t) => 
		`<div> REPORTS === ` +
		$t.clean(get("name")) +
		` </div> `

exports['report'] = (get, $t) => 
		`<div> REPORT === ` +
		$t.clean(get("name")) +
		` </div> `

exports['-1250012283'] = (get, $t) => 
		`<td >` +
		$t.clean(get("col")) +
		`</td>`

exports['-302235087'] = (get, $t) => 
		`<tr > <td>` +
		$t.clean(get("row")) +
		`</td> ` +
		$t.clean( new $t('1591500900').render(get("columns")(), 'colIndex, col', get)) +
		` </tr>`

exports['-327218816'] = (get, $t) => 
		`<span class='decision-input-array-cnt pad ` +
		$t.clean(get("class")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("input").html()) +
		` <span> <button class='conditional-button' target-id='` +
		$t.clean(get("input").id()) +
		`'> If ` +
		$t.clean(get("input").name()) +
		` = ` +
		$t.clean(get("input").value()) +
		` </button> <div class='condition-input-tree tab'></div> <div class='children-recurse-cnt tab' value='` +
		$t.clean(get("input").value()) +
		`'>` +
		$t.clean(get("childrenHtml")(get("$index"), true)) +
		`</div> </span> <br> </span>`
