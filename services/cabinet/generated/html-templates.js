
exports['202297006'] = (get, $t) => 
		`<div class="expandable-list-body" index='` +
		$t.clean(get("$index")) +
		`'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'>X</button> </div> <div class="expand-header ` +
		$t.clean(get("type")) +
		` ` +
		$t.clean(get("$index") === get("activeIndex") ? ' active' : '') +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("getHeader")(get("item"), get("$index"))) +
		` </div> </div> </div>`

exports['443122713'] = (get, $t) => 
		`<option value='` +
		$t.clean(get("section").prototype.constructor.name) +
		`' ` +
		$t.clean(get("opening").constructorId === get("section").name ? 'selected' : '') +
		`> ` +
		$t.clean(get("clean")(get("section").name)) +
		` </option>`

exports['632351395'] = (get, $t) => 
		`<div > <input class='expand-list-sidebar-input' list='auto-fill-list-` +
		$t.clean(get("input").id) +
		`' id='` +
		$t.clean(get("input").id) +
		`' placeholder='` +
		$t.clean(get("input").placeholder) +
		`' type='text'> <datalist id="auto-fill-list-` +
		$t.clean(get("input").id) +
		`"> ` +
		$t.clean(new $t('-1921787246').render(get('scope'), 'option in input.autofill', get)) +
		` </datalist> </div>`

exports['633282157'] = (get, $t) => 
		`<div class="expandable-list-body" index='` +
		$t.clean(get("$index")) +
		`'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'>X</button> <div class="expand-header ` +
		$t.clean(get("type")) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("getHeader")(get("item"), get("$index"))) +
		` </div> <div class="expand-body ` +
		$t.clean(get("type")) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("getBody")(get("item"), get("$index"))) +
		` </div> </div> </div>`

exports['990870856'] = (get, $t) => 
		`<div class='inline' > <h3>` +
		$t.clean(get("assem").objId) +
		`</h3> <div> ` +
		$t.clean(get("getFeatureDisplay")(get("assem"))) +
		` </div> </div>`

exports['1923072620'] = (get, $t) => 
		`<div class='model-label` +
		$t.clean(get("tdm").isTarget("part-name", get("partName")) ? " active" : "") +
		`' > <label type='part-name'>` +
		$t.clean(get("partName")) +
		`</label> <input type='checkbox' class='part-name-checkbox' part-name='` +
		$t.clean(get("partName")) +
		`' ` +
		$t.clean(!get("tdm").hidePartName(get("partName")) ? 'checked' : '') +
		`> ` +
		$t.clean(new $t('-1397238508').render(get('scope'), 'part in partList', get)) +
		` </div>`

exports['1927703609'] = (get, $t) => 
		`<div > ` +
		$t.clean(get("recurse")(get("key"), get("group"))) +
		` </div>`

exports['expandable/list'] = (get, $t) => 
		` <div class="expandable-list ` +
		$t.clean(get("type")) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`'> ` +
		$t.clean(new $t('633282157').render(get('scope'), 'item in list', get)) +
		` <div> <div id='input-tree-cnt'>` +
		$t.clean(get("inputTree") ? get("inputTree").html() : '') +
		`</div> <div ` +
		$t.clean(!get("hasInputTree")() ? '' : 'hidden') +
		`> ` +
		$t.clean(new $t('-1756076485').render(get('scope'), 'input in inputs', get)) +
		` <button ex-list-id='` +
		$t.clean(get("id")) +
		`' class='expandable-list-add-btn' ` +
		$t.clean(get("hideAddBtn") ? 'hidden' : '') +
		`> Add ` +
		$t.clean(get("listElemLable")) +
		` </button> </div> </div> <div class='error' id='` +
		$t.clean(get("ERROR_CNT_ID")) +
		`'></div> </div> `

exports['-2020667379'] = (get, $t) => 
		`<div class="expandable-list-body" index='` +
		$t.clean(get("$index")) +
		`'> <div class="expand-item"> <button class='expandable-item-rm-btn' ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'>X</button> <div class="expand-header ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("getHeader")(get("item"), get("$index"))) +
		` </div> <div class="expand-body ` +
		$t.clean(get("type")()) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("getBody")(get("item"), get("$index"))) +
		` </div> </div> </div>`

exports['-1921787246'] = (get, $t) => 
		`<option value="` +
		$t.clean(get("option")) +
		`" ></option>`

