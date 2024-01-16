
const Line3D = require('../three-d/objects/line.js');
const Vertex3D = require('../three-d/objects/vertex.js');
const Polygon3D = require('../three-d/objects/polygon.js');
const BiPolygon = require('../three-d/objects/bi-polygon.js');
const Cutter = require('../objects/assembly/assemblies/cutter.js');
const Panel = require('../objects/assembly/assemblies/panel.js');
const Butt = require('../objects/joint/joints/butt.js');
const KeyValue = require('../../../../public/js/utils/object/key-value.js');

class CabinetOpeningCorrdinates extends KeyValue {
  constructor(cabinet, sectionProperties) {
    // TODO need to remove openings from cabinet and use this class to list sectionProperies
    super({parentAttribute: 'parentAssembly'});
    const config = sectionProperties.config();
    let subassemblies = [];
    const instance = this;
    Object.getSet(this, 'parentAssembly', 'partCode');
    this.partCode('COC')
    this.divide = sectionProperties.divide;
    this.setSection = sectionProperties.setSection;
    this.sections = () => sectionProperties.sections;
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
    sectionProperties.getSubassemblies = (childrenOnly) => {
      if (subassemblies.length)
        return origGetSub(childrenOnly).concat(subassemblies);
      return origGetSub(childrenOnly);
    }

    function defaultCoordinates() {
      const right = instance.right();
      const left = instance.left();
      const top = instance.top();
      const bottom = instance.bottom();

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

    function panelInfo(len, biPoly, center, limitPlanes) {
      const polys = biPoly.furthestOrder(center);
      const outerPoly = polys[0];
      const innerPoly = polys[1];
      const backOutLine = outerPoly.lines()[1];
      const backInLine = innerPoly.lines()[1];

      const topOutStart = limitPlanes.top.out.intersection.line(backOutLine);
      const botOutStart = limitPlanes.bottom.out.intersection.line(backOutLine);
      const bottomVector = outerPoly.lines()[2].vector().unit();
      const topVector = outerPoly.lines()[0].vector().unit().inverse();

      const outerTop = Line3D.fromVector(topVector.scale(len), topOutStart).endVertex;
      const outerBot = Line3D.fromVector(bottomVector.scale(len), botOutStart).endVertex;

      const topInStart = limitPlanes.top.in.intersection.line(backInLine);
      const botInStart = limitPlanes.bottom.in.intersection.line(backInLine);
      const topInVect = innerPoly.lines()[0].vector();
      const botInVect = innerPoly.lines()[2].vector();
      const topInLine = Line3D.fromVector(topInVect, topInStart);
      const botInLine = Line3D.fromVector(botInVect, botInStart);

      return {
        innerLines: {top: topInLine, bottom: botInLine},
        outer: {top: outerTop, bottom: outerBot}
      };
    }

    function openingCenter(top, bottom, right, left) {
      const center = Vertex3D.center(bottom.center(), top.center());
      const rightFaces = right.closestOrder(center)[0].vertices();
      const leftFaces = left.closestOrder(center)[0].vertices();
      return Vertex3D.center(rightFaces[0], rightFaces[3], leftFaces[0], leftFaces[3]);
    }

    function limitPlanes(biPoly, center) {
      const faces = biPoly.closestOrder(center);
      return {in: faces[0].toPlane(), out: faces[1].toPlane()};
    }


    function sliceCoordinates(leftLen, rightLen) {
      const top = instance.top().toBiPolygon();
      const bottom = instance.bottom().toBiPolygon();
      const left = instance.left().toBiPolygon();
      const right = instance.right().toBiPolygon();
      right.orderBy.biPolygon(left);

      const center = openingCenter(top, bottom, right, left);
      const topPlanes = limitPlanes(top, center);
      const bottomPlanes = limitPlanes(bottom, center);
      const limits = {top: topPlanes, bottom: bottomPlanes};
      const lInfo = panelInfo(leftLen, left, center, limits);
      const rInfo = panelInfo(rightLen, right, center, limits);

      const outer = [lInfo.outer.top, rInfo.outer.top, rInfo.outer.bottom, lInfo.outer.bottom];
      const outerPlane = new Polygon3D(outer).toPlane();

      const topLeft = outerPlane.intersection.line(lInfo.innerLines.top);
      const topRight = outerPlane.intersection.line(rInfo.innerLines.top);
      const bottomRight = outerPlane.intersection.line(rInfo.innerLines.bottom);
      const bottomLeft = outerPlane.intersection.line(lInfo.innerLines.bottom);
      const inner = [topLeft, topRight, bottomRight, bottomLeft];

      addCutter(outer);
      return {inner, outer};
    }




    this.update = () => {
      let coords;
      try {
        switch (config._Type) {
          case 'location':
            coords = manualCoordinates(config.coordinates); break;
          case 'slice':
            const cutter = new Cutter.Opening('aoc', 'auto-opening-crop');
            subassemblies = [cutter];
            coords = sliceCoordinates(cabinet.eval(config.leftDepth), cabinet.eval(config.rightDepth));break;
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
