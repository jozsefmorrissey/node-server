


const Show = require('../app-src/show.js');
const OpenSectionDisplay = require('../app-src/displays/open-section.js');
const CostManager = require('../app-src/displays/managers/cost.js');
const Labor = require('../app-src/cost/types/material/labor.js');
const Cost = require('../app-src/cost/cost.js');
const Material = require('../app-src/cost/types/material.js');
const Select = require('../../../public/js/utils/input/styles/select.js');
const Divider = require('../app-src/objects/assembly/assemblies/divider.js');
const DoorSection = require('../app-src/objects/assembly/assemblies/section/space/sections/open-cover/sections/door.js');
const Door = require('../app-src/objects/assembly/assemblies/door/door.js');

exports['202297006'] = (get, $t) => `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + ` ` + (get("$index") === get("activeIndex") ? ' active' : '') + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`

exports['443122713'] = (get, $t) => `<option value='` + (get("section").prototype.constructor.name) + `' ` + (get("opening").constructorId === get("section").name ? 'selected' : '') + `> ` + (get("clean")(get("section").name)) + ` </option>`

exports['632351395'] = (get, $t) => `<div > <input class='expand-list-sidebar-input' list='auto-fill-list-` + (get("input").id) + `' id='` + (get("input").id) + `' placeholder='` + (get("input").placeholder) + `' type='text'> <datalist id="auto-fill-list-` + (get("input").id) + `"> ` + (new $t('<option value="{{option}}" ></option>').render(get('scope'), 'option in input.autofill', get)) + ` </datalist> </div>`

exports['633282157'] = (get, $t) => `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> <div class="expand-body ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getBody")(get("item"), get("$index"))) + ` </div> </div> </div>`

exports['990870856'] = (get, $t) => `<div class='inline' > <h3>` + (get("assem").objId) + `</h3> <div> ` + (get("getFeatureDisplay")(get("assem"))) + ` </div> </div>`

exports['1927703609'] = (get, $t) => `<div > ` + (get("recurse")(get("key"), get("group"))) + ` </div>`

exports['cabinet/body'] = (get, $t) => `<div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> </div> <div class='property-id-container center inline-flex'>` + (get("selectHtml")) + `</div> <div class='right'> <select class="show-right-select"> ` + (new $t('<option >{{showType.name}}</option>').render(get('scope'), 'showType in showTypes', get)) + ` </select> <label>Show Right</label> </div> </div> <br> <div class='center'> <button class='save-cabinet-btn' index='` + (get("$index")) + `'>Save</button> </div> ` + (new $t('<div  class=\'divison-section-cnt\'> {{OpenSectionDisplay.html(opening)}} </div>').render(get('scope'), 'opening in cabinet.openings', get)) + ` </div> `

exports['-970877277'] = (get, $t) => `<option >` + (get("showType").name) + `</option>`

exports['-1702305177'] = (get, $t) => `<div class='divison-section-cnt'> ` + (get("OpenSectionDisplay").html(get("opening"))) + ` </div>`

exports['cabinet/head'] = (get, $t) => `<div class='cabinet-header'> <input class='cabinet-id-input' prop-update='` + (get("$index")) + `.name' index='` + (get("$index")) + `' room-id='` + (get("room").id) + `' value='` + (get("cabinet").name || get("$index")) + `'> Size: <div class='cabinet-dem-cnt'> <label>W:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.width' room-id='` + (get("room").id) + `' value='` + (get("cabinet").width()) + `'> <label>H:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.length' room-id='` + (get("room").id) + `' value='` + (get("cabinet").length()) + `'> <label>D:</label> <input class='cabinet-input dem' prop-update='` + (get("$index")) + `.thickness' room-id='` + (get("room").id) + `' value='` + (get("cabinet").thickness()) + `'> </div> </div> `

exports['divide/body'] = (get, $t) => `<h2>` + (get("list").activeIndex()) + `</h2> val: ` + (get("list").value()('selected')) + ` `

exports['display-manager'] = (get, $t) => `<div class='display-manager' id='` + (get("id")) + `'> ` + (new $t('<div  class=\'display-manager-item\'> <input class=\'display-manager-input{{$index === 0 ? " active" : ""}}\' type=\'button\' display-id=\'{{item.id}}\' value=\'{{item.name}}\'/> </div>').render(get('scope'), 'item in list', get)) + ` </div> `

exports['-1519826343'] = (get, $t) => `<div class='display-manager-item'> <input class='display-manager-input` + (get("$index") === 0 ? " active" : "") + `' type='button' display-id='` + (get("item").id) + `' value='` + (get("item").name) + `'/> </div>`

exports['divide/head'] = (get, $t) => `<div> <select value='` + (get("opening").name) + `' class='open-divider-select` + (get("sections").length === 0 ? ' hidden' : '') + `'> ` + (new $t('<option  value=\'{{section.prototype.constructor.name}}\' {{opening.constructorId === section.name ? \'selected\' : \'\'}}> {{clean(section.name)}} </option>').render(get('scope'), 'section in sections', get)) + ` </select> <div class='open-divider-select` + (get("sections").length === 0 ? '' : ' hidden') + `'> D </div> </div> `

exports['divider-controls'] = (get, $t) => `<div> <label>Dividers:</label> <input class='division-pattern-input' type='text' name='pattern' opening-id='` + (get("opening").uniqueId) + `' value='` + (get("opening").pattern().str) + `'> <span class="open-orientation-radio-cnt"> <label for='open-orientation-horiz-` + (get("opening").uniqueId) + `'>Horizontal:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='horizontal' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-horiz-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").value('vertical') ? '' : 'checked') + `> <label for='open-orientation-vert-` + (get("opening").uniqueId) + `'>Vertical:</label> <input type='radio' name='orientation-` + (get("opening").uniqueId) + `' value='vertical' open-id='` + (get("opening").uniqueId) + `' id='open-orientation-vert-` + (get("opening").uniqueId) + `' class='open-orientation-radio' ` + (get("opening").value('vertical') ? 'checked' : '') + `> </span> <div class='open-pattern-input-cnt' opening-id='` + (get("opening").uniqueId) + `' ` + (get("opening").pattern().equal ? 'hidden' : '') + `> ` + (get("patternInputHtml")) + ` </div> </div> `