exports['-624140361'] = (get, $t) => 
		`<span > <input list='auto-fill-list-` +
		$t.clean(get("input").id()) +
		`' id='` +
		$t.clean(get("input").id()) +
		`' placeholder='` +
		$t.clean(get("input").placeholder) +
		`' type='text'> <datalist id="auto-fill-list-` +
		$t.clean(get("input").id()) +
		`"> ` +
		$t.clean(new $t('-1921787246').render(get('scope'), 'option in input.autofill()', get)) +
		` </datalist> </span>`

exports['expandable/pill'] = (get, $t) => 
		` <div class="expandable-list ` +
		$t.clean(get("type")) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`'> <div class="expand-list-cnt ` +
		$t.clean(get("type")) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`'> ` +
		$t.clean(new $t('-520175802').render(get('scope'), 'item in list', get)) +
		` </div> <div> <div id='input-tree-cnt'>` +
		$t.clean(get("inputTree") ? get("inputTree").html() : '') +
		`</div> <div ` +
		$t.clean(!get("hasInputTree")() ? '' : 'hidden') +
		`> ` +
		$t.clean(new $t('-1756076485').render(get('scope'), 'input in inputs', get)) +
		` <button ex-list-id='` +
		$t.clean(get("id")) +
		`' class='expandable-list-add-btn' ` +
		$t.clean(get("hideAddBtn") ? 'hidden' : '') +
		`> Add ` +
		$t.clean(get("listElemLable")) +
		` </button> </div> <br> <div class='error' id='` +
		$t.clean(get("ERROR_CNT_ID")) +
		`'></div> </div> <div class="expand-body ` +
		$t.clean(get("type")) +
		`"></div> </div> `

exports['-520175802'] = (get, $t) => 
		`<div class="expandable-list-body" index='` +
		$t.clean(get("$index")) +
		`'> <div class="expand-item"> <div class='expand-rm-btn-cnt'> <button class='expandable-item-rm-btn' ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'>X</button> </div> <div class="expand-header ` +
		$t.clean(get("type")) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("getHeader")(get("item"), get("$index"))) +
		` </div> </div> </div>`

exports['-1756076485'] = (get, $t) => 
		`<span > <input list='auto-fill-list-` +
		$t.clean(get("input").id) +
		`' id='` +
		$t.clean(get("input").id) +
		`' placeholder='` +
		$t.clean(get("input").placeholder) +
		`' type='text'> <datalist id="auto-fill-list-` +
		$t.clean(get("input").id) +
		`"> ` +
		$t.clean(new $t('-1921787246').render(get('scope'), 'option in input.autofill', get)) +
		` </datalist> </span>`

exports['expandable/sidebar'] = (get, $t) => 
		` <div class="expandable-list ` +
		$t.clean(get("type")) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`'> <div class="expand-list-cnt ` +
		$t.clean(get("type")) +
		`" ex-list-id='` +
		$t.clean(get("id")) +
		`'> ` +
		$t.clean(new $t('202297006').render(get('scope'), 'item in list', get)) +
		` <div id='input-tree-cnt'>` +
		$t.clean(get("inputTree") ? get("inputTree").html() : '') +
		`</div> <div ` +
		$t.clean(!get("hasInputTree")() ? '' : 'hidden') +
		`> ` +
		$t.clean(new $t('632351395').render(get('scope'), 'input in inputs', get)) +
		` <button ex-list-id='` +
		$t.clean(get("id")) +
		`' class='expandable-list-add-btn' ` +
		$t.clean(get("hideAddBtn") ? 'hidden' : '') +
		`> Add ` +
		$t.clean(get("listElemLable")) +
		` </button> <div class='error' id='` +
		$t.clean(get("ERROR_CNT_ID")) +
		`'></div> </div> </div> <div> </div> <div class="expand-body ` +
		$t.clean(get("type")) +
		`"> Hello World! </div> </div> `

exports['input/decision/decision'] = (get, $t) => 
		` <div> <span id='` +
		$t.clean(get("id")) +
		`' class='inline-flex'> ` +
		$t.clean(new $t('-2022747631').render(get('scope'), 'input in inputArray', get)) +
		` </span> ` +
		$t.clean(new $t('-1362189101').render(get('scope'), 'input in inputArray', get)) +
		` </div> `

