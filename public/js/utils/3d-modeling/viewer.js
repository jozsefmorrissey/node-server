


const du = require('../dom-utils.js');
const CSG = require('./csg.js');
const GL = require('./lightgl.js');

// Set the color of all polygons in this solid
CSG.prototype.setColor = function(r, g, b, force) {
  this.toPolygons().map(function(polygon) {
    if (polygon.shared === undefined || force) {
      polygon.setColor(r, g, b);
    }
  });
};

// Convert from CSG solid to GL.Mesh object
CSG.prototype.toMesh = function() {
  var mesh = new GL.Mesh({ normals: true, colors: true });
  var indexer = new GL.Indexer();
  this.toPolygons().map(function(polygon) {
    var indices = polygon.vertices.map(function(vertex) {
      vertex.color = polygon.shared || [1, 1, 1];
      return indexer.add(vertex);
    });
    for (var i = 2; i < indices.length; i++) {
      mesh.triangles.push([indices[0], indices[i - 1], indices[i]]);
    }
  });
  mesh.vertices = indexer.unique.map(function(v) { return [v.pos.x, v.pos.y, v.pos.z]; });
  mesh.normals = indexer.unique.map(function(v) { return [v.normal.x, v.normal.y, v.normal.z]; });
  mesh.colors = indexer.unique.map(function(v) { return v.color; });
  mesh.computeWireframe();
  return mesh;
};

var angleX = 0;
var angleY = 0;
var angleZ = 0;
var viewers = [];

// Set to true so lines don't use the depth buffer
Viewer.lineOverlay = false;