exports['expandable/list'] = (get, $t) => ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <button class=\'expandable-item-rm-btn\' ex-list-id=\'` + (get("id")) + `\' index=\'{{$index}}\'>X</button> <div class="expand-header {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> <div class="expand-body {{type}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getBody(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div> <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<span > <input list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </span>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='{{id}}' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> </div> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> `

exports['-1921787246'] = (get, $t) => `<option value="` + (get("option")) + `" ></option>`

exports['-1756076485'] = (get, $t) => `<span > <input list='auto-fill-list-` + (get("input").id) + `' id='` + (get("input").id) + `' placeholder='` + (get("input").placeholder) + `' type='text'> <datalist id="auto-fill-list-` + (get("input").id) + `"> ` + (new $t('<option value="{{option}}" ></option>').render(get('scope'), 'option in input.autofill', get)) + ` </datalist> </span>`

exports['expandable/pill'] = (get, $t) => ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'` + (get("id")) + `\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` </div> <div> <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<span > <input list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </span>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='{{id}}' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> </div> <br> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> <div class="expand-body {{type}}"></div> </div> `

exports['-520175802'] = (get, $t) => `<div class="expandable-list-body" index='` + (get("$index")) + `'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'>X</button> </div> <div class="expand-header ` + (get("type")) + `" ex-list-id='` + (get("id")) + `' index='` + (get("$index")) + `'> ` + (get("getHeader")(get("item"), get("$index"))) + ` </div> </div> </div>`