exports['-2022747631'] = (get, $t) => 
		`<span class='pad ` +
		$t.clean(get("class")) +
		`' node-id='` +
		$t.clean(get("_nodeId")) +
		`' index='` +
		$t.clean(get("$index")) +
		`'> ` +
		$t.clean(get("input").html()) +
		` </span>`

exports['-1362189101'] = (get, $t) => 
		`<div id='` +
		$t.clean(get("input").childCntId) +
		`'> ` +
		$t.clean(get("childHtml")(get("$index"))) +
		` </div>`

exports['input/decision/decisionTree'] = (get, $t) => 
		`<div class='` +
		$t.clean(get("class")) +
		`' tree-id='` +
		$t.clean(get("treeId")) +
		`'> ` +
		$t.clean(get("payload").html()) +
		` <button class='` +
		$t.clean(get("buttonClass")) +
		`' tree-id='` +
		$t.clean(get("treeId")) +
		`' ` +
		$t.clean(get("formFilled")() ? '' : 'disabled') +
		`> ` +
		$t.clean(get("name")) +
		` </button> </div> `

exports['input/measurement'] = (get, $t) => 
		`<div class='fit input-cnt'` +
		$t.clean(get("hidden")() ? ' hidden' : '') +
		`> <label>` +
		$t.clean(get("label")) +
		`</label> <input class='measurement-input ` +
		$t.clean(get("class")) +
		`' id='` +
		$t.clean(get("id")) +
		`' value='` +
		$t.clean(get("value")() ? get("value")() : "") +
		`' placeholder='` +
		$t.clean(get("placeholder")) +
		`' type='` +
		$t.clean(get("type")) +
		`' name='` +
		$t.clean(get("name")) +
		`'> <div class='error' id='` +
		$t.clean(get("errorMsgId")) +
		`'>` +
		$t.clean(get("errorMsg")) +
		`</div> </div> `

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
		$t.clean(new $t('-994603408').render(get('scope'), 'item in list()', get)) +
		` </datalist> <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`'>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `

exports['-994603408'] = (get, $t) => 
		`<option value="` +
		$t.clean(get("item")) +
		`" ></option>`

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
		$t.clean(new $t('-1238286346').render(get('scope'), 'value in list()', get)) +
		` </select> <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`'>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `

exports['-1238286346'] = (get, $t) => 
		`<option value='` +
		$t.clean(get("isArray")() ? get("value") : get("key")) +
		`' ` +
		$t.clean(get("selected")(get("item")) ? 'selected' : '') +
		`> ` +
		$t.clean(get("value")) +
		` </option>`

exports['cabinet/body'] = (get, $t) => 
		`<div> <div class='center'> <div class='left'> <label>Show Left</label> <select class="show-left-select"> ` +
		$t.clean(new $t('-970877277').render(get('scope'), 'showType in showTypes', get)) +
		` </select> </div> <div class='property-id-container center inline-flex'>` +
		$t.clean(get("selectHtml")) +
		`</div> <div class='right'> <select class="show-right-select"> ` +
		$t.clean(new $t('-970877277').render(get('scope'), 'showType in showTypes', get)) +
		` </select> <label>Show Right</label> </div> </div> <br> <div class='center'> <button class='save-cabinet-btn' index='` +
		$t.clean(get("$index")) +
		`'>Save</button> </div> ` +
		$t.clean(new $t('-1702305177').render(get('scope'), 'opening in cabinet.openings', get)) +
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
		`<div class='cabinet-header'> <input class='cabinet-id-input' prop-update='` +
		$t.clean(get("$index")) +
		`.name' index='` +
		$t.clean(get("$index")) +
		`' room-id='` +
		$t.clean(get("room").id()) +
		`' value='` +
		$t.clean(get("cabinet").name || get("$index")) +
		`'> Size: <div class='cabinet-dem-cnt'> <label>W:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.width' room-id='` +
		$t.clean(get("room").id()) +
		`' value='` +
		$t.clean(get("cabinet").width()) +
		`'> <label>H:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.length' room-id='` +
		$t.clean(get("room").id()) +
		`' value='` +
		$t.clean(get("cabinet").length()) +
		`'> <label>D:</label> <input class='cabinet-input dem' prop-update='` +
		$t.clean(get("$index")) +
		`.thickness' room-id='` +
		$t.clean(get("room").id()) +
		`' value='` +
		$t.clean(get("cabinet").thickness()) +
		`'> </div> </div> `

