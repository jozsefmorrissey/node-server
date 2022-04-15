// information ripped off of
// https://www.getzips.com/area.htm

const zips = {
  "201": 07451,
  "202": 20444,
  "203": 06614,
  "205": 35403,
  "206": 98134,
  "207": 04491,
  "208": 83541,
  "209": 95310,
  "210": 78224,
  "212": 10123,
  "213": 90010,
  "214": 75218,
  "215": 19054,
  "216": 44142,
  "217": 61839,
  "218": 56354,
  "219": 46394,
  "220": 43066,
  "225": 70743,
  "228": 39540,
  "229": 31707,
  "231": 49676,
  "239": 33907,
  "240": 20588,
  "248": 48237,
  "251": 36569,
  "252": 27966,
  "253": 98354,
  "254": 76622,
  "256": 35774,
  "260": 46825,
  "262": 53138,
  "269": 49090,
  "270": 42050,
  "272": 17813,
  "276": 24343,
  "281": 77345,
  "301": 20993,
  "302": 19850,
  "303": 80243,
  "304": 25727,
  "305": 33134,
  "307": 82516,
  "308": 69022,
  "309": 61550,
  "310": 90292,
  "312": 60654,
  "313": 48213,
  "314": 63122,
  "315": 13449,
  "316": 67154,
  "317": 46231,
  "318": 71241,
  "319": 50607,
  "320": 56284,
  "321": 32906,
  "323": 90065,
  "325": 76882,
  "330": 44451,
  "334": 36421,
  "336": 27420,
  "337": 70639,
  "340": 00802,
  "346": 77402,
  "347": 11096,
  "352": 33574,
  "360": 98397,
  "361": 78145,
  "386": 32169,
  "401": 02864,
  "402": 68509,
  "404": 30072,
  "405": 73069,
  "406": 59466,
  "407": 32878,
  "408": 95056,
  "409": 77701,
  "410": 21405,
  "412": 15137,
  "413": 01152,
  "414": 53213,
  "415": 94121,
  "417": 65468,
  "419": 44287,
  "423": 37602,
  "424": 90071,
  "425": 98068,
  "432": 79718,
  "434": 23909,
  "435": 84328,
  "440": 44124,
  "442": 93516,
  "458": 97528,
  "478": 31003,
  "479": 72812,
  "480": 85226,
  "501": 72121,
  "502": 40225,
  "503": 97239,
  "504": 70116,
  "505": 87301,
  "507": 55991,
  "508": 02032,
  "509": 99001,
  "510": 94618,
  "512": 78783,
  "513": 45174,
  "515": 50323,
  "516": 11520,
  "517": 49073,
  "518": 12473,
  "520": 85605,
  "530": 95948,
  "531": 68179,
  "534": 54552,
  "539": 74370,
  "540": 23170,
  "541": 97543,
  "559": 93714,
  "561": 33438,
  "562": 90701,
  "563": 52358,
  "570": 17976,
  "573": 63945,
  "574": 46732,
  "575": 88001,
  "580": 73901,
  "585": 14481,
  "586": 48048,
  "601": 39320,
  "602": 85050,
  "603": 03598,
  "605": 57401,
  "606": 41347,
  "607": 14867,
  "608": 53924,
  "609": 08251,
  "610": 19004,
  "612": 55440,
  "614": 43287,
  "615": 37201,
  "616": 49422,
  "617": 02222,
  "618": 62434,
  "619": 92071,
  "620": 67330,
  "623": 85343,
  "626": 91772,
  "628": 94151,
  "630": 60305,
  "631": 11733,
  "636": 63378,
  "641": 50239,
  "646": 10170,
  "650": 94128,
  "651": 55110,
  "657": 90637,
  "660": 64438,
  "661": 91383,
  "662": 38958,
  "670": 96951,
  "671": 96919,
  "684": 96799,
  "701": 58426,
  "702": 89104,
  "703": 22206,
  "704": 28159,
  "706": 30810,
  "707": 94954,
  "708": 60412,
  "712": 51201,
  "713": 77315,
  "714": 92615,
  "715": 54739,
  "716": 14305,
  "717": 17302,
  "718": 11102,
  "719": 80977,
  "724": 15606,
  "725": 89081,
  "727": 33742,
  "731": 38257,
  "732": 08759,
  "734": 48189,
  "740": 43822,
  "747": 91405,
  "757": 23488,
  "760": 92364,
  "763": 55357,
  "765": 46936,
  "770": 30189,
  "772": 32971,
  "773": 60642,
  "775": 89460,
  "781": 02148,
  "785": 67449,
  "787": 00795,
  "801": 84171,
  "802": 05491,
  "803": 29432,
  "804": 23079,
  "805": 93064,
  "806": 79237,
  "808": 96781,
  "810": 48353,
  "812": 47441,
  "813": 33650,
  "814": 16326,
  "815": 60956,
  "816": 64114,
  "817": 76103,
  "818": 91208,
  "828": 28690,
  "830": 78618,
  "831": 93940,
  "832": 77263,
  "843": 29551,
  "845": 12563,
  "847": 60084,
  "850": 32437,
  "856": 08108,
  "858": 92101,
  "859": 40598,
  "860": 06262,
  "863": 33930,
  "864": 29687,
  "865": 37848,
  "870": 72449,
  "901": 38088,
  "903": 75608,
  "904": 32145,
  "906": 49862,
  "907": 99680,
  "908": 08889,
  "909": 92305,
  "910": 28312,
  "912": 31312,
  "913": 66117,
  "914": 10591,
  "915": 88588,
  "916": 95609,
  "917": 11419,
  "918": 74150,
  "919": 27610,
  "920": 54240,
  "925": 94531,
  "928": 86036,
  "929": 11379,
  "931": 37723,
  "936": 77304,
  "937": 45123,
  "940": 76486,
  "941": 34201,
  "949": 92637,
  "951": 92564,
  "952": 55387,
  "954": 33394,
  "956": 78067,
  "970": 80726,
  "973": 07460,
  "978": 01742,
  "979": 77852,
  "985": 70340,
  "989": 48811
}

function getZips() {
  const div = document.createElement('div');
  document.body.append(div);

  function setZipBody(areaCode) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', `https://www.getzips.com/cgi-bin/ziplook.exe?What=4&Area=${areaCode}`);
    xhr.onload = function() {
        if (xhr.status === 200) {
            div.innerHTML = xhr.responseText;
        }
        const zipObj = estimateZip();
        zips[areaCode] = zipObj.closest;
        console.log(`${areaCode}) ${zipObj.min} < ${zipObj.closest} < ${zipObj.max} `);
    };
    xhr.send();
  }

  function estimateZip() {
    let count = 0;
    let total = 0;
    let max = 0;
    let min = Number.MAX_SAFE_INTEGER;
    let numbers = [];
    const func = (e) => {
      if (e.innerText.trim().match(/^[0-9]{5}$/)) {
        const number = Number.parseInt(e.innerText);
        count++;
        max = number > max ? number : max;
        min = number < min ? number : min;
        numbers.push(number);
        total += number;
      }
    }
    Array.from(document.querySelectorAll('tr>td>p')).forEach(func);
    const approximate = total / count;
    closest = numbers[0];
    numbers.forEach((zip) => {
      const minDiff = Math.abs(closest - approximate);
      const newDiff = Math.abs(closest - zip);
      closest = newDiff < minDiff ? zip : closest;
    });
    return {closest, max, min, approximate};
  }
  Object.keys(zips).forEach((areaCode, index) => {
    console.log(index*1000);
    setTimeout(() => setZipBody(areaCode), index * 1000)
  });
}
