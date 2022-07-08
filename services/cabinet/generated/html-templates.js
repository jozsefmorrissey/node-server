
exports['101748844'] = (get, $t) => 
		`<span class='pad ` +
		$t.clean(get("class")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("input").html()) +
		` </span>`

exports['115117775'] = (get, $t) => 
		`<div ` +
		$t.clean(get("hideAll")(get("properties")) ? 'hidden' : '') +
		`> <div class="property-container close" radio-id='666'> <div class='` +
		$t.clean(get("key") ? "expand-header" : "") +
		`'> ` +
		$t.clean(get("key")) +
		` </div> <div id='config-expand-list-` +
		$t.clean(get("childIdMap")[get("key")]) +
		`' hidden> ` +
		$t.clean(get("childIdMap")[get("key")]) +
		` </div> </div> </div>`

exports['443122713'] = (get, $t) => 
		`<option value='` +
		$t.clean(get("section").prototype.constructor.name) +
		`' ` +
		$t.clean(get("opening").constructorId === get("section").name ? 'selected' : '') +
		`> ` +
		$t.clean(get("clean")(get("section").name)) +
		` </option>`

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

exports['714657883'] = (get, $t) => 
		`<div >` +
		$t.clean(get("groupHtml")(get("group"))) +
		`</div>`

exports['990870856'] = (get, $t) => 
		`<div class='inline' > <h3>` +
		$t.clean(get("assem").objId) +
		`</h3> <div> ` +
		$t.clean(get("getFeatureDisplay")(get("assem"))) +
		` </div> </div>`

exports['1036581066'] = (get, $t) => 
		`<div class='tab' > ` +
		$t.clean(get("property").name()) +
		` (` +
		$t.clean(get("property").code()) +
		`) </div>`

exports['1136490671'] = (get, $t) => 
		`<div class='model-label` +
		$t.clean(get("tdm").isTarget("part-name", get("partName")) ? " active" : "") +
		`' > <label type='part-name'>` +
		$t.clean(get("partName")) +
		`</label> <input type='checkbox' class='part-name-checkbox' part-name='` +
		$t.clean(get("partName")) +
		`' ` +
		$t.clean(!get("tdm").hidePartName(get("partName")) ? 'checked' : '') +
		`> ` +
		$t.clean( new $t('1686400020').render(get("partList"), 'part', get)) +
		` </div>`

exports['1410278299'] = (get, $t) => 
		`<span > <label>` +
		$t.clean(get("property").name()) +
		`</label> <input type='radio' name='` +
		$t.clean(get("key")) +
		`' prop-radio-update='` +
		$t.clean(get("property").id()) +
		`' ` +
		$t.clean(get("property").value() === true ? 'checked' : '') +
		`> </span>`

exports['1417643187'] = (get, $t) => 
		`<li name='` +
		$t.clean(get("property").name()) +
		`'> ` +
		$t.clean(get("property").name()) +
		` </li>`

exports['1686400020'] = (get, $t) => 
		`<div class='` +
		$t.clean(get("tdm").isTarget("part-code", get("part").partCode()) ? "active " : "") +
		` model-label indent' ` +
		$t.clean(get("partList").length > 1 ? "" : "hidden") +
		`> <label type='part-code'>` +
		$t.clean(get("part").partCode()) +
		`</label> <input type='checkbox' class='part-code-checkbox' part-code='` +
		$t.clean(get("part").partCode()) +
		`' ` +
		$t.clean(!get("tdm").hidePartCode(get("part").partCode()) ? 'checked' : '') +
		`> </div>`

exports['1818128950'] = (get, $t) => 
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
		$t.clean(get("getBody")(get("item"), get("key"))) +
		` </div> </div> </div>`

exports['1835219150'] = (get, $t) => 
		`<option value='` +
		$t.clean(get("isArray")() ? get("value") : get("key")) +
		`' ` +
		$t.clean(get("selected")(get("isArray")() ? get("value") : get("key")) ? 'selected' : '') +
		`> ` +
		$t.clean(get("value")) +
		` </option>`

exports['1927703609'] = (get, $t) => 
		`<div > ` +
		$t.clean(get("recurse")(get("key"), get("group"))) +
		` </div>`

