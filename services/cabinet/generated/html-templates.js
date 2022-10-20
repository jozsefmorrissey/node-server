
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

exports['770968599'] = (get, $t) => 
		`<div part-id='` +
		$t.clean(get("part").uniqueId()) +
		`' part-code='` +
		$t.clean(get("part").partCode()) +
		`' class='` +
		$t.clean(get("tdm").isTarget("part-id", get("part").uniqueId()) ? "active " : "") +
		` model-label indent' ` +
		$t.clean(get("partList").length > 1 ? "" : "hidden") +
		`> <label type='part-id' part-id='` +
		$t.clean(get("part").uniqueId()) +
		`' part-code='` +
		$t.clean(get("part").partCode()) +
		`'> ` +
		$t.clean(get("part").partCode()) +
		`-` +
		$t.clean(get("$index") +
		1) +
		` </label> <input type='checkbox' class='part-id-checkbox' part-id='` +
		$t.clean(get("part").uniqueId()) +
		`' part-code='` +
		$t.clean(get("part").partCode()) +
		`' ` +
		$t.clean(!get("tdm").hidePartId(get("part").uniqueId()) ? 'checked' : '') +
		`> </div>`

exports['987967094'] = (get, $t) => 
		`<span > <label>` +
		$t.clean(get("property").name()) +
		`</label> <input class='transparent' type='radio' name='UNIT2' prop-radio-update='` +
		$t.clean(get("property").id()) +
		`' value="` +
		$t.clean(get("property").name()) +
		`" ` +
		$t.clean(get("property").value() === true ? 'checked' : '') +
		`> </span>`

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

exports['1160200676'] = (get, $t) => 
		`<div class='model-label` +
		$t.clean(get("tdm").isTarget("part-name", get("partName")) ? " active" : "") +
		`' > <label type='part-name'>` +
		$t.clean(get("partName")) +
		`</label> <input type='checkbox' class='part-name-checkbox' part-name='` +
		$t.clean(get("partName")) +
		`' ` +
		$t.clean(!get("tdm").hidePartName(get("partName")) ? 'checked' : '') +
		`> ` +
		$t.clean( new $t('770968599').render(get("partList"), 'part', get)) +
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

exports['input/select'] = (get, $t) => 
		`<` +
		$t.clean(get("inline") ? 'span' : 'div') +
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
		$t.clean(get("inline") ? 'span' : 'div') +
		`> `

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
		`'></td> </tr> <tr> <td> <button class='hinge-btn transparent'>Hinge</button> </td> <td><button class='remove-btn-2d transparent'>Remove</button></td> </tr> </table> </div> `

exports['2d/pop-up/snap-2d'] = (get, $t) => 
		`<div type-2d='` +
		$t.clean(get("target").parent().constructor.name) +
		`' id='` +
		$t.clean(get("target").parent().id()) +
		`' x='` +
		$t.clean(get("lastImagePoint").x) +
		`' y='` +
		$t.clean(get("lastImagePoint").y) +
		`'> <label>Name</label> <input class='value-2d' member='object' type="text" key="name" value="` +
		$t.clean(get("target").parent().name()) +
		`"> <br><br> <label>Width</label> <input class='value-2d' member='cabinet' type="text" key="width" value="` +
		$t.clean(get("display")(get("target").width())) +
		`"> <br> <label>Depth</label> <input class='value-2d' member='cabinet' type="text" key="thickness" value="` +
		$t.clean(get("display")(get("target").height())) +
		`"> <br> <label>Angle</label> <input class='value-2d' member='snap' type="text" convert='false' key="angle" value="` +
		$t.clean(get("target").angle()) +
		`"> <br> <label>X</label> <input class='value-2d' member='snap' type="text" key="x" value="` +
		$t.clean(get("display")(get("target").x())) +
		`"> <br> <label>Y</label> <input class='value-2d' member='snap' type="text" key="y" value="` +
		$t.clean(get("display")(get("target").y())) +
		`"> <br> <button class='remove-btn-2d transparent'>Remove</button> </div> `