exports['expandable/sidebar'] = (get, $t) => ` <div class="expandable-list ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> <div class="expand-list-cnt ` + (get("type")) + `" ex-list-id='` + (get("id")) + `'> ` + (new $t('<div  class="expandable-list-body" index=\'{{$index}}\'> <div class="expand-item"> <div class=\'expand-rm-btn-cnt\'> <button class=\'expandable-item-rm-btn\' ex-list-id=\'` + (get("id")) + `\' index=\'{{$index}}\'>X</button> </div> <div class="expand-header ` + (get("type")) + ` {{$index === activeIndex ? \' active\' : \'\'}}" ex-list-id=\'{{id}}\' index=\'{{$index}}\'> {{getHeader(item, $index)}} </div> </div> </div>').render(get('scope'), 'item in list', get)) + ` <div id='input-tree-cnt'>` + (get("inputTree") ? get("inputTree").html() : '') + `</div> <div ` + (!get("hasInputTree")() ? '' : 'hidden') + `> ` + (new $t('<div > <input class=\'expand-list-sidebar-input\' list=\'auto-fill-list-{{input.id}}\' id=\'{{input.id}}\' placeholder=\'{{input.placeholder}}\' type=\'text\'> <datalist id="auto-fill-list-{{input.id}}"> <option:t value="{{option}}" repeat=\'option in input.autofill\'></option:t> </datalist> </div>').render(get('scope'), 'input in inputs', get)) + ` <button ex-list-id='{{id}}' class='expandable-list-add-btn' ` + (get("hideAddBtn") ? 'hidden' : '') + `> Add ` + (get("listElemLable")) + ` </button> <div class='error' id='` + (get("ERROR_CNT_ID")) + `'></div> </div> </div> <div> </div> <div class="expand-body {{type}}"> Hello World! </div> </div> `

exports['features'] = (get, $t) => `<div class='tab'> ` + (new $t('<div > <label>{{feature.name}}</label> <input type=\'checkbox\' name=\'{{id + \'-checkbox\'}}\' {{feature.isCheckbox() ? \'\': \'hidden\'}}> <input type=\'text\' name=\'{{id + \'-input\'}}\' {{feature.showInput() ? \'\' : \'hidden\'}}> <input class=\'feature-radio\' type=\'radio\' name=\'{{id}}\' value=\'{{feature.id}}\' {{!feature.isRadio() ? "hidden disabled" : ""}}> <div {{!feature.isRadio() ? \'\' : \'hidden\'}}> <input type=\'text\' placeholder="Unique Notes" {{!feature.isRadio() ? "hidden disabled" : ""}}> {{new $t(\'features\').render({features: get(\'feature.features\'), id: get(\'id\') + \'.\' + get(\'feature.id\')})}} </div> </div>').render(get('scope'), 'feature in features', get)) + ` </div> `

exports['-666497277'] = (get, $t) => `<div > <label>` + (get("feature").name) + `</label> <input type='checkbox' name='` + (get("id") + '-checkbox') + `' ` + (get("feature").isCheckbox() ? '': 'hidden') + `> <input type='text' name='` + (get("id") + '-input') + `' ` + (get("feature").showInput() ? '' : 'hidden') + `> <input class='feature-radio' type='radio' name='` + (get("id")) + `' value='` + (get("feature").id) + `' ` + (!get("feature").isRadio() ? "hidden disabled" : "") + `> <div ` + (!get("feature").isRadio() ? '' : 'hidden') + `> <input type='text' placeholder="Unique Notes" ` + (!get("feature").isRadio() ? "hidden disabled" : "") + `> ` + (new get("$t")('features').render({features: get("get")('feature.features'), id: get("get")('id') + '.' + get("get")('feature.id')})) + ` </div> </div>`

exports['input/decision/decision'] = (get, $t) => ` <div> <span id='` + (get("id")) + `' class='inline-flex'> ` + (new $t('<span  class=\'pad {{class}}\' node-id=\'{{_nodeId}}\' index=\'{{$index}}\'> {{input.html()}} </span>').render(get('scope'), 'input in inputArray', get)) + ` </span> ` + (new $t('<div  id=\'{{input.childCntId}}\'> {{childHtml($index)}} </div>').render(get('scope'), 'input in inputArray', get)) + ` </div> `

exports['-2022747631'] = (get, $t) => `<span class='pad ` + (get("class")) + `' node-id='` + (get("_nodeId")) + `' index='` + (get("$index")) + `'> ` + (get("input").html()) + ` </span>`

