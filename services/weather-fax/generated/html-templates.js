
exports['182923293'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td><b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`%</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`%</td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['229660393'] = (get, $t) => 
		`<option value='` +
		$t.clean(get("value")) +
		`' ` +
		$t.clean(get("user").timeZone() === get("value") ? 'selected' : '') +
		`> ` +
		$t.clean(get("display")) +
		` </option>`

exports['315695473'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunset, get("user"), true)) +
		` </span> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['445083642'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		` ` +
		$t.clean(get("day").date_epoch) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").day.daily_chance_of_rain || 0))) +
		`% chance of rain </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunset, get("user"), true)) +
		` </span> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['636775893'] = (get, $t) => 
		`<tr > <td>` +
		$t.clean(get("number").faxNumber()) +
		`</td> <td>` +
		$t.clean(get("number").service()) +
		`</td> <td>` +
		$t.clean(get("number").description()) +
		`</td> </tr>`

exports['698669312'] = (get, $t) => 
		`<span > <img src="` +
		$t.clean(get("utils").iconUrl(get("type").icon)) +
		`" alt="Rain"> <br> ` +
		$t.clean(get("type").description) +
		` </span>`

exports['708422984'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['756433586'] = (get, $t) => 
		`<tr > <td><input type='time'></td> <td class='toggle-cnt days'> <span class='pointer' sending='true' day-index='0'>S</span> <span class='pointer' sending='true' day-index='1'>M</span> <span class='pointer' sending='true' day-index='2'>T</span> <span class='pointer' sending='true' day-index='3'>W</span> <span class='pointer' sending='true' day-index='4'>T</span> <span class='pointer' sending='true' day-index='5'>F</span> <span class='pointer' sending='true' day-index='6'>S</span> </td> <td class='toggle-cnt types'> <span class='pointer' ` +
		$t.clean(!get("isPdf") ? 'style="text-decoration: line-through;"' : '') +
		` >Hourly</span> <span class='pointer' ` +
		$t.clean(!get("isPdf") ? 'style="text-decoration: line-through;"' : '') +
		`> Daily</span> <span class='pointer' sending='true'>12 Hour and Daily</span> </td> </tr>`

exports['783606175'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain ? '' : 'hidden') +
		`> <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% </td> <td>&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain +
		get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> <b>Amount Percipitation</b> ` +
		$t.clean(get("day").day.totalprecip_intotalprecip_in) +
		` in </td> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['789133096'] = (get, $t) => 
		`<div class='left tab pointer orig-reports' id='` +
		$t.clean(get("report").id()) +
		`'> <b>Time</b> ` +
		$t.clean(get("report").time()) +
		` <b>Type:</b> ` +
		$t.clean(get("report").type()) +
		` <b>Days:</b> ` +
		$t.clean(get("dayIndexesToString")(get("report").dayIndexes())) +
		` </div>`

exports['806046918'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> </tr> <tr> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain ? '' : 'hidden') +
		`> <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% </td> <td ` +
		$t.clean(get("day").day.daily_chance_of_snow ? '' : '') +
		`> &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain +
		get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> &nbsp;&nbsp;&nbsp; <b>Accumulation</b> ` +
		$t.clean(get("day").day.totalprecip_in) +
		` in </td> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['937211060'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").day.daily_chance_of_rain || 0))) +
		`% chance of rain </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunset, get("user"), true)) +
		` </span> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['944878731'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` - <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` - <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['1482301144'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain ? '' : 'hidden') +
		`> <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% </td> <td>&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain +
		get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> <b>Amount Percipitation</b> ` +
		$t.clean(get("day").day.totalprecip_in) +
		` in </td> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['1513094842'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> </tr> <tr> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain ? '' : 'hidden') +
		`> <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% </td> <td>&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_snow ? '' : '') +
		`> <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </td> <td>&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain +
		get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> <b>Accumulation</b> ` +
		$t.clean(get("day").day.totalprecip_in) +
		` in </td> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['1668520998'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['1829486658'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain ? '' : 'hidden') +
		`> <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% </td> <td>&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_snow ? '' : '') +
		`> <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain +
		get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> <b>Amount Percipitation</b> ` +
		$t.clean(get("day").day.totalprecip_in) +
		` in </td> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['1836366674'] = (get, $t) => 
		`<div > <img src="` +
		$t.clean(get("utils").iconUrl(get("type").icon)) +
		`" alt="Rain"> <br> ` +
		$t.clean(get("type").description) +
		` </div>`

exports['1936278026'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> </tr> <tr> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain ? '' : 'hidden') +
		`> <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; </td> <td ` +
		$t.clean(get("day").day.daily_chance_of_snow ? '' : '') +
		`> <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% &nbsp;&nbsp;&nbsp; </td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain +
		get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> <b>Accumulation</b> ` +
		$t.clean(get("day").day.totalprecip_in) +
		` in </td> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['1975566886'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['2012576605'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td><b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`%</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`%</td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['admin'] = (get, $t) => 
		`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <script type='text/javascript' src="/js/short-cut-container.js"></script> <script type='text/javascript' src="/debug-gui/js/debug-gui-client.js" host='http://localhost:3000/debug-gui' log-window='23'></script> <script type='text/javascript' src="/debug-gui/js/debug-gui.js"></script> <script src="/js/utils/dom-utils.js"></script> <script src="/js/utils/request.js"></script> <script src='/weather-fax/js/admin.js'></script> <script src="/weather-fax/js/order-form.js"></script> <meta charset="utf-8"> <title></title> </head> <body> <div class='left'> <label>User:</label> <input hidden type="text" name="admin-password" value="` +
		$t.clean(get("adminPassword")) +
		`"> <input type="text" name="user-id" value=""> <button id='update-reports'>Update Schedualed Report Table</button> <button id='toggle-debug'>Toggle Debugging</button> <div id='payment-cnt' class='left' hidden> <br> <input type='number', name='payment-value'> <button id='payment'>Payment Recieved</button> </div> <div id='user-info'></div> </div> </body> </html> `

exports['footer'] = (get, $t) => 
		`<div> <style media="screen"> ul {list-style: none;} ` +
		$t.clean(get("isPdf") ? '.small {zoom: .5;}' : '') +
		` </style> <div> <table class='small'> <tbody> <tr> <td colspan="3"><b>Fax Numbers</b></td> </tr> ` +
		$t.clean( new $t('636775893').render(get("numbers"), 'number', get)) +
		` </tbody> </table> </div> </div> `

exports['order-form'] = (get, $t) => 
		`<!-- timeStamp: ` +
		$t.clean(get("timeStamp")()) +
		` --> <div> <script src="/js/utils/dom-utils.js"></script> <script src="/weather-fax/js/order-form.js"></script> <style> div {text-align: center;} table {text-align: center; width: 100%;} ` +
		$t.clean(get("isPdf") ? 'html {zoom: 0.55; margin: 3em}' : '') +
		` ` +
		$t.clean(!get("isPdf") ? 'table {width: 50vw;}' : '') +
		` ` +
		$t.clean(get("isPdf") ? 'input {display: none;}' : '') +
		` ` +
		$t.clean(get("isPdf") ? 'select {display: none;}' : '') +
		` .two-thirds {width: 66vw;} .half {width: 50vw;} .years-input {min-width: 5em;} .tab {margin-left: 15pt;} .left {text-align: left;} h2 {margin-bottom: 0} td {padding: 0 8pt;} .toggle-cnt > * { padding: 0 5pt; border-radius: 8pt; } .toggle-cnt > *:hover { background-color: #80808040; } .pointer { cursor: pointer; } </style> <input hidden name='account-id' value='` +
		$t.clean(get("user").faxNumber() || get("user").email()) +
		`'> <input hidden name='orig-zip-code' value='` +
		$t.clean(get("user").zipCode()) +
		`'> <input hidden name='orig-time-zone' value='` +
		$t.clean(get("user").timeZone()) +
		`'> <input hidden name='orig-plan-name' value='` +
		$t.clean(get("user").plan().name()) +
		`'> <div` +
		$t.clean(get("isPdf") ? '' : ' class="half"') +
		`> <h2>Weather Fax</h2> <b>Order form</b> </div> <br> <table border="2" cellspacing="0" cellpadding="0"> <thead> <caption><b> Account Information for ` +
		$t.clean(get("user").isFax() ? 'Fax Number:' : 'Email:') +
		` ` +
		$t.clean(get("user").userId()) +
		` </b></caption> <tr> <td><b>Zip Code</b></td> <td><b>Time Zone</b></td> </tr> </thead> <tbody> <tr> <td>` +
		$t.clean(get("user").zipCode()) +
		`</td> <td>` +
		$t.clean(get("utils").displayTimeZone(get("user").timeZone())) +
		`</td> </tr> <tr> <td><input type='number' maxlength="5" name="zipCode"/></td> <td> <select name="timeZone"> ` +
		$t.clean( new $t('229660393').render(get("utils").timeZoneMap(), 'display, value', get)) +
		` </select> </td> <td>Correct if neccisary</td> </tr> </tbody> </table> <br> <table border="2" cellspacing="0" cellpadding="0"> <caption><b>Plans: ` +
		$t.clean(get("user").plan().name()) +
		`</b></caption> <thead> <tr> <td><b>Select</b></td> <td><b>Price per Year</b></td> <td><b>Name</b></td> <td><b>Description</b></td> </tr> </thead> <tbody> ` +
		$t.clean( new $t('-1683812331').render(get("plans"), 'key, plan', get)) +
		` </tbody> </table> <br> <table border="2" cellspacing="0" cellpadding="0"> <tbody> <tr> <caption><b>Cost</b></caption> <td><b>Years</b></td> <td class='years-input'><input name='years' type=number min='1' max='5' value='1'></td> <td>Max 5 years you get a 6.25% discount for every additional year</td> </tr> <tr> <td><b>Total</b></td> <td><input name='total' disabled></td> <td><b>Formula:</b> pricePerYear * years * (1 - ((years - 1) * 0.0625))</td> </tr> </tbody> </table> <br> <div class='left' ` +
		$t.clean(get("user").schedualedReports().length === 0 ? 'hidden' : '') +
		`> <b>Existing Reports: Cross out to have them removed</b> ` +
		$t.clean( new $t('789133096').render(get("user").schedualedReports(), 'report', get)) +
		` </div> <table border="2" cellspacing="0" cellpadding="0"> <caption><b>Schedualed Reports</b> (` +
		$t.clean(get("user").schedualedReportsActive()) +
		`)</caption> <thead> <tr> <td><b>Time</b></td> <td><b>Days of the Week</b> (Circle Multiple)</td> <td><b>Type</b> (Circle One)</td> </tr> </thead> <tbody> ` +
		$t.clean( new $t('756433586').render('0..10', 'i', get)) +
		` </table> <br> <div class='left'> ` +
		$t.clean(get("isPdf") ? `<b>Fax Copy to our service number at:</b><div class='left tab'>(217)572-9339</div>` : "<div class='center half'><button id='order-form-submit' type='submit'>Submit</button></div>") +
		` <b>Mail payment and copy or original to:</b> <div class='left tab'> Jozsef Morrissey <br> 716 West N. Water St. </br> Beathany IL 61914 </div> <br> ` +
		$t.clean(get("footer")(get("isPdf"))) +
		` </div> `

exports['-1683812331'] = (get, $t) => 
		`<tr > <td><input class='pointer' type='radio' name='plan' value='` +
		$t.clean(get("plan").name()) +
		`' ` +
		$t.clean((get("user").plan().name() && get("user").plan().name() === get("plan").name()) ? 'checked' : '') +
		`></td> <td><z>$</z>` +
		$t.clean(get("plan").price()) +
		`.00</td> <td>` +
		$t.clean(get("plan").name()) +
		`</td> <td>` +
		$t.clean(get("plan").description()) +
		`</td> </tr>`

exports['reportStatus'] = (get, $t) => 
		`<div> <h3> Your schedualed reports are currently ` +
		$t.clean(get("user").schedualedReportsActive() ? 'ACTIVE' : 'INACTIVE') +
		` </h3> </div> `

exports['weather-reports/open-weather/daily'] = (get, $t) => 
		`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <title>Daily Weather Report</title> <style> html {zoom: 0.9; margin: 1em} h4 {margin: 0;} div {font-size: 8pt;} .margin-right {margin-right: 16px;} b {font-size: 8pt;} .left {float: left;} .right {float: right;} .icon-cnt {position: absolute; right: 0; top: 0;} .day-cnt {position: relative; margin-bottom: 8px;} .full-width {width: 100%} </style> </head> <body> <div> <div><b>Daily Weather Report</b> (` +
		$t.clean(get("user").zipCode()) +
		`)</div> ` +
		$t.clean( new $t('-1814681123').render(get("weatherData"), 'day', get)) +
		` </div> </body> </html> `

exports['-1814681123'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Wind ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</b> </td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> <td></td> <td><b>Speed</b></td> <td>` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> <td></td> <td><b>Gust</b></td> <td>` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</div> </td> <td> <div>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</div> </td> <td> <div>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</div> </td> <td> <div>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` </span> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </span> </div> <br> </div>`

exports['user-capped'] = (get, $t) => 
		`<h2>Sorry for the inconvenience you have exceeded your request limit for this month</h2> `

exports['weather-reports/open-weather/hourly'] = (get, $t) => 
		`<div> <style> html {zoom: 0.95; margin: 1em} h2 {margin: 0;} h5 {margin: 0;} div {font-size: 8pt;} b {font-size: 8pt;} td {font-size: 8pt;} .icon-cnt {position: absolute; right: 0; top: 0;} .hour-cnt {position: relative; margin-bottom: 8px;} .full-width {width: 75%} </style> <title>Hourly Weather Report</title> <div> <div><b>` +
		$t.clean(get("utils").getDateStr(get("weatherData")[0].dt)) +
		` Hourly Weather Report</b> (` +
		$t.clean(get("user").zipCode()) +
		`)</div> ` +
		$t.clean( new $t('-643004969').render(get("weatherData"), 'hour', get)) +
		` </div> </div> `

exports['-643004969'] = (get, $t) => 
		`<div class='hour-cnt'> <table class='full-width'> <tbody> <tr> <td> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"), true)) +
		`</b> </td> <td> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </td> <td> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </td> <td> <b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109; </td> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> </tbody> </table> <table> <tbody> <tr> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td><b>Wind ` +
		$t.clean(get("utils").getDirection(get("hour").wind_deg)) +
		` (` +
		$t.clean(get("hour").wind_deg) +
		`&deg;)</b></td> <td><b>Speed:</b> ` +
		$t.clean(get("Math").round(get("hour").wind_speed)) +
		` mph</td> <td><b>Gust:</b> ` +
		$t.clean(get("Math").round(get("hour").wind_gust)) +
		` mph</td> </tr> </tbody> </table> <span class='icon-cnt'> ` +
		$t.clean( new $t('698669312').render(get("hour").weather, 'type', get)) +
		` </span> </div>`

exports['weather-reports/weather-api/hourly'] = (get, $t) => 
		`<div> <style> html {zoom: 0.95; margin: 1em} h2 {margin: 0;} h5 {margin: 0;} .center {text-align: center;} div {font-size: 8pt;} b {font-size: 8pt;} td {font-size: 8pt;} .icon-cnt {position: absolute; right: 0; top: 0;} .hour-cnt {position: relative; margin-bottom: 8px;} .full-width {width: 75%} </style> <title>Hourly Weather Report</title> <div> <div class='center'><b> ` +
		$t.clean(get("utils").getDateStr(get("weatherData").hourly[0].time_epoch)) +
		` &nbsp;&nbsp;&nbsp;&nbsp; Hourly Weather Report </b> (` +
		$t.clean(get("user").zipCode()) +
		`)</div> ` +
		$t.clean( new $t('-966940671').render(get("weatherData").hourly, 'hour', get)) +
		` </div> </div> `

exports['-966940671'] = (get, $t) => 
		`<div class='hour-cnt'> <table class='full-width'> <tbody> <tr> <td> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").time_epoch, get("user"), true)) +
		`</b> </td> <td> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").chance_of_rain)) +
		`% </td> <td> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp_f)) +
		` &#x2109; </td> <td> <b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feelslike_f)) +
		` &#x2109; </td> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("hour").dewpoint_f) +
		`</td> <td><b>Humidity</b> ` +
		$t.clean(get("hour").humidity) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("hour").vis_miles) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("hour").uv) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("hour").cloud) +
		`</td> </tr> </tbody> </table> <table> <tbody> <tr> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure_mb)) +
		`</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td><b>Wind ` +
		$t.clean(get("hour").wind_dir) +
		` (` +
		$t.clean(get("hour").wind_degree) +
		`&deg;)</b></td> <td><b>Speed:</b> ` +
		$t.clean(get("Math").round(get("hour").wind_mph)) +
		` mph</td> <td><b>Gust:</b> ` +
		$t.clean(get("Math").round(get("hour").gust_mph)) +
		` mph</td> </tr> </tbody> </table> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("hour").condition.icon) +
		`" alt="hour.condition.text"> </span> </div>`

