
const Line3D = require('../three-d/objects/line.js');
const Vertex3D = require('../three-d/objects/vertex.js');
const Polygon3D = require('../three-d/objects/polygon.js');
const BiPolygon = require('../three-d/objects/bi-polygon.js');
const Cutter = require('../objects/assembly/assemblies/cutter.js');
const Panel = require('../objects/assembly/assemblies/panel.js');
const Cut = require('../objects/joint/joints/cut.js');
const Dependency = require('../objects/dependency.js');
const KeyValue = require('../../../../public/js/utils/object/key-value.js');
const SectionProperties = require('../objects/assembly/assemblies/section/section-properties.js');

class InvalidOpeningConfig extends Error {};
class InvalidSliceConfig extends InvalidOpeningConfig {};

class CabinetOpeningCorrdinates extends KeyValue {
  constructor(cabinet, sectionProperties) {
    // TODO need to remove openings from cabinet and use this class to list sectionProperies
    super({parentAttribute: 'parentAssembly'});
    const config = sectionProperties.config();
    let subassemblies = [];
    let normal = null;
    const instance = this;
    let cutter;
    this.config = () => config;
    this.partCode = () => 'COC';
    this.included = () => false;
    this.locationCode = () => cabinet.locationCode() + '_COC';
    this.parentAssembly = () => cabinet;
    this.part = () => false;
    this.partName = () => 'CabinetOpeningCorrdinates';
    sectionProperties.back();
    this.divide = sectionProperties.divide;
    this.setSection = sectionProperties.setSection;
    this.sections = () => sectionProperties.sections;
    this.vertical = sectionProperties.vertical;
    this.normal = () => {
      this.update();
      return normal || sectionProperties.normal();
    }
    this.sectionProperties = () => sectionProperties;
    this.pattern = sectionProperties.pattern;
    this.top = sectionProperties.top;
    this.bottom = sectionProperties.bottom;
    this.left = sectionProperties.left;
    this.right = sectionProperties.right;
    this.back = sectionProperties.back;
    this.cutter = () => cutter;
    this.coordinates = sectionProperties.coordinates;
    this.children = () => subassemblies;

    cabinet.addDependencies(new Dependency(/^BACK$/,/^dv$/, null, 'BACK=>dv'));

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

      const topMax = top.position().centerAdjust('y', '+z', top.thickness()/2);
      const topMin = top.position().centerAdjust('y', '-z', top.thickness()/2);
      const leftMax = left.position().centerAdjust('x', '+z', left.thickness()/2);
      const leftMin = left.position().centerAdjust('x', '-z', left.thickness()/2);
      const rightMin = right.position().centerAdjust('x', '-z', right.thickness()/2);
      const rightMax = right.position().centerAdjust('x', '+z', right.thickness()/2);
      const bottomMin = bottom.position().centerAdjust('y', '-z', bottom.thickness()/2);
      const bottomMax = bottom.position().centerAdjust('y', '+z', bottom.thickness()/2);

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

    function panelInfo(len, biPoly, center, limitPlanes, side) {
      const polys = biPoly.furthestOrder(center);
      const outerPoly = polys[0];
      const innerPoly = polys[1];
      const backOutLine = outerPoly.lines()[1];
      const backInLine = innerPoly.lines()[1];

      const topOutStart = limitPlanes.top.out.intersection.line(backOutLine);
      if (topOutStart === null)
        throw new InvalidSliceConfig(`Top and Back of ${side} are Parrelle`);
      const botOutStart = limitPlanes.bottom.out.intersection.line(backOutLine);
      if (botOutStart === null)
        throw new InvalidSliceConfig(`Bottom and Back of ${side} are Parrelle`);
      const bottomVector = outerPoly.lines()[2].vector().unit();
      const topVector = outerPoly.lines()[0].vector().unit().inverse();

      const outerTop = Line3D.fromVector(topVector.scale(len), topOutStart)[1];
      const outerBot = Line3D.fromVector(bottomVector.scale(len), botOutStart)[1];

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
      const center = Vertex3D.center(bottom.position().center(), top.position().center());
      const rightFaces = right.closestOrder(center)[0].vertices();
      const leftFaces = left.closestOrder(center)[0].vertices();
      return Vertex3D.center(rightFaces[0], rightFaces[3], leftFaces[0], leftFaces[3]);
    }

    function limitPlanes(part, center, right, left) {
      const partCenter = new Vertex3D(part.position().current().center).copy();
      const thickness = part.thickness();
      const rightNorms = right.normals();
      const leftNorms = left.normals();
      const normals = {z: rightNorms.y.bisector(leftNorms.y).unit(),
                      x: rightNorms.x.bisector(leftNorms.x).unit()};
      normals.y = normals.x.crossProduct(normals.z).unit();
      const biPoly = BiPolygon.fromVectorObject(1000, 1000, thickness, partCenter, normals);
      const faces = biPoly.closestOrder(center);
      return {in: faces[0].toPlane(), out: faces[1].toPlane()};
    }


    function sliceCoordinates(leftLen, rightLen) {
      const top = instance.top();
      const bottom = instance.bottom();
      const left = instance.left().position().toBiPolygon();
      const right = instance.right().position().toBiPolygon();
      right.orderBy.biPolygon(left);

      const center = openingCenter(top, bottom, right, left);
      const topPlanes = limitPlanes(top, center, right, left);
      const bottomPlanes = limitPlanes(bottom, center, right, left);
      const limits = {top: topPlanes, bottom: bottomPlanes};
      const lInfo = panelInfo(leftLen, left, center, limits, 'Left');
      const rInfo = panelInfo(rightLen, right, center, limits, 'Right');

      const outer = [lInfo.outer.top, rInfo.outer.top, rInfo.outer.bottom, lInfo.outer.bottom];
      const outerPlane = new Polygon3D(outer).toPlane();
      normal = outerPlane.normal();

      const topLeft = outerPlane.intersection.line(lInfo.innerLines.top);
      const topRight = outerPlane.intersection.line(rInfo.innerLines.top);
      const bottomRight = outerPlane.intersection.line(rInfo.innerLines.bottom);
      const bottomLeft = outerPlane.intersection.line(lInfo.innerLines.bottom);
      const inner = [topLeft, topRight, bottomRight, bottomLeft];

      return {inner, outer};
    }

    let error = null;
    this.error = () => error;
    this.update = () => {
      let coords;
      try {
        normal = null;
        switch (config._Type) {
          case 'location':
            coords = manualCoordinates(config.coordinates); break;
          case 'slice':
            cutter = new Cutter('aoc', 'Opening');
            cutter.allModels(true);
            cabinet.addDependencies(new Dependency(cutter, cabinet));
            cutter.parentAssembly(this);
            subassemblies = [cutter];
            coords = sliceCoordinates(cabinet.eval(config.leftDepth), cabinet.eval(config.rightDepth));
            break;
        }
        error = null;
      } catch (e) {
        error = e;
        console.warn(`Failed to determine coordinates of the specified type: '${config._Type}'`);
      }

      if (coords === undefined) coords = defaultCoordinates();

      sectionProperties.updateCoordinates(coords);
      return coords;
    }
  }
}

Object.class.register(CabinetOpeningCorrdinates, 'config', 'parentAssembly.id', 'partCode', 'locationCode');
CabinetOpeningCorrdinates.fromJson = (json) => {
  return json;
}

module.exports = CabinetOpeningCorrdinates;