exports['2d/pop-up/line-measurement-2d'] = (get, $t) => 
		`<div type-2d='` +
		$t.clean(get("target").constructor.name) +
		`' id='` +
		$t.clean(get("target").id()) +
		`' x='` +
		$t.clean(get("lastImagePoint").x) +
		`' y='` +
		$t.clean(get("lastImagePoint").y) +
		`'> ` +
		$t.clean( new $t('987967094').render(get("UNITS"), 'property', get)) +
		` <br> <input type='text' class='measurement-mod transparent' value='` +
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
		`'></td> </tr> <tr> <td colspan="2"><button class='remove-btn-2d transparent'>Remove</button></td> </tr> <tr> </table> </div> `

exports['2d/pop-up/wall-2d'] = (get, $t) => 
		`<div type-2d='` +
		$t.clean(get("target").constructor.name) +
		`' id='` +
		$t.clean(get("target").id()) +
		`' x='` +
		$t.clean(get("lastImagePoint").x) +
		`' y='` +
		$t.clean(get("lastImagePoint").y) +
		`'> <button class='add-door-btn-2d transparent'>Add Door</button> <button class='add-window-btn-2d transparent'>Add Window</button> <button class='add-vertex-btn-2d transparent'>Add Vertex</button> <button class='add-object-btn-2d transparent'>Add Object</button> <button class='remove-btn-2d transparent'>Remove</button> </div> `

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
		`<div class='cabinet-header' cabinet-id='` +
		$t.clean(get("cabinet").uniqueId()) +
		`'> ` +
		$t.clean(get("$index")) +
		`) <input class='cabinet-id-input' prop-update='` +
		$t.clean(get("$index")) +
		`.name' index='` +
		$t.clean(get("$index")) +
		`' display-id='` +
		$t.clean(get("displayId")) +
		`' value='` +
		$t.clean(get("cabinet").name()) +
		`'> Size: <div class='cabinet-dem-cnt' cabinet-id='` +
		$t.clean(get("cabinet").uniqueId()) +
		`'> <label>W:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.width' name='width' display-id='` +
		$t.clean(get("displayId")) +
		`' value='` +
		$t.clean(get("displayValue")(get("cabinet").width())) +
		`'> <label>H:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.length' name='length' display-id='` +
		$t.clean(get("displayId")) +
		`' value='` +
		$t.clean(get("displayValue")(get("cabinet").length())) +
		`'> <label>D:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.thickness' name='thickness' display-id='` +
		$t.clean(get("displayId")) +
		`' value='` +
		$t.clean(get("displayValue")(get("cabinet").thickness())) +
		`'> </div> </div> `

exports['display-manager'] = (get, $t) => 
		`<div class='display-manager' id='` +
		$t.clean(get("id")) +
		`'> ` +
		$t.clean( new $t('-533097724').render(get("list"), 'item', get)) +
		` </div> `

exports['-533097724'] = (get, $t) => 
		`<span class='display-manager-item'> <button class='display-manager-input` +
		$t.clean(get("$index") === 0 ? " active" : "") +
		`' type='button' display-id='` +
		$t.clean(get("item").id) +
		`' link='` +
		$t.clean(get("link")) +
		`'>` +
		$t.clean(get("item").name) +
		`</button> </span>`

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

exports['feature'] = (get, $t) => 
		`<h3>Feature Display</h3> `

exports['group/body'] = (get, $t) => 
		`<div class='group-cnt'> <div class='group-header' cab-style='Inset' ` +
		$t.clean(get("group").propertyConfig.isInset() ? '' : 'hidden') +
		`> <h2>Inset <b class='group-key'>` +
		$t.clean(get("group").propertyConfig('Inset').__KEY) +
		`</b></h2> </div> <div class='group-header' cab-style='Overlay' ` +
		$t.clean(!get("group").propertyConfig.isInset() && !get("group").propertyConfig.isReveal() ? '' : 'hidden') +
		`> <h2>Overlay <b class='group-key'>` +
		$t.clean(get("group").propertyConfig('Overlay').__KEY) +
		`</b></h2> </div> <div class='group-header' cab-style='Reveal' ` +
		$t.clean(get("group").propertyConfig.isReveal() ? '' : 'hidden') +
		`> <h2>Reveal <b class='group-key'>` +
		$t.clean(get("group").propertyConfig('Reveal').__KEY) +
		`</b></h2> </div> ` +
		$t.clean(get("propertyHtml")()) +
		` <div class='cabinet-cnt' group-id='` +
		$t.clean(get("group").id()) +
		`'></div> </div> `

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

