// ./src/index/services/$t.js

$t.functions['408493355'] = function (get) {
	return `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").checkbox()) + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> <div ` + (get("feature").isRadio(get("features"), get("id")) ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> ` + (new $t('./public/html/planks/features.html').render({features: get('feature.features'), id: get('id') + '.' + get('feature.id')})) + ` </div> </div>`
}
$t.functions['633282157'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> <div class="expand-body ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getBody")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['753088715'] = function (get) {
	return `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").checkbox() ? '': 'hidden') + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (!get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> <div ` + (!get("feature").isRadio(get("features"), get("id")) ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (!get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> ` + (new $t('./public/html/planks/features.html').render({features: get('feature.features'), id: get('id') + '.' + get('feature.id')})) + ` </div> </div>`
}
$t.functions['1758315766'] = function (get) {
	return `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").checkbox() ? '': 'hidden') + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> <div ` + (get("feature").isRadio(get("features"), get("id")) ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> ` + (new $t('./public/html/planks/features.html').render({features: get('feature.features'), id: get('id') + '.' + get('feature.id')})) + ` </div> </div>`
}
$t.functions['./public/html/planks/cabinet-body.html'] = function (get) {
	return `<div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> </div> <input type="radio" name="frame-type-` + (get("cabinet").id) + `" value='framed' checked id='cabinet-framed-radio-` + (get("cabinet").id) + `'> <label for='cabinet-framed-radio-` + (get("cabinet").id) + `'>Framed</label> <input type="radio" name="frame-type-` + (get("cabinet").id) + `" id='cabinet-frameless-radio-` + (get("cabinet").id) + `' value='frameless'> <label for='cabinet-frameless-radio-` + (get("cabinet").id) + `'>Frameless</label> <div class='right'> <select class="show-right-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> <label>Show Right</label> </div> </div> <div>` + (get("OpenSectionDisplay").html(get("cabinet").opening)) + `</div> </div> `
}
$t.functions['-970877277'] = function (get) {
	return `<option >` + (get("showType").name) + `</option>`
}
$t.functions['./public/html/planks/cabinet-head.html'] = function (get) {
	return `<div class='cabinet-header'> <input class='cabinet-input' type='id' value='` + (get("id")) + `'> Size: <div class='cabinet-dem-cnt'> <label>W:</label> <input class='cabinet-input dem' type='width' value='` + (get("width")) + `'> X <label>H:</label> <input class='cabinet-input dem' type='height' value='` + (get("height")) + `'> X <label>D:</label> <input class='cabinet-input dem' type='depth' value='` + (get("depth")) + `'> </div> </div> `
}
$t.functions['./public/html/planks/expandable-list.html'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> <div class="expand-body {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getBody(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div> <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> </div> `
}
$t.functions['./public/html/planks/features.html'] = function (get) {
	return `<div class='tab'> ` + (new $t('<div > <label>{{feature.name}}</label> <input type=\'checkbox\' name=\'{{id + \'-checkbox\'}}\' {{feature.checkbox() ? \'\': \'hidden\'}}> <input class=\'feature-radio\' type=\'radio\' name=\'{{id}}\' value=\'{{feature.id}}\' {{!feature.isRadio(features, id) ? "hidden disabled" : ""}}> <div {{!feature.isRadio(features, id) ? \'\' : \'hidden\'}}> <input type=\'text\' placeholder="Unique Notes" {{!feature.isRadio(features, id) ? "hidden disabled" : ""}}> {{new $t(\'./public/html/planks/features.html\').render({features: get(\'feature.features\'), id: get(\'id\') + \'.\' + get(\'feature.id\')})}} </div> </div>').render(get('scope'), 'feature in features', get)) + ` </div> `
}
$t.functions['./public/html/planks/expandable-sidebar.html'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <div> </div> <div class="expand-body ` + (get("type")) + `"> Hello World! </div> </div> `
}
$t.functions['-520175802'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['./public/html/planks/opening-list-body.html'] = function (get) {
	return `<h2>` + (get("list").activeIndex()) + `</h2> val: ` + (get("list").value()('selected')) + ` `
}
$t.functions['./public/html/planks/expandable-pill.html'] = function (get) {
	return ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'{{id}}\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <button ex-list-id='` + (get("id")) + `' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <div> </div> <div class="expand-body ` + (get("type")) + `"> Hello World! </div> </div> `
}
$t.functions['./public/html/planks/opening-list-head.html'] = function (get) {
	return `<div> <select value='` + (get("opening").name) + `' class='open-divider-select` + (get("sections").length === 0 ? ' hidden' : '') + `'> ` + (new $t('<option  value=\'{{section.constructor.name}}\' {{opening.constructorId === section.constructorId ? \'selected\' : \'\'}}> {{section.name}} </option>').render(get('scope'), 'section in sections', get)) + ` </select> <div class='open-divider-select` + (get("sections").length === 0 ? '' : ' hidden') + `'> D </div> </div> `
}
$t.functions['-412627865'] = function (get) {
	return `<option value='` + (get("section").constructor.name) + `' ` + (get("opening").constructorId === get("section").constructorId ? 'selected' : '') + `> ` + (get("section").name) + ` </option>`
}
$t.functions['./public/html/planks/sections/divider.html'] = function (get) {
	return `<h2>Panel: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/opening.html'] = function (get) {
	return `<div> <label>Dividers:</label> <input type="number" min="1" max="10" step="1" class='open-division-input' opening-id='` + (get("opening").id) + `' value='` + (get("opening").dividerCount()) + `'> <span class='open-orientation-radio-cnt hidden'> <label for='open-orientation-horiz-` + (get("opening").id) + `'>Horizontal:</label> <input type='radio' name='orientation-` + (get("opening").id) + `' value='horizontal' open-id='` + (get("opening").id) + `' id='open-orientation-horiz-` + (get("opening").id) + `' class='open-orientation-radio'> <label for='open-orientation-vert-` + (get("opening").id) + `'>Vertical:</label> <input type='radio' name='orientation-` + (get("opening").id) + `' value='vertical' open-id='` + (get("opening").id) + `' id='open-orientation-vert-` + (get("opening").id) + `' class='open-orientation-radio'> </span> <select class='open-pattern-select ` + ( get("opening").dividerCount() > 0 ? '' : 'hidden') + `' id='` + (get("selectPatternId")) + `'> ` + (get("patterns")) + ` </select> <span> ` + (get("inputHtml")) + ` </span> </div> <div id='` + (get("openDispId")) + `'> Divisions: ` + (get("opening").dividerCount()) + ` </div> `
}
$t.functions['./public/html/planks/sections/drawer.html'] = function (get) {
	return `<h2>Drawer: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/sections/door.html'] = function (get) {
	return `<h2>Door: ` + (get("list").activeIndex()) + `</h2> <label><label> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/sections/dual-door.html'] = function (get) {
	return `<h2>Dual Door: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/sections/false-front.html'] = function (get) {
	return `<h2>False Front: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['./public/html/planks/sections/open.html'] = function (get) {
	return `<h2>Open: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `
}
$t.functions['-1898152158'] = function (get) {
	return `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").checkbox() ? '': 'hidden') + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (!get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> <div ` + (!get("feature").isRadio(get("features"), get("id")) || get("feature").noFeatures() ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (!get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> ` + (new $t('./public/html/planks/features.html').render({features: get('feature.features'), id: get('id') + '.' + get('feature.id')})) + ` </div> </div>`
}
$t.functions['-1923621079'] = function (get) {
	return `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").checkbox() ? '': 'hidden') + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (!get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> <div ` + (!get("feature").isRadio(get("features"), get("id")) || get("features").length === 0 ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (!get("feature").isRadio(get("features"), get("id")) ? "hidden disabled" : "") + `> ` + (new $t('./public/html/planks/features.html').render({features: get('feature.features'), id: get('id') + '.' + get('feature.id')})) + ` </div> </div>`
}