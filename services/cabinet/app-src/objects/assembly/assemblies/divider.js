


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Cutter = require('./cutter.js');
const PanelModel = require('./panel').Model;
const Joint = require('../../joint/joint.js');


class Divider extends Assembly {
  constructor(partCode, partName, centerConfig, demensionConfig, rotationConfig, toModel, toBiPolygon) {
    const partId = String.random();
    partCode += '-' + partId;
    if (toModel) {
      super(partCode, partName);
      this.toModel = toModel;
      this.partName = partName;
    } else super(partCode, partName, centerConfig, demensionConfig, rotationConfig);
    const instance = this;

    Object.getSet(this, 'type');

    if (toBiPolygon) this.toBiPolygon = toBiPolygon;

    const parentGetSubAssems = this.getSubassemblies;
    this.getSubassemblies = () => {
      return parentGetSubAssems();
    }

    let isPart = true;
    this.part = () => isPart;
    const parentToJson = this.toJson;
    this.toJson = () => {
      const json = parentToJson();
      json.subassemblies = [];
      return json;
    }

    let type = Divider.Types[0];
    let cutter;
    this.type = (t) => {
      const index = Divider.Types.indexOf(t);
      if (index !== -1) {
        isPart = index === 0;
        instance.includeJoints(isPart);
        type = Divider.Types[index];
        if (index > 1 && this.parentAssembly()) {
          build();
        }
      }
      return type;
    }

    const parentHash = this.hash;
    this.hash = () => parentHash() + type.hash();

    function build(delay) {
      delay = delay ? 1 : delay * 2;
      if (instance.sectionProperties()) {
        if (builders[type]) {
          builders[type]();
        }
      } else console.warn(`SectionProperties has not been defined for object '${instance.id()}'`);
    }

    this.sectionProperties = () => {
      const parent = this.parentAssembly();
      if (parent === undefined) return;
      let secProps;
      if (parent.constructor.name === 'DividerSection') {
        secProps = parent.parentAssembly();
      } else {
        if (parent.openings.length === 0) return;
        secProps = parent.openings[0].sectionProperties();
      }
      return secProps;
    }

    function buildPolyCutter(intersected, depth, normal, append, location) {
      const biPoly = instance.toBiPolygon();
      if (biPoly.valid()) {
        intersected.scale(1000,1000);
        const poly = Polygon3D.fromIntersections(intersected, [biPoly.front(), biPoly.back()]);
        poly.scale(10, 10);
        const fromPoint = poly.center();
        const offsetVect = normal.scale(depth);

        const flip = normal.sameDirection(poly.normal());
        const copy = flip ? poly.reverse() : poly.copy();

        cutter = new Cutter.Poly(copy.translate(offsetVect), fromPoint, offsetVect);
        // if (location === 'back') {
        //   cutter.included(true);
        //   cutter.part(true);
        // }
        cutter.parentAssembly(instance);
        const partCode = `${instance.partCode()}-${location[0]}`;
        const partName = `${instance.partName()}-${location}`;
        const panel = new PanelModel(partCode, partName, instance.toModel);
        panel.parentAssembly(instance);
        panel.addJoints(new Joint(cutter.partCode(), partCode));
        // panel.addJoints(new Joint.References(instance.getJointList, partCode, instance.partCode()))

        if (!append) instance.subassemblies.deleteAll();
        instance.addSubAssembly(cutter);
        instance.addSubAssembly(panel);
      }
    }

    const builders = {
      front: (append) => {
        const secProps = instance.sectionProperties();
        const intersected = instance.sectionProperties().outerPoly();
        const normal = secProps.normal();
        buildPolyCutter(intersected, -4 * 2.54, normal, append, 'front');
      },
      back: (append) => {
        const secProps = instance.sectionProperties();
        const biPoly = secProps.back().toBiPolygon()
        const front = biPoly.front().copy();
        const back = biPoly.back().copy();
        const frontDist = front.center().distance(secProps.innerCenter());
        const backDist = back.center().distance(secProps.innerCenter());
        const intersected = backDist > frontDist ? front : back;
        intersected.reverse();
        const openNormal = secProps.normal();
        let normal = secProps.back().toBiPolygon().front().normal();
        if (openNormal.sameDirection(normal)) normal = normal.inverse();
        buildPolyCutter(intersected, -4 * 2.54, normal, append, 'back');
      },
      frontAndBack: () => builders.front() | builders.back(true),
    }

    instance.on.parentSet(() => instance.parentAssembly().on.change(build));
  }
}

Divider.Types = ['full', 'none', 'front', 'back', 'frontAndBack'];
Divider.count = 0;

Divider.abbriviation = 'dv';

Divider.fromJson = (json) => {
  const obj = Assembly.fromJson(json);
  obj.on.parentSet(() => obj.type(json.type))
  return obj;
}

module.exports = Divider