exports['-1362189101'] = (get, $t) => `<div id='` + (get("input").childCntId) + `'> ` + (get("childHtml")(get("$index"))) + ` </div>`

exports['input/decision/decisionTree'] = (get, $t) => `<div class='` + (get("class")) + `' tree-id='` + (get("treeId")) + `'> ` + (get("payload").html()) + ` <button class='` + (get("buttonClass")) + `' tree-id='` + (get("treeId")) + `' ` + (get("formFilled")() ? '' : 'disabled') + `> ` + (get("name")) + ` </button> </div> `

exports['input/input'] = (get, $t) => `<div class='input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <input class='` + (get("class")) + `' list='input-list-` + (get("id")) + `' id='` + (get("id")) + `' placeholder='` + (get("placeholder")) + `' type='` + (get("type")) + `' name='` + (get("name")) + `' ` + (get("attrString")()) + `> <datalist id="input-list-` + (get("id")) + `"> ` + (new $t('<option value="{{item}}" ></option>').render(get('scope'), 'item in list', get)) + ` </datalist> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `

exports['-994603408'] = (get, $t) => `<option value="` + (get("item")) + `" ></option>`

exports['input/measurement'] = (get, $t) => `<div class='fit input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <input class='measurement-input ` + (get("class")) + `' id='` + (get("id")) + `' value='` + (get("value")() ? get("value")() : "") + `' placeholder='` + (get("placeholder")) + `' type='` + (get("type")) + `' name='` + (get("name")) + `'> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `

exports['input/select'] = (get, $t) => `<div class='input-cnt'` + (get("hidden")() ? ' hidden' : '') + `> <label>` + (get("label")) + `</label> <select class='` + (get("class")) + `' id='` + (get("id")) + `' name='` + (get("name")) + `' value='` + (get("value")()) + `'> ` + (new $t('<option  value=\'{{isArray() ? value : key}}\' {{selected(item) ? \'selected\' : \'\'}}> {{value}} </option>').render(get('scope'), 'key, value in list', get)) + ` </select> <div class='error' id='` + (get("errorMsgId")) + `'>` + (get("errorMsg")) + `</div> </div> `

exports['-1238286346'] = (get, $t) => `<option value='` + (get("isArray")() ? get("value") : get("key")) + `' ` + (get("selected")(get("item")) ? 'selected' : '') + `> ` + (get("value")) + ` </option>`

exports['login/confirmation-message'] = (get, $t) => `<h3> Check your email for confirmation. </h3> <button id='resend-activation'>Resend</button> `

exports['login/create-account'] = (get, $t) => `<h3>Create An Account</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='register'>Register</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='LOGIN'>Login</a> `

exports['login/reset-password'] = (get, $t) => `<h3>Reset Password</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='reset-password'>Reset</button> <br><br> <a href='#' user-state='LOGIN'>Login</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `

exports['managers/abstract-manager'] = (get, $t) => `<div> <div class="center"> <h2 id='` + (get("headerId")) + `'> ` + (get("header")) + ` <button class='manager-save-btn' id='` + (get("saveBtnId")) + `'>Save</button> </h2> </div> <div id="` + (get("bodyId")) + `"></div> </div> `

exports['login/login'] = (get, $t) => `<h3>Login</h3> <input type='text' placeholder="email" name='email' value='` + (get("email")) + `'> <input type='password' placeholder="password" name='password' value='` + (get("password")) + `'> <br><br> <button id='login-btn'>Login</button> <br><br> <a href='#' user-state='RESET_PASSWORD'>Reset Passord</a> | <a href='#' user-state='CREATE_ACCOUNT'>Create An Account</a> `

exports['managers/cost/body'] = (get, $t) => `<div class='` + (get("instance").CostManager.cntClass) + `' > ` + (get("instance").CostManager.costTypeHtml(get("instance").cost, get("instance"))) + ` </div> `

exports['managers/cost/cost-body'] = (get, $t) => `<div> ` + (get("CostManager").costTypeHtml(get("cost"), get("scope"))) + ` </div> `

