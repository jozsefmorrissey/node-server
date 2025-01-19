const $t = require('../../../public/js/utils/$t.js');
$t.loadFunctions(require('../generated/html-templates'));
require('../../../public/js/utils/std-lib/init.js');
const du = require('../../../public/js/utils/dom-utils');
require('../../../public/js/utils/3d-modeling/csg.js');
const MeasurementInput = require('../../../public/js/utils/input/styles/measurement');

const ThreeD = require('./3D');
const TwoD = require('./2D');

const input = du.find('textarea');

TwoD.oft(false)

const twoDDisplay = du.id('two-d-display');
const threeDDisplay = du.id('three-d-display');

const param2D = du.param.get('2D');
const param3D = du.param.get('3D');
let text2d = !param2D ? TwoD.initialValue : param2D.split(':').join('\n');
let text3d = !param3D ? ThreeD.initialValue : param3D.split(':').join('\n');

let parcer = du.find('[name="parcer"]:checked').value;
const is3D = () => parcer === '3D';
const getActive = () => is3D() ? ThreeD : TwoD;
text = () => is3D() ? text3d : text2d;

const snapShotControls = du.find('.player-controls');

let snapShotsDetected = false;
const snapShotCommentReg = /\/\/[ \t]*(([0-9]{1,}).*)/;
function parseSnapShots(lines) {
  snapShotControls.hidden = true;
  let snapShots = [];
  snapShots[-1] = [];
  snapShots[-1].comments = [];
  let snapIndex = -1;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const match = line.match(snapShotCommentReg);
    if (match) {
      const newIndex = Number.parseInt(match[2]);
      if (newIndex > 0)
        snapShots[snapIndex].concatInPlace(snapShots[-1]);
      snapIndex = newIndex;
      snapShots[snapIndex] = [];
      snapShots[snapIndex].comments = [match[1]];
    } else {
      const commentMatch = line.match(commentReg);
      if (commentMatch)snapShots[snapIndex].comments.push(commentMatch[1]);
      else snapShots[snapIndex].push(line);
    }
  }
  snapShots = snapShots.filter(ss => ss.length !== 0);
  if (snapShots.length > 1) {
    snapShotControls.hidden = false;
    getActive().slideShow.slides(snapShots);
  };
}

const commentReg = /\s*\/\/(.*)/;
const zeroReg = /(-|)[0-9](|\.[0-9]{1,})e-[1-9][0-9]*/g;
const negInfinityReg = /\-[0-9](|\.[0-9]{1,})e\+[1-9][0-9]*/g;
const infinityReg = /[0-9](|\.[0-9]{1,})e\+[1-9][0-9]*/g;
function clean(text) {
  let lines = text.split('\n');
  lines = lines.map(l => l.replace(zeroReg, 0)
                      .replace(negInfinityReg, Math.floor(Number.MIN_SAFE_INTEGER/10000000000))
                      .replace(infinityReg, Number.MAX_SAFE_INTEGER));

  parseSnapShots(lines);
  return lines.map(l => l.replace(commentReg, '')).filter(l => l);
}

let lastHash;
let scale = 1;
function parse(elem, event) {
  if (event && event.type === 'refresh') lastHash = undefined;
  const thisHash = text().hash();
  const sc = Number.parseFloat(du.find('[name="scale"]').value || 1);
  if (lastHash !== thisHash || (sc !== scale)) {
    lastHash = thisHash;
    scale = sc;
    du.id('snap-shot-comment-cnt').innerHTML = '';
    getActive().parse(clean(text()), scale);
  }
}

du.on.match('change', '[name="parcer"]', (elem, event) => {
  const slideShow = getActive().slideShow;
  if (slideShow && slideShow.length()) {
    slideShow.pause();
    updatePlayControls();
  }
  parcer = elem.value;
  twoDDisplay.hidden = is3D();
  threeDDisplay.hidden = !is3D();
  TwoD.oft(!is3D());
  ThreeD.oft(is3D());
  getActive().parse(clean(text()), scale);
  input.value = text()
});

input.addEventListener('keyup', (elem) => {
  is3D() ? (text3d = input.value) : (text2d = input.value);
  parse(elem);
});


