
$t.functions['202297006'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + ` ` + (get("$index") === get("activeIndex") ? ' active' : '') + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['443122713'] = function (get) {
	return `<option value='` + (get("section").prototype.constructor.name) + `' ` + (get("opening").constructorId === get("section").name ? 'selected' : '') + `> ` + (get("clean")(get("section").name)) + ` </option>`
}
$t.functions['600085932'] = function (get) {
	return `<option value='` + (get("item")) + `' ` + (get("selected")(get("item")) ? 'selected' : '') + `> ` + (get("item")) + ` </option>`
}
$t.functions['632351395'] = function (get) {
	return `<div > <input class='expand-list-sidebar-input' list='auto-fill-list-` + (get("input").id) + `' id='` + (get("input").id) + `' placeholder='` + (get("input").placeholder) + `' type='text'> <datalist id="auto-fill-list-` + (get("input").id) + `"> ` + (new $t('<option value="{{option}}" ></option>').render(get('scope'), 'option in input.autofill', get)) + ` </datalist> </div>`
}
$t.functions['633282157'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> <div class="expand-body ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getBody")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['990870856'] = function (get) {
	return `<div class='inline' > <h3>` + (get("assem").objId) + `</h3> <div> ` + (get("getFeatureDisplay")(get("assem"))) + ` </div> </div>`
}
$t.functions['cabinet/body'] = function (get) {
	return `<div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> </div> <div class='property-id-container center inline-flex'>` + (get("selectHtml")) + `</div> <div class='right'> <select class="show-right-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> <label>Show Right</label> </div> </div> <br> <div class='center'> <button class='save-cabinet-btn' index='` + (get("$index")) + `'>Save</button> </div> ` + (new $t('<div  class=\'divison-section-cnt\'> {{OpenSectionDisplay.html(opening)}} </div>').render(get('scope'), 'opening in cabinet.openings', get)) + ` </div> `
}
$t.functions['-970877277'] = function (get) {
	return `<option >` + (get("showType").name) + `</option>`
}
$t.functions['-1702305177'] = function (get) {
	return `<div class='divison-section-cnt'> ` + (get("OpenSectionDisplay").html(get("opening"))) + ` </div>`
}
$t.functions['cabinet/head'] = function (get) {
	return `<div class='cabinet-header'> <input class='cabinet-id-input' prop-update='` + (get("$index")) + `.name' index='` + (get("$index")) + `' room-id='` + (get("room").id) + `' value='` + (get("cabinet").name || get("$index")) + `'> Size: <div class='cabinet-dem-cnt'> <label>W:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.width' room-id='` + (get("room").id) + `' value='` + (get("cabinet").width()) + `'> <label>H:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.length' room-id='` + (get("room").id) + `' value='` + (get("cabinet").length()) + `'> <label>D:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.thickness' room-id='` + (get("room").id) + `' value='` + (get("cabinet").thickness()) + `'> </div> </div> `
}
$t.functions['display-manager'] = function (get) {
	return `<div class='display-manager' id='` + (get("id")) + `'> ` + (new $t('<div  class=\'display-manager-item\'> <input class=\'display-manager-input{{$index === 0 ? " active" : ""}}\' type=\'button\' display-id=\'{{item.id}}\' value=\'{{item.name}}\'/> </div>').render(get('scope'), 'item in list', get)) + ` </div> `
}
$t.functions['-1519826343'] = function (get) {
	return `<div class='display-manager-item'> <input class='display-manager-input` + (get("$index") === 0 ? " active" : "") + `' type='button' display-id='` + (get("item").id) + `' value='` + (get("item").name) + `'/> </div>`
}
$t.functions['divide/body'] = function (get) {
	return `<h2>` + (get("list").activeIndex()) + `</h2> val: ` + (get("list").value()('selected')) + ` `
}
$t.functions['divide/head'] = function (get) {
	return `<div> <select value='` + (get("opening").name) + `' class='open-divider-select` + (get("sections").length === 0 ? ' hidden' : '') + `'> ` + (new $t('<option  value=\'{{section.prototype.constructor.name}}\' {{opening.constructorId === section.name ? \'selected\' : \'\'}}> {{clean(section.name)}} </option>').render(get('scope'), 'section in sections', get)) + ` </select> <div class='open-divider-select` + (get("sections").length === 0 ? '' : ' hidden') + `'> D </div> </div> `
}
$t.functions['divider-controls'] = function (get) {
	return `<div> <label>Dividers:</label> <input class='division-pattern-input' type='text' name='pattern' opening-id='` + (get("opening").uniqueId) + `' value='` + (get("opening").pattern().str) + `'> <span class="open-orientation-radio-cnt"> <label for='open-orientation-horiz-` + (get("opening").uniqueId) + `'>Horizontal:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='horizontal' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-horiz-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").value('vertical') ? '' : 'checked') + `> <label for='open-orientation-vert-` + (get("opening").uniqueId) + `'>Vertical:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='vertical' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-vert-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").value('vertical') ? 'checked' : '') + `> </span> <div class='open-pattern-input-cnt' opening-id='` + (get("opening").uniqueId) + `' ` + (get("opening").pattern().equal ? 'hidden' : '') + `> ` + (get("patternInputHtml")) + ` </div> </div> `
}
$t.functions['expandable/list'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> <div class="expand-body {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getBody(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div> <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<span > <input list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </span>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> </div> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> `
}
$t.functions['-1921787246'] = function (get) {
	return `<option value="` + (get("option")) + `" ></option>`
}
$t.functions['-1756076485'] = function (get) {
	return `<span > <input list='auto-fill-list-` + (get("input").id) + `' id='` + (get("input").id) + `' placeholder='` + (get("input").placeholder) + `' type='text'> <datalist id="auto-fill-list-` + (get("input").id) + `"> ` + (new $t('<option value="{{option}}" ></option>').render(get('scope'), 'option in input.autofill', get)) + ` </datalist> </span>`
}
$t.functions['expandable/pill'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` </div> <div> <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<span > <input list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </span>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <br> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> <div class="expand-body ` + (get("type")) + `"></div> </div> `
}
$t.functions['-520175802'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['expandable/sidebar'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}} {{$index === activeIndex ? \' active\' : \'\'}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<div > <input class=\'expand-list-sidebar-input\' list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </div>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> </div> <div> </div> <div class="expand-body ` + (get("type")) + `"> Hello World! </div> </div> `
}
$t.functions['input/decision/decision'] = function (get) {
	return ` <div> <span id='` + (get("id")) + `' class='inline-flex'> ` + (new $t('<span  class=\'pad {{class}}\' node-id=\'{{_nodeId}}\' index=\'{{$index}}\'> {{input.html()}} </span>').render(get('scope'), 'input in inputArray', get)) + ` </span> ` + (new $t('<div  id=\'{{input.childCntId}}\'> {{childHtml($index)}} </div>').render(get('scope'), 'input in inputArray', get)) + ` </div> `
}
$t.functions['-2022747631'] = function (get) {
	return `<span class='pad ` + (get("class")) + `' node-id='` + (get("_nodeId")) + `' index='` + (get("$index")) + `'> ` + (get("input").html()) + ` </span>`
}
$t.functions['-1362189101'] = function (get) {
	return `<div id='` + (get("input").childCntId) + `'> ` + (get("childHtml")(get("$index"))) + ` </div>`
}
$t.functions['input/decision/decisionTree'] = function (get) {
	return `<div class='` + (get("class")) + `' tree-id='` + (get("treeId")) + `'> ` + (get("payload").html()) + ` <button class='` + (get("buttonClass")) + `' disabled tree-id='` + (get("treeId")) + `'>` + (get("name")) + `</button> </div> `
}
$t.functions['input/input'] = function (get) {
	return `<div` + (get("hide") ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <input class='` + (get("class")) + `' list='input-list-` + (get("id")) + `' id='` + (get("id")) + `' placeholder='` + (get("placeholder")) + `' type='` + (get("type")) + `' name='` + (get("name")) + `'> <datalist id="input-list-` + (get("id")) + `"> ` + (new $t('<option value="{{item}}" ></option>').render(get('scope'), 'item in list', get)) + ` </datalist> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `
}
$t.functions['-994603408'] = function (get) {
	return `<option value="` + (get("item")) + `" ></option>`
}
$t.functions['input/measurement'] = function (get) {
	return `<div class='fit'` + (get("hide") ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <input class='measurement-input ` + (get("class")) + `' id='` + (get("id")) + `' value='` + (get("value")() ? get("value")() : "") + `' placeholder='` + (get("placeholder")) + `' type='` + (get("type")) + `' name='` + (get("name")) + `'> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `
}
$t.functions['input/select'] = function (get) {
	return `<div` + (get("hide") ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <select class='` + (get("class")) + `' id='` + (get("id")) + `' name='` + (get("name")) + `' value='` + (get("value")()) + `'> ` + (new $t('<option  value=\'{{item}}\' {{selected(item) ? \'selected\' : \'\'}}> {{item}} </option>').render(get('scope'), 'item in list', get)) + ` </select> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `
}
$t.functions['login/confirmation-message'] = function (get) {
	return `<h3> Check your email for confirmation. </h3> <button id='resend-activation'>Resend</button> `
}
$t.functions['login/create-account'] = function (get) {
	return `<h3>Create An Account</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='register'>Register</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='LOGIN'>Login</a> `
}
$t.functions['login/login'] = function (get) {
	return `<h3>Login</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='login-btn'>Login</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `
}
$t.functions['login/reset-password'] = function (get) {
	return `<h3>Reset Password</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='reset-password'>Reset</button> <br><br> <a href='#' user-state='LOGIN'>Login</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `
}
$t.functions['managers/abstract-manager'] = function (get) {
	return `<div> <div class="center"> <h2 id='` + (get("headerId")) + `'> ` + (get("header")) + ` <button id='` + (get("saveBtnId")) + `'>Save</button> </h2> </div> <div id="` + (get("bodyId")) + `"></div> </div> `
}
$t.functions['managers/cost/body'] = function (get) {
	return `<div class='` + (get("instance").cntClass) + `' > <div id='` + (get("instance").parentId) + `'>` + (get("instance").expandList.html()) + `</div> <div hidden>hi</div> </div> `
}
$t.functions['managers/cost/cost-body'] = function (get) {
	return `<div> <span> <input value='` + (get("cost").length()) + `'> </span> <span> <label>X</label> <input value='` + (get("cost").width()) + `'> </span> <span> <label>X</label> <input value='` + (get("cost").depth()) + `'> </span> <label>Cost</label> <input value='` + (get("cost").cost()) + `'> <br> <label>Per ` + (get("cost").unitCost('name')) + ` = ` + (get("cost").unitCost('value')) + `</label> <div id='` + (get("parentId")) + `'>` + (get("expandList").html()) + `</div> </div> `
}
$t.functions['managers/cost/cost-head'] = function (get) {
	return `<b>` + (get("id")()) + ` - ` + (get("constructor").name) + ` (` + (get("method")()) + `)</b> `
}
$t.functions['managers/cost/header'] = function (get) {
	return `<b>` + (get("instance").partId) + `</b> `
}
$t.functions['managers/property/body'] = function (get) {
	return `<div> No Need </div> `
}
$t.functions['managers/property/header'] = function (get) {
	return `<div> <b>` + (get("instance").name) + ` (` + (get("instance").constructor.code) + `) - ` + (get("instance").value) + `</b> </div> `
}
$t.functions['managers/template/body'] = function (get) {
	return `<div> <span> <input value='` + (get("instance").length()) + `'> </span> <span> <label>X</label> <input value='` + (get("instance").width()) + `'> </span> <span> <label>X</label> <input value='` + (get("instance").depth()) + `'> </span> <label>Cost</label> <input value='` + (get("instance").cost()) + `'> <br> <label>Per ` + (get("instance").unitCost().name) + ` = ` + (get("instance").unitCost().value) + ` </div> `
}
$t.functions['managers/template/header'] = function (get) {
	return `<div> <b>` + (get("instance").id()) + ` - ` + (get("instance").constructor.name) + ` (` + (get("instance").method()) + `)</b> </div> `
}
$t.functions['model-controller'] = function (get) {
	return `<div> <div class='model-selector'> <div ` + (get("group").level > 0 ? 'hidden' : '') + `> <div class='` + (get("tdm").isTarget("prefix", get("group").prefix) ? "active " : "") + ` ` + (get("label") ? "prefix-switch model-label" : "") + `' ` + (!get("label") ? 'hidden' : '') + `> <label type='prefix'>` + (get("label")) + `</label> <input type='checkbox' class='prefix-checkbox' prefix='` + (get("group").prefix) + `' ` + (!get("tdm").hidePrefix(get("label")) ? 'checked' : '') + `> </div> <div class='` + (get("label") ? "prefix-body indent" : "") + `' ` + (get("label") ? 'hidden' : '') + `> ` + (new $t('<div class=\'model-label{{tdm.isTarget("part-name", partName) ? " active" : ""}}\' > <label type=\'part-name\'>{{partName}}</label> <input type=\'checkbox\' class=\'part-name-checkbox\' part-name=\'{{partName}}\' {{!tdm.hidePartName(partName) ? \'checked\' : \'\'}}> {{new $t(\'<div class=\\\'{{tdm.isTarget("part-code", part.partCode) ? "active " : ""}} model-label indent\\\'  {{partList.length > 1 ? "" : "hidden"}}> <label type=\\\'part-code\\\'>{{part.partCode}}</label> <input type=\\\'checkbox\\\' class=\\\'part-code-checkbox\\\' part-code=\\\'{{part.partCode}}\\\' {{!tdm.hidePartCode(part.partCode) ? \\\'checked\\\' : \\\'\\\'}}> </div>\').render(get(\'scope\'), \'part in partList\', get)}} </div>').render(get('scope'), 'partName, partList in group.parts', get)) + ` ` + (new $t('model-controller').render(get('scope'), 'label, group in group.groups', get)) + ` </div> </div> </div> </div> `
}
$t.functions['-1397238508'] = function (get) {
	return `<div class='` + (get("tdm").isTarget("part-code", get("part").partCode) ? "active " : "") + ` model-label indent' ` + (get("partList").length > 1 ? "" : "hidden") + `> <label type='part-code'>` + (get("part").partCode) + `</label> <input type='checkbox' class='part-code-checkbox' part-code='` + (get("part").partCode) + `' ` + (!get("tdm").hidePartCode(get("part").partCode) ? 'checked' : '') + `> </div>`
}
$t.functions['-443173449'] = function (get) {
	return `<div class='model-label` + (get("tdm").isTarget("part-name", get("partName")) ? " active" : "") + `' > <label type='part-name'>` + (get("partName")) + `</label> <input type='checkbox' class='part-name-checkbox' part-name='` + (get("partName")) + `' ` + (!get("tdm").hidePartName(get("partName")) ? 'checked' : '') + `> ` + (new $t('<div class=\'{{tdm.isTarget("part-code", part.partCode) ? "active " : ""}} model-label indent\' {{partList.length > 1 ? "" : "hidden"}}> <label type=\'part-code\'>{{part.partCode}}</label> <input type=\'checkbox\' class=\'part-code-checkbox\' part-code=\'{{part.partCode}}\' {{!tdm.hidePartCode(part.partCode) ? \'checked\' : \'\'}}> </div>').render(get('scope'), 'part in partList', get)) + ` </div>`
}
$t.functions['-424251200'] = function (get) {
	return `model-controller`
}
$t.functions['opening'] = function (get) {
	return `<div class='opening-cnt' opening-id='` + (get("opening").uniqueId) + `'> <div class='divider-controls'> </div> </div> <div id='` + (get("openDispId")) + `'> </div> `
}
$t.functions['order/body'] = function (get) {
	return `<div> <b>` + (get("order").name) + `</b> <button class='save-order-btn' index='` + (get("$index")) + `'>Save</button> <div id='room-pills'></div> </div> `
}
$t.functions['order/head'] = function (get) {
	return `<h3 class='margin-zero'> ` + (get("order").name) + ` </h3> `
}
$t.functions['order'] = function (get) {
	return `<div> <label>Order Name</label> <input type='text'> <div id='room-pills'></div> </div> `
}
$t.functions['properties/properties'] = function (get) {
	return `<div class='center'> <input type=text class='property-filter'> <div class='property-container'> ` + (new $t('<div > <label>{{prop.name}}</label> <input type="text" name="{{key}}" value="{{prop.value}}"> </div>').render(get('scope'), 'key, prop in properties', get)) + ` </div> </div> `
}
$t.functions['-783531553'] = function (get) {
	return `<div > <label>` + (get("prop").name) + `</label> <input type="text" name="` + (get("key")) + `" value="` + (get("prop").value) + `"> </div>`
}
$t.functions['room/body'] = function (get) {
	return `<div> <select> ` + (new $t('<option >{{type}}</option>').render(get('scope'), 'type in propertyTypes', get)) + ` </select> <div class='cabinet-cnt' room-id='` + (get("room").id) + `'></div> </div> `
}
$t.functions['-1674837651'] = function (get) {
	return `<option >` + (get("type")) + `</option>`
}
$t.functions['room/head'] = function (get) {
	return `<b>` + (get("room").name) + `</b> `
}
$t.functions['sections/divider'] = function (get) {
	return `<h2>Divider: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['sections/door'] = function (get) {
	return `<h2>DoorSection(` + (get("list").activeIndex()) + `):</h2> <br><br> <div> ` + (new $t('<div class=\'inline\' > <h3>{{assem.objId}}</h3> <div> {{getFeatureDisplay(assem)}} </div> </div>').render(get('scope'), 'assem in assemblies', get)) + ` </div> `
}
$t.functions['sections/drawer'] = function (get) {
	return `<h2>Drawer: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['sections/dual-door'] = function (get) {
	return `<h2>Dual Door: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['sections/false-front'] = function (get) {
	return `<h2>False Front: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['sections/open'] = function (get) {
	return `<h2>Open: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}