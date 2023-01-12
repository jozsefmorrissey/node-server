
const Vertex2d = require('vertex');
const Line2d = require('line');
const SnapLocation2d = require('snap-location');
const HoverMap2d = require('../hover-map');
const Tolerance = require('../../../../../public/js/utils/tolerance.js');
const withinTol = Tolerance.within(.1);

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
        const radianDifference = newValue - radians;
        this.object().rotate(radianDifference);
        notify(radians, newValue);
        radians = Math.mod(newValue, 2*Math.PI);
      }
      return radians;
    };
    this.rotate = (rads) => {
      this.radians(rads + radians);
    }

    let height = 60.96;
    let width = 121.92;
    this.height = (h) => {
      if ((typeof h) === 'number') {
        const newVal = h;
        notify(height, newVal);
        height = newVal;
      }
      return height;
    }
    this.width = (w) => {
      if ((typeof w) === 'number') {
        const newVal = w;
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
        const index = snapLocations.length;
        snapLocations.push(snapLoc);
        snapLoc.prev = () => snapLocations[Math.mod(index - 1, snapLocations.length)];
        snapLoc.next = () => snapLocations[Math.mod(index + 1, snapLocations.length)];
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

    const backReg = /^back[0-9]{1,}$/;
    const rightCenterReg = /^right[0-9]{1,}center$/;
    const leftCenterReg = /^left[0-9]{1,}center$/;
    const backCenterReg = /^back[0-9]{1,}center$/;
    const centerReg = /^[a-z]{1,}[0-9]{1,}center$/;
    this.snapLocations = getSnapLocations;
    this.snapLocations.notPaired = () => getSnapLocations((loc) => loc.pairedWith() === null);
    this.snapLocations.paired = () => getSnapLocations((loc) => loc.pairedWith() !== null);
    this.snapLocations.wallPairable = () => getSnapLocations((loc) => loc.location().match(backReg));
    this.snapLocations.rightCenter = () => getSnapLocations((loc) => loc.location().match(rightCenterReg));
    this.snapLocations.leftCenter = () => getSnapLocations((loc) => loc.location().match(leftCenterReg));
    this.snapLocations.backCenter = () => getSnapLocations((loc) => loc.location().match(backCenterReg));
    this.snapLocations.center = () => getSnapLocations((loc) => loc.location().match(centerReg));
    this.snapLocations.at = (vertex) => {
      for (let index = 0; index < snapLocations.length; index++)
        if (snapLocations[index].center().equal(vertex)) return snapLocations[index];
      return null;
    }
    this.snapLocations.resetCourting = () => {
      for (let index = 0; index < snapLocations.length; index++) {
        snapLocations[index].courting(null);
      }
    }
    // this.snapLocations.rotate = backCenter.rotate;
    function resetVertices() {
      for (let index = 0; index < snapLocations.length; index += 1) {
        const snapLoc = snapLocations[index];
        instance.position[snapLoc.location()]();
      }
    }

    this.maxRadius = () => {
      const center = this.parent().center();
      let maxDist = 0;
      for (let index = 0; index < snapLocations.length; index++) {
        const loc = snapLocations[index].center();
        const currDist = center.distance(loc);
        if (currDist > maxDist) {
          maxDist = currDist;
        }
      }
      return maxDist;
    }

    this.minRadius = () => {
      const center = this.parent().center();
      let minDist = Number.MAX_SAFE_INTEGER;
      for (let index = 0; index < snapLocations.length; index++) {
        const loc = snapLocations[index].center();
        const currDist = center.distance(loc);
        if (currDist < minDist) {
          minDist = currDist;
        }
      }
      return minDist;
    }

    const hoveringNear = new HoverMap2d(this.object().center, () => this.maxRadius() + 10).hovering;
    const hoveringObject = new HoverMap2d(this.object().center, () => this.minRadius() * 1.3).hovering;
    this.hovering = (vertex) => {
      const isNear = hoveringNear(vertex);
      if (!isNear) return;
      for (let index = 0; index < snapLocations.length; index++) {
        const hoveringSnap = snapLocations[index].hovering(vertex);
        if (hoveringSnap) return snapLocations[index];
      }
      return hoveringObject(vertex) && this;
    }

    this.hoveringSnap = (vertex, excluded) => {
      if (this === excluded || Array.exists(excluded, this)) return false;
      const isNear = hoveringNear(vertex);
      if (!isNear) return;
      for (let index = 0; index < snapLocations.length; index++) {
        const hoveringSnap = snapLocations[index].hovering(vertex);
        if (hoveringSnap) return snapLocations[index];
      }
      return false;
    }

    this.otherHoveringSnap = (vertex) =>
      parent.layout().snapAt(vertex, this);

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

    function sameSlopeAsWall(wall, v1, v2, v3) {
      const wallSlope = wall.slope();
      const p1 = v1.point();
      const p2 = v2.point()
      const p3 = v3.point()
      return withinTol(wallSlope, Line2d.getSlope(p1.x, p1.y, p2.x, p2.y)) ||
              withinTol(wallSlope, Line2d.getSlope(p2.x, p2.y, p3.x, p3.y));
    }

    function findBestWallSnapLoc(center, wall, wallPairables, theta) {
      let best;
      const currentCenter = instance.parent().center();
      for (let index = 0; index < wallPairables.length; index++) {
        const snapLoc = wallPairables[index];
        const neighbors = instance.object().neighbors(snapLoc.center(), -1, 1);
        if (theta === 180)
          console.log('rotated');
        if (sameSlopeAsWall(wall, neighbors[0], snapLoc.center(), neighbors[1])) {
          const centerVertex = snapLoc.at({center, theta});
          const moveIsWithin = layout.within(centerVertex);
          if (moveIsWithin) {
            const dist = centerVertex.distance(currentCenter);
            if (best === undefined || best.dist > dist) {
              best = {center: centerVertex, theta, wall, pairWith: snapLoc};
            }
          }
        }
      }
      return best;
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
        const wallPairables = instance.snapLocations.wallPairable();
        return findBestWallSnapLoc(point, wall, wallPairables, 0) ||
                    findBestWallSnapLoc(point, wall, wallPairables, Math.PI);
      }
    }

    const neighborSelectFunc = (cursorCenter, neighborSeperation) => (min, index) =>
      min.distance(cursorCenter);// + (index === 1 ? neighborSeperation / 2 : 0);

    function findClosestNeighbor(otherMidpoint, radians, targetMidpoint, otherLoc, cursorCenter) {
      const obj = instance.object();
      const tempPoly = obj.copy();
      const objVerts = obj.verticesAndMidpoints();
      const targetIndex = objVerts.equalIndexOf(targetMidpoint.center());

      if (targetIndex === undefined) {
        console.log('wtf');
      }

      tempPoly.rotate(radians);
      const newCenter = tempPoly.point(targetIndex, {center: otherMidpoint.center()});
      tempPoly.centerOn(newCenter);
      const neighbors = tempPoly.neighbors(otherMidpoint.center(), -1, 0, 1);
      const neighborSeperation = neighbors[0].distance(neighbors[2]);
      const neighbor = neighbors.min(null, neighborSelectFunc(cursorCenter, neighborSeperation));
      const neighborIndex = tempPoly.verticesAndMidpoints().equalIndexOf(neighbor);
      const locCount = instance.snapLocations().length;

      const originalPosition = objVerts[neighborIndex + locCount % locCount];
      if (originalPosition === undefined) { // Vertex
        console.log('wtff');
      }
      const targetLoc = instance.snapLocations.at(originalPosition);
      if (!targetLoc) {
        // console.log(targetLoc.location());
        return;
      }

      const dist = neighbor.distance(cursorCenter);
      const centerDist = tempPoly.center().distance(otherMidpoint.parent().object().center());
      return {targetLoc, dist, radians, targetMidpoint, otherMidpoint, centerDist};
    }

    function closestSnap(otherMidpoint, otherLoc, snapList, cursorCenter) {
      let closest = null;
      const c = cursorCenter;
      const om = otherMidpoint;
      const ol = otherLoc;
      for (let index = 0; index < snapList.length; index++) {
        const targetMidpoint = snapList[index];
        const tm = targetMidpoint;
        const radDiff = otherMidpoint.forwardRadians() - targetMidpoint.forwardRadians();
        const parrelle = findClosestNeighbor(om, radDiff, tm, ol, c);
        const antiParrelle = findClosestNeighbor(om, radDiff - Math.PI, tm, ol, c);
        const furthestCenter =
          parrelle.centerDist > antiParrelle.centerDist ? parrelle : antiParrelle;
        furthestCenter.otherLoc = otherLoc;
        if (furthestCenter.radians === 0) return furthestCenter;
        if (!closest || closest.dist < furthestCenter.dist) {
          closest = furthestCenter;
        }
      }
      return closest;
    }


    function closestBackSnapInfo(otherLoc, cursorCenter) {
      const snapList = instance.snapLocations.center();
      let midpoint = otherLoc.neighbor(1);
      let snapInfo1 = closestSnap(midpoint, otherLoc, snapList, cursorCenter);
      if (snapInfo1.radians === 0) return snapInfo1;
      midpoint = otherLoc.neighbor(-1);
      let snapInfo2 = closestSnap(midpoint, otherLoc, snapList, cursorCenter);
      if (snapInfo2.radians === 0) return snapInfo2;
      if (snapInfo1.radians === Math.PI) return snapInfo1;
      if (snapInfo2.radians === Math.PI) return snapInfo2;
      const rotation1isSmallest = snapInfo2.radians > snapInfo1.radians;
      return rotation1isSmallest ? snapInfo1 : snapInfo2;
    }

    function closestCenterSnap(otherLoc, cursorCenter) {
      const snapList = instance.snapLocations.center();
    }

    let lastClosestSnapLocation;
    const distanceFunc = (center) => (snapLoc) => snapLoc.center().distance(center);// +
//          (lastClosestSnapLocation === snapLoc ? -10 : 0);
    function findClosestSnapLoc (center) {
      const objects = parent.layout().objects();
      const instObj = instance.object();
      const instCenter = instObj.center();
      let closest = null;
      for (let index = 0; index < objects.length; index++) {
        const object = objects[index];
        if (object !== parent) {
          const otherSnap = object.topview();
          const combinedRadius = otherSnap.maxRadius() + instance.maxRadius();
          const center2centerDist = otherSnap.object().center().distance(instCenter);
          if (center2centerDist - 1 < combinedRadius) {
            const snapLocs = otherSnap.snapLocations();
            closest = snapLocs.min(closest, distanceFunc(center));
          }
        }
      }
      lastClosestSnapLocation = closest;
      return closest;
    }

    function snapMove(snapInfo) {
      if (snapInfo) {
        snapInfo.targetLoc.move(snapInfo.otherLoc.center(), null);
        instance.rotate(snapInfo.radians, snapInfo.otherLoc.center());
        snapInfo.targetLoc.courting(snapInfo.otherLoc);
      }
    }

    function findObjectSnapLocation(center) {
      const closestOtherLoc = findClosestSnapLoc(center);
      if (closestOtherLoc === null) return;
      let snapList, midpointOffset;
      if (closestOtherLoc.isLeft) {
        if (!closestOtherLoc.isCenter) midpointOffset = -1;
        snapList = instance.snapLocations.rightCenter();
      } else if (closestOtherLoc.isRight) {
        if (!closestOtherLoc.isCenter) midpointOffset = 1;
        snapList = instance.snapLocations.leftCenter();
      } else if (closestOtherLoc.isBack && ! closestOtherLoc.isCenter) {
        const snapInfo = closestBackSnapInfo(closestOtherLoc, center);
        snapMove(snapInfo);
        return;
      } else {
        snapList = instance.snapLocations.backCenter();
      }
      if (snapList) {
        let midpoint = midpointOffset ? closestOtherLoc.neighbor(midpointOffset) : closestOtherLoc;
        const snapInfo = closestSnap(midpoint, closestOtherLoc, snapList, center);
        snapMove(snapInfo);
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
      this.snapLocations.resetCourting();
      instance.object().centerOn(position.center);
      if (position.theta !== undefined) instance.radians(position.theta);
      if (!force) {
        let validMove = true;
        instance.object().centerOn(position.center);
        if (!validMove) {
          if (lastValidMove) {
            console.log('Invalid Move');
            return this.makeMove(lastValidMove, true); // No move was made return undefined
          }
        } else lastValidMove = position;
        lastValidMove = position;
      }
      instance.update();
    }
    this.move = (center) => {
      checkPotentialPair();
      const pairedSnapLocs = this.snapLocations.paired();
      const centerWithin = layout.within(center);
      let closest = {};
      const wallSnapLocation = findWallSnapLocation(center);
      if (wallSnapLocation !== undefined) {
        const move = this.makeMove(wallSnapLocation);
        const wallSnapLoc = this.snapLocations.wallPairable()[0];
        lastPotentalPair = [wallSnapLoc.pairWith, wallSnapLocation.wall];
        return move;
      } else if (centerWithin) {
        const move = this.makeMove({center});
        findObjectSnapLocation(center);
        return move;
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
