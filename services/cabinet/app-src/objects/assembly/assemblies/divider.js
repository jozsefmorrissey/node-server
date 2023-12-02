


const Assembly = require('../assembly.js');
const BiPolygon = require('../../../three-d/objects/bi-polygon.js');
const Polygon3D = require('../../../three-d/objects/polygon.js');
const Cutter = require('./cutter.js');
const Panel = require('./panel');
const PanelModel = Panel.Model;
const Joint = require('../../joint/joint.js');


class Divider extends Assembly {
  constructor(partCode, partName, config, panelModel, toBiPolygon) {
    partCode ||= 'dv';
    if (panelModel) {
      super(partCode, partName);
      this.partName = partName;
    } else{
      super(partCode, partName, config);
      panelModel = this.position().toModel;
    }
    const instance = this;

    Object.getSet(this, 'type');

    if (toBiPolygon) this.toBiPolygon = toBiPolygon;

    this.part = () => false;
    const parentToJson = this.toJson;
    this.toJson = () => {
      const json = parentToJson();
      json.subassemblies = [];
      return json;
    }

    instance.includeJoints(false);

    let type = Divider.Types[0];
    let cutter;
    this.type = (t) => {
      const index = Divider.Types.indexOf(t);
      if (index !== -1) type = Divider.Types[index];
      if (this.parentAssembly()) {
        build();
      }
      return type;
    }

    const parentHash = this.hash;
    this.hash = () => parentHash() + type.hash();

    function build() {
      if (instance.sectionProperties()) {
        if (builders[type]) {
          builders[type]();
          if (type === 'frontAndBack') {
            const front = panels[':f'];
            // cutters[':f'].part(true);
            // cutters[':f'].included(true);
            builders[type]();
          }
        }
      } else console.warn.subtle(`SectionProperties has not been defined for object '${instance.id()}'`);
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

    const panels = {};
    const cutters = {};

    function buildPolyCutter(intersected, depth, normal, append, location) {
      const biPoly = instance.toBiPolygon();
      if (biPoly.valid()) {
        intersected.scale(10000,10000);
        const poly = Polygon3D.fromIntersections(intersected, [biPoly.front(), biPoly.back()]);
        poly.scale(10, 10);
        const offsetVect = normal.scale(depth);

        const flip = normal.sameDirection(poly.normal());
        const copy = flip ? poly.reverse() : poly.copy();
        const translated = copy.translate(offsetVect);
        // cutter.part(true);cutter.included(true);
        // if (location === 'back') {
        //   cutter.included(true);
        //   cutter.part(true);
        // }
        const partCode = `:${location[0]}`;
        const partName = `${location}`;
        let cutter, panel;
        if (panels[partCode] === undefined) {
          panel = new PanelModel(partCode, partName, panelModel, toBiPolygon);
          panel.normals = instance.normals;
          panel.position().normals = instance.position().normals;
          panel.position().normalizingRotations = instance.position().normalizingRotations;
          panels[partCode] = panel;
          panel.parentAssembly(instance);
          cutter = new Cutter.Poly(translated);
          cutters[partCode] = cutter;
          instance.addSubAssembly(panel);
          instance.addSubAssembly(cutter);
        }
        panel = panels[partCode];
        cutter = cutters[partCode];
        panel.addJoints(new Joint(cutter.partCode(true), panel.partCode(true), null, 'only'));
        cutter.poly(translated);

        if (Array.isArray(instance.subassemblies)) {
          console.log('wtff');
        }
        if (!append) instance.subassemblies.deleteAll();
        instance.addSubAssembly(panel);
        instance.addSubAssembly(cutter);
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
      full: () => {
        instance.subassemblies.deleteAll();
        const pc = ':p';
        if (panels[pc] === undefined) {
          panels[pc] = new PanelModel(pc, 'panel', panelModel);
          panels[pc].normals = instance.normals;
          panels[pc].position().normals = instance.position().normals;
          panels[pc].position().normalizingRotations = instance.position().normalizingRotations;
        }
        const panel = panels[pc];
        instance.subassemblies.deleteAll();
        instance.addSubAssembly(panel);
      },
    }

    instance.on.parentSet(() => instance.parentAssembly().on.change(() => {
      const parent = instance.parentAssembly();
      if (parent.openings) {
        parent.openings.onAfterChange(build);
      } else build();
    }));
    instance.on.change(build);
  }
}

Divider.Types = ['full', 'none', 'front', 'back', 'frontAndBack'];
Divider.count = 0;

Divider.abbriviation = 'dv';

Divider.fromJson = (json) => {
  const obj = Assembly.fromJson(json);
  json.constructed(() =>
    obj.type(json.type)
  , 1000);
  return obj;
}

module.exports = Divider