exports['managers/cost/cost-head'] = (get, $t) => `<b> ` + (get("id")()) + ` - ` + (get("constructor").constructorId(get("constructor").name)) + ` </b> `

exports['managers/cost/header'] = (get, $t) => `<b part-id='` + (get("instance").partId) + `'>` + (get("instance").partId) + `</b> `

exports['managers/cost/types/category'] = (get, $t) => `<div> <b>Catagory</b> <div id='` + (get("parentId")) + `'>` + (get("expandList").html()) + `</div> </div> `

exports['managers/cost/types/conditional'] = (get, $t) => `<div> <b>Conditional</b> <div id='` + (get("parentId")) + `'>` + (get("expandList").html()) + `</div> </div> `

exports['managers/cost/types/labor'] = (get, $t) => `<div> <b>Labor</b> <span` + (get("cost").length() === undefined ? ' hidden' : '') + `> <input value='` + (get("cost").length()) + `'> </span> <span` + (get("cost").width() === undefined ? ' hidden' : '') + `> <label>X</label> <input value='` + (get("cost").width()) + `'> </span> <span` + (get("cost").depth() === undefined ? ' hidden' : '') + `> <label>X</label> <input value='` + (get("cost").depth()) + `'> </span> <br> <div> <label>Cost</label> <input value='` + (get("cost").cost()) + `'> <label>Per ` + (get("cost").unitCost('name')) + ` = ` + (get("cost").unitCost('value')) + `</label> </div> </div> `

exports['managers/cost/types/material'] = (get, $t) => `<div> <b>Material</b> <span` + (get("cost").length() === undefined ? ' hidden' : '') + `> <input value='` + (get("cost").length()) + `'> </span> <span` + (get("cost").width() === undefined ? ' hidden' : '') + `> <label>X</label> <input value='` + (get("cost").width()) + `'> </span> <span` + (get("cost").depth() === undefined ? ' hidden' : '') + `> <label>X</label> <input value='` + (get("cost").depth()) + `'> </span> <br> <div> <label>Cost</label> <input value='` + (get("cost").cost()) + `'> <label>Per ` + (get("cost").unitCost('name')) + ` = ` + (get("cost").unitCost('value')) + `</label> </div> </div> `

exports['managers/cost/types/select'] = (get, $t) => `<div> <b>Select</b> <div> ` + (get("CostManager").selectInput(get("cost")).html()) + ` </div> <div id='` + (get("parentId")) + `'>` + (get("expandList").html()) + `</div> </div> `

exports['managers/property/body'] = (get, $t) => `<div> No Need </div> `

exports['managers/property/header'] = (get, $t) => `<div> <b>` + (get("instance").name) + ` (` + (get("instance").constructor.code) + `) - ` + (get("instance").value) + `</b> </div> `

exports['managers/template/body'] = (get, $t) => `<div> <span> <input value='` + (get("instance").length()) + `'> </span> <span> <label>X</label> <input value='` + (get("instance").width()) + `'> </span> <span> <label>X</label> <input value='` + (get("instance").depth()) + `'> </span> <label>Cost</label> <input value='` + (get("instance").cost()) + `'> <br> <label>Per ` + (get("instance").unitCost().name) + ` = ` + (get("instance").unitCost().value) + ` </div> `

exports['managers/template/header'] = (get, $t) => `<div> <b>` + (get("instance").id()) + ` - ` + (get("instance").constructor.name) + ` (` + (get("instance").method()) + `)</b> </div> `

