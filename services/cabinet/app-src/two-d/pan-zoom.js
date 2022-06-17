
// Took thiss code from https://stackoverflow.com/a/33929456
function panZoom(canvas, draw) {
  let mrx, mry;
  const eventFuncs = [];

  this.on = (eventName) => {
    if (eventFuncs[eventName] === undefined) eventFuncs[eventName] = [];
    return (func) => {
      if ((typeof func) === 'function') {
        eventFuncs[eventName].push(func);
      }
    }
  }
  this.onMove = this.on('move');
  this.onClick = this.on('click');
  this.onMousedown = this.on('mousedown');
  this.onMouseup = this.on('mouseup');

  function eventObject(eventName) {
    let x  =  mouse.rx;
    let y = mouse.ry;
    const dt = displayTransform;
    x -= dt.x;
    y -= dt.y;
    // screenX and screen Y are the screen coordinates.
    screenX = -1*dt.scale*(x * dt.matrix[0] + y * dt.matrix[2])+dt.cox;
    screenY = -1*dt.scale*(x * dt.matrix[1] + y * dt.matrix[3])+dt.coy;
    return {
      eventName, screenX, screenY,
      imageX: mouse.rx,
      imageY: mouse.ry,
      dx: mrx,
      dy: mry,
    };
  }

  function runOn(type, event) {
    const dt = displayTransform;
    let performingFunction = false;
    const funcs = eventFuncs[type];
    const eventObj  = eventObject(type);
    for (let index = 0; !performingFunction && index < funcs.length; index += 1) {
      performingFunction = funcs[index](eventObj, event);
    }
    return performingFunction;
  }

  var ctx = canvas.getContext("2d");
  var mouse = {
      x : 0,
      y : 0,
      w : 0,
      alt : false,
      shift : false,
      ctrl : false,
      buttonLastRaw : 0, // user modified value
      buttonRaw : 0,
      over : false,
      buttons : [1, 2, 4, 6, 5, 3], // masks for setting and clearing button raw bits;
  };
  function mouseMove(event) {
      mouse.x = event.offsetX;
      mouse.y = event.offsetY;
      if (mouse.x === undefined) {
          mouse.x = event.clientX;
          mouse.y = event.clientY;
      }
      runOn('move', event);
      mouse.alt = event.altKey;
      mouse.shift = event.shiftKey;
      mouse.ctrl = event.ctrlKey;
      if (event.type === "mousedown") {
        if (!runOn('mousedown', event))  {
          event.preventDefault()
          mouse.buttonRaw |= mouse.buttons[event.which-1];
        }
      } else if (event.type === "mouseup") {
        if (!runOn('mouseup', event)) {
          mouse.buttonRaw &= mouse.buttons[event.which + 2];
        }
      } else if (event.type === "mouseout") {
          mouse.buttonRaw = 0;
          mouse.over = false;
      } else if (event.type === "mouseover") {
          mouse.over = true;
      } else if (event.type === "mousewheel") {
          event.preventDefault()
          mouse.w = event.wheelDelta;
      } else if (event.type === "DOMMouseScroll") { // FF you pedantic doffus
         mouse.w = -event.detail;
      }


  }

  function setupMouse(e) {
      e.addEventListener('mousemove', mouseMove);
      e.addEventListener('mousedown', mouseMove);
      e.addEventListener('mouseup', mouseMove);
      e.addEventListener('mouseout', mouseMove);
      e.addEventListener('mouseover', mouseMove);
      e.addEventListener('mousewheel', mouseMove);
      e.addEventListener('DOMMouseScroll', mouseMove); // fire fox

      e.addEventListener("contextmenu", function (e) {
          e.preventDefault();
      }, false);
  }
  setupMouse(canvas);

  let transformCount = 0;
  const round = (val) => Math.round((val*100)/displayTransform.scale) / 100;
  const print = (...attrs) => {
    if (transformCount++ % 100 !== 0) return;
    let str = '';
    for (let index = 0; index < attrs.length; index += 1) {
      const attr = attrs[index];
      str += `${attr}: ${round(displayTransform[attr])} `;
    }
    console.log(displayTransform);
  }
  // terms.
  // Real space, real, r (prefix) refers to the transformed canvas space.
  // c (prefix), chase is the value that chases a requiered value
  var displayTransform = {
      x:0,
      y:0,
      ox:0,
      oy:0,
      scale:1,
      rotate:0,
      cx:0,  // chase values Hold the actual display
      cy:0,
      cox:0,
      coy:0,
      cscale:1,
      crotate:0,
      dx:0,  // deltat values
      dy:0,
      dox:0,
      doy:0,
      dscale:1,
      drotate:0,
      drag:0.1,  // drag for movements
      accel:0.7, // acceleration
      matrix:[0,0,0,0,0,0], // main matrix
      invMatrix:[0,0,0,0,0,0], // invers matrix;
      mouseX:0,
      mouseY:0,
      ctx:ctx,
      setTransform:function(){
          var m = this.matrix;
          var i = 0;
          const dt = displayTransform;
          print('x', 'y',  'dx', 'dy', 'mouseX', 'mouseY', 'scale');
          this.ctx.setTransform(m[i++],m[i++],m[i++],m[i++],m[i++],m[i++]);
      },
      setHome:function(){
          this.ctx.setTransform(1,0,0,1,0,0);

      },
      update:function(){
          // smooth all movement out. drag and accel control how this moves
          // acceleration
          this.dx += (this.x-this.cx)*this.accel;
          this.dy += (this.y-this.cy)*this.accel;
          this.dox += (this.ox-this.cox)*this.accel;
          this.doy += (this.oy-this.coy)*this.accel;
          this.dscale += (this.scale-this.cscale)*this.accel;
          this.drotate += (this.rotate-this.crotate)*this.accel;
          // drag
          this.dx *= this.drag;
          this.dy *= this.drag;
          this.dox *= this.drag;
          this.doy *= this.drag;
          this.dscale *= this.drag;
          this.drotate *= this.drag;
          // set the chase values. Chase chases the requiered values
          this.cx += this.dx;
          this.cy += this.dy;
          this.cox += this.dox;
          this.coy += this.doy;
          this.cscale += this.dscale;
          this.crotate += this.drotate;

          // create the display matrix
          this.matrix[0] = Math.cos(this.crotate)*this.cscale;
          this.matrix[1] = Math.sin(this.crotate)*this.cscale;
          this.matrix[2] =  - this.matrix[1];
          this.matrix[3] = this.matrix[0];

          // set the coords relative to the origin
          this.matrix[4] = -(this.cx * this.matrix[0] + this.cy * this.matrix[2])+this.cox;
          this.matrix[5] = -(this.cx * this.matrix[1] + this.cy * this.matrix[3])+this.coy;


          // create invers matrix
          var det = (this.matrix[0] * this.matrix[3] - this.matrix[1] * this.matrix[2]);
          this.invMatrix[0] = this.matrix[3] / det;
          this.invMatrix[1] =  - this.matrix[1] / det;
          this.invMatrix[2] =  - this.matrix[2] / det;
          this.invMatrix[3] = this.matrix[0] / det;

          // check for mouse. Do controls and get real position of mouse.
          if(mouse !== undefined){  // if there is a mouse get the real cavas coordinates of the mouse
              let mdx = mouse.x-mouse.oldX; // get the mouse movement
              let mdy = mouse.y-mouse.oldY;
              mrx = (mdx * this.invMatrix[0] + mdy * this.invMatrix[2]);
              mry = (mdx * this.invMatrix[1] + mdy * this.invMatrix[3]);
              if(mouse.oldX !== undefined && (mouse.buttonRaw & 1)===1){ // check if panning (middle button)
                  // get the movement in real space
                  this.x -= mrx;
                  this.y -= mry;
              }
              // do the zoom with mouse wheel
              if(mouse.w !== undefined && mouse.w !== 0){
                  this.ox = mouse.x;
                  this.oy = mouse.y;
                  this.x = this.mouseX;
                  this.y = this.mouseY;
                  /* Special note from answer */
                  // comment out the following is you change drag and accel
                  // and the zoom does not feel right (lagging and not
                  // zooming around the mouse
                  /*
                  this.cox = mouse.x;
                  this.coy = mouse.y;
                  this.cx = this.mouseX;
                  this.cy = this.mouseY;
                  */
                  if(mouse.w > 0){ // zoom in
                      this.scale *= 1.1;
                      mouse.w -= 20;
                      if(mouse.w < 0){
                          mouse.w = 0;
                      }
                  }
                  if(mouse.w < 0){ // zoom out
                      this.scale *= 1/1.1;
                      mouse.w += 20;
                      if(mouse.w > 0){
                          mouse.w = 0;
                      }
                  }

              }
              // get the real mouse position
              var screenX = (mouse.x - this.cox);
              var screenY = (mouse.y - this.coy);
              this.mouseX = this.cx + (screenX * this.invMatrix[0] + screenY * this.invMatrix[2]);
              this.mouseY = this.cy + (screenX * this.invMatrix[1] + screenY * this.invMatrix[3]);
              mouse.rx = this.mouseX;  // add the coordinates to the mouse. r is for real
              mouse.ry = this.mouseY;
              // save old mouse position
              mouse.oldX = mouse.x;
              mouse.oldY = mouse.y;
          }

      }
  }
  // image to show
  var img = new Image();
  img.src = "https://upload.wikimedia.org/wikipedia/commons/e/e5/Fiat_500_in_Emilia-Romagna.jpg"
  // set up font
  ctx.font = "14px verdana";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // timer for stuff
  var timer =0;
  function update(){
      timer += 1; // update timere
      // update the transform
      displayTransform.update();
      // set home transform to clear the screem
      displayTransform.setHome();
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // if the image loaded show it
      if(img.complete){
        displayTransform.setTransform();
        draw(canvas);
        ctx.fillStyle = "white";
        if(Math.floor(timer/100)%2 === 0){
            ctx.fillText("Left but to pan",mouse.rx,mouse.ry);
        }else{
            ctx.fillText("Wheel to zoom",mouse.rx,mouse.ry);
        }
    }else{
        // waiting for image to load
        displayTransform.setTransform();
        ctx.fillText("Loading image...",100,100);

    }
    if(mouse.buttonRaw === 4){ // right click to return to homw
         displayTransform.x = 0;
         displayTransform.y = 0;
         displayTransform.scale = 1;
         displayTransform.rotate = 0;
         displayTransform.ox = 0;
         displayTransform.oy = 0;
     }
    // reaquest next frame
    requestAnimationFrame(update);
  }
  update(); // start it happening
  return this;
}

module.exports = panZoom;
