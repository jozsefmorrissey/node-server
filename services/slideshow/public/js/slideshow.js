
const folder = window.location.href.replace(/.*\/(.*)/, '$1');

function setSize(elem) {
  elem.style.maxWidth = window.innerWidth;
  elem.style.maxHeight = window.innerHeight;

  const heightOffset = 40;
  const widthDiff = Math.abs(window.innerWidth - elem.getBoundingClientRect().width);
  const heightDiff = Math.abs(window.innerHeight - elem.getBoundingClientRect().height);

  elem.style.height = window.innerHeight - heightOffset;
  elem.style.width = 'unset';
}


function run() {
  let index = 0;
  const images = document.querySelectorAll('img[index]');
  const count = images.length;
  const intervalCnt = du.id('interval-cnt');
  let displaying;
  let time = 15000;
  let changeTreadId = 0;
  let showingControls = false;
  let paused = false;

  const timeInc = 1000;
  intervalCnt.innerText = time / 1000;

  function controls(target, event) {
    console.log(event.key);
    switch (event.key) {
      case 'ArrowDown':
        time += timeInc;
        intervalCnt.innerText = time / 1000;
        break;
      case 'ArrowUp':
        time = time > timeInc ? time - timeInc : timeInc;
        intervalCnt.innerText = time / 1000;
        break;
      case 'ArrowLeft':
          index = (index + count - 2) % count;
          change(++changeTreadId, true);
        break;
      case 'ArrowRight':
        change(++changeTreadId, true);
        break;
      case ' ':
        paused = !paused;
        if (!paused) change(++changeTreadId);
        break;
      default:

    }
  }

  const descCnt = du.id('description');
  function change(treadId, force) {
    if (treadId < changeTreadId) return;
    if (!paused || force === true) {
      if (!showingControls || force === true) {
        if (displaying) displaying.hidden = true;
        displaying = images[index];
        descCnt.innerText = displaying.getAttribute('alt-text');
        displaying.hidden = false;
        setSize(displaying);
        index = index >= count -1 ? 0 : index + 1;
      }
      setTimeout(() => change(treadId), time);
    }
  }

  function download(elem, event) {
    console.log('downloading');

    window.open(`/slideshow/download/${folder}`, '_blank')
  }

  function toggleControlCnt() {
    const cnt = du.id('controls-cnt');
    cnt.hidden = !cnt.hidden;
    showingControls = !cnt.hidden;
  }

  du.on.match('keydown', '*', controls);
  du.on.match('click', 'div', toggleControlCnt);
  du.on.match('click', '#download', download);

  change(changeTreadId);
}

window.onload = run;