exports['display-manager'] = (get, $t) => 
		`<div class='display-manager' id='` +
		$t.clean(get("id")) +
		`'> ` +
		$t.clean(new $t('-1519826343').render(get('scope'), 'item in list', get)) +
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
		$t.clean(get("list").activeIndex()) +
		`</h2> val: ` +
		$t.clean(get("list").value()('selected')) +
		` `

exports['divide/head'] = (get, $t) => 
		`<div> <select value='` +
		$t.clean(get("opening").name) +
		`' class='open-divider-select` +
		$t.clean(get("sections").length === 0 ? ' hidden' : '') +
		`'> ` +
		$t.clean(new $t('443122713').render(get('scope'), 'section in sections', get)) +
		` </select> <div class='open-divider-select` +
		$t.clean(get("sections").length === 0 ? '' : ' hidden') +
		`'> D </div> </div> `

exports['divider-controls'] = (get, $t) => 
		`<div> <label>Dividers:</label> <input class='division-pattern-input' type='text' name='pattern' opening-id='` +
		$t.clean(get("opening").uniqueId) +
		`' value='` +
		$t.clean(get("opening").pattern().str) +
		`'> <span class="open-orientation-radio-cnt"> <label for='open-orientation-horiz-` +
		$t.clean(get("opening").uniqueId) +
		`'>Horizontal:</label> <input type='radio' name='orientation-` +
		$t.clean(get("opening").uniqueId) +
		`' value='horizontal' open-id='` +
		$t.clean(get("opening").uniqueId) +
		`' id='open-orientation-horiz-` +
		$t.clean(get("opening").uniqueId) +
		`' class='open-orientation-radio' ` +
		$t.clean(get("opening").value('vertical') ? '' : 'checked') +
		`> <label for='open-orientation-vert-` +
		$t.clean(get("opening").uniqueId) +
		`'>Vertical:</label> <input type='radio' name='orientation-` +
		$t.clean(get("opening").uniqueId) +
		`' value='vertical' open-id='` +
		$t.clean(get("opening").uniqueId) +
		`' id='open-orientation-vert-` +
		$t.clean(get("opening").uniqueId) +
		`' class='open-orientation-radio' ` +
		$t.clean(get("opening").value('vertical') ? 'checked' : '') +
		`> </span> <div class='open-pattern-input-cnt' opening-id='` +
		$t.clean(get("opening").uniqueId) +
		`' ` +
		$t.clean(get("opening").pattern().equal ? 'hidden' : '') +
		`> ` +
		$t.clean(get("patternInputHtml")) +
		` </div> </div> `

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
		`<div class='` +
		$t.clean(get("instance").CostManager.cntClass) +
		`' > ` +
		$t.clean(get("instance").CostManager.costTypeHtml(get("instance").cost, get("instance"))) +
		` </div> `

exports['managers/cost/cost-body'] = (get, $t) => 
		`<div> ` +
		$t.clean(get("CostManager").costTypeHtml(get("cost"), get("scope"))) +
		` </div> `

exports['managers/cost/cost-head'] = (get, $t) => 
		`<b> ` +
		$t.clean(get("id")()) +
		` - ` +
		$t.clean(get("constructor").constructorId(get("constructor").name)) +
		` </b> `

exports['managers/cost/header'] = (get, $t) => 
		`<b part-id='` +
		$t.clean(get("instance").partId) +
		`'>` +
		$t.clean(get("instance").partId) +
		`</b> `

exports['managers/cost/types/category'] = (get, $t) => 
		`<div> <b>Catagory</b> <div id='` +
		$t.clean(get("parentId")) +
		`'>` +
		$t.clean(get("expandList").html()) +
		`</div> </div> `

exports['managers/cost/types/conditional'] = (get, $t) => 
		`<div> <b>Conditional</b> <div id='` +
		$t.clean(get("parentId")) +
		`'>` +
		$t.clean(get("expandList").html()) +
		`</div> </div> `

exports['managers/cost/types/labor'] = (get, $t) => 
		`<div> <b>Labor</b> <span` +
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
		`<div> <b>Material</b> <span` +
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

