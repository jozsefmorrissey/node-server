
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

exports['976176139'] = (get, $t) => 
		`<td > ` +
		$t.clean(get("col").html()) +
		` </td>`

exports['1088583088'] = (get, $t) => 
		`<div > <input type='text' value='` +
		$t.clean(get("key")) +
		`'/> => ` +
		$t.clean(get("listItemHtml")(get("value"))) +
		` <br> </div>`

exports['1254550278'] = (get, $t) => 
		`<td >` +
		$t.clean(get("name")) +
		`</td>`

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

exports['1507176312'] = (get, $t) => 
		`<div class='single-entry-cnt' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("setHtml")(get("$index"))) +
		` </div>`

exports['1682356664'] = (get, $t) => 
		`<div id="input-input-list-` +
		$t.clean(get("id")()) +
		`" > ` +
		$t.clean(get("input").html()) +
		` <br> </div>`

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

exports['input/data-list'] = (get, $t) => 
		`` +
		$t.clean( new $t('-994603408').render(get("list")(), 'item', get)) +
		` `

exports['-994603408'] = (get, $t) => 
		`<option value="` +
		$t.clean(get("item")) +
		`" ></option>`

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
		` <div class='decision-tree-mod-cnt'> <div class='then-add-cnt'> <button hidden class='then-btn modify-edit' mod-id='1'> Then... </button> <button hidden class='add-btn modify-edit'mod-id='4'>Add Input</button> </div> <div hidden class='if-edit-cnt'> <button class='edit-btn modify-edit' mod-id='2'> <i class="fas fa-pencil-alt"></i> </button> <button class='conditional-btn modify-edit' mod-id='3'> If </button> </div> <div hidden class='then-cnt tab modify-edit' mod-id='1'>Then Html!</div> <div hidden class='condition-cnt tab modify-edit' mod-id='3'>Condition Tree Html!</div> <div hidden class='rm-edit-cnt modify-edit' mod-id='2'> <div class='edit-cnt'>Edit Tree Html!</div> <button class='modiy-rm-input-btn'>Remove</button> </div> <div hidden class='add-cnt tab modify-edit' mod-id='4'> Add Input Html! </div> <div class='remove-btn-cnt' hidden> <button class='rm-node modify-edit'>X</button> </div> <div class='close-cnts' hidden><button class='modify-edit'>X</button></div> </div> `

exports['input/decision/decision'] = (get, $t) => 
		` <div class='decision-input-cnt card` +
		$t.clean(get("inputArray")().length === 0 ? ' empty' : '') +
		`' node-id='` +
		$t.clean(get("id")()) +
		`' recursion="disabled"> <span id='` +
		$t.clean(get("id")()) +
		`'> <div class='payload-cnt'>` +
		$t.clean(get("payloadHtml")()) +
		`</div> ` +
		$t.clean(get("inputArray")().length === 0 ? '<br><br>' : '') +
		` ` +
		$t.clean( new $t('-1551174699').render(get("inputArray")(), 'input', get)) +
		` <div class='orphan-cnt tab'>` +
		$t.clean(get("childrenHtml")()) +
		`</div> </span> </div> `

exports['-1551174699'] = (get, $t) => 
		`<div class='decision-input-array-cnt pad ` +
		$t.clean(get("class")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("input").html()) +
		` </div>`

exports['input/decision/decisionTree'] = (get, $t) => 
		`<div class='` +
		$t.clean(get("node").tree().class()) +
		` ` +
		$t.clean(get("DecisionInputTree").class) +
		`' tree-id='` +
		$t.clean(get("node").tree().id()) +
		`' input-id='` +
		$t.clean(get("node").tree().id()) +
		`' node-id='` +
		$t.clean(get("node").id()) +
		`'> ` +
		$t.clean(get("header")) +
		` ` +
		$t.clean(get("inputHtml")) +
		` <div ` +
		$t.clean(get("node").tree().hideButton ? 'hidden' : '') +
		`> <br> <button class='` +
		$t.clean(get("node").tree().buttonClass()) +
		` ` +
		$t.clean(get("DecisionInputTree").buttonClass) +
		`' tree-id='` +
		$t.clean(get("node").tree().id()) +
		`'> ` +
		$t.clean(get("node").tree().buttonText()) +
		` </button> </div> </div> `