exports['index'] = (get, $t) => 
		`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <style> /* #two-d-model { width: 500px; height:500px;} */ div { font-size:x-small; } </style> <script type="text/javascript" src='/cabinet/js/index.js'></script> <link rel="stylesheet" href="/styles/expandable-list.css"> <link rel="stylesheet" href="/cabinet/styles/estimate.css"> <script src="/js/utility-filter.js" run-type='auto'></script> <title>Estimate</title> </head> <body> <button id='menu-btn'>&#8801;</button> <div id='menu' hidden></div> <div id='login'><div id='login-cnt' class='center-all'></div></div> <div id='display-ctn'> <div id='app' name='Orders' ` +
		$t.clean(get("id") !== 'home' ? "link='/cabinet/home'" : '') +
		` hidden> <div id='order-cnt'></div> <div id='model-cnt'> <div id='display-menu'></div> <div id='model-display-cnt'> <canvas id="two-d-model"></canvas> <div id="three-d-model" class="viewer small"> <span id="model-controller"></span> <span id="three-d-model-display"></span> </div> </div> </div> </div> <div name='Property Manager' ` +
		$t.clean(get("id") !== 'home' ? "link='/cabinet/property'" : '') +
		` id='property-manager-cnt' hidden> <div class='center'> <button id='property-manager-save-all'>Save All</button> </div> <div id='property-manager'></div> </div> <div id='cost-manager' "link='/cabinet/cost'" name='Cost Manager' ` +
		$t.clean(get("id") !== 'cost' ? "link='/cabinet/cost'" : '') +
		` hidden></div> <div id='template-manager' name='Template Manager' ` +
		$t.clean(get("id") !== 'template' ? "link='/cabinet/template'" : '') +
		` hidden>Temp Man</div> <div id='pattern-manager' name='Pattern Manager' ` +
		$t.clean(get("id") !== 'home' ? "link='/cabinet/pattern'" : '') +
		` hidden>Pat Man</div> </div> <div id='property-select-cnt'></div> </body> </html> `

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

exports['input/input'] = (get, $t) => 
		`<` +
		$t.clean(get("inline") ? 'span' : 'div') +
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
		$t.clean(get("inline") ? 'span' : 'div') +
		`> `

exports['-994603408'] = (get, $t) => 
		`<option value="` +
		$t.clean(get("item")) +
		`" ></option>`

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

exports['login/reset-password'] = (get, $t) => 
		`<h3>Reset Password</h3> <input type='text' placeholder="email" name='email' value='` +
		$t.clean(get("email")) +
		`'> <input type='password' placeholder="password" name='password' value='` +
		$t.clean(get("password")) +
		`'> <br><br> <button id='reset-password'>Reset</button> <br><br> <a href='#' user-state='LOGIN'>Login</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `

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

exports['managers/template/head'] = (get, $t) => 
		`<div> <b>` +
		$t.clean(get("template").type()) +
		`</b> </div> `

exports['managers/template/body'] = (get, $t) => 
		`<div class='template-body' template-id=` +
		$t.clean(get("template").id()) +
		`> <div class='inline-flex full-width'> <h4>` +
		$t.clean(get("template").type()) +
		`</h4> <div class='full-width'> <button class='copy-template right'>Copy</button> <button class='paste-template right'>Paste</button> </div> </div> <span class='part-input-cnt'> <br> <input type="text" name="partSelector" list='part-list'> <datalist id='part-list'></datalist> </span> <input class='cabinet-input dem' type="text" name="width" value="` +
		$t.clean(get("toDisplay")(get("template").width())) +
		`"> X <input class='cabinet-input dem' type="text" name="height" value="` +
		$t.clean(get("toDisplay")(get("template").height())) +
		`"> X <input class='cabinet-input dem' type="text" name="thickness" value="` +
		$t.clean(get("toDisplay")(get("template").thickness())) +
		`"> <div template-id='` +
		$t.clean(get("template").id()) +
		`' class='cabinet-template-input-cnt'> <div class='expand-header'>Values</div> <div hidden class="` +
		$t.clean(get("containerClasses").values) +
		`"></div> </div> <div template-id='` +
		$t.clean(get("template").id()) +
		`' class='cabinet-template-input-cnt'> <div class='expand-header'>Subassemblies</div> <div hidden class="` +
		$t.clean(get("containerClasses").subassemblies) +
		`">2</div> </div> <div template-id='` +
		$t.clean(get("template").id()) +
		`' class='cabinet-template-input-cnt'> <div class='expand-header'>Joints</div> <div hidden class="` +
		$t.clean(get("containerClasses").joints) +
		`">3</div> </div> <div template-id='` +
		$t.clean(get("template").id()) +
		`' class='cabinet-template-input-cnt'> <div class='expand-header'>Divider Joint</div> <div hidden class="` +
		$t.clean(get("containerClasses").dividerJoint) +
		`"> ` +
		$t.clean(get("dividerJointInput").html()) +
		` </div> </div> <div template-id='` +
		$t.clean(get("template").id()) +
		`' class='cabinet-template-input-cnt'> <div class='expand-header'>Opening Border Part Codes</div> <div hidden class="` +
		$t.clean(get("containerClasses").openings) +
		`">5</div> </div> <div template-id='` +
		$t.clean(get("template").id()) +
		`' class='cabinet-template-input-cnt'> <div class='expand-header'>View Shape</div> <div hidden>` +
		$t.clean(get("templateShapeInput").html()) +
		`</div> </div> </div> `