// A viewer is a WebGL canvas that lets the user view a mesh. The user can
// tumble it around by dragging the mouse.
function Viewer(csg, width, height, depth) {
  const originalDepth = depth;
  viewers.push(this);
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
  this.mesh = csg.toMesh();
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
  gl.clearColor(0.93, 0.93, 0.93, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.polygonOffset(1, 1);

  // Black shader for wireframe
  this.blackShader = new GL.Shader('\
    void main() {\
      gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;\
    }\
  ', '\
    void main() {\
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.1);\
    }\
  ');

  // Shader with diffuse and specular lighting
  this.changeLightingShaderDirection = (x,y,z) => this.lightingShader = new GL.Shader(`
    varying vec3 color;
    varying vec3 normal;
    varying vec3 light;
    void main() {
      const vec3 lightDir = vec3(${x}, ${y}, ${z}) / 3.741657386773941;
      light = (gl_ModelViewMatrix * vec4(lightDir, 0.005)).xyz;
      color = gl_Color.rgb;
      normal = gl_NormalMatrix * gl_Normal;
      gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
    }
  `, `
    varying vec3 color;
    varying vec3 normal;
    varying vec3 light;
    void main() {
      vec3 n = normalize(normal);
      float diffuse = max(0.0, dot(light, n));
      float specular = pow(max(0.0, -reflect(light, n).z), 32.0) * sqrt(diffuse);
      gl_FragColor = vec4(mix(color * (0.3 + 0.7 * diffuse), vec3(1.0), specular), 1.0);
    }`);

  this.changeLightingShaderDirection(0, 0, 0);
  // this.changeLightingShaderDirection(3, 2, 3);

  let origCenter = {x:0, y:0};
  let pointClicked = {x: 0, y: 0, z: 0};
  function setPointClicked(e) {
    const canvasPos = e.target.getBoundingClientRect();
    const clickPos = {x: e.x - canvasPos.x, y: e.y - canvasPos.y};
    const canvasCenter = {x: e.target.width/2, y: e.target.height/2};
    const canvasOffset = {x: clickPos.x - canvasCenter.x, y: clickPos.y - canvasCenter.y};
    const twoDLoc = {x: origCenter.x + canvasOffset.x, y: origCenter.y + canvasOffset.y};
    const centerOffset = GL.Matrix.relitiveDirection(twoDLoc.x, twoDLoc.y,0,gl.modelviewMatrix)
    pointClicked = {x: centerOffset[0], y: centerOffset[1], z: centerOffset[2]};
  }

  let rotationUnit;
  let rotationOffset = [0,0,0];
  let panOffset;
  let panUnit;

  let rotationVector = new CSG.Vector(25, 12,11.5);
  let point = {x: 0, y: 12, z: 11.5};
  // let rotationVector = new CSG.Vector(25, 12,11.5);
  function rotateEvent(e) {
    if (!rotationUnit) {
      rotationUnit = {};
      rotationUnit.y = GL.Matrix.relitiveDirection(1, 0,0,gl.modelviewMatrix);
      rotationUnit.x = GL.Matrix.relitiveDirection(0, 1,0,gl.modelviewMatrix);
    }
    if (rotationUnit) {
      const speed = 40;
      if (e.deltaY) {
        const dir = e.deltaY < 0 ? -speed : speed;
        rotationOffset[0] += rotationUnit.y[0]/dir;
        rotationOffset[1] += rotationUnit.y[1]/dir;
        rotationOffset[2] += rotationUnit.y[2]/dir;
      }
      if (e.deltaX) {
        const dir = e.deltaX < 0 ? speed : -speed;
        rotationOffset[0] += rotationUnit.x[0]/dir;
        rotationOffset[1] += rotationUnit.x[1]/dir;
        rotationOffset[2] += rotationUnit.x[2]/dir;
      }
    }
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

  function viewFrom(point, rotation) {
      gl.makeCurrent();

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // const relDir1 = GL.Matrix.relitiveDirection(point.x, point.y, point.z, gl.modelviewMatrix);
      gl.loadIdentity();

      gl.rotate(rotation.x, 1, 0, 0);
      gl.rotate(rotation.y, 0, 1, 0);
      gl.rotate(rotation.z, 0, 0, 1);

      gl.translate(0, 0, -20);
      // const relDir = GL.Matrix.relitiveDirection(point.x, point.y, point.z, gl.modelviewMatrix);
      // gl.translate(-relDir[0], -relDir[1], -relDir[2]);

      if (!Viewer.lineOverlay) gl.enable(gl.POLYGON_OFFSET_FILL);
      that.lightingShader.draw(that.mesh, gl.TRIANGLES);
      if (!Viewer.lineOverlay) gl.disable(gl.POLYGON_OFFSET_FILL);

      if (Viewer.lineOverlay) gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      // that.blackShader.draw(that.mesh, gl.LINES);
      gl.disable(gl.BLEND);
      if (Viewer.lineOverlay) gl.enable(gl.DEPTH_TEST);
  }
  this.viewFrom = viewFrom;

  function applyZoom() {
    // const depthArr = GL.Matrix.relitiveDirection(0,0,depth,gl.modelviewMatrix);
    const transArr = GL.Matrix.relitiveDirection(x,-y,depth,gl.modelviewMatrix);
    gl.translate(-transArr[0], -transArr[1], transArr[2])
  }

  var that = this;
  gl.ondraw = function() {
    gl.makeCurrent();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // gl.loadIdentity();
    applyZoom();
    gl.rotateAroundPoint(pointClicked, rotationOffset);

    // gl.rotate(angleX, rotationVector.x, rotationVector.y, rotationVector.z);
    // gl.rotate(angleY, rotationVector.x, rotationVector.y, rotationVector.z);
    // gl.rotate(rotationOffset[2], 0, 0, -1);
    x = y = angleX = angleY = rotationOffset[0] = rotationOffset[1] = rotationOffset[2] = depth = 0;

    if (!Viewer.lineOverlay) gl.enable(gl.POLYGON_OFFSET_FILL);
    that.lightingShader.draw(that.mesh, gl.TRIANGLES);
    if (!Viewer.lineOverlay) gl.disable(gl.POLYGON_OFFSET_FILL);

    if (Viewer.lineOverlay) gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    // that.blackShader.draw(that.mesh, gl.LINES);
    gl.disable(gl.BLEND);
    if (Viewer.lineOverlay) gl.enable(gl.DEPTH_TEST);
  };

  gl.ondraw();

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