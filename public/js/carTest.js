
function drawRoad(canvas) {
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#686568";
  var oneThirdWidth = canvas.width / 3;
  var oneTwelvethWidth = canvas.width / 12;
  var oneThirdHeight = canvas.height/3;
  ctx.beginPath();
  ctx.moveTo(canvas.width, canvas.height);
  ctx.lineTo(7 * oneTwelvethWidth, oneThirdHeight);
  ctx.lineTo(6 * oneTwelvethWidth, oneThirdHeight);
  ctx.lineTo(0, 1.5 * oneThirdHeight);
  ctx.lineTo(0, canvas.height);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.strokeStyle = "red";
  ctx.fill();
}

function drawGround(canvas) {
  var sideCtx = canvas.getContext("2d");
  var oneThirdHeight = canvas.height/3;
  sideCtx.fillStyle = "#1e6025";
  sideCtx.fillRect(0, oneThirdHeight, canvas.width, 2 * oneThirdHeight);
}

function drawSky(canvas) {
  //sky
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4f344f";
  var oneThirdHeight = canvas.height/3;
  ctx.fillRect(0, 0, canvas.width, oneThirdHeight);
}

function drawLines(canvas) {
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#d2d265";
  var oneThirdWidth = canvas.width / 3;
  var oneTwelvethWidth = canvas.width / 12;
  var oneThirdHeight = canvas.height/3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(6.5 * oneTwelvethWidth, oneThirdHeight);
  ctx.lineTo(-0.5 * oneTwelvethWidth, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.strokeStyle = "red";
  ctx.fill();
}

function onLoad() {
  var canvas = document.getElementById("car-canvas");
  drawSky(canvas);
  drawGround(canvas);
  drawRoad(canvas);
  drawLines(canvas);
  getState();
}

function getState() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', `/PracticeCarRestSrvc/state`);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
      if (xhr.status === 200) {
          var carInfo = JSON.parse(xhr.responseText);
          console.log(carInfo);
      }
  };
  xhr.send();
  setTimeout(getState, 1000);
}

window.addEventListener('load', onLoad);