exports['2055573719'] = (get, $t) => 
		`<div > ` +
		$t.clean(get("CostManager").headHtml(get("child"))) +
		` ` +
		$t.clean(get("CostManager").bodyHtml(get("child"))) +
		` </div>`

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
		$t.clean( new $t('1818128950').render(get("list")(), 'key, item', get)) +
		` <div class='expand-input-cnt' hidden>` +
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
		`'></div> </div> <div class="expand-body ` +
		$t.clean(get("type")()) +
		`"></div> </div> `

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
		`</div> <div class='input-open-cnt'>Add ` +
		$t.clean(get("listElemLable")()) +
		`</div> </div> <div> </div> <div class="expand-body ` +
		$t.clean(get("type")()) +
		`"> Hello World! </div> </div> `

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

exports['input/decision/decision'] = (get, $t) => 
		` <span class='decision-input-cnt' node-id='` +
		$t.clean(get("_nodeId")) +
		`' ` +
		$t.clean(get("reachable")() ? '' : 'hidden') +
		`> <span id='` +
		$t.clean(get("id")) +
		`' class='inline-flex'> ` +
		$t.clean( new $t('101748844').render(get("inputArray"), 'input', get)) +
		` </span> </span> `

exports['input/decision/decisionTree'] = (get, $t) => 
		`<div class='` +
		$t.clean(get("DecisionInputTree").class) +
		`' root-id='` +
		$t.clean(get("wrapper").nodeId()) +
		`'> ` +
		$t.clean(get("inputHtml")) +
		` <button class='` +
		$t.clean(get("DecisionInputTree").buttonClass) +
		`' root-id='` +
		$t.clean(get("wrapper").nodeId()) +
		`'' ` +
		$t.clean(get("tree").hideButton ? 'hidden' : '') +
		`> ` +
		$t.clean(get("tree").buttonText()) +
		` </button> </div> `

exports['input/input'] = (get, $t) => 
		`<div class='input-cnt'` +
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
		`'>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `

exports['-994603408'] = (get, $t) => 
		`<option value="` +
		$t.clean(get("item")) +
		`" ></option>`

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
		`'>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `

exports['input/select'] = (get, $t) => 
		`<div class='input-cnt'` +
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
		`'>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `

exports['2-d/pop-up/vertex-2d'] = (get, $t) => 
		`<div 2d-type='` +
		$t.clean(get("constructor").name) +
		`' id='` +
		$t.clean(get("id")()) +
		`'> <table> <tr> <td><label>X</label></td> <td><input class='2d-value' key='x' value='` +
		$t.clean(get("x")()) +
		`'></td> </tr> <tr> <td><label>Y</label></td> <td><input class='2d-value' key='y' value='` +
		$t.clean(get("y")()) +
		`'></td> </tr> <tr> <td colspan="2"><button class='2d-remove-btn'>Remove</button></td> </tr> <tr> </table> `

exports['2-d/pop-up/wall-2d'] = (get, $t) => 
		`<div 2d-type='` +
		$t.clean(get("constructor").name) +
		`' id='` +
		$t.clean(get("id")()) +
		`'> <button class='2d-add-door-btn'>Add Door</button> <button class='2d-add-window-btn'>Add Window</button> <button class='2d-add-vertex-btn'>Add Vertex</button> <button class='2d-remove-btn'>Remove</button> </div> `

exports['2-d/pop-up/window-2d'] = (get, $t) => 
		`<div 2d-type='` +
		$t.clean(get("constructor").name) +
		`' id='` +
		$t.clean(get("id")()) +
		`'> <table> <tr> <td colspan="2"><button class='2d-remove-btn'>Remove</button></td> </tr> <tr> <td><label>Height</label></td> <td><input class='2d-value' key='height' value='` +
		$t.clean(get("height")()) +
		`'></td> </tr> <tr> <td><label>Width</label></td> <td><input class='2d-value' key='width' value='` +
		$t.clean(get("width")()) +
		`'></td> </tr> <tr> <td><label>Distance From Previous Wall</label></td> <td><input class='2d-value' key='fromPreviousWall' value='` +
		$t.clean(get("fromPreviousWall")()) +
		`'></td> </tr> <tr> <td><label>Distance From Floor</label></td> <td><input class='2d-value' key='fromFloor' value='` +
		$t.clean(get("fromFloor")()) +
		`'></td> </tr> </table> </div> `

