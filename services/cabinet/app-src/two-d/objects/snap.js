
const Vertex2d = require('vertex');
const SnapLocation2d = require('snap-location');

class Snap2d {
  constructor(layout, object, tolerance) {
    Object.getSet(this, {object, tolerance}, 'layoutId');
    if (layout === undefined) return;
    const instance = this;
    const id = String.random();
    let start = new Vertex2d();
    let end = new Vertex2d();

    this.toString = () => `SNAP (${tolerance}):${object}`
    this.id = () => id;
    this.layoutId = () => layout.id();
    this.radians = object.radians;
    this.angle = object.angle;
    this.x = object.x;
    this.y = object.y;
    this.height = object.height;
    this.width = object.width;
    this.onChange = object.onChange;

    const backLeft = new SnapLocation2d(this, "backLeft",  new Vertex2d(null),  'backRight', 'red');
    const backRight = new SnapLocation2d(this, "backRight",  new Vertex2d(null),  'backLeft', 'purple');
    const frontRight = new SnapLocation2d(this, "frontRight",  new Vertex2d(null),  'frontLeft', 'black');
    const frontLeft = new SnapLocation2d(this, "frontLeft",  new Vertex2d(null),  'frontRight', 'green');

    const backCenter = new SnapLocation2d(this, "backCenter",  new Vertex2d(null),  'backCenter', 'teal');
    const leftCenter = new SnapLocation2d(this, "leftCenter",  new Vertex2d(null),  'rightCenter', 'pink');
    const rightCenter = new SnapLocation2d(this, "rightCenter",  new Vertex2d(null),  'leftCenter', 'yellow');

    const snapLocations = [backCenter,leftCenter,rightCenter,backLeft,backRight,frontLeft,frontRight];
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
    this.snapLocations.rotate = backCenter.rotate;
    function resetVertices() {
      for (let index = 0; index < snapLocations.length; index += 1) {
        const snapLoc = snapLocations[index];
        instance[snapLoc.location()]();
      }
    }

    function centerMethod(snapLoc, widthMultiplier, heightMultiplier, position) {
      const vertex = snapLoc.vertex();
      // if (position === undefined && vertex.point() !== null) return vertex;
      const center = object.center();
      const rads = object.radians();
      const offsetX = object.width() * widthMultiplier * Math.cos(rads) -
                        object.height() * heightMultiplier * Math.sin(rads);
      const offsetY = object.height() * heightMultiplier * Math.cos(rads) +
                        object.width() * widthMultiplier * Math.sin(rads);

      if (position !== undefined) {
        const posCenter = new Vertex2d(position.center);
        return new Vertex2d({x: posCenter.x() + offsetX, y: posCenter.y() + offsetY});
      }
      const backLeftLocation = {x: center.x() - offsetX , y: center.y() - offsetY};
      vertex.point(backLeftLocation);
      return snapLoc;
    }

    this.frontCenter = (position) => centerMethod(frontCenter, 0, -.5, position);
    this.backCenter = (position) => centerMethod(backCenter, 0, .5, position);
    this.leftCenter = (position) => centerMethod(leftCenter, .5, 0, position);
    this.rightCenter = (position) => centerMethod(rightCenter, -.5, 0, position);

    this.backLeft = (position) => centerMethod(backLeft, .5, .5, position);
    this.backRight = (position) => centerMethod(backRight, -.5, .5, position);
    this.frontLeft = (position) =>  centerMethod(frontLeft, .5, -.5, position);
    this.frontRight = (position) => centerMethod(frontRight, -.5, -.5, position);

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

        const backCenter = instance.backCenter({center, theta});
        const backLeftCenter = instance.backLeft({center: wall.startVertex(), theta});
        if (backCenter.distance(backLeftCenter) < object.maxDem() / 2) return object.move({center: backLeftCenter, theta});
        const backRightCenter = instance.backRight({center: wall.endVertex(), theta})
        if (backCenter.distance(backRightCenter) < object.maxDem() / 2) return object.move({center: backRightCenter,theta});

        return {center: backCenter, theta};
      }
    }

    function findObjectSnapLocation (center) {
      let snapObj;
      SnapLocation2d.active().forEach((snapLoc) => {
        const targetSnapLoc = instance[snapLoc.targetVertex()]();
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
        return {snapLoc, center: instance[funcName]({center, theta}), theta};
      }
    }

    let lastPotentalPair;
    this.setLastPotentialPair = (lpp) => lastPotentalPair = lpp;
    function checkPotentialPair() {
      if (!lastPotentalPair) return;
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
          const vertexCenter = snapLoc.parent()[snapLoc.location()]().vertex();
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
        return object.move(snapLocation);
      } else if (!centerWithin && (wallSnapLocation instanceof Object)) {
        return object.move(wallSnapLocation);
      } else if (centerWithin) {
        return object.move({center});
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
