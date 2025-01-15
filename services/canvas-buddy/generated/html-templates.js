
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

exports['orientation-arrows'] = (get, $t) => 
		`<div class='orientation-arrows' id='` +
		$t.clean(get("navId")()) +
		`' l-id='` +
		$t.clean(get("id")()) +
		`'> <table class='orientation-arrows-table orient-arrows' cellspacing="0" cellpadding="0"> <tr><td></td> <td dir='u'>&#8681;</td> <td></td></tr> <tr><td dir='l'>&#8680;</td> <td dir='c'>` +
		$t.clean(get("space")()) +
		`&#8865;` +
		$t.clean(get("space")()) +
		`</td> <td dir='r'>&#8678;</td></tr> <tr><td></td> <td dir='d'>&#8679;</td> <td></td></tr> </table> </div> `

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
