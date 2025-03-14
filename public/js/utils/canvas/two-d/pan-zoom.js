
// Took this code from https://stackoverflow.com/a/33929456
class PanZoom {
  constructor(canvas, draw) {
    let mrx, mry;
    const eventFuncs = [];
    const instance = this;
    let lastMoveTime = new Date().getTime();

    this.on = (eventName) => {
      if (eventFuncs[eventName] === undefined) eventFuncs[eventName] = [];
      return (func) => {
        if ((typeof func) === 'function') {
          eventFuncs[eventName].push(func);
        }
      }
    }
    let sleeping = false;
    let nextUpdateId = 0;
    this.sleep = () => sleeping = true;

    this.on = {
      move: this.on('move'),
      translate: this.on('translated'),
      zoom: this.on('zoom'),
      click: this.on('mousedown'),
      mousedown: this.on('mousedown'),
      mouseup: this.on('mouseup')
    }

    const small = .01;
    this.moving = () => displayTransform.dx > small || displayTransform.dx < -small;
    this.zooming = () => displayTransform.dscale > small || displayTransform.dscale < -small;

    function eventObject(eventName, event) {
      let x  =  mouse.rx;
      let y = mouse.ry;
      const dt = displayTransform;
      x -= dt.x;
      y -= dt.y;
      // screenX and screen Y are the screen coordinates.
      screenX = event ? event.pageX : 0;//dt.scale*(x * dt.matrix[0] + y * dt.matrix[2])+dt.cox;
      screenY = event ? event.pageY : 0;//dt.scale*(x * dt.matrix[1] + y * dt.matrix[3])+dt.coy;
      return {
        eventName, screenX, screenY,
        imageX: mouse.rx,
        imageY: mouse.ry,
        dx: mrx,
        dy: mry,
      };
    }

    const lastRunTime = {};
    function runOn(type, event) {
      const time = new Date().getTime();
      let performingFunction = false;
      // if (!lastRunTime[type] || lastRunTime[type] + 100 < time) {
        const dt = displayTransform;
        const funcs = eventFuncs[type];
        const eventObj  = eventObject(type, event);
        for (let index = 0; index < funcs.length; index += 1) {
          performingFunction = performingFunction | funcs[index](eventObj, event);
        }
        lastRunTime[type] = time;
      // }
      return performingFunction;
    }

    canvas.height = Number.parseInt(getComputedStyle(canvas).height);
    canvas.width = Number.parseInt(getComputedStyle(canvas).width);

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
        moved: false
    };

