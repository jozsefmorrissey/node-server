
const Vertex2d = require('vertex');
const SnapLocation2d = require('snap-location');

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

    this.toString = () => `SNAP (${tolerance}):${object}`
    this.position = {};
    this.id = () => id;
    this.parent = () => parent;
    this.radians = object.radians;
    this.angle = object.angle;
    this.x = object.x;
    this.y = object.y;
    this.height = object.height;
    this.width = object.width;
    this.onChange = object.onChange;

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
    function getSnapLocations(paired) {
      if (paired === undefined) return snapLocations;
      const locs = [];
      for (let index = 0; index < snapLocations.length; index += 1) {
        const loc = snapLocations[index];
        if (paired) {
          if (loc.pairedWith() !== null) locs.push(loc);
        } else if (loc.pairedWith() === null) locs.push(loc);
      }
      return locs;
    }

    this.snapLocations = getSnapLocations;
    this.snapLocations.notPaired = () => getSnapLocations(false);
    this.snapLocations.paired = () => getSnapLocations(true);
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
        const perpLine = wall.perpendicular(undefined, 10);
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
          const isCloser = (!centerWithin || wallDist < tolerance) &&
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
        const theta = wall.radians();
        let position = {center, theta};

        const backCenter = instance.position.backCenter({center, theta});
        const backLeftCenter = instance.position.backLeft({center: wall.startVertex(), theta});
        if (backCenter.distance(backLeftCenter) < object.maxDem() / 2) return instance.makeMove({center: backLeftCenter, theta});
        const backRightCenter = instance.position.backRight({center: wall.endVertex(), theta})
        if (backCenter.distance(backRightCenter) < object.maxDem() / 2) return instance.makeMove({center: backRightCenter,theta});

        return {center: backCenter, theta, wall};
      }
    }

    function findObjectSnapLocation (center) {
      let snapObj;
      SnapLocation2d.active().forEach((snapLoc) => {
        const targetSnapLoc = instance.position[snapLoc.targetVertex()]();
        if (snapLoc.isConnected(instance) ||
            snapLoc.pairedWith() !== null || targetSnapLoc.pairedWith() !== null) return;
        const vertDist = snapLoc.vertex().distance(center);
        const vertCloser = (snapObj === undefined && vertDist < tolerance) ||
        (snapObj !== undefined && snapObj.distance > vertDist);
        if (vertCloser) snapObj = {snapLoc: snapLoc, distance: vertDist, targetSnapLoc};
      });
      if (snapObj) {
        const snapLoc = snapObj.snapLoc;
        let theta = snapLoc.parent().radians();
        const center = snapLoc.vertex();
        const funcName = snapLoc.targetVertex();
        if (funcName === 'backCenter') theta = (theta + Math.PI) % (2 * Math.PI);
        lastPotentalPair = [snapLoc, snapObj.targetSnapLoc];
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
      lastPotentalPair && lastPotentalPair[0].pairWith(lastPotentalPair[1])
      lastPotentalPair = null;
    };
    this.makeMove = (position) => {
      object.move(position);
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
            const theta = approximate(((snapInfo.theta + 2 * Math.PI) - this.object().radians()) % (2*Math.PI));
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
      } else if (!centerWithin && (wallSnapLocation instanceof Object)) {
        const move = this.makeMove(wallSnapLocation);
        lastPotentalPair = [backCenter, wallSnapLocation.wall];
        return move;
      } else if (centerWithin) {
        return this.makeMove({center});
      }
    };
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