exports['managers/template/joints/body'] = (get, $t) => 
		`` +
		$t.clean(get("jointInput").html()) +
		` <input type="text" name="value" disabled > <input type="checkbox" name="convert" checked> `

exports['managers/template/joints/head'] = (get, $t) => 
		`<b> <input class='template-input' value='` +
		$t.clean(get("obj").malePartCode) +
		`' attr='joints' placeholder='Male Part Code' name='malePartCode'> => <input class='template-input' value='` +
		$t.clean(get("obj").femalePartCode) +
		`' attr='joints' placeholder='Female Part Code' name='femalePartCode'> </b> `

exports['managers/template/main'] = (get, $t) => 
		`<div template-manager=` +
		$t.clean(get("id")()) +
		`> Main template <div id='` +
		$t.clean(get("parentId")()) +
		`'></div> </div> `

exports['managers/template/openings/head'] = (get, $t) => 
		`<div class='inline-flex'> ` +
		$t.clean(get("select").html()) +
		` <input class='opening-part-code-input' attr='openings' name='partCode' value="` +
		$t.clean(get("obj")[get("select").value()]) +
		`"> </div> `

exports['managers/template/subassemblies/head'] = (get, $t) => 
		`<label>Part Code</label> <input class='template-input' attr='subassemblies' name='code' value="` +
		$t.clean(get("obj").code) +
		`"> ` +
		$t.clean(get("typeInput").html()) +
		` `

exports['managers/template/subassemblies/body'] = (get, $t) => 
		`<div template-attr='subassembles'> <div> <label>All</label> <input class='template-include' type='radio' name='is-` +
		$t.clean(get("obj").id) +
		`' value='All' ` +
		$t.clean(get("obj").include === 'All' ? 'checked' : '') +
		`> <label>Overlay</label> <input class='template-include' type='radio' name='is-` +
		$t.clean(get("obj").id) +
		`' value='Overlay' ` +
		$t.clean(get("obj").include === 'Overlay' ? 'checked' : '') +
		`> <label>Reveal</label> <input class='template-include' type='radio' name='is-` +
		$t.clean(get("obj").id) +
		`' value='Reveal' ` +
		$t.clean(get("obj").include === 'Reveal' ? 'checked' : '') +
		`> <label>Inset</label> <input class='template-include' type='radio' name='is-` +
		$t.clean(get("obj").id) +
		`' value='Inset' ` +
		$t.clean(get("obj").include === 'Inset' ? 'checked' : '') +
		`> </div> <label>Name</label> <input class='template-input' attr='subassemblies' name="name" value="` +
		$t.clean(get("obj").name) +
		`"> <br> <div class='sub-demensions-cnt inline-flex'> ` +
		$t.clean(get("demensionXyzSelect").html()) +
		` <input class='template-input' attr='subassemblies' name='demensions' value='` +
		$t.clean(get("getEqn")(get("demensionXyzSelect"), get("obj").demensions)) +
		`'> <input disabled class='measurement-input' name='value'> <input type="checkbox" name="convert" checked> </div> <br> <div class='sub-center-cnt inline-flex'> ` +
		$t.clean(get("centerXyzSelect").html()) +
		` <input class='template-input' attr='subassemblies' name='center' value='` +
		$t.clean(get("getEqn")(get("centerXyzSelect"), get("obj").center)) +
		`'> <input disabled class='measurement-input' name='value'> <input type="checkbox" name="convert" checked> </div> <br> <div class='sub-center-cnt inline-flex'> ` +
		$t.clean(get("rotationXyzSelect").html()) +
		` <input class='template-input' attr='subassemblies' name='rotation' value='` +
		$t.clean(get("getEqn")(get("rotationXyzSelect"), get("obj").rotation)) +
		`'> <input disabled class='measurement-input' name='value'> </div> </div> `