exports['input/edit/input'] = (get, $t) => 
		`<div class='input-edit-cnt' input-ref-id='` +
		$t.clean(get("input").id()) +
		`'> <label>Label</label> <input type='text' attr='label' value='` +
		$t.clean(get("input").label()) +
		`'/> <br> <label>Name</label> <input type='text' attr='name' value='` +
		$t.clean(get("input").name()) +
		`'/> <br> <label ` +
		$t.clean(get("input").list().length === 0 ? 'hidden' : '') +
		`>List</label> <div class='tab edit-input-list-cnt relative'> ` +
		$t.clean( new $t('1088583088').render(get("input").list(), 'key, value', get)) +
		` </div> <br> </div> `

exports['input/edit/list/object'] = (get, $t) => 
		`<div class='edit-input-list-obj tab'> ` +
		$t.clean( new $t('-2045511556').render(get("scope"), 'key, value', get)) +
		` </div> `

exports['-2045511556'] = (get, $t) => 
		`<div > <input type='text' value='` +
		$t.clean(get("key")) +
		`'/> = <input type='text' value='` +
		$t.clean(get("value")) +
		`'/> </div>`

exports['input/edit/list/string'] = (get, $t) => 
		`<input type='text' name='value' value='` +
		$t.clean(get("value")) +
		`'/> `

exports['input/edit/table'] = (get, $t) => 
		`<div class='input-edit-cnt' input-ref-id='` +
		$t.clean(get("table").id()) +
		`'> <label>Label</label> <input type='text' attr='label' value='` +
		$t.clean(get("table").label()) +
		`'/> <br> <label>Name</label> <input type='text' attr='name' value='` +
		$t.clean(get("table").name()) +
		`'/> <br> <div class='table-column-edit-cnt'> <label ` +
		$t.clean(get("table").columns().length === 0 ? 'hidden' : '') +
		`>Columns</label> ` +
		$t.clean(get("listHtml")(get("table").columns())) +
		`; <button id='table-column-edit-btn'>Apply</button> </div> <div class='table-row-edit-cnt'> <label ` +
		$t.clean(get("table").rows().length === 0 ? 'hidden' : '') +
		`>Rows</label> ` +
		$t.clean(get("listHtml")(get("table").rows())) +
		`; <button id='table-row-edit-btn'>Apply</button> </div> <br> </div> `