exports['model-controller'] = (get, $t) => `<div> <div class='model-selector'> <div ` + (get("group").level > 0 ? 'hidden' : '') + `> <div class='` + (get("tdm").isTarget("prefix", get("group").prefix) ? "active " : "") + ` ` + (get("label") ? "prefix-switch model-label" : "") + `' ` + (!get("label") ? 'hidden' : '') + `> <label type='prefix'>` + (get("label")) + `</label> <input type='checkbox' class='prefix-checkbox' prefix='` + (get("group").prefix) + `' ` + (!get("tdm").hidePrefix(get("label")) ? 'checked' : '') + `> </div> <div class='` + (get("label") ? "prefix-body indent" : "") + `' ` + (get("label") ? 'hidden' : '') + `> ` + (new $t('<div class=\'model-label{{tdm.isTarget("part-name", partName) ? " active" : ""}}\' > <label type=\'part-name\'>{{partName}}</label> <input type=\'checkbox\' class=\'part-name-checkbox\' part-name=\'{{partName}}\' {{!tdm.hidePartName(partName) ? \'checked\' : \'\'}}> {{new $t(\'<div class=\\\'{{tdm.isTarget("part-code", part.partCode) ? "active " : ""}} model-label indent\\\'  {{partList.length > 1 ? "" : "hidden"}}> <label type=\\\'part-code\\\'>{{part.partCode}}</label> <input type=\\\'checkbox\\\' class=\\\'part-code-checkbox\\\' part-code=\\\'{{part.partCode}}\\\' {{!tdm.hidePartCode(part.partCode) ? \\\'checked\\\' : \\\'\\\'}}> </div>\').render(get(\'scope\'), \'part in partList\', get)}} </div>').render(get('scope'), 'partName, partList in group.parts', get)) + ` ` + (new $t('model-controller').render(get('scope'), 'label, group in group.groups', get)) + ` </div> </div> </div> </div> `

exports['-1397238508'] = (get, $t) => `<div class='` + (get("tdm").isTarget("part-code", get("part").partCode) ? "active " : "") + ` model-label indent' ` + (get("partList").length > 1 ? "" : "hidden") + `> <label type='part-code'>` + (get("part").partCode) + `</label> <input type='checkbox' class='part-code-checkbox' part-code='` + (get("part").partCode) + `' ` + (!get("tdm").hidePartCode(get("part").partCode) ? 'checked' : '') + `> </div>`

exports['-443173449'] = (get, $t) => `<div class='model-label` + (get("tdm").isTarget("part-name", get("partName")) ? " active" : "") + `' > <label type='part-name'>` + (get("partName")) + `</label> <input type='checkbox' class='part-name-checkbox' part-name='` + (get("partName")) + `' ` + (!get("tdm").hidePartName(get("partName")) ? 'checked' : '') + `> ` + (new $t('<div class=\'{{tdm.isTarget("part-code", part.partCode) ? "active " : ""}} model-label indent\' {{partList.length > 1 ? "" : "hidden"}}> <label type=\'part-code\'>{{part.partCode}}</label> <input type=\'checkbox\' class=\'part-code-checkbox\' part-code=\'{{part.partCode}}\' {{!tdm.hidePartCode(part.partCode) ? \'checked\' : \'\'}}> </div>').render(get('scope'), 'part in partList', get)) + ` </div>`

exports['-424251200'] = (get, $t) => `model-controller`

exports['opening'] = (get, $t) => `<div class='opening-cnt' opening-id='` + (get("opening").uniqueId) + `'> <div class='divider-controls'> </div> </div> <div id='` + (get("openDispId")) + `'> </div> `

exports['order/body'] = (get, $t) => `<div> <b>` + (get("order").name) + `</b> <ul id='order-nav' class='center toggle-display-list'> <li class='toggle-display-item active' display-id='builder-display-` + (get("$index")) + `'>Builder</li> <li class='toggle-display-item' display-id='information-display-` + (get("$index")) + `'>Information</li> </ul> <div id='builder-display-` + (get("$index")) + `'> <b>` + (get("order").name) + `</b> <button class='save-order-btn' index='` + (get("$index")) + `'>Save</button> <div id='room-pills'>RoomPills!</div> </div> <div id='information-display-` + (get("$index")) + `' hidden> <utility-filter id='uf-info-` + (get("$index")) + `' edit='true'> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> </div> </div> `

exports['order/builder/body'] = (get, $t) => `<div> <b>` + (get("order").name) + `</b> <button class='save-order-btn' index='` + (get("$index")) + `'>Save</button> <div id='room-pills'>RoomPills!</div> </div> `

exports['order/builder/head'] = (get, $t) => `<h3 class='margin-zero'> ` + (get("order").name) + ` </h3> `

