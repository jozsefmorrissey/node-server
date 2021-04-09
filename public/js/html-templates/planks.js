// ./src/index/services/$t.js

$t.functions['202297006'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + ` ` + (get("$index") === get("activeIndex") ? ' active' : '') + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['633282157'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> <div class="expand-body ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getBody")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['990870856'] = function (get) {
	return `<div class='inline' > <h3>` + (get("assem").objId) + `</h3> <div> ` + (get("getFeatureDisplay")(get("assem"))) + ` </div> </div>`
}
$t.functions['./public/html/planks/cabinet-body.html'] = function (get) {
	return `<div> <div class='cabinet-header'> <label>Reveal:</label> <div class='cabinet-dem-cnt'> <label>Top:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.trv' value='` + (get("cabinet").value("trv")) + `'> <label>Bottom:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.trv' value='` + (get("cabinet").value("brv")) + `'> <label>Left:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.trv' value='` + (get("cabinet").value("lrv")) + `'> <label>Right:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.trv' value='` + (get("cabinet").value("rrv")) + `'> </div> </div> <br> <div class='cabinet-header'> <label>Toe Kick Height:</label> <div class='cabinet-dem-cnt'> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.trv' value='` + (get("cabinet").value("tkh")) + `'> </div> </div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> </div> <input type="radio" name="frame-type-` + (get("cabinet").id) + `" value='framed' checked id='cabinet-framed-radio-` + (get("cabinet").id) + `'> <label for='cabinet-framed-radio-` + (get("cabinet").id) + `'>Framed</label> <input type="radio" name="frame-type-` + (get("cabinet").id) + `" id='cabinet-frameless-radio-` + (get("cabinet").id) + `' value='frameless'> <label for='cabinet-frameless-radio-` + (get("cabinet").id) + `'>Frameless</label> <div class='right'> <select class="show-right-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> <label>Show Right</label> </div> </div> <div>` + (get("OpenSectionDisplay").html(get("cabinet").opening)) + `</div> </div> `
}
$t.functions['-970877277'] = function (get) {
	return `<option >` + (get("showType").name) + `</option>`
}
$t.functions['./public/html/planks/cabinet-head.html'] = function (get) {
	return `<div class='cabinet-header'> <input class='cabinet-input' prop-update='id' value='` + (get("cabinet").id || get("$index")) + `'> Size: <div class='cabinet-dem-cnt'> <label>W:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.width' value='` + (get("cabinet").width()) + `'> <label>H:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.length' value='` + (get("cabinet").length()) + `'> <label>D:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.thickness' value='` + (get("cabinet").thickness()) + `'> </div> </div> `
}
$t.functions['./public/html/planks/expandable-pill.html'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <div> </div> <div class="expand-body ` + (get("type")) + `"> Hello World! </div> </div> `
}
$t.functions['-520175802'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['./public/html/planks/expandable-sidebar.html'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}} {{$index === activeIndex ? \' active\' : \'\'}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <div> </div> <div class="expand-body ` + (get("type")) + `"> Hello World! </div> </div> `
}
$t.functions['./public/html/planks/features.html'] = function (get) {
	return `<div class='tab'> ` + (new $t('<div > <label>{{feature.name}}</label> <input type=\'checkbox\' name=\'{{id + \'-checkbox\'}}\' {{feature.isCheckbox() ? \'\': \'hidden\'}}> <input type=\'text\' name=\'{{id + \'-input\'}}\' {{feature.showInput() ? \'\' : \'hidden\'}}> <input class=\'feature-radio\' type=\'radio\' name=\'{{id}}\' value=\'{{feature.id}}\' {{!feature.isRadio() ? "hidden disabled" : ""}}> <div {{!feature.isRadio() ? \'\' : \'hidden\'}}> <input type=\'text\' placeholder="Unique Notes" {{!feature.isRadio() ? "hidden disabled" : ""}}> {{new $t(\'./public/html/planks/features.html\').render({features: get(\'feature.features\'), id: get(\'id\') + \'.\' + get(\'feature.id\')})}} </div> </div>').render(get('scope'), 'feature in features', get)) + ` </div> `
}
$t.functions['-344212861'] = function (get) {
	return `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").isCheckbox() ? '': 'hidden') + `> <input type='text' name='` + (get("id") + '-input') + `' ` + (get("feature").showInput() ? '' : 'hidden') + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (!get("feature").isRadio() ? "hidden disabled" : "") + `> <div ` + (!get("feature").isRadio() ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (!get("feature").isRadio() ? "hidden disabled" : "") + `> ` + (new $t('./public/html/planks/features.html').render({features: get('feature.features'), id: get('id') + '.' + get('feature.id')})) + ` </div> </div>`
}
$t.functions['./public/html/planks/opening-list-body.html'] = function (get) {
	return `<h2>` + (get("list").activeIndex()) + `</h2> val: ` + (get("list").value()('selected')) + ` `
}
$t.functions['./public/html/planks/expandable-list.html'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> <div class="expand-body {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getBody(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div> <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> </div> `
}
$t.functions['./public/html/planks/opening-list-head.html'] = function (get) {
	return `<div> <select value='` + (get("opening").name) + `' class='open-divider-select` + (get("sections").length === 0 ? ' hidden' : '') + `'> ` + (new $t('<option  value=\'{{section.constructor.name}}\' {{opening.constructorId === section.constructorId ? \'selected\' : \'\'}}> {{section.name}} </option>').render(get('scope'), 'section in sections', get)) + ` </select> <div class='open-divider-select` + (get("sections").length === 0 ? '' : ' hidden') + `'> D </div> </div> `
}
$t.functions['-412627865'] = function (get) {
	return `<option value='` + (get("section").constructor.name) + `' ` + (get("opening").constructorId === get("section").constructorId ? 'selected' : '') + `> ` + (get("section").name) + ` </option>`
}
$t.functions['./public/html/planks/opening.html'] = function (get) {
	return `<div class='opening-cnt' opening-id='` + (get("opening").uniqueId) + `'> <div class='divider-controls'> </div> </div> <div id='` + (get("openDispId")) + `'> </div> `
}
$t.functions['./public/html/planks/sections/divider.html'] = function (get) {
	return `<h2>Divider: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/sections/door.html'] = function (get) {
	return `<h2>DoorSection(` + (get("list").activeIndex()) + `):</h2> <br><br> <div> ` + (new $t('<div class=\'inline\' > <h3>{{assem.objId}}</h3> <div> {{getFeatureDisplay(assem)}} </div> </div>').render(get('scope'), 'assem in assemblies', get)) + ` </div> `
}
$t.functions['./public/html/planks/sections/drawer.html'] = function (get) {
	return `<h2>Drawer: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/sections/open.html'] = function (get) {
	return `<h2>Open: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/sections/dual-door.html'] = function (get) {
	return `<h2>Dual Door: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/sections/false-front.html'] = function (get) {
	return `<h2>False Front: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/divider-controls.html'] = function (get) {
	return `<div> <label>Dividers:</label> <input type="number" min="0" max="10" step="1" class='division-count-input' opening-id='` + (get("opening").uniqueId) + `' value='` + (get("opening").dividerCount()) + `'> <span class="open-orientation-radio-cnt ` + (get("opening").dividerCount() > 0 ? '' : 'hidden') + `"> <label for='open-orientation-horiz-` + (get("opening").uniqueId) + `'>Horizontal:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='horizontal' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-horiz-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").vertical ? '' : 'checked') + `> <label for='open-orientation-vert-` + (get("opening").uniqueId) + `'>Vertical:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='vertical' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-vert-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").vertical ? 'checked' : '') + `> </span> <select class='open-pattern-select ` + ( get("opening").dividerCount() > 0 ? '' : 'hidden') + `' id='` + (get("selectPatternId")) + `' prop-update='pattern' divisions=` + (get("opening").dividerCount()) + `> ` + (get("patterns")) + ` </select> ` + (new $t('<span class=\'input-html-cnt-{{opening.uniqueId}}\' > <label>{{label}}</label> <input class=\'division-pattern-input\' name=\'{{pattern.name}}\' index=\'{{$index}}\' value=\'{{fill ? fill[$index] : ""}}\'> </span>').render(get('scope'), 'label in pattern.inputArr', get)) + ` </div> `
}
$t.functions['-935556873'] = function (get) {
	return `<span class='input-html-cnt-` + (get("opening").uniqueId) + `' > <label>` + (get("label")) + `</label> <input class='division-pattern-input' name='` + (get("pattern").name) + `' index='` + (get("index")) + `' value='` + (get("fill") ? get("fill")[get("index")] : "") + `'> </span>`
}
$t.functions['-1178631413'] = function (get) {
	return `<span class='input-html-cnt-` + (get("opening").uniqueId) + `' > <label>` + (get("label")) + `</label> <input class='division-pattern-input' name='` + (get("pattern").name) + `' index='` + (get("$index")) + `' value='` + (get("fill") ? get("fill")[get("$index")] : "") + `'> </span>`
}