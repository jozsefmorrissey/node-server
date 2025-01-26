
exports['1747552123'] = (get, $t) => 
		`<span > <label>` +
		$t.clean(get("uNit")) +
		`</label><input type='radio' name='` +
		$t.clean(get("id")()) +
		`-unit' value='` +
		$t.clean(get("uNit")) +
		`' ` +
		$t.clean(get("uNit") === get("unit")() ? 'checked' : '') +
		`> </span>`

exports['orientation-controls'] = (get, $t) => 
		`<div class='orientation no-print' id='` +
		$t.clean(get("navId")()) +
		`' l-id='` +
		$t.clean(get("id")()) +
		`'> <div class='arrows'> <table cellspacing="0" cellpadding="0"> <tr> <td cmd='settings'><i class='gg-menu-round'></i></td> <td cmd='u'>&#8681;</td> <td cmd='color'><input type='color' value='` +
		$t.clean(get("color")()) +
		`'/></td> </tr> <tr> <td cmd='l'>&#8680;</td> <td cmd='c'>` +
		$t.clean(get("space")()) +
		`&#8865;` +
		$t.clean(get("space")()) +
		`</td> <td cmd='r'>&#8678;</td> </tr> <tr> <td></td> <td cmd='d'>&#8679;</td> <td></td> </tr> </table> </div> <div class='settings' hidden> <button class='remove-btn'>X</button> <div class='body'></div> </div> </div> `

exports['controls/viewer'] = (get, $t) => 
		`<label>Polygons</label> <input type='checkbox' name='polygons' ` +
		$t.clean(get("CONTROLS").POLYGONS ? 'checked' : '') +
		`> <br> <label>Outline</label> <input type='checkbox' name='outline' ` +
		$t.clean(get("CONTROLS").OUTLINE ? 'checked' : '') +
		`> <br/> <label>Wireframe</label> <input type='checkbox' name='wireframe' ` +
		$t.clean(get("CONTROLS").WIREFRAME ? 'checked' : '') +
		`> <br> <label>Background Color</label> <input type="color" value="` +
		$t.clean(get("CONTROLS").BACKGROUND_COLOR) +
		`" name='background-color'> `

exports['input/measurement'] = (get, $t) => 
		`<div class='fit input-cnt measurement-input-cnt'` +
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
		`' unit='` +
		$t.clean(get("unit")()) +
		`' ` +
		$t.clean(get("disabled")() ? 'disabled' : '') +
		` ` +
		$t.clean(get("unitOnly")() ? 'hidden' : '') +
		`> ` +
		$t.clean( new $t('1747552123').render(get("units")(), 'uNit', get)) +
		` <div class='error' id='` +
		$t.clean(get("errorMsgId")()) +
		`' hidden>` +
		$t.clean(get("errorMsg")()) +
		`</div> </div> `
