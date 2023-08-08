
const Assembly = require('../../assembly');
const PanelModel = require('../panel').Model;
const CutterModel = require('../cutter').Model;
const Vertex3D = require('../../../../three-d/objects/vertex');
const Vector3D = require('../../../../three-d/objects/vector');
const Line3D = require('../../../../three-d/objects/line');
const Polygon3D = require('../../../../three-d/objects/polygon');
const BiPolygon = require('../../../../three-d/objects/bi-polygon');
const Butt = require('../../../joint/joints/butt.js');

const so = 3*2.54;

const tkCounters = {};
const getId = (cab) => {
  if (tkCounters[cab.id()] === undefined) tkCounters[cab.id()] = 0;
  return tkCounters[cab.id()]++;
}

class AutoToekick extends Assembly {
  constructor(cabinet) {
    const id = getId(cabinet);
    const atkid = `AutoToeKick${id}`;
    super(`AUTOTK`, atkid);

    Object.getSet(this, {rightEndStyle: false, leftEndStyle: false});
    const instance = this;
    let toeKick;
    let vOid;
    let offsetToeKickPoly;
    let supports;
    let supportPanels = [];

    const children = {}

    function toModel(name, index) {
      return () => {
        instance.update();
        const assem = children[name];
        return assem.toModel();
      }
    }

    const joint = (part) => (otherPartCode, condition) =>
      part.addJoints(new Butt(part.partCode(), otherPartCode, condition));
    const toeKickPanel = new PanelModel('tkb', `${atkid}.Backer`, toModel('toeKick'));
    joint(toeKickPanel)('R');
    joint(toeKickPanel)('B');
    joint(toeKickPanel)('L');
    const cutter = new CutterModel('tkc', `${atkid}.Cutter`, toModel('vOid'));
    joint(cutter)('R', () => !this.rightEndStyle());
    joint(cutter)('L', () => !this.leftEndStyle());
    const assems = [toeKickPanel, cutter];

    // function updateSupports() {
    //   supportPanels = [];
    //   for (let index = 0; supports && index < supports.length; index++) {
    //     const panel = new PanelModel('tks', `${atkid}.ToeKickCutter`, toModel('supports', index));
    //     supportPanels.push(panel);
    //   }
    //   return supportPanels;
    // }

    this.part = () => false;
    this.children = () => this.getSubassemblies();
    this.getSubassemblies = () => assems;

    let lastState;
    this.update = () => {
      const currState = cabinet.modificationState();
      if (currState !== lastState) {
        try{
          lastState = currState;
          this.toBiPolygon();
        } catch (e) {
          console.error('AutoToeKick: update exception');
          console.error(e);
        }
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
      children.toeKick = toeKick;
    }

    // function addExtraSupports(supports) {
    //   const back = toeKick.back();
    //   const topLine = back.lines()[0];
    //   const length = topLine.length();
    //   const supportCount = Math.ceil(length / (5 * 2.54)) - 2;
    //   if (supportCount < 1) return;
    //
    //   const offsetLength = length/(supportCount + 1);
    //   const backVect = toeKick.normal();
    //   const downVect = toeKick.front().lines()[1].vector().unit();
    //   const half34 = so/8;
    //   const getSupport = (at) => {
    //     const point2 = at.translate(backVect.scale(so), true);
    //     const point3 = at.translate(downVect.scale(so), true);
    //     const triangle = new Polygon3D([at, point2, point3]);
    //     return BiPolygon.fromPolygon(triangle, half34, -half34);
    //   }
    //
    //
    //   for (let index = 0; index < supportCount; index++) {
    //     const dist = offsetLength * (index + 1);
    //     const point = topLine.fromStart(dist);
    //     supports.push(getSupport(point));
    //   }
    // }

    function sidePoly(assem, targetPoint, trendSetter) {
      const side = assem.toBiPolygon().closestOrder(targetPoint)[0];
      const verts = side.vertices();
      const closestPoint = Vertex3D.nearest(verts, targetPoint);
      let vects;
      for (let index = 0; index < verts.length; index += 1) {
        const vert = verts[index];
        if (vert.equals(closestPoint)) {
          const next = verts[(index + 1) % verts.length];
          const prev = verts[(index + verts.length - 1) % verts.length];
          vects = [new Line3D(vert, next).vector().unit(), new Line3D(vert, prev).vector().unit()];
          if (Vector3D.mostInLine(vects, trendSetter).equals(vects[1])) vects.reverse();
          break;
        }
      }
      const depthVector = vects[0];
      const heightVector = vects[1];
      const tkw = cabinet.eval('tkbw');
      const tkh = cabinet.eval('tkh');
      const tkd = cabinet.eval('tkd');
      const point1 = closestPoint.translate(heightVector.scale(tkh), true)
                                  .translate(depthVector.scale(tkw + tkd));
      const point2 = point1.translate(depthVector.scale(so), true);
      const point3 = point1.translate(heightVector.inverse().scale(so), true);
      const triangle = new Polygon3D([point1, point2, point3]);
      return BiPolygon.fromPolygon(triangle, so/2);
    }

    // function buildSupports(right, left, coords) {
    //   supports = [];
    //   const center = Vertex3D.center(coords.inner);
    //   const leftBottom = coords.inner[3];
    //   const rightBottom = coords.inner[2];
    //
    //   const rightTrendSetter = toeKick.faceNormal(1);
    //   const leftTrendSetter = toeKick.faceNormal(0);
    //   supports.push(sidePoly(left, leftBottom, leftTrendSetter));
    //   addExtraSupports(supports);
    //   supports.push(sidePoly(right, rightBottom, rightTrendSetter));
    //   children.supports = supports;
    //   return supports[0];
    // }

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
      vOid = buildOffset(right, left, center, coords, innerPoly, tkh, sdepth, -10000, xyOffset);
      children.vOid = vOid;

      const tkd1 = sdepth;
      const tkd2 = tkd1 + cabinet.value('tkbw');
      const tkah = tkh + cabinet.eval('B.t')/2;
      offsetToeKickPoly = buildOffset(right, left, center, coords, innerPoly, tkah, tkd1, tkd2);

      return buildToeKick(offsetToeKickPoly, vOid);
      // return buildSupports(right, left, coords);

      // return toeKick;
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

    this.toModel = () => this.toBiPolygon().toModel();
  }
}

module.exports = AutoToekick;