exports['weather-reports/weather-api/daily'] = (get, $t) => 
		`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <title>Daily Weather Report</title> <style> html {zoom: 0.9; margin: 1em} h4 {margin: 0;} div {font-size: 8pt;} .margin-right {margin-right: 16px;} b {font-size: 8pt;} .center {text-align: center;} .left {float: left;} .right {float: right;} .icon-cnt {position: absolute; right: 0; top: 0;} .day-cnt {position: relative; margin-bottom: 8px;} .full-width {width: 100%} </style> </head> <body> <div> <div class='center'><b>Daily Weather Report</b> (` +
		$t.clean(get("user").zipCode()) +
		`)</div> <br> ` +
		$t.clean( new $t('1936278026').render(get("weatherData").daily, 'day', get)) +
		` </div> </body> </html> `

exports['-1529715509'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("day").date_epoch) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").day.daily_chance_of_rain || 0))) +
		`% chance of rain </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunset, get("user"), true)) +
		` </span> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['-1372634552'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").day.daily_chance_of_rain || 0))) +
		`% chance of rain </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunset, get("user"), true)) +
		` </span> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['-1747587151'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").day.daily_chance_of_rain || 0))) +
		`% chance of rain &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").day.daily_chance_of_snow || 0))) +
		`% chance of snow </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.sunset, get("user"), true)) +
		` </span> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").astro.moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['-1099527195'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <br> </div>`

