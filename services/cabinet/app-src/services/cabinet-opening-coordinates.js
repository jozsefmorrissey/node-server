
const Line3D = require('../three-d/objects/line.js');
const Vertex3D = require('../three-d/objects/vertex.js');
const Polygon3D = require('../three-d/objects/polygon.js');
const BiPolygon = require('../three-d/objects/bi-polygon.js');
const Cutter = require('../objects/assembly/assemblies/cutter.js');
const Panel = require('../objects/assembly/assemblies/panel.js');
const Butt = require('../objects/joint/joints/butt.js');
// TODO: fix required coordinate layout leftTop, rightTop, RightBottom, leftBottom
class CabinetOpeningCorrdinates {
  constructor(cabinet, sectionProperties) {
    const config = sectionProperties.config();
    let subassemblies = [];

    this.divide = sectionProperties.divide;
    this.setSection = sectionProperties.setSection;
    this.sections = sectionProperties.sections;
    this.vertical = sectionProperties.vertical;
    this.normal = sectionProperties.normal;
    this.sectionProperties = () => sectionProperties;
    this.pattern = sectionProperties.pattern;
    this.top = sectionProperties.top;
    this.bottom = sectionProperties.bottom;
    this.left = sectionProperties.left;
    this.right = sectionProperties.right;
    this.back = sectionProperties.back;
    this.coordinates = sectionProperties.coordinates;

    const origGetSub = sectionProperties.getSubassemblies;
    sectionProperties.getSubassemblies = () => {
      if (subassemblies.length)
        return origGetSub().concat(subassemblies);
      return origGetSub();
    }

    function defaultCoordinates() {
      const right = cabinet.getAssembly(config.right);
      const left = cabinet.getAssembly(config.left);
      const top = cabinet.getAssembly(config.top);
      const bottom = cabinet.getAssembly(config.bottom);

      const topMax = top.position().centerAdjust('y', '+z');
      const topMin = top.position().centerAdjust('y', '-z');
      const leftMax = left.position().centerAdjust('x', '+z');
      const leftMin = left.position().centerAdjust('x', '-z');
      const rightMin = right.position().centerAdjust('x', '-z');
      const rightMax = right.position().centerAdjust('x', '+z');
      const bottomMin = bottom.position().centerAdjust('y', '-z');
      const bottomMax = bottom.position().centerAdjust('y', '+z');

      return {
        inner: [
          {x: leftMax, y: topMin, z: 0},
          {x: rightMin, y: topMin, z: 0},
          {x: rightMin, y: bottomMax, z: 0},
          {x: leftMax, y: bottomMax, z: 0}
        ],
        outer: [
          {x: leftMin, y: topMax, z: 0},
          {x: rightMax, y: topMax, z: 0},
          {x: rightMax, y: bottomMin, z: 0},
          {x: leftMin, y: bottomMin, z: 0}
        ]
      }
    }

    function manualCoordinates(object) {
      return cabinet.evalObject(object);;
    }

    let printVerts = (verts) => '(' + leftPlane[0].vertices().join('),(') + ')';

    function backCoordinates() {
      const right = cabinet.getAssembly(config.right);
      const left = cabinet.getAssembly(config.left);
      const top = cabinet.getAssembly(config.top);
      const bottom = cabinet.getAssembly(config.bottom);
      const back = cabinet.getAssembly(config.back);
      const center = Vertex3D.center(bottom.position().center(), top.position().center());

      const biPolyLeft = left.position().toBiPolygon();
      const biPolyRight = right.position().toBiPolygon();
      const biPolyTop = top.position().toBiPolygon();
      const biPolyBottom = bottom.position().toBiPolygon();
      const leftPolys = biPolyLeft.furthestOrder(center);
      const rightPolys = biPolyRight.furthestOrder(center);
      const topPolys = biPolyTop.furthestOrder(center);
      const bottomPolys = biPolyBottom.furthestOrder(center);

      const backCenter = back.position().center();
      const outLineLeft = Line3D.centerClosestTo(backCenter, leftPolys[0].lines());
      const outLineRight = Line3D.centerClosestTo(backCenter, rightPolys[0].lines());

      const inLineLeft = Line3D.centerClosestTo(backCenter, leftPolys[1].lines());
      const inLineRight = Line3D.centerClosestTo(backCenter, rightPolys[1].lines());

      const topTopPlane = topPolys[0].toPlane();
      const bottomTopPlane = topPolys[1].toPlane();
      const bottomBottomPlane = bottomPolys[0].toPlane();
      const topBottomPlane = bottomPolys[1].toPlane();

      const topLeftOut = topTopPlane.lineIntersection(outLineLeft);
      const topRightOut = topTopPlane.lineIntersection(outLineRight);
      const bottomRightOut = bottomBottomPlane.lineIntersection(outLineRight);
      const bottomLeftOut = bottomBottomPlane.lineIntersection(outLineLeft);

      const topLeftIn = bottomTopPlane.lineIntersection(inLineLeft);
      const topRightIn = bottomTopPlane.lineIntersection(inLineRight);
      const bottomRightIn = topBottomPlane.lineIntersection(inLineRight);
      const bottomLeftIn = topBottomPlane.lineIntersection(inLineLeft);

      return {
        in: new Polygon3D([topLeftIn, topRightIn, bottomRightIn, bottomLeftIn]),
        out: new Polygon3D([topLeftOut, topRightOut, bottomRightOut, bottomLeftOut]),
        center
      }
    }

    // TODO-maybe: centerOffset was intended to enable rotation of the planes...
    function sliceCoordinates(leftLen, rightLen, centerOffset) {
      const backCoords = backCoordinates();
      const outerBackPoly = backCoords.out;
      const innerBackPoly = backCoords.in;
      const innerDirPoly = innerBackPoly.parrelleNear(backCoords.center);

      const oflpv = outerBackPoly.parrelleAt(-leftLen).vertices();
      const ofrpv = outerBackPoly.parrelleAt(-rightLen).vertices();
      const outer = [oflpv[0], ofrpv[1], ofrpv[2], oflpv[3]];
      const outerPoly = new Polygon3D([oflpv[0], ofrpv[1], ofrpv[2], oflpv[3]]);
      const outerPlane = outerPoly.toPlane();

      const ibpv = innerBackPoly.vertices();
      const idpv = innerDirPoly.vertices();
      const i0 = outerPlane.lineIntersection(new Line3D(ibpv[0], idpv[0]));
      const i1 = outerPlane.lineIntersection(new Line3D(ibpv[1], idpv[1]));
      const i2 = outerPlane.lineIntersection(new Line3D(ibpv[2], idpv[2]));
      const i3 = outerPlane.lineIntersection(new Line3D(ibpv[3], idpv[3]));

      const corner2corner = outer[0].distance(outer[2]);
      const outerOffsetPoly = outerPoly.parrelleAt(corner2corner/-2);
      const center = Vertex3D.center(...outerOffsetPoly.vertices());
      const dem = {x: corner2corner, y: corner2corner, z: corner2corner};
      const rot = {x: 0, y: 0, z: 0};
      // subassemblies = [new Panel('gerf', 'Gerf', () => center, () => dem, () => rot)];

      const biPoly = BiPolygon.fromPolygon(outerPoly, corner2corner/-2, 0, {x: corner2corner, y: corner2corner});
      const partCode = 'gerf';
      const partName = 'Gerf';
      const cutter = new Cutter.Model(partCode, () => partName, biPoly.toModel);
      subassemblies = [cutter];
      const joint = (otherPartCode) => new Butt(partCode, otherPartCode);
      cutter.addJoints(joint('T'), joint('B'), joint('R'), joint('L'));



      return {inner: [i0,i1,i2,i3], outer};
    }




    this.update = () => {
      let coords;
      try {
        switch (config._Type) {
          case 'location':
          coords = manualCoordinates(config.coordinates);
          case 'slice':
          coords = sliceCoordinates(cabinet.eval(config.leftDepth), cabinet.eval(config.rightDepth));
        }
      } catch (e) {
        console.warn(`Failed to determine coordinates of the specified type: '${config._Type}'`);
        console.warn(e);
      }

      if (coords === undefined) coords = defaultCoordinates();

      sectionProperties.updateCoordinates(coords);
      return coords;
    }
  }
}

module.exports = CabinetOpeningCorrdinates;
