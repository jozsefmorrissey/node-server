
exports['orientation-arrows'] = (get, $t) => 
		`<div class='orientation-arrows' id='` +
		$t.clean(get("navId")()) +
		`' l-id='` +
		$t.clean(get("id")()) +
		`'> <table class='orientation-arrows-table orient-arrows' cellspacing="0" cellpadding="0"> <tr><td></td> <td dir='u'>&#8679;</td> <td></td></tr> <tr><td dir='l'>&#8678;</td> <td dir='c'>` +
		$t.clean(get("space")()) +
		`&#8865;` +
		$t.clean(get("space")()) +
		`</td> <td dir='r'>&#8680;</td></tr> <tr><td></td> <td dir='d'>&#8681;</td> <td></td></tr> </table> </div> `