exports['-1665255603'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span class='left'> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` - <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span class='right'> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` - <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['-2094435540'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <td> <div>` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity</div> </td> <td> <div>` +
		$t.clean(get("day").day.uv) +
		` UV Index</div> </td> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` - <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` - <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['-1202572790'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity </span> <span> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("day").day.uv) +
		` UV Index </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` - <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` - <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['-1580473402'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b> &nbsp;&nbsp;&nbsp; <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% &nbsp;&nbsp;&nbsp; <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Max Wind Speed: ` +
		$t.clean(get("day").day.maxwind_mph) +
		`</b> </td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% Average Humidity </span> <span> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("day").day.uv) +
		` UV Index </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['-155480058'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td><b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`%</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`%</td> <tr> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`

exports['-531089227'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").date_epoch)) +
		`</b></div> <span class='icon-cnt'> <img src="http:` +
		$t.clean(get("day").day.condition.icon) +
		`" alt="day.day.condition.text"> </span> <table> <tbody> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").day.mintemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").day.maxtemp_f)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain ? '' : 'hidden') +
		`> <b>Rain</b> ` +
		$t.clean(get("day").day.daily_chance_of_rain) +
		`% </td> <td>&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_snow ? '' : '') +
		`> <b>Snow</b> ` +
		$t.clean(get("day").day.daily_chance_of_snow) +
		`% </td> <td>&nbsp;&nbsp;&nbsp;</td> <td ` +
		$t.clean(get("day").day.daily_chance_of_rain +
		get("day").day.daily_chance_of_snow ? '' : 'hidden') +
		`> <b>Accumulation</b> ` +
		$t.clean(get("day").day.totalprecip_in) +
		` in </td> </tr> <tr> </tr> </tbody> </table> <table class='full-width'> <tbody> <tr> <span> <b>Average Humidity</b> ` +
		$t.clean(get("Math").round(get("day").day.avghumidity )) +
		`% </span> <span> &nbsp;&nbsp;&nbsp; <b>UV Index</b> ` +
		$t.clean(get("day").day.uv) +
		` </span> <span> &nbsp;&nbsp;&nbsp; <b>Max Wind Speed:</b> ` +
		$t.clean(get("day").day.maxwind_mph) +
		` </span> </tr> </tbody> </table> <div> <span> <b>Sun rise:</b> ` +
		$t.clean(get("day").astro.sunrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.sunset) +
		` </span> <br> <span> <b>Moon rise:</b> ` +
		$t.clean(get("day").astro.moonrise) +
		` &nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp; <b>set:</b> ` +
		$t.clean(get("day").astro.moonset) +
		` &nbsp;&nbsp;&nbsp; (<b>Phase</b> ` +
		$t.clean(get("day").astro.moon_phase) +
		`) </span> </div> <br> </div>`
