
const Vertex2d = require('vertex');
const Line2d = require('line');
const SnapLocation2d = require('snap-location');
const Tolerance = require('../../../tolerance.js');
const Lookup = require('../../../object/lookup.js');
const AutoLocationProperties = require('./snap/auto-location-properties.js');

const realClose = Tolerance.within(.001);

class Snap2d extends Lookup {
  constructor(parent, object) {
    super();
    Object.getSet(this, {object}, 'layoutId');
    if (parent === undefined) return;
    const instance = this;
    let start = new Vertex2d();
    let end = new Vertex2d();
    let layout = parent.layout();

    this.dl = () => 24 * 2.54;
    this.dr = () => 24 * 2.54;
    this.dol = () => 12;
    this.dor = () => 12;
    this.toString = () => `SNAP ${this.id()}(${this.tolerance()}):${this.object()}`
    this.position = {};
    this.parent = () => parent;
    this.x = parent.x;
    this.y = parent.y;
    this.width = parent.width;
    this.height = parent.height;
    this.center = parent.center;
    this.angle = parent.angle;
    this.rotate = parent.rotate;
    this.AutoLocationProperties = () => AutoLocationProperties.get(this.id());
    this.tolerance = () => this.AutoLocationProperties().TOLERANCE;
    this.withinTol = (...args) => Tolerance.within(this.tolerance())(...args);

    this.radians = parent.radians;
    object.radians = parent.radians;


    // TODO: implement this as rotation function, allows for rotation of multple connected objects
    this.rot = function (newValue) {
      if (newValue !== undefined ) {
        const constraint = this.constraint();
        if (constraint === 'fixed') return;
        const radians = parent.radians();
        const snapAnchor = constraint.snapLoc;
        const originalPosition = snapAnchor && snapAnchor.center();
        const radianDifference = newValue - radians;
        this.parent().rotate(radianDifference);
        if (snapAnchor) this.parent.center(snapAnchor.at({center: originalPosition}));
      }
      return parent.radians();
    };

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

    // this.minDem = () => this.width() > this.height() ? this.width() : this.height();
    // this.maxDem = () => this.width() > this.height() ? this.width() : this.height();

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

    this.forEachConnectedObject = (func, objMap) => {
      objMap = objMap || {};
      objMap[this.id()] = this;
      const locs = this.snapLocations.paired();
      for (let index = 0; index < locs.length; index += 1) {
        const loc = locs[index];
        const connSnap = loc.pairedWith();
        if (connSnap instanceof SnapLocation2d) {
          const connObj = connSnap.parent();
          if (connObj && objMap[connOb.id()] === undefined) {
            objMap[connObj.id()] = connObj;
            connSnap.parent().forEachConnectedObject(undefined, objMap);
          }
        }
      }
      if ((typeof func) === 'function') {
        const objs = Object.values(objMap);
        for (let index = 0; index < objs.length; index += 1) {
          func(objs[index]);
        }
      } else return objMap;
    };

    this.forEachConnectedSnap = (func, pairedMap) => {
      pairedMap ||= {};
      const locs = this.snapLocations.paired();
      for (let index = 0; index < locs.length; index += 1) {
        const loc = locs[index];
        pairedMap[loc.toString()]  = loc;
        const connSnap = loc.pairedWith();
        if (connSnap instanceof SnapLocation2d) {
          const snapStr = connSnap.toString();
          if (pairedMap[snapStr] === undefined) {
            pairedMap[snapStr] = connSnap;
            connSnap.parent().forEachConnectedSnap(undefined, pairedMap);
          }
        }
      }

      if ((typeof func) === 'function') {
        const snaps = Object.values(pairedMap);
        for (let index = 0; index < snaps.length; index += 1) {
          func(snaps[index]);
        }
      } else return pairedMap;
    }

    this.constraints = () => {
      let constraints = [];
      this.forEachConnectedSnap((snapLoc) => {
        const possible = snapLoc.pairedWith();
        if (!(possible instanceof SnapLocation2d)) constraints.push(snapLoc);
      });
      return constraints;
    };

    this.constraint = () => {
      let constraints = this.constraints();
      if (constraints.length === 0) return 'free';
      const wallMap = {};
      let anchor;
      for (let index = 0; index < constraints.length; index++) {
        const snapLoc = constraints[index];
        const constraint = snapLoc.pairedWith();
        if (constraint instanceof Line2d && !wallMap[constraint.toString()]) {
          wallMap[constraint.toString()] = {wall: constraint, snapLoc};
          if (Object.keys(wallMap).length === 2 || anchor) return 'fixed';
        } else if (constraint instanceof Vertex2d) {
          if (anchor || Object.keys(wallMap).length === 1) return 'fixed';
          anchor = {vertex: constraint, snapLoc};
        }
      }
      if (anchor) return anchor;
      const walls = Object.values(wallMap);
      return walls.length === 1 ? walls[0] : 'free';
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

    const backReg = /^back([0-9]{1,}|)$/;
    const rightCenterReg = /^right([0-9]{1,}|)center$/;
    const leftCenterReg = /^left([0-9]{1,}|)center$/;
    const backCenterReg = /^back([0-9]{1,}|)center$/;
    const centerReg = /^[a-z]{1,}([0-9]{1,}|)center$/;
    this.snapLocations = getSnapLocations;
    this.snapLocations.notPaired = () => getSnapLocations((loc) => loc.pairedWith() === null);
    this.snapLocations.paired = () => getSnapLocations((loc) => loc.pairedWith() !== null);
    this.snapLocations.wallPairable = () => getSnapLocations((loc) => loc.location().match(backReg));
    this.snapLocations.rightCenter = () => getSnapLocations((loc) => loc.location().match(rightCenterReg));
    this.snapLocations.leftCenter = () => getSnapLocations((loc) => loc.location().match(leftCenterReg));
    this.snapLocations.backCenter = () => getSnapLocations((loc) => loc.location().match(backCenterReg));
    this.snapLocations.center = () => getSnapLocations((loc) => loc.location().match(centerReg));
    this.snapLocations.corners = () => getSnapLocations((loc) => !loc.location().match(centerReg));
    this.snapLocations.byLocation = (name) => getSnapLocations((loc) => loc.location() === name);
    this.snapLocations.at = (vertex) => {
      for (let index = 0; index < snapLocations.length; index++)
        if (snapLocations[index].center().equals(vertex)) return snapLocations[index];
      return null;
    }
    this.snapLocations.resetCourting = () => {
      for (let index = 0; index < snapLocations.length; index++) {
        if (snapLocations[index] instanceof SnapLocation2d)
          snapLocations[index].courting(null);
      }
    }

    function nearest(locations, center, filter) {
      let closest;
      for (let sIndex = 0; sIndex < locations.length; sIndex++) {
        const snapLoc = locations[sIndex];
        const locCenter = snapLoc.center();
        if (!(filter instanceof Function) || filter(snapLoc)) {
          const dist = locCenter.distance(center);
          if (closest === undefined || closest.dist > dist) {
            closest = {snapLoc, dist};
          }
        }
      }
      return closest ? closest.snapLoc : undefined;
    }

    this.snapLocations.corners.nearest = (center, filter) => nearest(this.snapLocations.corners(), center, filter);
    this.snapLocations.nearest = (center, filter) => nearest(this.snapLocations(), center, filter);

    this.backs = () => {
      const backs = [];
      const backCenters = this.snapLocations.backCenter();
      backCenters.forEach((snapLoc) => {
        const corners = instance.object().neighbors(snapLoc.center(), -3, -1, 1, 3);
        const line = new Line2d(corners[1], corners[2]);
        backs.push(line);
        const prevLine = new Line2d(corners[0], corners[1]);
        const nextLine = new Line2d(corners[2], corners[3]);
        const lessThan10Deg = Math.mod(prevLine.radianDifference(nextLine), Math.PI) < .17;
        if (backCenters.length < 2 && !lessThan10Deg) {
          backs.push(prevLine);
          backs.push(nextLine);
        }
      });
      return backs;
    }
    this.connected = () => this.snapLocations.paired().length > 0;

    function resetVertices() {
      for (let index = 0; index < snapLocations.length; index += 1) {
        const snapLoc = snapLocations[index];
        instance.position[snapLoc.location()]();
      }
    }

    this.maxRadius = () => {
      return Math.sqrt(this.width() * this.width() + this.height()*this.height());
      // This is more accurate but expensive.
      // const center = this.center();
      // let maxDist = 0;
      // for (let index = 0; index < snapLocations.length; index++) {
      //   const loc = snapLocations[index].center();
      //   const currDist = center.distance(loc);
      //   if (currDist > maxDist) {
      //     maxDist = currDist;
      //   }
      // }
      // return maxDist;
    }

    this.minRadius = () => {
      const center = this.center();
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

    function sameRads(wall, v1, v2, v3) {
      const wallRads = wall.radians();
      return instance.withinTol(wallRads, new Line2d(v2,v3).radians()) ||
              instance.withinTol(wallRads, new Line2d(v1, v2).radians());
    }


    function nearestSnapsOnWall(center, wall) {
      const filter = (snapLoc) => wall.liesOn([snapLoc.center()], 5).length === 1;
      const objects = instance.parent().layout().activeObjects();
      const neighbors = [];
      for (let index = 0; index < objects.length; index++) {
        const snap = objects[index].snap2d.top();
        if (snap !== instance) {
          const snapLoc = snap.snapLocations.corners.nearest(center, filter);
          if (snapLoc !== undefined) {
            const dist = snapLoc.center().distance(center);
            neighbors.push({snapLoc, dist});
          }
        }
      }

      neighbors.sortByAttr('dist');
      return neighbors.map(n=>n.snapLoc);
    }

    const parrelleFilter = (line, v1) => (v2) => line.isParrelle(new Line2d(v1, v2));

    function neighborSnap(center, wall, theta) {
      if (!instance.withinTol(theta, 0)) return;
      const neighbors = nearestSnapsOnWall(center, wall);
      if (neighbors.length === 0) return;
      else if (neighbors.length > 1) {
        const alps = instance.AutoLocationProperties();
        const sl1 = neighbors[0];
        const sl2 = neighbors[1];
        const newSize = sl1.center().distance(sl2.center());
        const sl3 = instance.snapLocations.corners.nearest(sl1.center());
        const sl4 = instance.snapLocations.corners.nearest(sl2.center());
        if (instance.resize(sl3, sl4, newSize, alps.SIZE_ADJUST_PERCENT)) {
          const newCenter = sl3.at({center: sl1.center()});
          return {center: newCenter, wall: sl1, pairWith: sl3}
        }
      }
      const snapLoc = neighbors[0];
      const pairWith = instance.snapLocations.corners.nearest(snapLoc.center());
      const snapDist = snapLoc.center().distance(pairWith.center());

      // console.log(neighbors.map(n => n.parent().polygon().rotate(neighbors[1].parent().radians(), null, true).toDrawString()));

      // TODO: wall and pairWith should have more appropriate names should return an array of pair sets
      if (snapDist < 10) {
        const pairCenter = pairWith.at({center: snapLoc.center()});
        const snapCenter = snapLoc.at({center: snapLoc.center()});

        const corners = snapLoc.parent().object().neighbors(snapLoc.center(), -2, 2);
        const otherCorner = corners.filter(parrelleFilter(wall, snapLoc.center()))[0];
        const otherSnap = snapLoc.parent().snapLocations.at(otherCorner);
        const otherCenter = otherSnap.at({center: snapLoc.center()});
        const otherPairCenter = pairWith.at({center: otherSnap.center()});

        if (snapCenter.distance(pairCenter) > instance.width()*.4)
          return {center: pairCenter, wall: snapLoc, pairWith}
        return {center: otherPairCenter, wall: otherSnap, pairWith}
      }
    }

    function findBestWallSnapLoc(center, wall, wallPairables, theta) {
      let best;
      const currentCenter = instance.parent().center();
      for (let index = 0; index < wallPairables.length; index++) {
        const snapLoc = wallPairables[index];
        const neighbors = instance.object().neighbors(snapLoc.center(), -1, 1);
        const centerVertex = snapLoc.at({center, theta});
        const moveIsWithin = layout.within(centerVertex);
        if (moveIsWithin) {
          const dist = centerVertex.distance(currentCenter);
          if (best === undefined || best.dist > dist) {
            const nSnap = neighborSnap(center, wall, theta);
            if (nSnap) return nSnap;
            best = {center: centerVertex, theta, wall, pairWith: snapLoc};
          }
        }
      }
      return best;
    }

    function findWallSnapLocation(center) {
      const alps = instance.AutoLocationProperties();
      if (!alps.WALLS) return;
      const centerWithin = layout.within(center);
      let wallObj;
      layout.walls().forEach((wall) => {
        const point = wall.closestPointOnLine(center, true);
        if (point) {
          const wallDist = point.distance(center);
          const force = alps.LAYOUT_INTERIOR_ONLY && !centerWithin;
          const isCloser = (force || wallDist < instance.tolerance()*200) &&
                          (wallObj === undefined || wallObj.distance > wallDist);
          if (isCloser) {
            wallObj = {point, distance: wallDist, wall};
          }
        }
      });
      if (wallObj) {
        const wall = wallObj.wall;
        const point = wallObj.point;
        let wallPairables = instance.snapLocations.wallPairable();
        let theta = 0;
        if (alps.FIXED_ANGLE) {
          return findBestWallSnapLoc(point, wall, wallPairables, 0);
        } else if (alps.MATCH_WALL_ANGLE) {
          const backLine = instance.backs().sort((a,b) => wall.distance(a.midpoint()) - wall.distance(b.midpoint()))[0];
          wallPairables = [instance.snapLocations.at(backLine.midpoint())];
          theta = wall.radians() - backLine.radians();
        }
        return findBestWallSnapLoc(point, wall, wallPairables, theta) ||
                    findBestWallSnapLoc(point, wall, wallPairables, theta + Math.PI);
      }
    }

    const neighborSelectFunc = (cursorCenter, neighborSeperation) => (min, index) =>
      min.distance(cursorCenter);// + (index === 1 ? neighborSeperation / 2 : 0);

    function findClosestNeighbor(otherMidpoint, radians, targetMidpoint, otherLoc, cursorCenter) {
      const obj = instance.object();
      const objVerts = obj.verticesAndMidpoints();
      const targetIndex = objVerts.equalIndexOf(targetMidpoint.center());

      const newCenter = obj.point(targetIndex, {theta: radians, center: otherMidpoint.center()});
      const neighbors = tempPoly.neighbors(otherMidpoint.center(), -1, 0, 1);
      const neighborSeperation = neighbors[0].distance(neighbors[2]);
      const neighbor = neighbors.min(null, neighborSelectFunc(cursorCenter, neighborSeperation));
      const neighborIndex = tempPoly.verticesAndMidpoints().equalIndexOf(neighbor);
      const locCount = instance.snapLocations().length;

      const originalPosition = objVerts[neighborIndex + locCount % locCount];
      const targetLoc = instance.snapLocations.at(originalPosition);
      if (!targetLoc) {
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
      const otherParent = otherMidpoint.parent();
      for (let index = 0; index < snapList.length; index++) {
        const snapLoc = snapList[index];
        if (snapLoc.parent() !== otherParent) {
          try {
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
          } catch (e) {
            console.warn('dont know if/how this needs fixed');
          }
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
      const objects = parent.layout().activeObjects();
      const instObj = instance.object();
      const instCenter = instObj.center();
      let closest = null;
      for (let index = 0; index < objects.length; index++) {
        const object = objects[index];
        // TODO: these should be the same object but they are not.... its convoluted.
        if (object.id() !== parent.id()) {
          const otherSnap = object.snap2d.top();
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

    function singleBackCornerSnap(closest) {
      const lines = instance.object().lines();
      const cornerRads = closest.layout.corner.radians();
      for (let index = 1; index < lines.length + 1; index++) {
        const line1 = lines[index === 0 ? lines.length - 1 : index - 1];
        const line2 = lines[index === lines.length ? 0 : index];
        const vertex = line1.startVertex();
        // TODO: I dont know how this can work... its always positive...
        const rads = line1.radianDifference(line2);
        //(2*Math.PI + line1.radians() - line2.radians()) % (2*Math.PI);
        if (instance.withinTol(Math.abs(rads), Math.abs(cornerRads))) {
          const snapLoc = instance.snapLocations.at(vertex);
          const newCenter = snapLoc.at({center: closest.layout.corner})
          const moveIsWithin = layout.within(newCenter);
          if (moveIsWithin) {
            closest.object = {snapLoc, center: newCenter};
          }
        }
      }
      return closest.object;
    }

    function orientCornerLines(line1, line2, objLines) {
      line1 = line1.copy();
      line2 = line2.copy();
      const list = [line1, line2];
      const intersection = line1.findIntersection(line2);

      const startDist1 = line1.startVertex().distance(intersection);
      const endDist1 = line1.endVertex().distance(intersection);
      const endVert1 = startDist1 > endDist1 ? line1.startVertex() : line1.endVertex();
      line1 = new Line2d(intersection, endVert1.copy());

      const startDist2 = line2.startVertex().distance(intersection);
      const endDist2 = line2.endVertex().distance(intersection);
      const endVert2 = startDist2 > endDist2 ? line2.startVertex() : line2.endVertex();
      line2 = new Line2d(intersection, endVert2.copy());
      list.push(line1);list.push(line2);

      return {line1, line2, intersection};
    }

    function multiBackCornerSnap(closest,backs) {
      const corner = closest.layout.corner;
      const cornerRads = Math.abs(corner.radians());
      const cornerLinesTar = orientCornerLines(corner.prevWall(), corner.nextWall());
      const prevWall = cornerLinesTar.line1;
      const nextWall = cornerLinesTar.line2;
      for (let index = 0; index < backs.length; index++) {
        for (let jIndex = index+1; jIndex < backs.length; jIndex++) {
          const cornerLines = orientCornerLines(backs[index], backs[jIndex], true);
          const line1 =  cornerLines.line1;
          const line2 = cornerLines.line2;
          const rads = line1.radianDifference(line2);
          if (instance.withinTol(Math.abs(rads), Math.abs(cornerRads))) {
            const intersection = cornerLines.intersection;

            const radDiff2 = line2.radianDifference(prevWall);
            const radDiff1 = line1.radianDifference(nextWall);
            let theta = -1 * (line1.radians() - nextWall.radians());
            if (!Math.modTolerance(radDiff1, radDiff2, 2*Math.PI, instance.tolerance())) {
              theta = -1*(line1.radians() - prevWall.radians());
            }

            const moveTo = {center: closest.layout.corner.copy(), theta};
            const newCenter = instance.object().relativeToExternalVertex(intersection, moveTo);
            const moveIsWithin = layout.within(newCenter);
            const dist = newCenter.distance(moveTo.center);
            if (moveIsWithin && (!closest.object || dist < closest.object.dist)) {
              closest.object = {center: newCenter, dist, theta};
            }
          }
        }
      }
      return closest.object;
    }

    function findCornerSnapLocation(center) {
      const alps = instance.AutoLocationProperties();
      if (alps.CORNERS) {
        const corners = layout.vertices();
        let closest = {};
        for (let index = 0; index < corners.length; index++) {
          const corner = corners[index];
          const dist = center.distance(corner);
          if (closest.layout === undefined || dist < closest.layout.dist) {
            closest.layout = {corner, dist};
          }
        }
        if (closest.layout.dist < instance.tolerance() * 200) {
          const backs = instance.backs();
          if (backs.length === 1) {
            return singleBackCornerSnap(closest);
          } else {
            return multiBackCornerSnap(closest, backs);
          }
        }
      }
    }

    function findObjectSnapLocation(center) {
      const alps = instance.AutoLocationProperties();
      if (!alps.SNAPS) return;
      const start = new Date().getTime();
      const closestOtherLoc = findClosestSnapLoc(center);
      if (closestOtherLoc === null) return;
      let snapList, midpointOffset;
      if (alps.FIXED_ANGLE) {
        snapList = instance.snapLocations();
      } else if (closestOtherLoc.isLeft) {
        if (!closestOtherLoc.isCenter) midpointOffset = 1;
        snapList = instance.snapLocations.rightCenter();
      } else if (closestOtherLoc.isRight) {
        if (!closestOtherLoc.isCenter) midpointOffset = -1;
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

    let lastValidMove;
    this.makeMove = (position, force) => {
      this.snapLocations.resetCourting();
      this.parent().center(position.center);
      if (position.theta !== undefined) instance.rotate(position.theta);
      if (!force) {
        let validMove = true;
        if (!validMove) {
          if (lastValidMove) {
            console.log('Invalid Move');
            return this.makeMove(lastValidMove, true); // No move was made return undefined
          }
        } else lastValidMove = position;
        lastValidMove = position;
      }
    }

    function clearIdentifiedConstraints() {
      Snap2d.identifiedConstraints = null;
    }
    this.clearIdentifiedConstraints = clearIdentifiedConstraints;

    this.move = (center) => {
      clearIdentifiedConstraints.subtle(2000);
      let constraint = this.constraint();
      if (constraint.wall) {
        const snapCenter = constraint.wall.closestPointOnLine(center, true) ||
          constraint.wall.closestVertex(center);
        const vertCenter = constraint.snapLoc.at({center: snapCenter});
        return this.moveConnected(vertCenter);
      } else if (constraint.vertex) {
        console.log('vertex constraint');
        return;
      } else if (constraint === 'fixed') {
        Snap2d.identifiedConstraints = this.constraints();
        return;
      }
      const pairedSnapLocs = this.snapLocations.paired();
      let closest = {};
      const keepInBounds = this.AutoLocationProperties().LAYOUT_INTERIOR_ONLY;
      const runData = {start: new Date().getTime()};
      const cornerSnapLoc = findCornerSnapLocation(center);
      const wallSnapLocation = !cornerSnapLoc && findWallSnapLocation(center);
      runData.wall = new Date().getTime();
      if (cornerSnapLoc) {
        this.makeMove(cornerSnapLoc);
      } else if (wallSnapLocation !== undefined) {
        this.makeMove(wallSnapLocation);
        wallSnapLocation.pairWith.courting(wallSnapLocation.wall);
        this.moveConnected(null, wallSnapLocation.theta, true);
      } else if (!keepInBounds || layout.within(center)) {
        if (this.connected()) {
          this.moveConnected(center);
        } else {
          this.makeMove({center});
          runData.move = new Date().getTime();
          findObjectSnapLocation(center);
          runData.object = new Date().getTime();
        }
      }
    }

    function moveConnectedObjects(moveId, theta) {
      const pairedLocs = instance.snapLocations.paired();
      for (let index = 0; index < pairedLocs.length; index += 1) {
        const loc = pairedLocs[index];
        const paired = loc.pairedWith();
        if (paired instanceof SnapLocation2d) {
          const tarVertexLoc = paired.at({center: loc.center()});
          paired.parent().moveConnected(tarVertexLoc, theta, moveId);
        }
      }
    }

    let moveCounter = 0;
    let lastMove;
    this.moveConnected = (center, theta, moveId) => {
      const alreadyMoved = moveId === false;
      moveId ||= moveCounter++;
      if (moveId === lastMove) return;
      lastMove = moveId;
      if (!alreadyMoved) {
        if (theta) instance.rotate(theta, moveId);
        if (center) instance.makeMove({center});
      }
      moveConnectedObjects(moveId, theta);
    }

    this.getTextInfo = () => {
      return {
        text: instance.parent().name() || '????',
        center: instance.center(),
        size: instance.height() / 4,
        maxWidth: instance.width(),
        limit: 10
      }};

    const snapPairDemMap = {};
    const pairId = (sl1, sl2) => [sl1.location(), sl2.location()].sort().join('->');
    function setPairId(sl1, sl2, width, height) {
      const id = pairId(sl1, sl2);
      if (snapPairDemMap[id]) return;
      const dist = sl1.center().distance(sl2.center());
      if (realClose(dist, width)) snapPairDemMap[id] = 'width';
      else if (realClose(dist, height)) snapPairDemMap[id] = 'height';
    }

    // used to map snap locations to width/height based on size correlation
    function mapPairs() {
      const corners = instance.snapLocations.corners();
      const width = instance.width();
      const height = instance.height();
      if (instance.withinTol(width, height)) return;
      for (let i = 0; i < corners.length; i++) {
          const sl1 = corners[i];
          const neighborCorners = sl1.neighbors(-2, 2);
          setPairId(sl1, neighborCorners[0], width, height);
          setPairId(sl1, neighborCorners[1], width, height);
      }
    }

    this.resize = (snapLoc1, snapLoc2, newSize, percentChangeAllowed) => {
      if (percentChangeAllowed <= 0) return;
      let id = pairId(snapLoc1, snapLoc2);
      if (snapPairDemMap[id] === undefined) mapPairs();
      if (snapPairDemMap[id] === undefined) return;
      const size = this[snapPairDemMap[id]]();
      const change = size * (percentChangeAllowed / 100);
      if (size - change < newSize && size + change > newSize) {
        return this[snapPairDemMap[id]](newSize);
      }
    }
  }
}

Snap2d.get = {};
Snap2d.registar = (clazz) => {
  const instance = new clazz();
  if (instance instanceof Snap2d) {
    const name = clazz.prototype.constructor.name.replace(/^Snap/, '').toCamel();
    if (Snap2d.get[name] === undefined)
      Snap2d.get[name] = (parent) => new clazz(parent);
    else throw new Error(`Double registering Snap2d: ${name}`);
  }
}

Snap2d.identfied = (snapLoc) => Snap2d.identifiedConstraints &&
        Snap2d.identifiedConstraints.indexOf(snapLoc) !== -1;

Snap2d.fromJson = (json) => {
  const layout = Layout2d.get(json.layoutId);
  const object = Object.fromJson(json.object);
  const snapObj = new Snap2d(layout, object);
  snapObj.id(json.id);
  return snapObj;
}

new Snap2d();

module.exports = Snap2d;