    let lastMove = null;
    this.lastMove = () => lastMove;
    function mouseMove(event) {
        lastMoveTime = new Date().getTime();
        mouse.x = event.offsetX;
        mouse.y = event.offsetY;
        if (mouse.x === undefined) {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
        }
        displayTransform.mouseUpdate();
        lastMove = eventObject('move', event);
        if (runOn('move', event)) event.preventDefault();
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
            displayTransform.zoomUpdate();
        } else if (event.type === "DOMMouseScroll") { // FF you pedantic doffus
           mouse.w = -event.detail;
           displayTransform.zoomUpdate();
        }
        instance.update();
    }

    let active = true;
    this.oft = (on_off_toggle) => {
      if (on_off_toggle === true) active = true;
      if (on_off_toggle === false) active = false;
      if (on_off_toggle === null) active = !active;
      return active
    }
    function  activeListener(func) {
      return (...args) => active && func(...args);
    }
    function setupMouse(e) {
        e.addEventListener('mousemove', activeListener(mouseMove));
        e.addEventListener('mousedown', activeListener(mouseMove));
        e.addEventListener('mouseup', activeListener(mouseMove));
        e.addEventListener('mouseout', activeListener(mouseMove));
        e.addEventListener('mouseover', activeListener(mouseMove));
        e.addEventListener('mousewheel', activeListener(mouseMove));
        e.addEventListener('DOMMouseScroll', activeListener(mouseMove)); // fire fox

        e.addEventListener("contextmenu", activeListener(function (e) {
            e.preventDefault();
        }), false);
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
      console.log(str);
    }

    function positionEvents() {
      const dt = displayTransform;
      const dxAbs = Math.abs(dt.dx);
      const dyAbs = Math.abs(dt.dy);
      const doxAbs = Math.abs(dt.dox);
      const doyAbs = Math.abs(dt.doy);
      dt.moving = dt.moving || dxAbs > 1 || dyAbs > 1;
      dt.scoping = doxAbs > 1 || doyAbs > 1;
      if (dt.moving && dxAbs < .1 && dyAbs < .1) {
        dt.moving = false;
        runOn('translated', this);
      }
      // if (dt.scoping && doxAbs < .1 && doyAbs < .1) {
      //   dt.scoping = false;
      //   runOn('zoom', this);
      // }
    }

    this.canvasSimple = () => {
      return this.moving() || this.zooming();
      // return displayTransform.moving || displayTransform.scoping;
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
        ax:canvas.height, //actual values
        ay:canvas.width,
        dx:0,  // deltat values
        dy:0,
        dox:0,
        doy:0,
        dscale:1,
        drotate:0,
        drag:0.2,  // drag for movements
        accel:0.7, // acceleration
        matrix:[0,0,0,0,0,0], // main matrix
        invMatrix:[0,0,0,0,0,0], // invers matrix;
        mouseX:0,
        mouseY:0,
        ctx:ctx,
        realPosition: function (screenX, screenY) {
          if (screenX === undefined) screenX = canvas.width/2;
          if (screenY === undefined) screenY = canvas.height/2;
          screenX -= this.cox;
          screenY -= this.coy;
          this.screenX = screenX;
          this.screenY = screenY;
          let actualX = this.cx + (screenX * this.invMatrix[0] + screenY * this.invMatrix[2]);
          let actualY = this.cy + (screenX * this.invMatrix[1] + screenY * this.invMatrix[3]);

          return {x: actualX,y: actualY};
        },
        setTransform:function(){
            var m = this.matrix;
            var i = 0;
            const dt = displayTransform;
            this.ctx.setTransform(m[i++],m[i++],m[i++],m[i++],m[i++],m[i++]);
        },
        setHome:function(){
            this.ctx.setTransform(1,0,0,1,0,0);

        },
        stabilize: function () {
          do {
            this.update();
          } while (hasDelta());
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

            this.ax += this.dx * this.scale;
            this.ay += this.dy * this.scale;

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

            positionEvents(this);


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
        },
        mouseUpdate: function() {
          let mdx = mouse.x-mouse.oldX; // get the mouse movement
          let mdy = mouse.y-mouse.oldY;
          mrx = (mdx * this.invMatrix[0] + mdy * this.invMatrix[2]);
          mry = (mdx * this.invMatrix[1] + mdy * this.invMatrix[3]);
          mouse.moved = false;
          if(mouse.oldX !== undefined && (mouse.buttonRaw & 1)===1){ // check if panning (middle button)
            // get the movement in real space
            this.x -= mrx;
            this.y -= mry;
          }
          mouse.moved = Math.abs(mdx + mdy) > 1
          // do the zoom with mouse wheel (reolcated zoom)

          // get the real mouse position
          var screenX = (mouse.x - this.cox);
          var screenY = (mouse.y - this.coy);
          this.screenX = screenX;
          this.screenY = screenY;
          this.mouseX = this.cx + (screenX * this.invMatrix[0] + screenY * this.invMatrix[2]);
          this.mouseY = this.cy + (screenX * this.invMatrix[1] + screenY * this.invMatrix[3]);
          mouse.rx = this.mouseX;  // add the coordinates to the mouse. r is for real
          mouse.ry = this.mouseY;
          // save old mouse position
          mouse.oldX = mouse.x;
          mouse.oldY = mouse.y;
        },
        zoomUpdate: function() {
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
              runOn('zoom', this);
            }
            if(mouse.w < 0){ // zoom out
              this.scale *= 1/1.1;
              mouse.w += 20;
              if(mouse.w > 0){
                mouse.w = 0;
              }
              runOn('zoom', this);
            }
        }
    }
    this.displayTransform = displayTransform;

    const gtSmall = (c, t) => c > t ? c-t > small : t-c > small;
    function hasDelta() {
      const dt = displayTransform;
      return gtSmall(dt.x, dt.cx) || gtSmall(dt.y, dt.cy) ||
              gtSmall(dt.scale, dt.cscale) || gtSmall(dt.rotate, dt.crotate);
    }

    // image to show
    // var img = new Image();
    // img.src = "https://upload.wikimedia.org/wikipedia/commons/e/e5/Fiat_500_in_Emilia-Romagna.jpg"
    // set up font
    ctx.font = "14px verdana";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // timer for stuff
    var timer =0;
    function update(){
      if (!CPU.usage.overloaded) {
        nextUpdateId++;
        timer += 1; // update timere
        displayTransform.update();
        displayTransform.setHome();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        displayTransform.setTransform();
        draw(canvas);
        ctx.fillStyle = "white";
        if(mouse.buttonRaw === 4){ // right click to return to homw
          displayTransform.x = 0;
          displayTransform.y = 0;
          displayTransform.scale = 1;
          displayTransform.rotate = 0;
          displayTransform.ox = 0;
          displayTransform.oy = 0;
        }

        mouse.moved = false;
      }
      pendingUpdate = false;
      setTimeout(instance.update);
    }
    let pendingUpdate = false;
    this.update = (force) => {
      if (force === true || (!pendingUpdate && (hasDelta() || mouse.moved))) {
        pendingUpdate = true;
        requestAnimationFrame(update);
      }
    }
    update.call = () => {
      const id = ++nextUpdateId;
      return () => update(id);
    }

    this.center = () => {
      const x = displayTransform.x + canvas.width/2;
      const y = displayTransform.y + canvas.height/2

      return {x,y};
    }

    this.centerOn = function(x, y) {
      const dt = this.displayTransform;
      if (x.x !== undefined) {
        y = x.y;
        x = x.x;
      }
      this.displayTransform.update();
      const center = this.displayTransform.realPosition();
      dt.x += (x - center.x);
      dt.y += (y - center.y);
      dt.stabilize();
      this.update(true);
    };

    this.positionOn = function (center, demensions) {
      this.displayTransform.update();
      const dt = this.displayTransform;
      const scaleX = canvas.width/demensions.x;
      const scaleY = canvas.height/demensions.y;
      let count = 0;
      dt.scale = Math.roundTo(Math.min(scaleX, scaleY) * .8/2, .001) * 2;
      dt.stabilize();
      this.centerOn(center);
    }

    return this;
  }
}

module.exports = PanZoom;
