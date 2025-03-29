


const du = require('../dom-utils.js');
const CSG = require('./csg.js');
const GL = require('./lightgl.js');
const shaders = require('./shaders.js');
const ViewerHoverList = require('../canvas/three-d/viewer-hover-list.js');
const CustomEvent = require('../custom-event');

const VIEWER_CONTROLS = {
  POLYGONS: true,
  OUTLINE: true,
  WIREFRAME: true,
  AXIS: false,
  BACKGROUND_COLOR: '#636969',
  OUTLINE_COLOR: '#000000',
  HOVER_AND_CLICK: true
}

CSG.prototype.toLineMesh = function() {
  var mesh = new GL.Mesh({ normals: true, colors: true });
  var mesh = new GL.Mesh({ normals: true, colors: true });
  const lineIndexer = new GL.Indexer();
  var indexer = new GL.Indexer();
  this.outlines.forEach(outline => {
    let prevIndex, firstIndex;
    for (let index = 0; index < outline.length; index++) {
      const vertex = new CSG.Vertex(outline[index]);
      vertex.color === Color.rgb.percent(VIEWER_CONTROLS.OUTLINE_COLOR);
      const currIndex = indexer.add(vertex);
      if (prevIndex >= 0) {
        lineIndexer.add([Math.min(prevIndex, currIndex), Math.max(prevIndex, currIndex)])
      } else firstIndex = currIndex;
      prevIndex = currIndex;
    }
    if (outline.length > 1) lineIndexer.add([Math.min(firstIndex, prevIndex), Math.max(firstIndex, prevIndex)]);
  });
  mesh.vertices = indexer.unique.map(function(v) { return [v.pos.x, v.pos.y, v.pos.z]; });
  mesh.colors = indexer.unique.map(function(v) { return v.color; });
  mesh.addIndexBuffer('lines');
  mesh.lines = lineIndexer.unique;
  mesh.compile();
  return mesh;
};
// Convert from CSG solid to GL.Mesh object
CSG.prototype.toMesh = function() {
  var mesh = new GL.Mesh({ normals: true, colors: true });
  var indexer = new GL.Indexer();
  this.toPolygons().map(function(polygon) {
    var indices = polygon.vertices.map(function(vertex) {
      vertex.color = polygon.shared || [1, 1, 1, 1];
      if(!vertex.color[3])vertex.color[3] = 1;
      return indexer.add(vertex);
    });
    for (var i = 2; i < indices.length; i++) {
      mesh.triangles.push([indices[0], indices[i - 1], indices[i]]);
    }
  });
  mesh.vertices = indexer.unique.map(function(v) { return [v.pos.x, v.pos.y, v.pos.z]; });
  mesh.normals = indexer.unique.map(function(v) { return [v.normal.x, v.normal.y, v.normal.z]; });
  mesh.colors = indexer.unique.map(function(v) { return v.color; });
  mesh.computeWireframe(this.wireframe);
  mesh.compile();
  return mesh;
};

var angleX = 0;
var angleY = 0;
var angleZ = 0;
var viewers = [];

// Set to true so lines don't use the depth buffer
Viewer.lineOverlay = false;
Viewer.CONTROLS = VIEWER_CONTROLS;

