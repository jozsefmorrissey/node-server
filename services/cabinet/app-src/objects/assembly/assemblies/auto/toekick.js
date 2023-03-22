
const Assembly = require('../../assembly');
const Vertex3D = require('../../../../three-d/objects/vertex');
const Line3D = require('../../../../three-d/objects/line');
const Polygon3D = require('../../../../three-d/objects/polygon');
const BiPolygon = require('../../../../three-d/objects/bi-polygon');
const Butt = require('../../../joint/joints/butt.js');

class AutoToekick extends Assembly {
  constructor(cabinet) {
    super('AUTOTK', 'AutoToeKick');

    Object.getSet(this, {rightEndStyle: false, leftEndStyle: true});
    const instance = this;
    let lastSize = new Vertex3D();
    let toeKick;
    let vOid;
    let leftBlock;
    let rightBlock;
    let offsetToeKickPoly;

    this.update = () => {
      if (!lastSize.equals(cabinet.position().demension())) {
        try{
          updateStuff();
        } catch (e) {
          console.error('AutoToeKick: update exception');
          console.error(e);
        }
        lastSize = new Vertex3D(cabinet.position().demension());
      }
    }

    function corners(side, openingCenter, targetCorner, innerPoly, height, depth1, depth2) {
      const biPoly = side.position().toBiPolygon();
      const poly = biPoly.furthestOrder(openingCenter)[1];
      let front = Line3D.centerClosestTo(openingCenter, poly.lines()).polarize(targetCorner);
      const withoutUp = poly.lines().filter(l => !l.equals(front));
      let longBottom = Line3D.endpointClosestTo(targetCorner, withoutUp).polarize(targetCorner);

      let innerFront = Line3D.centerClosestTo(openingCenter, innerPoly.lines()).clone().polarize(targetCorner);

      let newStart = innerPoly.toPlane().intersection.line(longBottom);

      longBottom.startVertex = newStart;
      const shortBottom = longBottom.clone();

      const targetFront = Line3D.fromVector(innerFront.vector().unit().scale(height), newStart);
      shortBottom.adjustLength(depth1, true);
      const shortVector = shortBottom.vector();
      const shortTop = Line3D.fromVector(shortVector, targetFront.endVertex);

      if (depth2) {
        longBottom.adjustLength(depth2, true);
        const longVector = longBottom.vector();
        const longTop = Line3D.fromVector(longVector, targetFront.endVertex);
        return [shortTop.endVertex, longTop.endVertex,
              longBottom.endVertex, shortBottom.endVertex];
      }
      return [targetFront.endVertex, shortTop.endVertex,
              shortBottom.endVertex, newStart];
    }

    function buildOffset(right, left, openingCenter, coords, innerPoly, height, depth1, depth2, xyOffset) {
      const rightLines = corners(right, openingCenter, coords.inner[2], innerPoly, height, depth1, depth2);
      const leftLines = corners(left, openingCenter, coords.inner[3], innerPoly, height, depth1, depth2);
      const leftPoly = new Polygon3D(leftLines);
      const rightPoly = new Polygon3D(rightLines);

      const leftLine = innerPoly.lines()[3];
      const rightLine = innerPoly.lines()[1].negitive();
      const bottomPlane = new Polygon3D([rightLines[2], rightLines[3], leftLines[2], leftLines[3]]).toPlane();
      const leftStart = bottomPlane.intersection.line(leftLine);
      const rightStart = bottomPlane.intersection.line(rightLine);
      const leftTkLine = Line3D.fromVector(leftLine.vector().unit().scale(height), leftStart);
      const rightTkLine = Line3D.fromVector(rightLine.vector().unit().scale(height), rightStart);
      const tkSpacePoly = new Polygon3D([leftTkLine.endVertex, rightTkLine.endVertex, rightTkLine.startVertex, leftTkLine.startVertex]);
      return BiPolygon.fromPolygon(tkSpacePoly, depth1, depth2, xyOffset);
    }

    function buildToeKick(tkBiPoly, tkSpacePoly) {
      const leftInOut = instance.leftEndStyle() ? 'inner' : 'outer';
      const rightInOut = instance.rightEndStyle() ? 'inner' : 'outer';
      const toPoly = (intObjTop, intObjBottom) => {
        const vert1 = intObjTop.positive[rightInOut].intersection;
        const vert2 = intObjTop.negitive[leftInOut].intersection;
        const vert3 = intObjBottom.positive[leftInOut].intersection;
        const vert4 = intObjBottom.negitive[rightInOut].intersection;
        return new Polygon3D([vert1, vert2, vert3, vert4]);
      }

      const faces = tkBiPoly.closestOrder(tkSpacePoly.center());
      const topInner = cabinet.planeIntersection(faces[0].lines()[0]);
      const bottomInner = cabinet.planeIntersection(faces[0].lines()[2]);
      const topOuter = cabinet.planeIntersection(faces[1].lines()[0]);
      const bottomOuter = cabinet.planeIntersection(faces[1].lines()[2]);

      const buttToePoly2 = toPoly(topInner, bottomInner);
      const buttToePoly1 = toPoly(topOuter, bottomOuter);
      toeKick = new BiPolygon(buttToePoly1, buttToePoly2);
    }

    function buildSupports() {
      const normal = toeKick.normal();
      const back = toeKick.back();
      const topLine = back.lines()[0];
      const length = topLine.length;
      const supportCount = Math.ceil(length / 24 * 2.54);

      const vFront = vOid.front().vertices();
      const vBack = vOid.back().vertices();
      const vert1 = vFront[3]
      const triangle = new Polygon3D([vFront[0], vBack[0], vFront[3]]);
      const support = BiPolygon.fromPolygon(triangle, 3 * 2.54 / 4);
      return support;
    }

    function openingToeKick(opening) {
      const right = opening.right();
      const left = opening.left();
      const coords = opening.coordinates();
      const center = Vertex3D.center(coords.inner);
      const innerPoly = new Polygon3D(coords.inner);

      const tkh = cabinet.value('tkh');
      const sdepth = cabinet.value('tkd');
      const dem = cabinet.position().demension();
      const xyOffset = {x: dem.x + dem.z + dem.y, y: 0};
      vOid = buildOffset(right, left, center, coords, innerPoly, tkh, sdepth, null, xyOffset);

      const tkd1 = sdepth;
      const tkd2 = tkd1 + cabinet.value('tkbw');
      offsetToeKickPoly = buildOffset(right, left, center, coords, innerPoly, tkh, tkd1, tkd2);

      buildToeKick(offsetToeKickPoly, vOid);
      // return buildSupports();

      return toeKick;
    }

    this.toBiPolygon = () => {
      const openings = cabinet.openings;
      let opening;
      if (openings.length > 1) throw new Error('Not yet implemented for multiple openings...');
      for (let index = 0; index < openings.length; index++) {
        opening = openingToeKick(openings[index]);
      }
      return opening;
    }

    const joint = (otherPartCode) => new Butt(this.partCode(), otherPartCode);
    this.addJoints(joint('R'), joint('B'), joint('L'));
    this.toModel = () => this.toBiPolygon().toModel();
  }
}

module.exports = AutoToekick;
