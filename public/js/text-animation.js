
function TextAnime() {
  function modify(elem, rate, accel, target, callback) {
    var size = Number.parseInt(elem.offsetHeight);
    var isExpanding = size < target;
    var height;

    function incCond() {return height < target;}
    function decCond() {return height > target;}

    function inc() {
      rate += accel;
      size += rate;
    }
    function dec() {
      rate += accel;
      size -= rate;
    }

    var funcs = {
      update: {true: inc, false: dec},
      condition: {true: incCond, false: decCond}
    };
    var tol = 0.0000001;
    function itterate(update, reverse) {
      height = Number.parseInt(elem.offsetHeight);
      if (height > target - tol && height < target + tol) {
        callback();
      } else if (funcs.condition[isExpanding]()) {
        funcs.update[isExpanding]();
        elem.style = 'font-size: ' + size;
        setTimeout(itterate, 20);
      } else if (!funcs.condition[isExpanding]()){
        modify(elem, rate/2, accel, target, callback);
      }
    }

    setTimeout(itterate, 10);
  }

  function getTarget(elem) {
    elem.style = 'display: block';
    var target = elem.getAttribute('target-size');
    if (!Number.isFinite(target)) {
      target = elem.offsetHeight;
    } else {
      target = Number.parseFloat(target);
    }
    elem.style = 'display: none';
    return target;
  }

  function grow(elem, rate, accel, delay, percentage, callback) {
    var target = getTarget(elem);
    function startGrow() {
      if (percentage) {
        elem.style = 'font-size: ' + target * percentage/100;
      } else {
        elem.style = 'font-size: ' + 0;
      }
      modify(elem, rate, accel, target, callback);
    }
    setTimeout(startGrow, delay * 1000);
  }

  function shrink(elem, rate, accel, delay, percentage, callback) {
    var target = getTarget(elem);

    if (!percentage) {
      percentage = 200;
    }

    function startShrink() {
      elem.style = 'font-size: ' + target * percentage/100;
      modify(elem, rate, accel, target, callback);
    }
    setTimeout(startShrink, delay * 1000);
  }

  function resonant() {
    var elem = document.getElementById('resonant');
    var target = getTarget(elem);

    var itteration = 0;
    function callback() {
      if (itteration < 100) {
        funcs[itteration++ % 2 == 0]();
      }
    }

    function shrinkElem() {shrink(elem, 0.0001, 0.03, 0, 20, callback);}
    function growElem() {grow(elem, 0.0001, 0.03, 0, 180, callback);}
    var funcs = {true: shrinkElem, false: growElem};

    shrink(elem, 1, 0.03, 0, target, callback);
  }

  var ANIMATIONS = {shrink: shrink, grow: grow, resonant: resonant};

  function animateAll() {
    var elems = document.querySelectorAll('[text-animation]');
    for (var index = 0; index < elems.length; index += 1) {
      animate(elems[index]);
    }
  }

  function animate(elem) {
    if (typeof elem === 'string') {
      elem = document.getElementById(elem);
    }
    var type = elem.getAttribute('text-animation');
    var rate = Number.parseFloat(elem.getAttribute('rate'));
    var accel = Number.parseFloat(elem.getAttribute('accel'));
    var delay = Number.parseFloat(elem.getAttribute('delay'));
    var percent = Number.parseFloat(elem.getAttribute('percent'));
    ANIMATIONS[type](elem, rate, accel, delay, percent);
  }

  return {
    animate: animate,
    animateAll: animateAll,
    shrink: shrink,
    grow: grow,
    resonant: resonant
  };
}

window.onload = TextAnime().animateAll;
