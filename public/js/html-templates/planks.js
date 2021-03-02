// ./src/index/services/$t.js

$t.functions['./public/html/planks/expandable-list.html'] = function (get) {
	return ` <div class="expandable-list" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <button class=\'expandable-item-rm-btn\' ex-list-id=\'` + (get("id")) + `\' index=\'{{$index}}\'>X</button> <div class="expand-header"> {{getHeader(item, $index)}} </div> <div class="expand-body"> {{getBody(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div> <button ex-list-id='` + (get("id")) + `' ex-list-id='{{id}}' class='expandable-list-add-btn'> Add ` + (get("listType")) + ` </button> </div> </div> `
}
$t.functions['-129574707'] = function (get) {
	return `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> <div class="expand-header"> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> <div class="expand-body"> ` + (get("getBody")(get("item"), get("$index"))) + ` </div> </div> </div>`
}
$t.functions['./public/html/planks/cabinet.html'] = function (get) {
	return `<div class="expand" id='expand-` + (get("id")) + `'> <div class="expand-header" id='expand-header-` + (get("id")) + `'> ` + (get("getHeader")()) + ` </div> <div class="expand-body" id='expand-body-` + (get("id")) + `'> ` + (get("getBody")()) + ` </div> </div> `
}