exports['2d/pop-up/door-2d'] = (get, $t) => 
		`<div type-2d='` +
		$t.clean(get("target").constructor.name) +
		`' id='` +
		$t.clean(get("target").id()) +
		`' x='` +
		$t.clean(get("lastImagePoint").x) +
		`' y='` +
		$t.clean(get("lastImagePoint").y) +
		`'> <table> <tr> <td><label>Height</label></td> <td><input class='value-2d' key='height' value='` +
		$t.clean(get("display")(get("target").height())) +
		`'></td> </tr> <tr> <td><label>Width</label></td> <td><input class='value-2d' key='width' value='` +
		$t.clean(get("display")(get("target").width())) +
		`'></td> </tr> <tr> <td><label>Distance From Floor</label></td> <td><input class='value-2d' key='fromFloor' value='` +
		$t.clean(get("display")(get("target").fromFloor())) +
		`'></td> </tr> <tr> <td> <button class='hinge-btn'>Hinge</button> </td> <td><button class='remove-btn-2d'>Remove</button></td> </tr> </table> </div> `

exports['2d/pop-up/line-measurment-2d'] = (get, $t) => 
		`<div type-2d='` +
		$t.clean(get("target").constructor.name) +
		`' id='` +
		$t.clean(get("target").id()) +
		`' x='` +
		$t.clean(get("lastImagePoint").x) +
		`' y='` +
		$t.clean(get("lastImagePoint").y) +
		`'> ` +
		$t.clean( new $t('-1881817601').render(get("UNITS"), 'property', get)) +
		` <br> <input type='text' class='measurment-mod' value='` +
		$t.clean(get("target").display()) +
		`'> </div> `

exports['2d/pop-up/vertex-2d'] = (get, $t) => 
		`<div type-2d='` +
		$t.clean(get("target").constructor.name) +
		`' id='` +
		$t.clean(get("target").id()) +
		`' x='` +
		$t.clean(get("lastImagePoint").x) +
		`' y='` +
		$t.clean(get("lastImagePoint").y) +
		`'> <table> <tr> <td><label>X</label></td> <td><input class='value-2d' key='x' value='` +
		$t.clean(get("display")(get("target").x())) +
		`'></td> </tr> <tr> <td><label>Y</label></td> <td><input class='value-2d' key='y' value='` +
		$t.clean(get("display")(get("target").y())) +
		`'></td> </tr> <tr> <td colspan="2"><button class='remove-btn-2d'>Remove</button></td> </tr> <tr> </table> </div> `

exports['2d/pop-up/wall-2d'] = (get, $t) => 
		`<div type-2d='` +
		$t.clean(get("target").constructor.name) +
		`' id='` +
		$t.clean(get("target").id()) +
		`' x='` +
		$t.clean(get("lastImagePoint").x) +
		`' y='` +
		$t.clean(get("lastImagePoint").y) +
		`'> <button class='add-door-btn-2d'>Add Door</button> <button class='add-window-btn-2d'>Add Window</button> <button class='add-vertex-btn-2d'>Add Vertex</button> <button class='add-object-btn-2d'>Add Object</button> <button class='remove-btn-2d'>Remove</button> </div> `

exports['2d/pop-up/window-2d'] = (get, $t) => 
		`<div type-2d='` +
		$t.clean(get("target").constructor.name) +
		`' id='` +
		$t.clean(get("target").id()) +
		`' x='` +
		$t.clean(get("lastImagePoint").x) +
		`' y='` +
		$t.clean(get("lastImagePoint").y) +
		`'> <table> <tr> <td><label>Height</label></td> <td><input class='value-2d' key='height' value='` +
		$t.clean(get("display")(get("target").height())) +
		`'></td> </tr> <tr> <td><label>Width</label></td> <td><input class='value-2d' key='width' value='` +
		$t.clean(get("display")(get("target").width())) +
		`'></td> </tr> <tr> <td><label>Distance From Floor</label></td> <td><input class='value-2d' key='fromFloor' value='` +
		$t.clean(get("display")(get("target").fromFloor())) +
		`'></td> </tr> <tr> <td colspan="2"><button class='remove-btn-2d'>Remove</button></td> </tr> </table> </div> `

exports['cabinet/body'] = (get, $t) => 
		`<div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` +
		$t.clean( new $t('-970877277').render(get("showTypes"), 'showType', get)) +
		` </select> </div> <div class='property-id-container center inline-flex'>` +
		$t.clean(get("selectHtml")) +
		`</div> <div class='right'> <select class="show-right-select"> ` +
		$t.clean( new $t('-970877277').render(get("showTypes"), 'showType', get)) +
		` </select> <label>Show Right</label> </div> </div> <br> <div class='center'> <button class='save-cabinet-btn' index='` +
		$t.clean(get("$index")) +
		`'>Save</button> </div> ` +
		$t.clean( new $t('-1702305177').render(get("cabinet").openings, 'opening', get)) +
		` </div> `