// A viewer is a WebGL canvas that lets the user view a mesh. The user can
// tumble it around by dragging the mouse.
function Viewer(csg, width, height, depth) {
  const originalDepth = depth;
  viewers.push(this);
  instance = this;
  this.setDepth = (d) => depth = d;
  let x = 0;
  let y = 0;

  let lastZoom;
  let zoomCount = 0;
  const zoom = (out) => {
    let direction = (out === true ? 1 : -1);
    let zoomOffset = 2;
    let newTime = new Date().getTime();
    if (lastZoom > newTime - 50) {
      zoomCount++;
      zoomOffset *= zoomCount;
      zoomOffset = zoomOffset > 20 ? 20 : zoomOffset;
    }
    lastZoom = newTime;
    depth += zoomOffset * direction;
  };
  this.zoom = zoom;
  const pan = (leftRight, upDown) => {
    x += leftRight;
    y += upDown * -1;
  }

  // Get a new WebGL canvas
  var gl = GL.create();
  this.gl = gl;
  this.CONTROLS = VIEWER_CONTROLS;
  // this.mesh = csg.toMesh();
  // this.mesh.line = csg.toLineMesh();
  this.canvas = () => gl.canvas;

  // Set up the viewport
  gl.canvas.width = width;
  gl.canvas.height = height;
  gl.viewport(0, 0, width, height);
  gl.matrixMode(gl.PROJECTION);
  gl.loadIdentity();
  gl.perspective(100, width / height, 10, 1000);
  gl.rotate(0, 0, 1, 0);
  gl.translate(0, 0, -200);
  gl.matrixMode(gl.MODELVIEW);

  // Set up WebGL state
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  // gl.clearColor(0.93, 0.93, 0.93, 1);

  //Background Color
  gl.clearColor(...Color.rgb.percent(VIEWER_CONTROLS.BACKGROUND_COLOR), 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.polygonOffset(1, 1);

  // Black shader for wireframe
  this.blackShader = new GL.Shader(...shaders.WireFrame());

  // const program = gl.createProgram();
  // this.realisticLightShader = new GL.Shader(...shaders.RealisticLight());

  // Shader with diffuse and specular lighting
  this.changeLightingShaderDirection = (x,y,z) =>
      this.lightingShader = new GL.Shader(...shaders.LightDirection({x:3,y:2,z:3}));

  // this.lightingShaders = [
  //   new GL.Shader(...shaders.LightDirection({x:3,y:2,z:3})),
  //   new GL.Shader(...shaders.LightDirection({x:1,y:0,z:0})),
  //   new GL.Shader(...shaders.LightDirection({x:-1,y:0,z:0})),
  //   new GL.Shader(...shaders.LightDirection({x:0,y:0,z:-1})),
  //   new GL.Shader(...shaders.LightDirection({x:0,y:0,z:1})),
  //   new GL.Shader(...shaders.LightDirection({x:-3,y:-2,z:-3}))
  // ];
  this.lightingShader = new GL.Shader(...shaders.IlluminateAll({x:3,y:2,z:3}));

  // this.changeLightingShaderDirection(0, 0, 0);
  // this.changeLightingShaderDirection(3, 2, 3);

  function canvasPoint(e) {
    const canvasPos = e.target.getBoundingClientRect();
    const clickPos = {x: e.x - canvasPos.x, y: e.y - canvasPos.y};
    const canvasCenter = {x: e.target.width/2, y: e.target.height/2};
    const canvasOffset = {x: clickPos.x - canvasCenter.x, y: clickPos.y - canvasCenter.y};
    const twoDLoc = {x: origCenter.x + canvasOffset.x, y: origCenter.y + canvasOffset.y};
    const centerOffset = GL.Matrix.relitiveDirection(twoDLoc.x, twoDLoc.y,0,gl.modelviewMatrix)
    return {x: centerOffset[0], y: centerOffset[1], z: centerOffset[2]};
  }

  function pointInfo(e) {
    const canvasPos = e.target.getBoundingClientRect();
    const pos = {x: e.x - canvasPos.x,
                      y: canvasPos.height - (e.y - canvasPos.y)};
    const bounds = (z) => [gl.unProject(0,canvasPos.height, z),
	                    gl.unProject(canvasPos.width, canvasPos.height, z),
	                    gl.unProject(canvasPos.width, 0, z),
	                    gl.unProject(0, 0, z)];
    return {pos, bounds, relitivePos: gl.project};
  }

  let origCenter = {x:0, y:0};
  let pointClicked = {x: 0, y: 0, z: 0};
  function setPointClicked(e) {
    if (shiftHeld || !VIEWER_CONTROLS.HOVER_AND_CLICK) return;
    const info = pointInfo(e);
    instance.hoverList.click(info.pos, info.relitivePos, info.bounds);
  }

  let pointHovered = {x: 0, y: 0, z: 0};
  this.hoverList = new ViewerHoverList();

  function setPointHovered(e) {
    if (shiftHeld || !VIEWER_CONTROLS.HOVER_AND_CLICK) return;
    const info = pointInfo(e);
    instance.hoverList.hover(info.pos, info.relitivePos, info.bounds);
  }

  let rotationUnit;
  let rotationOffset = [0,0,0];
  let panOffset;
  let panUnit;

  let rotationVector = new CSG.Vector(25, 12,11.5);
  let point = {x: 0, y: 12, z: 11.5};
  // let rotationVector = new CSG.Vector(25, 12,11.5);
  function rotateEvent(e) {
    // TODO: If I am going to enable free rotation need to create intuitive process.
    // if (!rotationUnit) {
    //   rotationUnit = {};
    //   rotationUnit.y = GL.Matrix.relitiveDirection(1, 0,0,gl.modelviewMatrix);
    //   rotationUnit.x = GL.Matrix.relitiveDirection(0, 1,0,gl.modelviewMatrix);
    // }
    // if (rotationUnit) {
    //   const speed = 40;
    //   if (e.deltaY) {
    //     const dir = e.deltaY < 0 ? -speed : speed;
    //     rotationOffset[0] += rotationUnit.y[0]/dir;
    //     rotationOffset[1] += rotationUnit.y[1]/dir;
    //     rotationOffset[2] += rotationUnit.y[2]/dir;
    //   }
    //   if (e.deltaX) {
    //     const dir = e.deltaX < 0 ? speed : -speed;
    //     rotationOffset[0] += rotationUnit.x[0]/dir;
    //     rotationOffset[1] += rotationUnit.x[1]/dir;
    //     rotationOffset[2] += rotationUnit.x[2]/dir;
    //   }
    // }
    // angleY += e.deltaX * 2;
    // angleX += e.deltaY * 2;
    // angleX = Math.max(-90, Math.min(90, angleX));
  }

  gl.onmousemove = function(e) {
    if (e.dragging) {
      if (shiftHeld) panEvent(e);
      else rotateEvent(e);
      gl.ondraw();
    }
  };

  function zoomEvent(e) {
    const st = document.documentElement.scrollTop;
    if (e.deltaY < 0) {
      zoom(true);
    } else {
      zoom();
    }
  }

  function panEvent(e) {
    const st = document.documentElement.scrollTop;
    pan(-e.deltaX, e.deltaY)
  }

  let lastScrollTop = 0;
  gl.canvas.onwheel = function (e) {
    zoomEvent(e);
    gl.ondraw();
  }
  disableScroll(gl.canvas);

  gl.canvas.onmousemove = (...args) => setPointHovered.subtle('3Dhovering', 50, ...args);

  let shiftHeld = false;
  window.onkeydown = (e) => {
    shiftHeld = e.key === "Shift" ? true : false;
  }
  window.onkeyup = (e) => {
    shiftHeld = !shiftHeld || e.key === "Shift" ? false : true;
  }

  let clickHeld = false;
  window.onclick = (e) => {
    clickHeld = !clickHeld;
    if (!clickHeld) {
      rotationUnit = null;
      panUnit = null;
    }
  }

  window.onmousedown = setPointClicked;

  function draw() {
    if (!that.mesh) return;
    // gl.clearColor(...Color.rgb.percent(VIEWER_CONTROLS.BACKGROUND_COLOR), 1);
    if (!Viewer.lineOverlay) gl.enable(gl.POLYGON_OFFSET_FILL);
    // that.lightingShaders.forEach(s => s.draw(that.mesh, gl.TRIANGLES));
    if (VIEWER_CONTROLS.POLYGONS)
      that.lightingShader.draw(that.mesh, gl.TRIANGLES);
    if (VIEWER_CONTROLS.AXIS)
      that.lightingShader.draw(new CSG.Axis(100, 1).toMesh(), gl.TRIANGLES)
    if (!Viewer.lineOverlay) gl.disable(gl.POLYGON_OFFSET_FILL);

    if (Viewer.lineOverlay) gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    if (VIEWER_CONTROLS.OUTLINE && that.mesh.line)
      that.blackShader.draw(that.mesh.line, gl.LINES);
    if (VIEWER_CONTROLS.WIREFRAME)
      that.blackShader.draw(that.mesh, gl.LINES);
    gl.disable(gl.BLEND);
    if (Viewer.lineOverlay) gl.enable(gl.DEPTH_TEST);
  }

  function viewFrom(point, rotation) {
      gl.clearColor(...Color.rgb.percent(VIEWER_CONTROLS.BACKGROUND_COLOR), 1);
      gl.makeCurrent();

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // const relDir1 = GL.Matrix.relitiveDirection(point.x, point.y, point.z, gl.modelviewMatrix);
      gl.loadIdentity();

      gl.rotate(rotation.x, 1, 0, 0);
      gl.rotate(rotation.y, 0, 1, 0);
      gl.rotate(rotation.z, 0, 0, 1);

      point = new CSG.Vector(point);
      gl.translate(-point.x, -point.y, -point.z);

      draw();
  }
  this.viewFrom = viewFrom;

  function applyZoom() {
    // const depthArr = GL.Matrix.relitiveDirection(0,0,depth,gl.modelviewMatrix);
    const transArr = GL.Matrix.relitiveDirection(x,-y,depth,gl.modelviewMatrix);
    gl.translate(-transArr[0], -transArr[1], transArr[2])
  }

  var that = this;
  gl.ondraw = function() {
    gl.clearColor(...Color.rgb.percent(VIEWER_CONTROLS.BACKGROUND_COLOR), 1);
    gl.makeCurrent();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // gl.loadIdentity();
    applyZoom();
    // const rotIndex = rotationOffset.maxIndex();
    // const delRotIndex = rotIndex === 0 ? 1 : 0;
    // if (Math.abs(rotationOffset[rotIndex]) >= 1) {
    //   const rotAxis = rotIndex === 0 ? [0,Math.round(rotationOffset[1]),0] :
    //                     [Math.round(rotationOffset[0]),0,0];
    //   gl.rotateAroundPoint({x:0,y:0,z:0}, [rotationOffset[0],0,0]);
    //   rotationOffset[rotIndex] = rotationOffset[rotIndex] % 1;
    //   rotationOffset[delRotIndex] = 0;
    // }
    // gl.rotateAroundPoint(pointClicked, rotationOffset);

    // gl.rotate(angleX, rotationVector.x, rotationVector.y, rotationVector.z);
    // gl.rotate(angleY, rotationVector.x, rotationVector.y, rotationVector.z);
    // gl.rotate(rotationOffset[2], 0, 0, -1);
    x = y = angleX = angleY = depth = 0;
    draw();
  };

  // gl.ondraw();

  // gl.canvas.width = '100vw';
  // gl.canvas.height = '100vh';
}

var nextID = 0;
function addViewer(viewer, id) {
  du.find(id).appendChild(viewer.gl.canvas);
}




// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e) {
  e.preventDefault();
}

function preventDefaultForScrollKeys(e) {
  if (keys[e.keyCode]) {
    preventDefault(e);
    return false;
  }
}

// modern Chrome requires { passive: false } when adding event
var supportsPassive = false;
try {
  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
    get: function () { supportsPassive = true; }
  }));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

// call this to Disable
function disableScroll(element) {
  element.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
  element.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
  element.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
  element.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

// call this to Enable
function enableScroll(element) {
  element.removeEventListener('DOMMouseScroll', preventDefault, false);
  element.removeEventListener(wheelEvent, preventDefault, wheelOpt);
  element.removeEventListener('touchmove', preventDefault, wheelOpt);
  element.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}

exports.Viewer = Viewer
exports.addViewer = addViewer
exports.preventDefault = preventDefault
exports.preventDefaultForScrollKeys = preventDefaultForScrollKeys
exports.disableScroll = disableScroll
exports.enableScroll = enableScroll