exports['input/input'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
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
		` ` +
		$t.clean(get("checked")()) +
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

exports['input/list'] = (get, $t) => 
		`<div class='input-cnt` +
		$t.clean(get("inline")() ? ' inline' : '') +
		`'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
		$t.clean(get("label")()) +
		`</label> ` +
		$t.clean( new $t('1682356664').render(get("list")(), 'input', get)) +
		` <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`' hidden>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `

exports['input/measurement'] = (get, $t) => 
		`<div class='fit input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
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
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
		$t.clean(get("label")()) +
		`</label> <div class='multiple-entry-cnt tab card ` +
		$t.clean(get("inline")() ? 'inline' : '') +
		`' id='` +
		$t.clean(get("id")()) +
		`'> ` +
		$t.clean( new $t('1507176312').render(get("list")(), 'inputArray', get)) +
		` </div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['input/number'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
		$t.clean(get("label")()) +
		`</label> <input class='` +
		$t.clean(get("class")()) +
		`' list='input-list-` +
		$t.clean(get("id")()) +
		`' id='` +
		$t.clean(get("id")()) +
		`' placeholder='` +
		$t.clean(get("placeholder")()) +
		`' type='number' name='` +
		$t.clean(get("name")()) +
		`' max='` +
		$t.clean(get("max")()) +
		`' min='` +
		$t.clean(get("min")()) +
		`' step='` +
		$t.clean(get("step")()) +
		`'> <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`' hidden>` +
		$t.clean(get("errorMsg")()) +
		`</div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['input/object'] = (get, $t) => 
		`<div class='input-cnt` +
		$t.clean(get("inline")() ? ' inline' : '') +
		`'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
		$t.clean(get("label")()) +
		`</label> ` +
		$t.clean( new $t('1682356664').render(get("list")(), 'input', get)) +
		` <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`' hidden>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `

exports['input/one-entry'] = (get, $t) => 
		`<span class='one-entry-cnt'> ` +
		$t.clean(get("html")()) +
		` </span> `

exports['input/radio-table'] = (get, $t) => 
		`<div class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
		$t.clean(get("label")()) +
		`</label> <br> <div class='tab'> <table border="1"> <tbody> <tr> <td></td> ` +
		$t.clean( new $t('1254550278').render(get("columns")(), 'name', get)) +
		` </tr> ` +
		$t.clean( new $t('-44250289').render(get("rowDetail")(), 'row', get)) +
		` </tbody> </table> </div> </div> `

exports['-54469610'] = (get, $t) => 
		`<td class='radio-table-input-cnt' > <input type='radio' name='` +
		$t.clean(get("row").name) +
		`' key='` +
		$t.clean(get("row").key) +
		`' value='` +
		$t.clean(get("col")) +
		`' ` +
		$t.clean(get("row").value === get("col") ? 'checked' : '') +
		`/> </td>`

exports['-44250289'] = (get, $t) => 
		`<tr > <td>` +
		$t.clean(get("row").label) +
		`</td> ` +
		$t.clean( new $t('-54469610').render(get("columns")(get("rowIndex")), 'col', get)) +
		` </tr>`

exports['input/radio'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
		$t.clean(get("label")() ? get("label")() +
		':' : '') +
		`</label> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <div class='inline tab'> ` +
		$t.clean( new $t('-2140138526').render(get("list")(), 'key, val', get)) +
		` </div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['-2140138526'] = (get, $t) => 
		`<span > <label>` +
		$t.clean(get("isArray")() ? get("val") : get("key")) +
		`</label> <input type='radio' ` +
		$t.clean((get("isArray")() ? get("val") : get("key")) === get("value")() ? 'checked' : '') +
		` class='` +
		$t.clean(get("class")()) +
		`' id='` +
		$t.clean(get("id")()) +
		`' name='` +
		$t.clean(get("uniqueName")()) +
		`' value='` +
		$t.clean(get("val")) +
		`'> &nbsp;&nbsp; </span>`

exports['input/select'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
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
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
		$t.clean(get("label")()) +
		`</label> <br> <div class='tab'> <table border="1"> <tbody> <tr> <td></td> ` +
		$t.clean( new $t('1254550278').render(get("columnNames")(), 'name', get)) +
		` </tr> ` +
		$t.clean( new $t('-808712670').render(get("rows")(), 'rowIndex, row', get)) +
		` </tbody> </table> </div> </` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		`> `

exports['-808712670'] = (get, $t) => 
		`<tr > <td>` +
		$t.clean(get("row")) +
		`</td> ` +
		$t.clean( new $t('976176139').render(get("columns")(get("rowIndex")), 'col', get)) +
		` </tr>`

exports['input/textarea'] = (get, $t) => 
		`<` +
		$t.clean(get("inline")() ? 'span' : 'div') +
		` class='input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		` input-id='` +
		$t.clean(get("id")()) +
		`'> <label>` +
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

exports['ancestry'] = (get, $t) => 
		`<div> <button id='modify-btn'>Modify</button> </div> <div id='config-body'></div> <div id='test-ground'></div> `

exports['configure'] = (get, $t) => 
		`<div> <button id='update-tree-display-btn'>Update</button> <button class='modify-edit' id='modify-btn'>Modify</button> </div> <div id='config-body'></div> <div id='test-ground'></div> `

exports['index'] = (get, $t) => 
		`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <script type="text/javascript" src='/mitch/js/index.js'></script> <script src="https://kit.fontawesome.com/234ae94193.js" crossorigin="anonymous"></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/styles/icons.css"> <link rel="stylesheet" href="/mitch/styles/mitch.css"> <title></title> </head> <body> ` +
		$t.clean(get("header")) +
		` ` +
		$t.clean(get("main")) +
		` ` +
		$t.clean(get("footer")) +
		` </body> </html> `

exports['playground'] = (get, $t) => 
		`<div> <button id='update-tree-display-btn'>Update</button> <button id='modify-btn'>Modify</button> </div> <div id='config-body'></div> <div id='test-ground'></div> `

exports['report'] = (get, $t) => 
		`<div> REPORT === ` +
		$t.clean(get("name")) +
		` </div> `

exports['reports'] = (get, $t) => 
		`<div> REPORTS === ` +
		$t.clean(get("name")) +
		` </div> `