exports['-970877277'] = (get, $t) => 
		`<option >` +
		$t.clean(get("showType").name) +
		`</option>`

exports['-1702305177'] = (get, $t) => 
		`<div class='divison-section-cnt'> ` +
		$t.clean(get("OpenSectionDisplay").html(get("opening"))) +
		` </div>`

exports['cabinet/head'] = (get, $t) => 
		`<div class='cabinet-header'> ` +
		$t.clean(get("$index")) +
		`) <input class='cabinet-id-input' prop-update='` +
		$t.clean(get("$index")) +
		`.name' index='` +
		$t.clean(get("$index")) +
		`' display-id='` +
		$t.clean(get("displayId")) +
		`' value='` +
		$t.clean(get("cabinet").name()) +
		`'> Size: <div class='cabinet-dem-cnt'> <label>W:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.width' display-id='` +
		$t.clean(get("displayId")) +
		`' value='` +
		$t.clean(get("displayValue")(get("cabinet").width())) +
		`'> <label>H:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.length' display-id='` +
		$t.clean(get("displayId")) +
		`' value='` +
		$t.clean(get("displayValue")(get("cabinet").length())) +
		`'> <label>D:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.thickness' display-id='` +
		$t.clean(get("displayId")) +
		`' value='` +
		$t.clean(get("displayValue")(get("cabinet").thickness())) +
		`'> </div> </div> `

exports['display-manager'] = (get, $t) => 
		`<div class='display-manager' id='` +
		$t.clean(get("id")) +
		`'> ` +
		$t.clean( new $t('-1519826343').render(get("list"), 'item', get)) +
		` </div> `

exports['-1519826343'] = (get, $t) => 
		`<div class='display-manager-item'> <input class='display-manager-input` +
		$t.clean(get("$index") === 0 ? " active" : "") +
		`' type='button' display-id='` +
		$t.clean(get("item").id) +
		`' value='` +
		$t.clean(get("item").name) +
		`'/> </div>`

exports['divide/body'] = (get, $t) => 
		`<h2>` +
		$t.clean(get("list").activeKey()) +
		`</h2> val: ` +
		$t.clean(get("list").value()('selected')) +
		` `

exports['divide/head'] = (get, $t) => 
		`<div> <select value='` +
		$t.clean(get("opening").name) +
		`' class='open-divider-select` +
		$t.clean(get("sections").length === 0 ? ' hidden' : '') +
		`'> ` +
		$t.clean( new $t('443122713').render(get("sections"), 'section', get)) +
		` </select> <div class='open-divider-select` +
		$t.clean(get("sections").length === 0 ? '' : ' hidden') +
		`'> D </div> </div> `

exports['divider-controls'] = (get, $t) => 
		`<div> <label>Dividers:</label> <input class='division-pattern-input' type='text' name='pattern' opening-id='` +
		$t.clean(get("opening").uniqueId()) +
		`' value='` +
		$t.clean(get("opening").pattern().str) +
		`'> <span class="open-orientation-radio-cnt"> <label for='open-orientation-horiz-` +
		$t.clean(get("opening").uniqueId()) +
		`'>Horizontal:</label> <input type='radio' name='orientation-` +
		$t.clean(get("opening").uniqueId()) +
		`' value='horizontal' open-id='` +
		$t.clean(get("opening").uniqueId()) +
		`' id='open-orientation-horiz-` +
		$t.clean(get("opening").uniqueId()) +
		`' class='open-orientation-radio' ` +
		$t.clean(get("opening").value('vertical') ? '' : 'checked') +
		`> <label for='open-orientation-vert-` +
		$t.clean(get("opening").uniqueId()) +
		`'>Vertical:</label> <input type='radio' name='orientation-` +
		$t.clean(get("opening").uniqueId()) +
		`' value='vertical' open-id='` +
		$t.clean(get("opening").uniqueId()) +
		`' id='open-orientation-vert-` +
		$t.clean(get("opening").uniqueId()) +
		`' class='open-orientation-radio' ` +
		$t.clean(get("opening").value('vertical') ? 'checked' : '') +
		`> </span> <div class='open-pattern-input-cnt' opening-id='` +
		$t.clean(get("opening").uniqueId()) +
		`' ` +
		$t.clean(get("opening").pattern().equal ? 'hidden' : '') +
		`> ` +
		$t.clean(get("patternInputHtml")) +
		` </div> </div> `

