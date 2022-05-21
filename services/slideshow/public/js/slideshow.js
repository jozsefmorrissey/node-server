

function setSize(elem) {
  elem.style.maxWidth = window.innerWidth;
  elem.style.maxHeight = window.innerHeight;

  const heightOffset = window.innerHeight * .25;
  const widthDiff = Math.abs(window.innerWidth - elem.getBoundingClientRect().width);
  const heightDiff = Math.abs(window.innerHeight - elem.getBoundingClientRect().height);

  if (heightDiff > 0 && heightDiff < widthDiff) {
    elem.style.height = window.innerHeight - heightOffset;
    elem.style.width = 'unset';
  } else if (widthDiff > 0 && widthDiff < heightDiff) {
    elem.style.width = window.innerWidth;
    elem.style.height = 'unset';
  }
}


function run() {
  let index = 0;
  const images = document.querySelectorAll('img[index]');
  const count = images.length;
  let displaying;
  let time = 15000;
  let changeTreadId = 0;
  let paused = false;

  const timeInc = 1000;

  function controls(target, event) {
    console.log(event.key);
    switch (event.key) {
      case 'ArrowDown':
        time += timeInc;
        break;
      case 'ArrowUp':
        time = time > timeInc ? time - timeInc : timeInc;
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


  function change(treadId, force) {
    if (treadId < changeTreadId) return;
    if (!paused || force === true) {
      if (displaying) displaying.hidden = true;
      displaying = images[index];
      displaying.hidden = false;
      setSize(displaying);
      index = index >= count -1 ? 0 : index + 1;
      setTimeout(() => change(treadId), time);
    }
  }

  du.on.match('keydown', '*', controls);

  change(changeTreadId);
}

window.onload = run;
