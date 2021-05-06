
$t.functions['202297006'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + ` ` + (get("$index") === get("activeIndex") ? ' active' : '') + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['375408173'] = function (get) {
	return `<option value='` + (get("section").prototype.constructor.name) + `' ` + (get("opening").name === get("section").name ? 'selected' : '') + `> ` + (get("clean")(get("section").name)) + ` </option>`
}
$t.functions['443122713'] = function (get) {
	return `<option value='` + (get("section").prototype.constructor.name) + `' ` + (get("opening").constructorId === get("section").name ? 'selected' : '') + `> ` + (get("clean")(get("section").name)) + ` </option>`
}
$t.functions['633282157'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> <div class="expand-body ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getBody")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['990870856'] = function (get) {
	return `<div class='inline' > <h3>` + (get("assem").objId) + `</h3> <div> ` + (get("getFeatureDisplay")(get("assem"))) + ` </div> </div>`
}
$t.functions['1801522599'] = function (get) {
	return `<option value='` + (get("section").prototype.constructor.name) + `' ` + (get("opening").name === get("section").constructorId ? 'selected' : '') + `> ` + (get("clean")(get("section").name)) + ` </option>`
}
$t.functions['cabinet/body'] = function (get) {
	return `<div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> </div> <button class='save-cabinet-btn' index='` + (get("$index")) + `'>Save</button> <div class='right'> <select class="show-right-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> <label>Show Right</label> </div> </div> <br> <div>` + (get("OpenSectionDisplay").html(get("cabinet").opening)) + `</div> </div> `
}
$t.functions['-970877277'] = function (get) {
	return `<option >` + (get("showType").name) + `</option>`
}
$t.functions['cabinet/head'] = function (get) {
	return `<div class='cabinet-header'> <input class='cabinet-id-input' prop-update='` + (get("$index")) + `.id' index='` + (get("$index")) + `' value='` + (get("cabinet").id || get("$index")) + `'> Size: <div class='cabinet-dem-cnt'> <label>W:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.width' value='` + (get("cabinet").width()) + `'> <label>H:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.length' value='` + (get("cabinet").length()) + `'> <label>D:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.thickness' value='` + (get("cabinet").thickness()) + `'> </div> </div> `
}
$t.functions['divide/body'] = function (get) {
	return `<h2>` + (get("list").activeIndex()) + `</h2> val: ` + (get("list").value()('selected')) + ` `
}
$t.functions['divide/head'] = function (get) {
	return `<div> <select value='` + (get("opening").name) + `' class='open-divider-select` + (get("sections").length === 0 ? ' hidden' : '') + `'> ` + (new $t('<option  value=\'{{section.prototype.constructor.name}}\' {{opening.constructorId === section.name ? \'selected\' : \'\'}}> {{clean(section.name)}} </option>').render(get('scope'), 'section in sections', get)) + ` </select> <div class='open-divider-select` + (get("sections").length === 0 ? '' : ' hidden') + `'> D </div> </div> `
}
$t.functions['-881298725'] = function (get) {
	return `<option value='` + (get("section").prototype.constructor.name) + `' ` + (get("opening").constructorId === get("section").constructorId ? 'selected' : '') + `> ` + (get("section").name) + ` </option>`
}
$t.functions['divider-controls'] = function (get) {
	return `<div> <label>Dividers:</label> <input type="number" min="0" max="10" step="1" class='division-count-input' opening-id='` + (get("opening").uniqueId) + `' value='` + (get("opening").dividerCount()) + `'> <span class="open-orientation-radio-cnt ` + (get("opening").dividerCount() > 0 ? '' : 'hidden') + `"> <label for='open-orientation-horiz-` + (get("opening").uniqueId) + `'>Horizontal:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='horizontal' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-horiz-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").value('vertical') ? '' : 'checked') + `> <label for='open-orientation-vert-` + (get("opening").uniqueId) + `'>Vertical:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='vertical' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-vert-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").value('vertical') ? 'checked' : '') + `> </span> <select class='open-pattern-select ` + ( get("opening").dividerCount() > 0 ? '' : 'hidden') + `' id='` + (get("selectPatternId")) + `' prop-update='pattern' divisions=` + (get("opening").dividerCount()) + `> ` + (get("patterns")) + ` </select> ` + (new $t('<span class=\'input-html-cnt-{{opening.uniqueId}}\' > <label>{{label}}</label> <input class=\'division-pattern-input\' name=\'{{pattern.name}}\' index=\'{{$index}}\' value=\'{{fill ? fill[$index] : ""}}\'> </span>').render(get('scope'), 'label in pattern.inputArr', get)) + ` </div> `
}
$t.functions['-1178631413'] = function (get) {
	return `<span class='input-html-cnt-` + (get("opening").uniqueId) + `' > <label>` + (get("label")) + `</label> <input class='division-pattern-input' name='` + (get("pattern").name) + `' index='` + (get("$index")) + `' value='` + (get("fill") ? get("fill")[get("$index")] : "") + `'> </span>`
}
$t.functions['expandable/list'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> <div class="expand-body {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getBody(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div> <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> </div> `
}
$t.functions['expandable/pill'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <div> </div> <div class="expand-body ` + (get("type")) + `"> Hello World! </div> </div> `
}
$t.functions['-520175802'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['expandable/sidebar'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}} {{$index === activeIndex ? \' active\' : \'\'}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <div> </div> <div class="expand-body ` + (get("type")) + `"> Hello World! </div> </div> `
}
$t.functions['features'] = function (get) {
	return `<div class='tab'> ` + (new $t('<div > <label>{{feature.name}}</label> <input type=\'checkbox\' name=\'{{id + \'-checkbox\'}}\' {{feature.isCheckbox() ? \'\': \'hidden\'}}> <input type=\'text\' name=\'{{id + \'-input\'}}\' {{feature.showInput() ? \'\' : \'hidden\'}}> <input class=\'feature-radio\' type=\'radio\' name=\'{{id}}\' value=\'{{feature.id}}\' {{!feature.isRadio() ? "hidden disabled" : ""}}> <div {{!feature.isRadio() ? \'\' : \'hidden\'}}> <input type=\'text\' placeholder="Unique Notes" {{!feature.isRadio() ? "hidden disabled" : ""}}> {{new $t(\'features\').render({features: get(\'feature.features\'), id: get(\'id\') + \'.\' + get(\'feature.id\')})}} </div> </div>').render(get('scope'), 'feature in features', get)) + ` </div> `
}
$t.functions['-666497277'] = function (get) {
	return `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").isCheckbox() ? '': 'hidden') + `> <input type='text' name='` + (get("id") + '-input') + `' ` + (get("feature").showInput() ? '' : 'hidden') + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (!get("feature").isRadio() ? "hidden disabled" : "") + `> <div ` + (!get("feature").isRadio() ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (!get("feature").isRadio() ? "hidden disabled" : "") + `> ` + (new $t('features').render({features: get('feature.features'), id: get('id') + '.' + get('feature.id')})) + ` </div> </div>`
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
$t.functions['model-controller'] = function (get) {
	return `<div> <div class='model-selector'> <div> <div class='` + (get("tdm").isTarget("prefix", get("group").prefix) ? "active " : "") + ` ` + (get("label") ? "prefix-switch model-label" : "") + `' ` + (!get("label") ? 'hidden' : '') + `> <label type='prefix'>` + (get("label")) + `</label> <input type='checkbox' class='prefix-checkbox' prefix='` + (get("group").prefix) + `' ` + (!get("tdm").hidePrefix(get("label")) ? 'checked' : '') + `> </div> <div class='` + (get("label") ? "prefix-body indent" : "") + `'> ` + (new $t('<div class=\'model-label{{tdm.isTarget("part-name", partName) ? " active" : ""}}\' > <label type=\'part-name\'>{{partName}}</label> <input type=\'checkbox\' class=\'part-name-checkbox\' part-name=\'{{partName}}\' {{!tdm.hidePartName(partName) ? \'checked\' : \'\'}}> {{new $t(\'<div class=\\\'{{tdm.isTarget("part-code", part.partCode) ? "active " : ""}} model-label indent\\\'  {{partList.length > 1 ? "" : "hidden"}}> <label type=\\\'part-code\\\'>{{part.partCode}}</label> <input type=\\\'checkbox\\\' class=\\\'part-code-checkbox\\\' part-code=\\\'{{part.partCode}}\\\' {{!tdm.hidePartCode(part.partCode) ? \\\'checked\\\' : \\\'\\\'}}> </div>\').render(get(\'scope\'), \'part in partList\', get)}} </div>').render(get('scope'), 'partName, partList in group.parts', get)) + ` ` + (new $t('model-controller').render(get('scope'), 'label, group in group.groups', get)) + ` </div> </div> </div> </div> `
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
	return `<div> <label>Order Name</label> <input class='order-name-input' type='text' value='` + (get("order").name) + `' index='` + (get("$index")) + `'> <button class='save-order-btn' index='` + (get("$index")) + `'>Save</button> <div id='room-pills'></div> </div> `
}
$t.functions['order/head'] = function (get) {
	return `<h3 class='margin-zero'> ` + (get("order").name) + ` </h3> `
}
$t.functions['order'] = function (get) {
	return `<div> <label>Order Name</label> <input type='text'> <div id='room-pills'></div> </div> `
}
$t.functions['room/body'] = function (get) {
	return `<div> <select> ` + (new $t('<option >{{type}}</option>').render(get('scope'), 'type in propertyTypes', get)) + ` </select> <div class='cabinet-cnt' room-id='` + (get("room").id) + `'></div> </div> `
}
$t.functions['-1674837651'] = function (get) {
	return `<option >` + (get("type")) + `</option>`
}
$t.functions['room/head'] = function (get) {
	return `<b>` + (get("$index")) + `</b> `
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
$t.functions['-1793017541'] = function (get) {
	return `<option value='` + (get("section").prototype.constructor.name) + `' ` + (get("opening").constructorId === get("section").constructorId ? 'selected' : '') + `> ` + (get("clean")(get("section").name)) + ` </option>`
}