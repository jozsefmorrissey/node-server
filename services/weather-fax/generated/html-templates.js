
exports['3277243'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b></div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"))) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"))) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"))) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"))) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) <br> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td></td> </tr> </tbody> </table> ` +
		$t.clean(get("$index") !== get("weatherData").length - 1 ? '<br>' : '') +
		` </div>`

exports['7592747'] = (get, $t) => 
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
		` mph</td> </tr> </tbody> </table> <table> <tbody> <tr> <td> <div class='margin-right'>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</div> </td> <td> <div class='margin-right'>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</div> </td> <td> <div class='margin-right'>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</div> </td> <td> <div>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</div> </td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> </div>`

exports['41683291'] = (get, $t) => 
		`<tr > <td><input type='time'></td> <td class='toggle-cnt days'> <span class='pointer' sending='true' day-index='0'>S</span> <span class='pointer' sending='true' day-index='1'>M</span> <span class='pointer' sending='true' day-index='2'>T</span> <span class='pointer' sending='true' day-index='3'>W</span> <span class='pointer' sending='true' day-index='4'>T</span> <span class='pointer' sending='true' day-index='5'>F</span> <span class='pointer' sending='true' day-index='6'>S</span> </td> <td class='toggle-cnt types'> <span class='pointer' style="text-decoration: line-through;">Hourly</span> <span class='pointer' style="text-decoration: line-through;">Daily</span> <span class='pointer' sending='true'>15 Hour and Daily</span> </td> </tr>`

exports['55542979'] = (get, $t) => 
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
		` mph</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> </tr> </tbody> </table> </div>`

exports['78787155'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Wind ` +
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
		` mph</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> </tr> </tbody> </table> </div>`

exports['229660393'] = (get, $t) => 
		`<option value='` +
		$t.clean(get("value")) +
		`' ` +
		$t.clean(get("user").timeZone() === get("value") ? 'selected' : '') +
		`> ` +
		$t.clean(get("display")) +
		` </option>`

exports['261679667'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b></div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) <br> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td></td> </tr> </tbody> </table> </div>`

exports['262789380'] = (get, $t) => 
		`<div class='hour-cnt'> <div> <span> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</b> </span> <span> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </span> <span> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </span> </div> <table> <tbody> <tr> <td></td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td></td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind ` +
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

exports['387871784'] = (get, $t) => 
		`<div class='hour-cnt'> <table class='full-width'> <tbody> <tr> <td> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"), true)) +
		`</b> </td> <td> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </td> <td> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </td> </tr> </tbody> </table> <table> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> </tr> <tr> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> <td><b>Wind ` +
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

exports['604273474'] = (get, $t) => 
		`<div class='hour-cnt'> <div class='full-width'> <span> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</b> </span> <span> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </span> <span> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </span> </div> <table> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> </tr> <tr> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> <td><b>Wind ` +
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

exports['636775893'] = (get, $t) => 
		`<tr > <td>` +
		$t.clean(get("number").faxNumber()) +
		`</td> <td>` +
		$t.clean(get("number").service()) +
		`</td> <td>` +
		$t.clean(get("number").description()) +
		`</td> </tr>`

exports['644840433'] = (get, $t) => 
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
		`) </span> </div> </div>`

exports['698669312'] = (get, $t) => 
		`<span > <img src="` +
		$t.clean(get("utils").iconUrl(get("type").icon)) +
		`" alt="Rain"> <br> ` +
		$t.clean(get("type").description) +
		` </span>`

exports['756433586'] = (get, $t) => 
		`<tr > <td><input type='time'></td> <td class='toggle-cnt days'> <span class='pointer' sending='true' day-index='0'>S</span> <span class='pointer' sending='true' day-index='1'>M</span> <span class='pointer' sending='true' day-index='2'>T</span> <span class='pointer' sending='true' day-index='3'>W</span> <span class='pointer' sending='true' day-index='4'>T</span> <span class='pointer' sending='true' day-index='5'>F</span> <span class='pointer' sending='true' day-index='6'>S</span> </td> <td class='toggle-cnt types'> <span class='pointer' ` +
		$t.clean(!get("isPdf") ? 'style="text-decoration: line-through;"' : '') +
		` >Hourly</span> <span class='pointer' ` +
		$t.clean(!get("isPdf") ? 'style="text-decoration: line-through;"' : '') +
		`> Daily</span> <span class='pointer' sending='true'>12 Hour and Daily</span> </td> </tr>`

