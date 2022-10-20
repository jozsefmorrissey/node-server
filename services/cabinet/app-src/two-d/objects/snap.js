
const Vertex2d = require('vertex');
const SnapLocation2d = require('snap-location');
const approximate = require('../../../../../public/js/utils/approximate.js');

class Snap2d {
  constructor(parent, object, tolerance) {
    name = 'booyacka';
    Object.getSet(this, {object, tolerance}, 'layoutId');
    if (parent === undefined) return;
    const instance = this;
    const id = String.random();
    let start = new Vertex2d();
    let end = new Vertex2d();
    let layout = parent.layout();

    this.dl = () => 24 * 2.54;
    this.dr = () => 24 * 2.54;
    this.dol = () => 12;
    this.dor = () => 12;
    this.toString = () => `SNAP (${tolerance}):${object}`
    this.position = {};
    this.id = () => id;
    this.parent = () => parent;
    this.x = (val) => {
      if (val !== undefined) {
        notify(this.parent().center().x(), val);
        this.parent().center().x(val);
      }
      return this.parent().center().x();
    }
    this.y = (val) => {
      if (val !== undefined) {
        notify(this.parent().center().y(), val);
        this.parent().center().y(val);
      }
      return this.parent().center().y();
    }

    this.angle = (value) => {
      if (value !== undefined) {
        notify(this.angle(), value);
        this.radians(Math.toRadians(value));
      }
      return Math.toDegrees(this.radians());
    }


    const changeFuncs = [];
    this.onChange = (func) => {
      if ((typeof func) === 'function') {
        changeFuncs.push(func);
      }
    }

    let lastNotificationId = 0;
    function notify(currentValue, newValue) {
      if (changeFuncs.length === 0 || (typeof newValue) !== 'number') return;
      if (newValue !== currentValue) {
        const id = ++lastNotificationId;
        setTimeout(() => {
          if (id === lastNotificationId)
            for (let i = 0; i < changeFuncs.length; i++) changeFuncs[i](instance);
        }, 100);
      }
    }

    let radians = 0;
    this.radians = (newValue) => {
      if (newValue !== undefined && !Number.isNaN(Number.parseFloat(newValue))) {
        notify(radians, newValue);
        radians = newValue;
      }
      return radians;
    };

    let height = 60.96;
    let width = 121.92;
    this.height = (h) => {
      if ((typeof h) === 'number') {
        const newVal = approximate(h);
        notify(height, newVal);
        height = newVal;
      }
      return height;
    }
    this.width = (w) => {
      if ((typeof w) === 'number') {
        const newVal = approximate(w);
        notify(width, newVal);
        width = newVal;
      }
      return width;
    }

    this.minDem = () => this.width() > this.height() ? this.width() : this.height();
    this.maxDem = () => this.width() > this.height() ? this.width() : this.height();

    this.view = () => {
      switch (this) {
        case parent.topview(): return 'topview';
        case parent.bottomview(): return 'bottomview';
        case parent.leftview(): return 'leftview';
        case parent.rightview(): return 'rightview';
        case parent.frontview(): return 'frontview';
        case parent.backview(): return 'backview';
        default: return null;
      }
    }

    const snapLocations = [];
    this.addLocation = (snapLoc) => {
      if (snapLoc instanceof SnapLocation2d && this.position[snapLoc.location()] === undefined) {
        snapLocations.push(snapLoc);
        this.position[snapLoc.location()] = snapLoc.at;
      }
    }
    function getSnapLocations(func) {
      const locs = [];
      for (let index = 0; index < snapLocations.length; index += 1) {
        const loc = snapLocations[index];
        if ((typeof func) === 'function') {
          if (func(loc)) locs.push(loc);
        } else locs.push(loc);
      }
      return locs;
    }

    this.snapLocations = getSnapLocations;
    this.snapLocations.notPaired = () => getSnapLocations((loc) => loc.pairedWith() === null);
    this.snapLocations.paired = () => getSnapLocations((loc) => loc.pairedWith() !== null);
    this.snapLocations.wallPairable = () => getSnapLocations((loc) => loc.wallThetaOffset() !== undefined);
    // this.snapLocations.rotate = backCenter.rotate;
    function resetVertices() {
      for (let index = 0; index < snapLocations.length; index += 1) {
        const snapLoc = snapLocations[index];
        instance.position[snapLoc.location()]();
      }
    }

    function calculateMaxAndMin(closestVertex, furthestVertex, wall, position, axis) {
      const maxAttr = `max${axis.toUpperCase()}`;
      const minAttr = `min${axis.toUpperCase()}`;
      if (closestVertex[axis]() === furthestVertex[axis]()) {
        const perpLine = wall.perpendicular(10, null, true);
        const externalVertex = !layout.within(perpLine.startVertex()) ?
                perpLine.endVertex() : perpLine.startVertex();
        if (externalVertex[axis]() < closestVertex[axis]()) position[maxAttr] = closestVertex[axis]();
        else position[minAttr] = closestVertex[axis]();
      } else if (closestVertex[axis]() < furthestVertex[axis]()) position[minAttr] = closestVertex[axis]();
      else position[maxAttr] = closestVertex[axis]();
    }

    function findWallSnapLocation(center) {
      const centerWithin = layout.within(center);
      let wallObj;
      layout.walls().forEach((wall) => {
        const point = wall.closestPointOnLine(center, true);
        if (point) {
          const wallDist = point.distance(center);
          const isCloser = (!centerWithin || wallDist < tolerance*2) &&
                          (wallObj === undefined || wallObj.distance > wallDist);
          if (isCloser) {
            wallObj = {point, distance: wallDist, wall};
          }
        }
      });
      if (wallObj) {
        const wall = wallObj.wall;
        const point = wallObj.point;
        center = point;
        let theta = wall.radians();

        let position = {center, theta};

        const wallPairables = instance.snapLocations.wallPairable();
        let pairWith;
        if (centerWithin) pairWith = wallPairables[1];
        else pairWith = wallPairables[0];

        theta += Math.toRadians(pairWith.wallThetaOffset());
        const objCenter = pairWith.at({center, theta});

        return {center: objCenter, theta, wall, pairWith};
      }
    }

    function findObjectSnapLocation (center) {
      let snapObj;
      SnapLocation2d.active().forEach((snapLoc) => {
        const tarVertId = snapLoc.targetVertex();
        if ((typeof instance.position[tarVertId]) !== 'function') return;
        const targetSnapLoc = instance.position[tarVertId]();
        if (snapLoc.isConnected(instance) ||
            snapLoc.pairedWith() !== null || targetSnapLoc.pairedWith() !== null) return;
        const vertDist = snapLoc.vertex().distance(center);
        const vertCloser = (snapObj === undefined && vertDist < tolerance) ||
        (snapObj !== undefined && snapObj.distance > vertDist);
        if (vertCloser) snapObj = {snapLoc: snapLoc, distance: vertDist, targetSnapLoc};
      });
      if (snapObj) {
        const snapLoc = snapObj.snapLoc;
        const tarSnap = snapObj.targetSnapLoc;
        let theta = snapLoc.parent().radians();
        const center = snapLoc.vertex();
        const funcName = snapLoc.targetVertex();
        theta += Math.toRadians(tarSnap.thetaOffset(snapLoc));
        lastPotentalPair = [snapLoc, tarSnap];
        return {snapLoc, center: instance.position[funcName]({center, theta}), theta};
      }
    }

    let lastPotentalPair;
    this.setLastPotentialPair = (lpp) => lastPotentalPair = lpp;
    function checkPotentialPair() {
      if (!lastPotentalPair) return;
      if (!(lastPotentalPair[1] instanceof SnapLocation2d)) return true;
      const snap1 = lastPotentalPair[0];
      const snap2 = lastPotentalPair[1];
      snap1.eval();
      snap2.eval();
      if (!snap1.vertex().equal(snap2.vertex())) lastPotentalPair = null;
      return true;
    }

    this.potentalSnapLocation = () => checkPotentialPair() && lastPotentalPair && lastPotentalPair[0];
    this.pairWithLast = () => {
      if (lastPotentalPair) {
        if ((typeof lastPotentalPair[0].pairWith) === 'function') {
          lastPotentalPair && lastPotentalPair[0].pairWith(lastPotentalPair[1])
        } else {
          console.log('nope');
        }
      }
      lastPotentalPair = null;
    };

    let lastValidMove;
    this.makeMove = (position, force) => {
      const originalPos = {center: this.parent().center(), theta: this.radians()};
      instance.parent().center().point(position.center);
      if (position.theta !== undefined) instance.radians(position.theta);
      if (!force) {
        let validMove = true;
        instance.snapLocations().forEach((l) => validMove &&= layout.within(l.at().vertex()));
        if (!validMove) return this.makeMove(lastValidMove, true); // No move was made return undefined
        else lastValidMove = position;
      }
      instance.update();
    }
    this.move = (center) => {
      checkPotentialPair();
      const pairedSnapLocs = this.snapLocations.paired();
      resetVertices();
      if (pairedSnapLocs.length > 0) {
        const snapInfo = findObjectSnapLocation(center);
        if (snapInfo) {
          const obj = snapInfo.snapLoc.parent();
          if (snapInfo.theta !== undefined) {
            const theta = approximate(((snapInfo.theta + 2 * Math.PI) - this.radians()) % (2*Math.PI));
            snapInfo.theta = undefined;
            this.snapLocations.rotate(theta);
          }
          const snapLoc = snapInfo.snapLoc;
          const targetVertex = snapLoc.targetVertex();
          const targetSnapLoc = this[targetVertex]();
          lastPotentalPair = [targetSnapLoc, snapLoc];
          const vertexCenter = snapLoc.parent().position[snapLoc.location()]().vertex();
          return targetSnapLoc.move(vertexCenter);
        }
        const snapLoc = pairedSnapLocs[0];
        return snapLoc.move(center);
      }
      const centerWithin = layout.within(center);
      let closest = {};
      const snapLocation = findObjectSnapLocation(center);
      const wallSnapLocation = findWallSnapLocation(center);
      if (snapLocation) {
        return this.makeMove(snapLocation);
      } else if (wallSnapLocation !== undefined) {
        const move = this.makeMove(wallSnapLocation);
        const wallSnapLoc = this.snapLocations.wallPairable()[0];
        lastPotentalPair = [wallSnapLoc.pairWith, wallSnapLocation.wall];
        return move;
      } else if (centerWithin) {
        return this.makeMove({center});
      }
    }

    const objData = (funcName) => {
      const obj = this.object();
      return obj && (typeof obj[funcName]) === 'function';
    }
    function updateObject() {
      if (objData('radians')) object.radians(radians);
      if (objData('height')) object.height(height);
      if (objData('width')) object.width(width);
      instance.snapLocations().forEach((snapLoc) => snapLoc.at());
    }

    this.update = updateObject;
    this.onChange(updateObject);
  }
}

Snap2d.get = {};
Snap2d.registar = (clazz) => {
  const instance = new clazz();
  if (instance instanceof Snap2d) {
    const name = clazz.prototype.constructor.name.replace(/^Snap/, '').toCamel();
    if (Snap2d.get[name] === undefined)
      Snap2d.get[name] = (parent, tolerance) => new clazz(parent, tolerance);
    else throw new Error(`Double registering Snap2d: ${name}`);
  }
}


Snap2d.fromJson = (json) => {
  const layout = Layout2d.get(json.layoutId);
  const object = Object.fromJson(json.object);
  const snapObj = new Snap2d(layout, object, json.tolerance);
  snapObj.id(json.id);
  return snapObj;
}

new Snap2d();

module.exports = Snap2d;
