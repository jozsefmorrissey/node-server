
const Vertex3D = require('../../../../app-src/three-d/objects/vertex');
const Vector3D = require('../../../../app-src/three-d/objects/vector');
const Line3D = require('../../../../app-src/three-d/objects/line');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon');
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon');
const CabinetUtil = require('./cabinet');

const so = 3*2.54;

class OpeningToeKickUtil {
  constructor(openTk, modelInfo) {
    let toeKick;
    let vOid;
    let offsetToeKickPoly;
    let supports;
    let supportPanels = [];
    let opening = openTk.opening();
    let tkbNormals;

    const children = {}

    function toBiPolygon(name, index) {
      return () => children[name];
    }

    function toModel(name, index) {
      return (joints) => {
        const biPoly = children[name];
        return biPoly.toModel(joints);
      }
    }

    this.Backer = {
      model: toModel('toeKick'),
      biPolygon: toBiPolygon('toeKick'),
      normals: tkbNormals
    }
    this.Cutter = {
      model: toModel('vOid'),
      biPolygon: toBiPolygon('vOid')
    }


    function corners(side, openingCenter, targetCorner, innerPoly, height, depth1, depth2) {
      const sideBiPolyArr = modelInfo.modelInfo.biPolygonArray[side.id];
      const biPoly = new BiPolygon(sideBiPolyArr[0], sideBiPolyArr[1]);
      const poly = biPoly.furthestOrder(openingCenter)[1];
      let front = Line3D.centerClosestTo(openingCenter, poly.lines()).polarize(targetCorner);
      const withoutUp = poly.lines().filter(l => !l.equals(front));
      let longBottom = Line3D.endpointClosestTo(targetCorner, withoutUp).polarize(targetCorner);

      let innerFront = Line3D.centerClosestTo(openingCenter, innerPoly.lines()).clone().polarize(targetCorner);

      let newStart = innerPoly.toPlane().intersection.line(longBottom);

      longBottom.startVertex = newStart;
      const shortBottom = longBottom.clone();

      const targetFront = Line3D.fromVector(innerFront.vector().unit().scale(height), newStart);
      shortBottom.length(depth1, true);
      const shortVector = shortBottom.vector();
      const shortTop = Line3D.fromVector(shortVector, targetFront.endVertex);

      if (depth2) {
        longBottom.length(depth2, true);
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
      const cabinet = openTk.find('c');
      const autoToeKick = openTk.parentAssembly();
      const leftInOut = autoToeKick.leftEndStyle ? 'inner' : 'outer';
      const rightInOut = autoToeKick.rightEndStyle ? 'inner' : 'outer';
      const toPoly = (intObjTop, intObjBottom) => {
        const vert1 = intObjTop.positive[rightInOut].intersection;
        const vert2 = intObjTop.negitive[leftInOut].intersection;
        const vert3 = intObjBottom.positive[leftInOut].intersection;
        const vert4 = intObjBottom.negitive[rightInOut].intersection;
        return new Polygon3D([vert1, vert2, vert3, vert4]);
      }

      const faces = tkBiPoly.closestOrder(tkSpacePoly.center());
      const cabinetUtil = new CabinetUtil(cabinet, modelInfo);
      const topInner = cabinetUtil.planeIntersection(faces[0].lines()[0]);
      const bottomInner = cabinetUtil.planeIntersection(faces[0].lines()[2]);
      const topOuter = cabinetUtil.planeIntersection(faces[1].lines()[0]);
      const bottomOuter = cabinetUtil.planeIntersection(faces[1].lines()[2]);

      const buttToePoly2 = toPoly(topInner, bottomInner);
      const buttToePoly1 = toPoly(topOuter, bottomOuter);
      toeKick = new BiPolygon(buttToePoly1, buttToePoly2);
      tkbNormals = {
        x: faces[0].lines()[3].vector().unit(),
        y: faces[0].lines()[0].vector().unit(),
        z: buttToePoly2.normal()
      };
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
    //
    // function sidePoly(assem, targetPoint, trendSetter) {
    //   const side = assem.toBiPolygon().closestOrder(targetPoint)[0];
    //   const verts = side.vertices();
    //   const closestPoint = Vertex3D.nearest(verts, targetPoint);
    //   let vects;
    //   for (let index = 0; index < verts.length; index += 1) {
    //     const vert = verts[index];
    //     if (vert.equals(closestPoint)) {
    //       const next = verts[(index + 1) % verts.length];
    //       const prev = verts[(index + verts.length - 1) % verts.length];
    //       vects = [new Line3D(vert, next).vector().unit(), new Line3D(vert, prev).vector().unit()];
    //       if (Vector3D.mostInLine(vects, trendSetter).equals(vects[1])) vects.reverse();
    //       break;
    //     }
    //   }
    //   const depthVector = vects[0];
    //   const heightVector = vects[1];
    //   const tkw = cabinet.eval('tkbw');
    //   const tkh = cabinet.eval('tkh');
    //   const tkd = cabinet.eval('tkd');
    //   const point1 = closestPoint.translate(heightVector.scale(tkh), true)
    //                               .translate(depthVector.scale(tkw + tkd));
    //   const point2 = point1.translate(depthVector.scale(so), true);
    //   const point3 = point1.translate(heightVector.inverse().scale(so), true);
    //   const triangle = new Polygon3D([point1, point2, point3]);
    //   return BiPolygon.fromPolygon(triangle, so/2);
    // }
    //
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

    function build() {
      const right = opening.right();
      const left = opening.left();
      const coords = opening.coordinates;
      const innerPoly = opening.coordinates.inner.object();
      const center = innerPoly.center();

      const propConfig = modelInfo.propertyConfig;
      const tkh = propConfig.Cabinet.tkh;//cabinet.value('tkh');
      const sdepth = propConfig.Cabinet.tkd;//cabinet.value('tkd');
      const cabinet = openTk.find('c');
      const dem = cabinet.position.current.demension;
      const xyOffset = {x: dem.x + dem.z + dem.y, y: 0};
      vOid = buildOffset(right, left, center, coords, innerPoly, tkh, sdepth, -10000, xyOffset);
      children.vOid = vOid;

      const tkd1 = sdepth;
      const tkd2 = tkd1 + propConfig.Cabinet.tkbw;
      const bottomThickness = cabinet.find.down('B').position.current.demension.z;
      const tkah = tkh + bottomThickness/2;
      offsetToeKickPoly = buildOffset(right, left, center, coords, innerPoly, tkah, tkd1, tkd2);

      return buildToeKick(offsetToeKickPoly, vOid);
    }
    build();
  }
}

const built = {};
OpeningToeKickUtil.instance = (openTk, modelInfo) => {
  if (built[openTk.id] === undefined) {
    built[openTk.id] = new OpeningToeKickUtil(openTk, modelInfo);
  }
  return built[openTk.id];
}

module.exports = OpeningToeKickUtil;