exports['order/head'] = (get, $t) => `<h3 class='margin-zero'> ` + (get("order").name) + ` </h3> `

exports['order/information/body'] = (get, $t) => `<utility-filter hidden> [ {"ID":1,"NAME":"Linktype","LEGAL_NAME":"Telephone and Data Systems, Inc.","LOGO_URI":"http://dummyimage.com/349x31.jpg/dddddd/000000","OWNER_ID":988}, {"ID":2,"NAME":"Eare","LEGAL_NAME":"Zymeworks Inc.","LOGO_URI":null,"OWNER_ID":933}, {"ID":3,"NAME":"Ainyx","LEGAL_NAME":"Pacira Pharmaceuticals, Inc.","LOGO_URI":null,"OWNER_ID":960}, {"ID":4,"NAME":"Photobean","LEGAL_NAME":"ArQule, Inc.","LOGO_URI":null,"OWNER_ID":443}, {"ID":5,"NAME":"Zoombeat","LEGAL_NAME":"Domtar Corporation","LOGO_URI":"http://dummyimage.com/83x401.bmp/5fa2dd/ffffff","OWNER_ID":739}] </utility-filter> `

exports['order/information/head'] = (get, $t) => `<b>Information</b> `

exports['properties/properties'] = (get, $t) => `<div class='center'> <div class='` + (get("key") ? "property-container close" : "") + `' radio-id='` + (get("radioId")) + `' ` + (get("noChildren")() ? 'hidden' : '') + `> <div class='` + (get("key") ? "expand-header" : "") + `'> ` + (get("key")) + ` </div> <div` + (get("key") ? ' hidden' : '') + `> ` + (new $t('<div > <label>{{property.name()}}</label> <input type="text" name="{{key}}" value="{{property.value()}}"> </div>').render(get('scope'), 'property in properties', get)) + ` ` + (new $t('<div > {{recurse(key, group)}} </div>').render(get('scope'), 'key, group in groups', get)) + ` </div> </div> </div> `

exports['-136866915'] = (get, $t) => `<div > <label>` + (get("property").name()) + `</label> <input type="text" name="` + (get("key")) + `" value="` + (get("property").value()) + `"> </div>`

exports['properties/property'] = (get, $t) => `<label>` + (get("property").name()) + `</label> <input type="text" name="` + (get("key")) + `" value="` + (get("property").value()) + `"> `

exports['room/body'] = (get, $t) => `<div> <select> ` + (new $t('<option >{{type}}</option>').render(get('scope'), 'type in propertyTypes', get)) + ` </select> <div class='cabinet-cnt' room-id='` + (get("room").id) + `'></div> </div> `

exports['-1674837651'] = (get, $t) => `<option >` + (get("type")) + `</option>`

exports['room/head'] = (get, $t) => `<b>` + (get("room").name) + `</b> `

exports['sections/divider'] = (get, $t) => `<h2>Divider: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `

exports['sections/door'] = (get, $t) => `<h2>DoorSection(` + (get("list").activeIndex()) + `):</h2> <br><br> <div> ` + (new $t('<div class=\'inline\' > <h3>{{assem.objId}}</h3> <div> {{getFeatureDisplay(assem)}} </div> </div>').render(get('scope'), 'assem in assemblies', get)) + ` </div> `

exports['sections/drawer'] = (get, $t) => `<h2>Drawer: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `

exports['sections/dual-door'] = (get, $t) => `<h2>Dual Door: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `

exports['sections/false-front'] = (get, $t) => `<h2>False Front: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `

exports['sections/open'] = (get, $t) => `<h2>Open: ` + (get("list").activeIndex()) + `</h2> <div class='section-feature-ctn'> ` + (get("featureDisplay")) + ` </div> `

exports.Show = Show
exports.OpenSectionDisplay = OpenSectionDisplay
exports.CostManager = CostManager
exports.Labor = Labor
exports.Cost = Cost
exports.Material = Material
exports.Select = Select
exports.Divider = Divider
exports.DoorSection = DoorSection
exports.Door = Door