exports['managers/template/values/head'] = (get, $t) => 
		`<div template-attr='values'> <input class='template-input' attr='values' type='text' name='name' value='` +
		$t.clean(get("obj").key) +
		`' placeholder="Variable Name"> <input class='measurement-input' type='text' name='value' value='` +
		$t.clean(get("obj").eqn) +
		`' placeholder="Value" disabled> <input type="checkbox" name="convert" checked> <br> <input class='template-input full-width' attr='values' type='text' name='eqn' value='` +
		$t.clean(get("obj").eqn) +
		`' placeholder="Equation"> </div> `

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
		$t.clean( new $t('1160200676').render(get("group").parts, 'partName, partList', get)) +
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
		$t.clean(get("order").id()) +
		`'>Builder</li> <li class='toggle-display-item' display-id='information-display-` +
		$t.clean(get("order").id()) +
		`'>Information</li> </ul> <div id='builder-display-` +
		$t.clean(get("order").id()) +
		`'> <b>` +
		$t.clean(get("order").name()) +
		`</b> <button class='save-order-btn' index='` +
		$t.clean(get("$index")) +
		`'>Save</button> <div id='room-pills'>RoomPills!</div> </div> <div id='information-display-` +
		$t.clean(get("order").id()) +
		`' hidden> <utility-filter id='uf-info-` +
		$t.clean(get("order").id()) +
		`' edit='true'> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> </div> </div> `

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

exports['order/builder/body'] = (get, $t) => 
		`<div> <b>` +
		$t.clean(get("order").name) +
		`</b> <button class='save-order-btn' index='` +
		$t.clean(get("$index")) +
		`'>Save</button> <div id='room-pills'>RoomPills!</div> </div> `

exports['order/head'] = (get, $t) => 
		`<h3 class='margin-zero'> ` +
		$t.clean(get("order").name()) +
		` </h3> `

exports['order/builder/head'] = (get, $t) => 
		`<h3 class='margin-zero'> ` +
		$t.clean(get("order").name) +
		` </h3> `

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

exports['order/information/body'] = (get, $t) => 
		`<utility-filter hidden> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> `

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
		` <div class='cabinet-style-selector-cnt'>` +
		$t.clean(get("styleSelector")()) +
		`</div> Property MeNu `

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

exports['three-view'] = (get, $t) => 
		`<div class='three-view-cnt' id='` +
		$t.clean(get("id")()) +
		`'> <div class='three-view-three-d-cnt'></div> <div class='three-view-two-d-cnt'> <div class='three-view-canvases-cnt inline-flex' id='` +
		$t.clean(get("id")()) +
		`-cnt'> <div class='center-vert'>Part Code: <b id='three-view-part-code-` +
		$t.clean(get("id")()) +
		`'></b></div> <span class='three-view-canvas-cnt'> <b>Top</b> <canvas id="three-view-top" width="` +
		$t.clean(get("maxDem")()) +
		`" height="` +
		$t.clean(get("maxDem")()) +
		`"></canvas> </span> <span class='three-view-canvas-cnt'> <b>Left</b> <canvas id="three-view-left" width="` +
		$t.clean(get("maxDem")()) +
		`" height="` +
		$t.clean(get("maxDem")()) +
		`"></canvas> </span> <span class='three-view-canvas-cnt'> <b>Front</b> <canvas id="three-view-front" width="` +
		$t.clean(get("maxDem")()) +
		`" height="` +
		$t.clean(get("maxDem")()) +
		`"></canvas> </span> </div> </div> </div> `
