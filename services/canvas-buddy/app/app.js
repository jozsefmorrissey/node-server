const $t = require('../../../public/js/utils/$t.js');
$t.loadFunctions(require('../generated/html-templates'));
require('../../../public/js/utils/utils');
const du = require('../../../public/js/utils/dom-utils');
require('../../../public/js/utils/3d-modeling/csg.js');
const ThreeD = require('./3D');
const TwoD = require('./2D');

const input = du.find('textarea');

TwoD.oft(false)

const twoDDisplay = du.id('two-d-display');
const threeDDisplay = du.id('three-d-display');

let text2d = TwoD.initialValue;
let text3d = ThreeD.initialValue;

let parcer = du.find('[name="parcer"]:checked').value;
const is3D = () => parcer === '3D';
const getActive = () => is3D() ? ThreeD : TwoD;
text = () => is3D() ? text3d : text2d;

const snapShotControls = du.find('.player-controls');

let snapShotsDetected = false;
const snapShotCommentReg = /\/\/[ \t]*(([0-9]{1,}).*)/;
function parseSnapShots(lines) {
  snapShotControls.hidden = true;
  if (!is3D()) return;
  let snapShots = [[]];
  snapShots[0].comments = [];
  let snapIndex = 0;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const match = line.match(snapShotCommentReg);
    if (match) {
      snapIndex = Number.parseInt(match[2]);
      snapShots[snapIndex] = [];
      snapShots[snapIndex].comments = [match[1]];
    } else {
      const commentMatch = line.match(commentReg);
      if (commentMatch)snapShots[snapIndex].comments.push(commentMatch[1]);
      snapShots[snapIndex].push(line);
    }
  }
  snapShots = snapShots.filter(ss => ss.length !== 0);
  if (snapShots.length > 1) {
    snapShotControls.hidden = false;
    ThreeD.slideShow.slides(snapShots);
  };
}

const commentReg = /\s*\/\/(.*)/;
const zeroReg = /(-|)[0-9](|\.[0-9]{1,})e-[1-9][0-9]*/g;
const negInfinityReg = /\-[0-9](|\.[0-9]{1,})e\+[1-9][0-9]*/g;
const infinityReg = /[0-9](|\.[0-9]{1,})e\+[1-9][0-9]*/g;
function clean(text) {
  const lines = text.split('\n');
  parseSnapShots(lines);
  return lines.map(l => l.replace(commentReg, '')
                      .replace(zeroReg, 0)
                      .replace(negInfinityReg, Math.floor(Number.MIN_SAFE_INTEGER/10000000000))
                      .replace(infinityReg, Number.MAX_SAFE_INTEGER))
                      .filter(l => l);
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
    getActive().parse(clean(text()), scale);
  }
}

du.on.match('change', '[name="parcer"]', (elem, event) => {
  parcer = elem.value;
  twoDDisplay.hidden = is3D();
  threeDDisplay.hidden = !is3D();
  getActive().parse(clean(text()), scale);
  TwoD.oft(!is3D());
  ThreeD.oft(is3D());
  input.value = text()
});

input.addEventListener('keyup', (elem) => {
  is3D() ? (text3d = input.value) : (text2d = input.value);
  parse(elem);
});


const updateInfoText = (slideShow) => {
  const slide = slideShow.slide(null, true);
  const slideText = slide.comments;
  du.id('snap-shot-comment-cnt').innerHTML = slideText.join('<br/>');
}

const updatePlayControls = (elem) => {
  getActive().slideShow.on.show(updateInfoText);
  const playing = getActive().slideShow.playing();
  du.find.closest('.pause').parentElement.hidden = !playing;
  du.find.closest('.button').parentElement.hidden = playing;
}

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

console.log(parcer);
getActive().parse(input.value = text(), 1)