exports['feature'] = (get, $t) => 
		`<h3>Feature Display</h3> `

exports['group/body'] = (get, $t) => 
		`<div> ` +
		$t.clean(get("propertyHtml")()) +
		` <div class='cabinet-cnt' group-id='` +
		$t.clean(get("group").id()) +
		`'></div> </div> `

exports['group/head'] = (get, $t) => 
		`<div group-display-id='` +
		$t.clean(get("groupDisplay").id()) +
		`'> <div class='expand-header group-display-header' group-id='` +
		$t.clean(get("group").id()) +
		`'> ` +
		$t.clean(get("$index")) +
		`<input class='group-input' group-id='` +
		$t.clean(get("group").id()) +
		`' value='` +
		$t.clean(get("group").name()) +
		`' prop-update='name'> </div> <div class='group-display-body' hidden></div> </div> <br> `

exports['login/confirmation-message'] = (get, $t) => 
		`<h3> Check your email for confirmation. </h3> <button id='resend-activation'>Resend</button> `

exports['login/create-account'] = (get, $t) => 
		`<h3>Create An Account</h3> <input type='text' placeholder="email" name='email' value='` +
		$t.clean(get("email")) +
		`'> <input type='password' placeholder="password" name='password' value='` +
		$t.clean(get("password")) +
		`'> <br><br> <button id='register'>Register</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='LOGIN'>Login</a> `

exports['login/login'] = (get, $t) => 
		`<h3>Login</h3> <input type='text' placeholder="email" name='email' value='` +
		$t.clean(get("email")) +
		`'> <input type='password' placeholder="password" name='password' value='` +
		$t.clean(get("password")) +
		`'> <br><br> <button id='login-btn'>Login</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `

exports['login/reset-password'] = (get, $t) => 
		`<h3>Reset Password</h3> <input type='text' placeholder="email" name='email' value='` +
		$t.clean(get("email")) +
		`'> <input type='password' placeholder="password" name='password' value='` +
		$t.clean(get("password")) +
		`'> <br><br> <button id='reset-password'>Reset</button> <br><br> <a href='#' user-state='LOGIN'>Login</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `

exports['managers/abstract-manager'] = (get, $t) => 
		`<div> <div class="center"> <h2 id='` +
		$t.clean(get("headerId")) +
		`'> ` +
		$t.clean(get("header")) +
		` <button class='manager-save-btn' id='` +
		$t.clean(get("saveBtnId")) +
		`'>Save</button> </h2> </div> <div id="` +
		$t.clean(get("bodyId")) +
		`"></div> </div> `

exports['managers/cost/body'] = (get, $t) => 
		`<div hidden> <div> <span> ` +
		$t.clean(get("CostManager").nodeInputHtml()) +
		` <button>Add Cost</button> <button>Add Node</button> </span> <span> Cost Display </span> </div> ` +
		$t.clean( new $t('2055573719').render(get("node").children(), 'child', get)) +
		` </div> `

exports['managers/cost/head'] = (get, $t) => 
		`<div class='expand-header' node-id='` +
		$t.clean(get("node").nodeId()) +
		`'> <b> ` +
		$t.clean(get("node").payload().name()) +
		` - ` +
		$t.clean(get("node").payload().type()) +
		` </b> <ul> ` +
		$t.clean( new $t('1417643187').render(get("node").payload().requiredProperties, 'property', get)) +
		` </ul> </div> `

exports['managers/cost/main'] = (get, $t) => 
		`<div> <div class="center"> <h2 id='cost-manager-header'> Cost Tree Manager </h2> </div> ` +
		$t.clean( new $t('-496477131').render(get("root")().children(), 'child', get)) +
		` <button id='cost-manager-save-btn'>Save</button> </div> `

exports['-496477131'] = (get, $t) => 
		`<div class='expandable-list cost-tree' radio-id='poo'> ` +
		$t.clean(get("headHtml")(get("child"))) +
		` ` +
		$t.clean(get("bodyHtml")(get("child"))) +
		` </div>`

exports['managers/cost/property-select'] = (get, $t) => 
		`<div> ` +
		$t.clean( new $t('-1569738859').render(get("groups"), 'group, properties', get)) +
		` </div> `

exports['-1569738859'] = (get, $t) => 
		`<div > <b>` +
		$t.clean(get("group")) +
		` (` +
		$t.clean(get("abbriviation")(get("group"))) +
		`)</b> ` +
		$t.clean( new $t('1036581066').render(get("properties"), 'property', get)) +
		` </div>`