exports['773479560'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td> <b>Wind ` +
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
		` mph</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

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

exports['875906149'] = (get, $t) => 
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
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> </tbody> </table> <table> <tbody> <tr> <td><b>Wind ` +
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

exports['976418891'] = (get, $t) => 
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
		` mph</td> </tr> </tbody> </table> <table> <tbody> <tr> <td class='margin-right'>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td class='margin-right'>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td class='margin-right'>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td class='margin-right'>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> </div>`

exports['984281958'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Wind ` +
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
		` mph</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['1094017993'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['1179104379'] = (get, $t) => 
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
		` mph</td> </tr> </tbody> </table> <table> <tbody> <tr> <td> <div class='margin-right'>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</div> </td> <td> <div class='margin-right'>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</div> </td> <td> <div class='margin-right'>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</div> </td> <td> <div>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</div> </td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> </div>`

exports['1204225965'] = (get, $t) => 
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
		` mph</td> </tr> </tbody> </table> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> </div>`

exports['1440112564'] = (get, $t) => 
		`<option value='` +
		$t.clean(get("value")) +
		`'> ` +
		$t.clean(get("display")) +
		` </option>`

exports['1492206705'] = (get, $t) => 
		`<div class='hour-cnt'> <div> <span> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</b> </span> <span> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </span> <span> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </span> </div> <table> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> </tr> <tr> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> <td><b>Wind ` +
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

exports['1607202810'] = (get, $t) => 
		`<tr > <td><input type='time'></td> <td class='toggle-cnt days'> <span class='pointer' sending='true' day-index='0'>S</span> <span class='pointer' sending='true' day-index='1'>M</span> <span class='pointer' sending='true' day-index='2'>T</span> <span class='pointer' sending='true' day-index='3'>W</span> <span class='pointer' sending='true' day-index='4'>T</span> <span class='pointer' sending='true' day-index='5'>F</span> <span class='pointer' sending='true' day-index='6'>S</span> </td> <td class='toggle-cnt types'> <span class='pointer' {!isPdf ? 'style="text-decoration: line-through;"' : ''} >Hourly</span> <span class='pointer' {!isPdf ? 'style="text-decoration: line-through;"' : ''}> Daily</span> <span class='pointer' sending='true'>12 Hour and Daily</span> </td> </tr>`

exports['1629632834'] = (get, $t) => 
		`<div class='day-cnt'> <h4>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</h4> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) <br> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td></td> </tr> </tbody> </table> ` +
		$t.clean(get("$index") !== get("weatherData").length - 1 ? '<br>' : '') +
		` </div>`

exports['1812186885'] = (get, $t) => 
		`<div class='hour-cnt'> <div><b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</b></div> <table> <tbody> <tr> <td><b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109;</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`%</td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind ` +
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

exports['1836366674'] = (get, $t) => 
		`<div > <img src="` +
		$t.clean(get("utils").iconUrl(get("type").icon)) +
		`" alt="Rain"> <br> ` +
		$t.clean(get("type").description) +
		` </div>`

exports['1903552214'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Wind</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> <td></td> <td></td> <td></td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['1996042295'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b></div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"))) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"))) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"))) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"))) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) <br> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td></td> </tr> </tbody> </table> </div>`

exports['2031329395'] = (get, $t) => 
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
		` mph</td> </tr> </tbody> </table> <table> <tbody> <tr> <td class='margin-right'>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td class='margin-right'>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td class='margin-right'>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> </div>`

exports['2145216814'] = (get, $t) => 
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
		`</td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td><b>Wind ` +
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
		` </div> <table border="2" cellspacing="0" cellpadding="0"> <caption><b>Schedualed Reports</b></caption> <thead> <tr> <td><b>Time</b></td> <td><b>Days of the Week</b> (Circle Multiple)</td> <td><b>Type</b> (Circle One)</td> </tr> </thead> <tbody> ` +
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

exports['-1821268506'] = (get, $t) => 
		`<tr > <td><input type='time'></td> <td class='toggle-cnt days'> <span class='pointer' sending='true' day-index='0'>S</span> <span class='pointer' sending='true' day-index='1'>M</span> <span class='pointer' sending='true' day-index='2'>T</span> <span class='pointer' sending='true' day-index='3'>W</span> <span class='pointer' sending='true' day-index='4'>T</span> <span class='pointer' sending='true' day-index='5'>F</span> <span class='pointer' sending='true' day-index='6'>S</span> </td> <td class='toggle-cnt types'> <span class='pointer' style="text-decoration: line-through;">Hourly</span> <span class='pointer' style="text-decoration: line-through;">Daily</span> <span class='pointer' sending='true'>Both</span> </td> </tr>`

exports['schedualed'] = (get, $t) => 
		`<div> <h3> Your schedualed reports are currently ` +
		$t.clean(get("user").schedualedReportsActive() ? 'ACTIVE' : 'INACTIVE') +
		` </h3> </div> `

exports['weather-reports/hourly'] = (get, $t) => 
		`<div> <style> html {zoom: 0.95; margin: 1em} h2 {margin: 0;} h5 {margin: 0;} div {font-size: 8pt;} b {font-size: 8pt;} td {font-size: 8pt;} .icon-cnt {position: absolute; right: 0; top: 0;} .hour-cnt {position: relative; margin-bottom: 8px;} .full-width {width: 75%} </style> <title>Hourly Weather Report</title> <div> <div><b>` +
		$t.clean(get("utils").getDateStr(get("weatherData")[0].dt)) +
		` Hourly Weather Report</b></div> ` +
		$t.clean( new $t('-643004969').render(get("weatherData"), 'hour', get)) +
		` </div> </div> `

exports['-754346315'] = (get, $t) => 
		`<div class='hour-cnt'> <h3>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt)) +
		`</h3> <table> <tbody> <tr> <td><b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109;</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`%</td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind</b></td> <td>Speed: ` +
		$t.clean(get("Math").round(get("hour").wind_speed)) +
		` mph</td> <td>Gust: ` +
		$t.clean(get("Math").round(get("hour").wind_gust)) +
		` mph</td> <td>Direction: ` +
		$t.clean(get("utils").getDirection(get("hour").wind_deg)) +
		` (` +
		$t.clean(get("hour").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> <span class='icon-cnt'> ` +
		$t.clean( new $t('698669312').render(get("hour").weather, 'type', get)) +
		` </span> </div>`

exports['weather-reports/daily'] = (get, $t) => 
		`<!DOCTYPE html> <html lang="en" dir="ltr"> <head> <meta charset="utf-8"> <title>Daily Weather Report</title> <style> html {zoom: 0.9; margin: 1em} h4 {margin: 0;} div {font-size: 8pt;} .margin-right {margin-right: 16px;} b {font-size: 8pt;} .left {float: left;} .right {float: right;} .icon-cnt {position: absolute; right: 0; top: 0;} .day-cnt {position: relative; margin-bottom: 8px;} .full-width {width: 100%} </style> </head> <body> <div> <div><b>Daily Weather Report</b></div> ` +
		$t.clean( new $t('644840433').render(get("weatherData"), 'day', get)) +
		` </div> </body> </html> `

exports['-431538336'] = (get, $t) => 
		`<div class='day-cnt'> <h4>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</h4> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) <br> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td></td> </tr> </tbody> </table> ` +
		$t.clean(get("$index") !== get("weatherData").length ? '<br>' : '') +
		` </div>`

exports['-66755273'] = (get, $t) => 
		`<div class='hour-cnt'> <h2>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt)) +
		`</h2> <table> <tbody> <tr> <td><b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109;</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`%</td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind</b></td> <td>Speed: ` +
		$t.clean(get("Math").round(get("hour").wind_speed)) +
		` mph</td> <td>Gust: ` +
		$t.clean(get("Math").round(get("hour").wind_gust)) +
		` mph</td> <td>Direction: ` +
		$t.clean(get("utils").getDirection(get("hour").wind_deg)) +
		` (` +
		$t.clean(get("hour").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> <span class='icon-cnt'> ` +
		$t.clean( new $t('698669312').render(get("hour").weather, 'type', get)) +
		` </span> </div>`

exports['./public/html/templates/weather-reports/.gitignore'] = (get, $t) => 
		`/* `

exports['./public/html/templates/orderForm/.gitignore'] = (get, $t) => 
		`/* `

exports['-1092262748'] = (get, $t) => 
		`<div class='day-cnt'> <h4>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</h4> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"))) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"))) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"))) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"))) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) <br> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td></td> </tr> </tbody> </table> ` +
		$t.clean(get("$index") !== get("weatherData").length - 1 ? '<br>' : '') +
		` </div>`

exports['-1660664076'] = (get, $t) => 
		`<div class='hour-cnt'> <h3>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</h3> <table> <tbody> <tr> <td><b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109;</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`%</td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind</b></td> <td>Speed: ` +
		$t.clean(get("Math").round(get("hour").wind_speed)) +
		` mph</td> <td>Gust: ` +
		$t.clean(get("Math").round(get("hour").wind_gust)) +
		` mph</td> <td>Direction: ` +
		$t.clean(get("utils").getDirection(get("hour").wind_deg)) +
		` (` +
		$t.clean(get("hour").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> <span class='icon-cnt'> ` +
		$t.clean( new $t('698669312').render(get("hour").weather, 'type', get)) +
		` </span> </div>`

exports['reportStatus'] = (get, $t) => 
		`<div> <h3> Your schedualed reports are currently ` +
		$t.clean(get("user").schedualedReportsActive() ? 'ACTIVE' : 'INACTIVE') +
		` </h3> </div> `

exports['-53353616'] = (get, $t) => 
		`<div class='hour-cnt'> <h5>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</h5> <table> <tbody> <tr> <td><b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109;</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`%</td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind</b></td> <td>Speed: ` +
		$t.clean(get("Math").round(get("hour").wind_speed)) +
		` mph</td> <td>Gust: ` +
		$t.clean(get("Math").round(get("hour").wind_gust)) +
		` mph</td> <td>Direction: ` +
		$t.clean(get("utils").getDirection(get("hour").wind_deg)) +
		` (` +
		$t.clean(get("hour").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> <span class='icon-cnt'> ` +
		$t.clean( new $t('698669312').render(get("hour").weather, 'type', get)) +
		` </span> </div>`

exports['-1224184781'] = (get, $t) => 
		`<div class='hour-cnt'> <div><b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</b></div> <table> <tbody> <tr> <td><b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109;</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`%</td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind</b></td> <td>Speed: ` +
		$t.clean(get("Math").round(get("hour").wind_speed)) +
		` mph</td> <td>Gust: ` +
		$t.clean(get("Math").round(get("hour").wind_gust)) +
		` mph</td> <td>Direction: ` +
		$t.clean(get("utils").getDirection(get("hour").wind_deg)) +
		` (` +
		$t.clean(get("hour").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> <span class='icon-cnt'> ` +
		$t.clean( new $t('698669312').render(get("hour").weather, 'type', get)) +
		` </span> </div>`

exports['-1645014309'] = (get, $t) => 
		`<div class='hour-cnt'> <div><b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</b></div> <table> <tbody> <tr> <td><b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109;</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`%</td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind</b></td> <td>Speed: ` +
		$t.clean(get("Math").round(get("hour").wind_speed)) +
		` mph</td> <td>Gust: ` +
		$t.clean(get("Math").round(get("hour").wind_gust)) +
		` mph</td> <td>Direction: ` +
		$t.clean(get("utils").getDirection(get("hour").wind_deg)) +
		` (` +
		$t.clean(get("hour").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> <span class='icon-cnt'> ` +
		$t.clean( new $t('698669312').render(get("hour").weather, 'type', get)) +
		` </span> <br> </div>`

exports['-654995481'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) <br> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <table> <tbody> <tr> <td></td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td></td> </tr> </tbody> </table> </div>`

exports['-1234917750'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) <br> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> </tr> </tbody> </table> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['-594082107'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Wind</b></td> <tr> <td><b>Low</b> ` +
		$t.clean(get("Math").round(get("day").temp.min)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Real</b></td> <td>` +
		$t.clean(get("Math").round(get("day").temp.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").temp.night)) +
		` &#x2109;</td> <td></td> <td><b>Speed</b></td> <td></td> </tr> <tr> <td><b>High</b> ` +
		$t.clean(get("Math").round(get("day").temp.max)) +
		` &#x2109;</td> <td>&nbsp;&nbsp;&nbsp;</td> <td><b>Wind Chill</b></td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.morn)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.day)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.eve)) +
		` &#x2109;</td> <td>` +
		$t.clean(get("Math").round(get("day").feels_like.night)) +
		` &#x2109;</td> <td></td> <td><b>Gust</b></td> <td></td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['-1837739314'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Wind</b>` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> <tr> <td><b>Low</b> ` +
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
		` mph</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['-793664086'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;</td> <td></td> <td> <b>Wind</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;) </td> <tr> <td><b>Low</b> ` +
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
		` mph</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['-531854926'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Wind ` +
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
		` mph</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['-2039683078'] = (get, $t) => 
		`<div class='day-cnt'> <div><b>` +
		$t.clean(get("utils").getDateStr(get("day").dt)) +
		`</b> &nbsp;&nbsp;&nbsp; ` +
		$t.clean(get("Math").round((get("day").rain || 0))) +
		`% chance of rain </div> <div class='icon-cnt'> ` +
		$t.clean( new $t('1836366674').render(get("day").weather, 'type', get)) +
		` </div> <table> <tbody> <tr> <td><b>Temperature</b></td> <td>&nbsp;&nbsp;&nbsp;</td> <td></td> <td><b>Morning</b></td> <td><b>Day</b></td> <td><b>Evening</b></td> <td><b>Night</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td colspan="2"> <b>Wind ` +
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
		` mph</td> </tr> </tbody> </table> <div> <b>Sun rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").sunset, get("user"), true)) +
		` <br> <b>Moon rise:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonrise, get("user"), true)) +
		` - <b>set:</b> ` +
		$t.clean(get("utils").getTimeStr(get("day").moonset, get("user"), true)) +
		` (<b>Phase</b> ` +
		$t.clean(get("day").moon_phase) +
		`) </div> <table> <tbody> <tr> <td>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</td> <td>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</td> <td><b>Wind</b></td> <td>speed: ` +
		$t.clean(get("Math").round(get("day").wind_speed)) +
		` mph</td> <td>gust: ` +
		$t.clean(get("Math").round(get("day").wind_gust)) +
		` mph</td> </tr> <tr> <td>` +
		$t.clean(get("Math").round(get("day").clouds)) +
		`% cloud coverage</td> <td>` +
		$t.clean(get("day").uvi) +
		` UV Index(inconsistant)</td> <td></td> <td>direction: ` +
		$t.clean(get("utils").getDirection(get("day").wind_deg)) +
		` (` +
		$t.clean(get("day").wind_deg) +
		`&deg;)</td> </tr> </tbody> </table> </div>`

exports['-371534806'] = (get, $t) => 
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
		` mph</td> </tr> </tbody> </table> <table> <tbody> <tr> <td> <div class='margin-right'>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</div> </td> <td> <div class='margin-right'>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</div> </td> <td> <div class='margin-right'>` +
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
		`) </span> </div> </div>`

exports['-955904700'] = (get, $t) => 
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
		` mph</td> </tr> </tbody> </table> <table> <tbody> <tr> <td> <div class='margin-right'>` +
		$t.clean(get("Math").round(get("day").humidity )) +
		`% humidity</div> </td> <td> <div class='margin-right'>` +
		$t.clean(get("day").pressure) +
		` Air Pressure</div> </td> <td> <div class='margin-right'>` +
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

exports['-944312533'] = (get, $t) => 
		`<div class='hour-cnt'> <div><b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"))) +
		`</b></div> <table> <tbody> <tr> <td><b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109;</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`%</td> </tr> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> </tr> <tr> <td><b>Wind ` +
		$t.clean(get("utils").getDirection(get("hour").wind_deg)) +
		` (` +
		$t.clean(get("hour").wind_deg) +
		`&deg;)</b></td> <td>Speed: ` +
		$t.clean(get("Math").round(get("hour").wind_speed)) +
		` mph</td> <td>Gust: ` +
		$t.clean(get("Math").round(get("hour").wind_gust)) +
		` mph</td> </tr> </tbody> </table> <span class='icon-cnt'> ` +
		$t.clean( new $t('698669312').render(get("hour").weather, 'type', get)) +
		` </span> </div>`

exports['-2144523648'] = (get, $t) => 
		`<div class='hour-cnt'> <div class='full-width'> <span> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"), true)) +
		`</b> </span> <span> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </span> <span> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </span> </div> <table> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> </tr> <tr> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> <td><b>Wind ` +
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

exports['-486199727'] = (get, $t) => 
		`<div class='hour-cnt'> <<table class='full-width'> <tr> <td> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"), true)) +
		`</b> </td> <td> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </td> <td> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </td> </tr> </table> </div> <table> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> </tr> <tr> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> <td><b>Wind ` +
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

exports['-1729729095'] = (get, $t) => 
		`<div class='hour-cnt'> <table class='full-width'> <tr> <td> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"), true)) +
		`</b> </td> <td> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </td> <td> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </td> </tr> </table> </div> <table> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> </tr> <tr> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> <td><b>Wind ` +
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

exports['-1824542038'] = (get, $t) => 
		`<div class='hour-cnt'> <table class='full-width'> <tbody> <tr> <td> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"), true)) +
		`</b> </td> <td> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </td> <td> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </td> </tr> </tbody> </table> </div> <table> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109;</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> </tr> <tr> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> <td><b>Wind ` +
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

exports['-678989390'] = (get, $t) => 
		`<div class='hour-cnt'> <table class='full-width'> <tbody> <tr> <td> <b>` +
		$t.clean(get("utils").getTimeStr(get("hour").dt, get("user"), true)) +
		`</b> </td> <td> <b>Rain</b> ` +
		$t.clean(get("Math").round(get("hour").pop)) +
		`% </td> <td> <b>Temp</b> ` +
		$t.clean(get("Math").round(get("hour").temp)) +
		` &#x2109; </td> <td> <b>Chill</b> ` +
		$t.clean(get("Math").round(get("hour").feels_like)) +
		` &#x2109; </td> </tr> </tbody> </table> <table> <tbody> <tr> <td><b>Dew Point</b> ` +
		$t.clean(get("Math").round(get("hour").dew_point)) +
		`</td> <td><b>Humidity</b> ` +
		$t.clean(get("Math").round(get("hour").humidity)) +
		`</td> <td><b>Pressure</b> ` +
		$t.clean(get("Math").round(get("hour").pressure)) +
		`</td> <td><b>Visibility</b> ` +
		$t.clean(get("Math").round(get("hour").visibility)) +
		`</td> <td><b>UV Index</b> ` +
		$t.clean(get("Math").round(get("hour").uvi)) +
		`</td> </tr> <tr> <td><b>Clouds</b> ` +
		$t.clean(get("Math").round(get("hour").clouds)) +
		`</td> <td><b>Wind ` +
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

exports['-1919785147'] = (get, $t) => 
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
		`</td> <td><b>Wind ` +
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

exports['-839792104'] = (get, $t) => 
		`<tr > <td><input type='time'></td> <td class='toggle-cnt days'> <span class='pointer' sending='true' day-index='0'>S</span> <span class='pointer' sending='true' day-index='1'>M</span> <span class='pointer' sending='true' day-index='2'>T</span> <span class='pointer' sending='true' day-index='3'>W</span> <span class='pointer' sending='true' day-index='4'>T</span> <span class='pointer' sending='true' day-index='5'>F</span> <span class='pointer' sending='true' day-index='6'>S</span> </td> <td class='toggle-cnt types'> <span class='pointer' style="text-decoration: line-through;">Hourly</span> <span class='pointer' style="text-decoration: line-through;">Daily</span> <span class='pointer' sending='true'>12 Hour and Daily</span> </td> </tr>`