const updateInfoText = (slideShow) => {
  const slide = slideShow.slide(null, true);
  if (slide) {
    const slideText = slide.comments;
    du.id('snap-shot-comment-cnt').innerHTML = slideText.join('<br/>');
  }
}

const updatePlayControls = () => {
  const slideShow = getActive().slideShow;
  slideShow.on.show(updateInfoText);
  const playing = slideShow.playing();
  du.find.closest('.pause').parentElement.hidden = !playing;
  du.find.closest('.button').parentElement.hidden = playing;
}

const inputMeasurement = new MeasurementInput({label: 'Input: ', units: Measurement.units(), unitOnly: true, unit: 'cm'});
const outMeasurement = new MeasurementInput({label: 'Output: ', units: Measurement.units(), unitOnly: true});
const measureSelTemplate = new $t('input/measurement');

const inputSel = du.id('input-measurement-selector');
const outSel = du.id('output-measurement-selector');
inputSel.innerHTML = measureSelTemplate.render(inputMeasurement);
outSel.innerHTML = measureSelTemplate.render(outMeasurement);

du.on.match('click', '#measurement-cnt [type="checkbox"]', (elem) => {
  if (elem.checked) {
    inputSel.hidden = outSel.hidden = false;
  } else {
    inputSel.hidden = outSel.hidden = true;
  }
  if (getActive().measure) getActive().measure(elem.checked);
});

outMeasurement.on('change', () => Measurement.unit(outMeasurement.unit()))
inputMeasurement.on('change', () => parse(lastHash = undefined));


du.on.match('keyup:refresh', 'textarea,[name="scale"]', parse);
du.on.match('click', '.player-controls .gg-play.button', (elem) => {
  getActive().slideShow.play();
  updatePlayControls(elem);
})
du.on.match('click', '.player-controls .gg-play.pause', (elem) => {
  getActive().slideShow.pause();
  updatePlayControls(elem);
})
du.on.match('click', '.player-controls .gg-play.next', (elem) => {
  getActive().slideShow.next();
  updatePlayControls(elem);
})
du.on.match('click', '.player-controls .gg-play.previous', (elem) => {
  getActive().slideShow.previous();
  updatePlayControls(elem);
})
du.on.match('click', '.player-controls .gg-play.fast-forward', () => {
  const slideShow = getActive().slideShow;
  const speed = slideShow.speed();
  let newSpeed = speed * 1.25;
  console.log(newSpeed);
  slideShow.speed(newSpeed);
});
du.on.match('click', '.player-controls .gg-play.rewind', () => {
  const slideShow = getActive().slideShow;
  const speed = slideShow.speed();
  let newSpeed = speed * .75;
  newSpeed = newSpeed > 50 ? newSpeed : 50
  console.log(newSpeed);
  slideShow.speed(newSpeed);
});

const collapseBtn = du.id('collapse-btn');
du.on.match('click', '#collapse-btn', () => {
  du.id.hidden('input-cnt', null);
  const is = du.id.hidden('demension-cnt', null);
  collapseBtn.innerText = is ? '>>' : '<<';
});

du.on.match('click', '#share', () => {
  let params = {};
  params.input = du.find.down('input[type="radio"]:checked', inputSel).value;;
  params.output = du.find.down('input[type="radio"]:checked', outSel).value;;
  params[is3D() ? '3D' : '2D'] = text().split('\n').join(':');
  if (getActive().share) getActive().share(params);
  const url = du.url.build({params});
  du.copy(url);
  let txt = 'Url Copied!';
  if (url.length > 2048) txt += `\n\tDo not use Internet Explorer It cannot handle a url this size '${url.length}'`;
  alert(txt);
});

if (param2D) du.find('[name="parcer"][value="2D"').click();
const selectedInput = du.find.down(`input[value="${du.param.get('input')}"]`, inputSel);
if (selectedInput) selectedInput.click();
const selectedOutput = du.find.down(`input[value="${du.param.get('output')}"]`, outSel);
if (selectedOutput) selectedOutput.click();

console.log(parcer);
input.value = text();
parse();