exports['managers/cost/types/labor'] = (get, $t) => 
		`<div cost-id='` +
		$t.clean(get("cost").uniqueId()) +
		`'> <b>Labor</b> <span` +
		$t.clean(get("cost").length() === undefined ? ' hidden' : '') +
		`> <input value='` +
		$t.clean(get("cost").length()) +
		`'> </span> <span` +
		$t.clean(get("cost").width() === undefined ? ' hidden' : '') +
		`> <label>X</label> <input value='` +
		$t.clean(get("cost").width()) +
		`'> </span> <span` +
		$t.clean(get("cost").depth() === undefined ? ' hidden' : '') +
		`> <label>X</label> <input value='` +
		$t.clean(get("cost").depth()) +
		`'> </span> <br> <div> <label>Cost</label> <input value='` +
		$t.clean(get("cost").cost()) +
		`'> <label>Per ` +
		$t.clean(get("cost").unitCost('name')) +
		` = ` +
		$t.clean(get("cost").unitCost('value')) +
		`</label> </div> </div> `

exports['managers/cost/types/material'] = (get, $t) => 
		`<div cost-id='` +
		$t.clean(get("cost").uniqueId()) +
		`'> <b>Material</b> <span` +
		$t.clean(get("cost").length() === undefined ? ' hidden' : '') +
		`> <input value='` +
		$t.clean(get("cost").length()) +
		`'> </span> <span` +
		$t.clean(get("cost").width() === undefined ? ' hidden' : '') +
		`> <label>X</label> <input value='` +
		$t.clean(get("cost").width()) +
		`'> </span> <span` +
		$t.clean(get("cost").depth() === undefined ? ' hidden' : '') +
		`> <label>X</label> <input value='` +
		$t.clean(get("cost").depth()) +
		`'> </span> <br> <div> <label>Cost</label> <input value='` +
		$t.clean(get("cost").cost()) +
		`'> <label>Per ` +
		$t.clean(get("cost").unitCost('name')) +
		` = ` +
		$t.clean(get("cost").unitCost('value')) +
		`</label> </div> </div> `

exports['managers/property/body'] = (get, $t) => 
		`<div> No Need </div> `

exports['managers/property/header'] = (get, $t) => 
		`<div> <b>` +
		$t.clean(get("instance").name) +
		` (` +
		$t.clean(get("instance").constructor.code) +
		`) - ` +
		$t.clean(get("instance").value) +
		`</b> </div> `

exports['managers/template/body'] = (get, $t) => 
		`<div> <span> <input value='` +
		$t.clean(get("instance").length()) +
		`'> </span> <span> <label>X</label> <input value='` +
		$t.clean(get("instance").width()) +
		`'> </span> <span> <label>X</label> <input value='` +
		$t.clean(get("instance").depth()) +
		`'> </span> <label>Cost</label> <input value='` +
		$t.clean(get("instance").cost()) +
		`'> <br> <label>Per ` +
		$t.clean(get("instance").unitCost().name) +
		` = ` +
		$t.clean(get("instance").unitCost().value) +
		` </div> `

exports['managers/template/header'] = (get, $t) => 
		`<div> <b>` +
		$t.clean(get("instance").id()) +
		` - ` +
		$t.clean(get("instance").constructor.name) +
		` (` +
		$t.clean(get("instance").method()) +
		`)</b> </div> `

exports['model-controller'] = (get, $t) => 
		`<div> <div class='model-selector'> <div ` +
		$t.clean(get("group").level === -1 ? 'hidden' : '') +
		`> <div class='` +
		$t.clean(get("tdm").isTarget("prefix", get("group").prefix) ? "active " : "") +
		` ` +
		$t.clean(get("label") ? "prefix-switch model-label" : "") +
		`' ` +
		$t.clean(!get("label") ? 'hidden' : '') +
		`> <label type='prefix'>` +
		$t.clean(get("label")) +
		`</label> <input type='checkbox' class='prefix-checkbox' prefix='` +
		$t.clean(get("group").prefix) +
		`' ` +
		$t.clean(!get("tdm").hidePrefix(get("label")) ? 'checked' : '') +
		`> </div> <div class='` +
		$t.clean(get("label") ? "prefix-body indent" : "") +
		`' ` +
		$t.clean(get("label") ? 'hidden' : '') +
		`> ` +
		$t.clean( new $t('1136490671').render(get("group").parts, 'partName, partList', get)) +
		` </div> </div> ` +
		$t.clean( new $t('model-controller').render(get("group").groups, 'label, group', get)) +
		` </div> </div> `