exports['managers/cost/types/select'] = (get, $t) => 
		`<div> <b>Select</b> <div> ` +
		$t.clean(get("CostManager").selectInput(get("cost")).html()) +
		` </div> <div id='` +
		$t.clean(get("parentId")) +
		`'>` +
		$t.clean(get("expandList").html()) +
		`</div> </div> `

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
		$t.clean(get("group").level > 0 ? 'hidden' : '') +
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
		$t.clean(new $t('1923072620').render(get('scope'), 'partName, partList in group.parts', get)) +
		` ` +
		$t.clean(new $t('-424251200').render(get('scope'), 'label, group in group.groups', get)) +
		` </div> </div> </div> </div> `

exports['-1397238508'] = (get, $t) => 
		`<div class='` +
		$t.clean(get("tdm").isTarget("part-code", get("part").partCode) ? "active " : "") +
		` model-label indent' ` +
		$t.clean(get("partList").length > 1 ? "" : "hidden") +
		`> <label type='part-code'>` +
		$t.clean(get("part").partCode) +
		`</label> <input type='checkbox' class='part-code-checkbox' part-code='` +
		$t.clean(get("part").partCode) +
		`' ` +
		$t.clean(!get("tdm").hidePartCode(get("part").partCode) ? 'checked' : '') +
		`> </div>`

exports['-424251200'] = (get, $t) => 
		`model-controller`

exports['opening'] = (get, $t) => 
		`<div class='opening-cnt' opening-id='` +
		$t.clean(get("opening").uniqueId) +
		`'> <div class='divider-controls'> </div> </div> <div id='` +
		$t.clean(get("openDispId")) +
		`'> </div> `

exports['order/body'] = (get, $t) => 
		`<div> <b>` +
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

exports['properties/properties'] = (get, $t) => 
		`<div class='center'> <div class='` +
		$t.clean(get("key") ? "property-container close" : "") +
		`' radio-id='` +
		$t.clean(get("radioId")) +
		`' ` +
		$t.clean(get("noChildren")() ? 'hidden' : '') +
		`> <div class='` +
		$t.clean(get("key") ? "expand-header" : "") +
		`'> ` +
		$t.clean(get("key")) +
		` </div> <div` +
		$t.clean(get("key") ? ' hidden' : '') +
		`> ` +
		$t.clean(new $t('-136866915').render(get('scope'), 'property in properties', get)) +
		` ` +
		$t.clean(new $t('1927703609').render(get('scope'), 'key, group in groups', get)) +
		` </div> </div> </div> `

exports['-136866915'] = (get, $t) => 
		`<div > <label>` +
		$t.clean(get("property").name()) +
		`</label> <input type="text" name="` +
		$t.clean(get("key")) +
		`" value="` +
		$t.clean(get("property").value()) +
		`"> </div>`

exports['properties/property'] = (get, $t) => 
		`<label>` +
		$t.clean(get("property").name()) +
		`</label> <input type="text" name="` +
		$t.clean(get("key")) +
		`" value="` +
		$t.clean(get("property").value()) +
		`"> `

exports['room/body'] = (get, $t) => 
		`<div> <select> ` +
		$t.clean(new $t('-1674837651').render(get('scope'), 'type in propertyTypes', get)) +
		` </select> <div class='cabinet-cnt' room-id='` +
		$t.clean(get("room").id()) +
		`'></div> </div> `

exports['-1674837651'] = (get, $t) => 
		`<option >` +
		$t.clean(get("type")) +
		`</option>`

exports['room/head'] = (get, $t) => 
		`<b>` +
		$t.clean(get("room").name()) +
		`</b> `

exports['sections/divider'] = (get, $t) => 
		`<h2>Divider: ` +
		$t.clean(get("list").activeIndex()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['sections/door'] = (get, $t) => 
		`<h2>DoorSection(` +
		$t.clean(get("list").activeIndex()) +
		`):</h2> <br><br> <div> ` +
		$t.clean(new $t('990870856').render(get('scope'), 'assem in assemblies', get)) +
		` </div> `

exports['sections/drawer'] = (get, $t) => 
		`<h2>Drawer: ` +
		$t.clean(get("list").activeIndex()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['sections/dual-door'] = (get, $t) => 
		`<h2>Dual Door: ` +
		$t.clean(get("list").activeIndex()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['sections/false-front'] = (get, $t) => 
		`<h2>False Front: ` +
		$t.clean(get("list").activeIndex()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `

exports['sections/open'] = (get, $t) => 
		`<h2>Open: ` +
		$t.clean(get("list").activeIndex()) +
		`</h2> <div class='section-feature-ctn'> ` +
		$t.clean(get("featureDisplay")) +
		` </div> `