exports['opening'] = (get, $t) => 
		`<div class='opening-cnt' opening-id='` +
		$t.clean(get("opening").uniqueId()) +
		`'> <div class='divider-controls'> </div> </div> <div id='` +
		$t.clean(get("openDispId")) +
		`'> </div> `

exports['order/body'] = (get, $t) => 
		`<div order-id='` +
		$t.clean(get("order").id()) +
		`'> <b>` +
		$t.clean(get("order").name()) +
		`</b> <ul id='order-nav' class='center toggle-display-list'> <li class='toggle-display-item active' display-id='builder-display-` +
		$t.clean(get("$index")) +
		`'>Builder</li> <li class='toggle-display-item' display-id='information-display-` +
		$t.clean(get("$index")) +
		`'>Information</li> </ul> <div id='builder-display-` +
		$t.clean(get("$index")) +
		`'> <b>` +
		$t.clean(get("order").name()) +
		`</b> <button class='save-order-btn' index='` +
		$t.clean(get("$index")) +
		`'>Save</button> <div id='room-pills'>RoomPills!</div> </div> <div id='information-display-` +
		$t.clean(get("$index")) +
		`' hidden> <utility-filter id='uf-info-` +
		$t.clean(get("$index")) +
		`' edit='true'> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> </div> </div> `

exports['order/builder/body'] = (get, $t) => 
		`<div> <b>` +
		$t.clean(get("order").name) +
		`</b> <button class='save-order-btn' index='` +
		$t.clean(get("$index")) +
		`'>Save</button> <div id='room-pills'>RoomPills!</div> </div> `

exports['order/builder/head'] = (get, $t) => 
		`<h3 class='margin-zero'> ` +
		$t.clean(get("order").name) +
		` </h3> `

exports['order/head'] = (get, $t) => 
		`<h3 class='margin-zero'> ` +
		$t.clean(get("order").name()) +
		` </h3> `

exports['order/information/body'] = (get, $t) => 
		`<utility-filter hidden> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> `

exports['order/information/head'] = (get, $t) => 
		`<b>Information</b> `

exports['properties/config-body'] = (get, $t) => 
		`<div> ` +
		$t.clean( new $t('-302479018').render(get("properties"), 'property', get)) +
		` <button class='save-change' properties-id='` +
		$t.clean(get("properties")._ID) +
		`' ` +
		$t.clean(get("changed")(get("properties")._ID) ? '' : 'hidden') +
		`> Save </button> </div> `

exports['-302479018'] = (get, $t) => 
		`<div class='property-cnt' > <label>` +
		$t.clean(get("property").name()) +
		`</label> <span ` +
		$t.clean(get("property").measurementId() ? '' : 'hidden') +
		`> <input type="text" prop-value-update='` +
		$t.clean(get("property").id()) +
		`' value="` +
		$t.clean(get("property").display()) +
		`" measurement-id='` +
		$t.clean(get("property").measurementId()) +
		`'> </span> <span ` +
		$t.clean((typeof (get("property").value())) === 'boolean' ? '' : 'hidden') +
		`> <input type="checkbox" prop-boolean-update='` +
		$t.clean(get("property").id()) +
		`' ` +
		$t.clean(get("property").value() === true ? 'checked' : '') +
		`> </span> </div>`

exports['properties/config-body0'] = (get, $t) => 
		`<div> ` +
		$t.clean( new $t('-179269626').render(get("properties"), 'property', get)) +
		` <button class='save-change' properties-id='` +
		$t.clean(get("properties")._ID) +
		`' ` +
		$t.clean(get("changed")(get("properties")._ID) ? '' : 'hidden') +
		`> Save </button> </div> `

exports['-179269626'] = (get, $t) => 
		`<div class='property-cnt' > <label>` +
		$t.clean(get("property").name()) +
		`</label> <input type="text" prop-value-update='` +
		$t.clean(get("property").id()) +
		`' value="` +
		$t.clean(get("property").display()) +
		`" measurement-id='` +
		$t.clean(get("property").measurementId()) +
		`'> </div>`

exports['properties/config-head'] = (get, $t) => 
		`` +
		$t.clean(get("name")) +
		` `

exports['properties/config-head0'] = (get, $t) => 
		`` +
		$t.clean(get("name")) +
		` `

exports['properties/properties'] = (get, $t) => 
		`<div class='center'> <div class='center'> <label>UNIT :&nbsp;&nbsp;&nbsp;&nbsp;</label> ` +
		$t.clean( new $t('-766481261').render(get("Properties").UNITS, 'property', get)) +
		` </div> ` +
		$t.clean( new $t('115117775').render(get("values"), 'key, properties', get)) +
		` </div> `

exports['-766481261'] = (get, $t) => 
		`<span > <label>` +
		$t.clean(get("property").name()) +
		`</label> <input type='radio' name='UNIT' prop-radio-update='` +
		$t.clean(get("property").id()) +
		`' value="` +
		$t.clean(get("property").name()) +
		`" ` +
		$t.clean(get("property").value() === true ? 'checked' : '') +
		`> </span>`

exports['properties/properties0'] = (get, $t) => 
		`<div class='center'> <div class='` +
		$t.clean(get("key") ? "property-container close" : "") +
		`' radio-id='` +
		$t.clean(get("radioId")) +
		`' ` +
		$t.clean(get("noChildren")() ? 'hidden' : '') +
		`> <div class='` +
		$t.clean(get("key") ? "expand-header" : "") +
		`'> ` +
		$t.clean(get("label")) +
		` </div> <div` +
		$t.clean(get("key") ? ' hidden' : '') +
		`> <div` +
		$t.clean(get("branch") ? ' hidden' : '') +
		`> <div id='config-expand-list-` +
		$t.clean(get("uniqueId")) +
		`'></div> ` +
		$t.clean( new $t('1927703609').render(get("groups"), 'key, group', get)) +
		` </div> </div> </div> </div> `

exports['properties/property-menu'] = (get, $t) => 
		`MeNu <div class='cabinet-style-selector-cnt'>` +
		$t.clean(get("styleSelector")()) +
		`</div> `

exports['properties/radio'] = (get, $t) => 
		`<div class='center'> <label>` +
		$t.clean(get("key")) +
		`:&nbsp;&nbsp;&nbsp;&nbsp;</label> ` +
		$t.clean( new $t('1410278299').render(get("values"), 'property', get)) +
		` </div> `

exports['properties/unit'] = (get, $t) => 
		`<div> <label>Standard</label> <input type='radio' name='unit' ` +
		$t.clean(get("unit").value() === 'Imperial (US)' ? 'checked' : '') +
		` value='Imperial (US)'> <label>Metric</label> <input type='radio' name='unit' ` +
		$t.clean(get("unit").value() === 'Metric' ? 'checked' : '') +
		` value='Metric'> </div> `

exports['room/body'] = (get, $t) => 
		`<div> ` +
		$t.clean( new $t('714657883').render(get("room").groups, 'group', get)) +
		` <div> <button class='group-add-btn' room-id='` +
		$t.clean(get("room").id()) +
		`'>Add Group</button> </div> </div> `

exports['room/head'] = (get, $t) => 
		`<b>` +
		$t.clean(get("room").name()) +
		`</b> `

exports['sections/divider'] = (get, $t) => 
		`<h2>Divider: ` +
		$t.clean(get("list").activeKey()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['sections/door'] = (get, $t) => 
		`<h2>DoorSection(` +
		$t.clean(get("list").activeKey()) +
		`):</h2> <br><br> <div> ` +
		$t.clean( new $t('990870856').render(get("assemblies"), 'assem', get)) +
		` </div> `

exports['sections/drawer'] = (get, $t) => 
		`<h2>Drawer: ` +
		$t.clean(get("list").activeKey()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['sections/dual-door'] = (get, $t) => 
		`<h2>Dual Door: ` +
		$t.clean(get("list").activeKey()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['sections/false-front'] = (get, $t) => 
		`<h2>False Front: ` +
		$t.clean(get("list").activeKey()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['sections/open'] = (get, $t) => 
		`<h2>Open: ` +
		$t.clean(get("list").activeKey()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['units'] = (get, $t) => 
		`<label>UNIT :&nbsp;&nbsp;&nbsp;&nbsp;</label> ` +
		$t.clean( new $t('-766481261').render(get("UNITS"), 'property', get)) +
		` `

exports['-1881817601'] = (get, $t) => 
		`<span > <label>` +
		$t.clean(get("property").name()) +
		`</label> <input type='radio' name='UNIT2' prop-radio-update='` +
		$t.clean(get("property").id()) +
		`' value="` +
		$t.clean(get("property").name()) +
		`" ` +
		$t.clean(get("property").value() === true ? 'checked' : '') +
		`> </span>`
