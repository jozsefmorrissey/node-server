
const Vertex3D = require('./objects/vertex');
const Line3D = require('./objects/line');
const Vector3D = require('./objects/vector');
const Polygon3D = require('./objects/polygon');
const BiPolygon = require('./objects/bi-polygon');
const Plane = require('./objects/plane');
const Polygon2d = require('../../../../public/js/utils/canvas/two-d/objects/polygon');
const Vertex2d = require('../../../../public/js/utils/canvas/two-d/objects/vertex');
const Line2d = require('../../../../public/js/utils/canvas/two-d/objects/line');
const SnapPolygon = require('../../../../public/js/utils/canvas/two-d/objects/snap/polygon');
const EscapeMap = require('../../../../public/js/utils/canvas/two-d/maps/escape');
const Global = require('../services/global');

class CabinetModel {
  constructor(cabinet) {
    const assemblies = [];
    let cabinetCSG;
    const instance = this;
    let center, threeView, silhouette, complexModel;
    cabinet.snap2d = {};
    cabinet.view = {};

    this.cabinet = () => cabinet;
    this.rotation = () => (cabinet && cabinet.position().rotation()) || {x:0, y:0, z:0};
    this.add = (assembly, csg) => {
      if (assembly && assembly.inElivation) {
        assemblies.push(assembly);
      }
      if (assembly.locationCode().count('_') === 1) {
        // TODO: Hacky fix errors created by ToModel not including joint information
        if (cabinetCSG === undefined) cabinetCSG = csg;
        else cabinetCSG = cabinetCSG.union(csg);
      }
    }

    this.normals = () => {
      const normals = [];
      for (let index = 0; index < cabinet.openings.length; index++) {
        const sectionProps = cabinet.openings[index].sectionProperties();
        normals.push(sectionProps.outerPoly().normal());
      }
      return normals;
    }

    this.normal = () => new Vector3D(Math.mean(this.normals(), ['i', 'j', 'k']));

    // todo(pibe2): delegate to webworker (? given it's dependence on cabinetCSG)
    this.center = () => {
      if (cabinetCSG === undefined) return new Vertex3D(0,0,0);
      const polys = cabinetCSG.polygons;
      for (let index = 0; index < polys.length; index++) {
        const poly = polys[index];
        const verts = poly.vertices;
        const targetAttrs = {'pos.x': 'x', 'pos.y': 'y', 'pos.z': 'z'};
        const midrangePoint = Math.midrange(poly.vertices, targetAttrs);
        poly.center = new Vertex3D(midrangePoint);
        poly.plane = new Plane(...verts.slice(0,3).map(v =>v.pos));
      }
      const targetAttrs = {'center.x': 'x', 'center.y': 'y', 'center.z': 'z'};
      center = new Vertex3D(Math.midrange(polys, targetAttrs));
      return center;
    }

    // todo(pibe2): delegate to webworker
    this.threeView = () => {
      if (!threeView) {
        let csg = new CSG();
        const assems = Object.values(cabinet.subassemblies);
        for (let index = 0; index < assems.length; index++) {
          const assem = assems[index];
          const cxtr = assem.constructor.name;
          if (cxtr !== 'SectionProperties' && !cxtr.match(/(Cutter|Void)/)) {
            if (ToModel(assem))
              csg = csg.union(ToModel(assems[index], simpleJoints(assems[index])));
          }
        }
        const polys = Polygon3D.fromCSG(csg.polygons);
        threeView = Polygon3D.toThreeView(polys);
      }
      return threeView;
    }

    function silhouetteFrom2d(parimeter, length, rotation) {
      rotation ||= {x: 0, y: 0, z:0};
      const cabRotation = instance.rotation();
      rotation.x += cabRotation.x;
      rotation.y += cabRotation.y;
      rotation.z += cabRotation.z;
      const poly = Polygon3D.from2D(parimeter);
      poly.rotate(rotation);
      const silhouette = BiPolygon.fromPolygon(poly, 0, length);
      if (silhouette) {
        silhouette.center(instance.center());
      }
      return silhouette;
    }

    this.cabinetSilhouette = () => {
      if (!silhouette) {
        const threeView = this.threeView();

        const frontMinMax = Vertex2d.minMax(Line2d.vertices(threeView.front()));
        const height = frontMinMax.diff.y();
        const width = frontMinMax.diff.x();
        const depth = Vertex2d.minMax(Line2d.vertices(threeView.right())).diff.x();

        silhouette = {};
        silhouette.front = silhouetteFrom2d(threeView.parimeter().front(), depth);
        silhouette.right = silhouetteFrom2d(threeView.parimeter().right(), width, {x: 0, y: 90, z: 0});
        silhouette.top = silhouetteFrom2d(threeView.parimeter().top(), height, {x:90,y:0,z:0});
      }
      return silhouette;
    }

    // todo(pibe2): delegate to webworker
    this.model = (simpler, centerOn) => {
      // const offset = new Vertex3D(new Vertex3D(centerOn).minus(this.center()));
      let model = this.cabinetSilhouette().top.model(simpler);
      // model.translate(offset);
      for (let index = 0; !simpler && index < assemblies.length; index++) {
        const csg = ToModel(assemblies[index], true);
        // csg.translate(offset);
        model = model.union(csg);
      }
      return model;
    }

    const simpleJoints = (assem) => {
      // TODO: this is a hacky way of simplifying... fix
      const joints = assem.getJoints().female;
      joints.jointFilter = (assem) =>
        assem.constructor.name.match(/Cutter/) &&
        (assem.parentAssembly().parentAssembly() === undefined ||
        assem.partCode() === 'aoc');
      return joints;
    }

    // todo(pibe2): delegate to webworker
    this.boxModel = () => {
      let csg = new CSG();
      const assems = Object.values(cabinet.subassemblies);
      for (let index = 0; index < assems.length; index++) {
        const assem = assems[index];
        const cxtr = assem.constructor.name;
        if (cxtr !== 'SectionProperties' && !cxtr.match(/(Cutter|Void)/)) {
          if (assem.canBeModled)
            csg = csg.union(ToModel(assems[index], simpleJoints(assems[index])));
          else throw new Error('canBeModled is an attribute that should be added to assemblies');
        }
      }
      return csg;
    }

    // todo(pibe2): delegate to webworker
    this.viewFromVector = (vector, in2D, axis) => {
      let output = cabinet.toBiPolygon();
      output.center(this.center());
      if (in2D) {
        output = Polygon3D.toTwoD(output.toPolygons(), vector, axis);
        axis ||= output.axis;
      } else {
        output = ToModel(output);
      }
      for (let i = 0; i < assemblies.length; i++) {
        if (in2D) {
          const polygons = Polygon3D.fromCSG(ToModel(assemblies[i]).polygons);
          const twoDlines = Polygon3D.toTwoD(polygons, vector, axis);
          output.concatInPlace(twoDlines);
        } else
          output.union(ToModel(assemblies[i]));
      }
      return output;
    }

    function build() {
      const c = cabinet;
      const threeView = instance.threeView();
      let topview = threeView.parimeter().top();
      const layout = c.group().room().layout();
      const normals = instance.normals();
      const dist = c.width() > c.thickness() ? c.width() : c.thickness();
      const lines = topview.lines();
      const topCenter = Vertex2d.center(Line2d.vertices(lines));
      const cabRotation = instance.rotation();
      const normalLines = normals.map((n) => {
        const searchLine = Line3D.startAndVector(instance.center().copy(), n.scale(dist));
        const veiwFromVect = Line3D.viewFromVector([searchLine], threeView.normals.top())[0];
        const searchLine2d = veiwFromVect.to2D(threeView.axis().top[0], threeView.axis().top[1]);
        searchLine2d.translate(new Line2d(searchLine2d.startVertex().copy(), topCenter.copy()));
        // TODO: I should fix the root cause that requires the x coord to be mirrored;
        searchLine2d.mirrorX();
        // searchLine2d.mirrorY();
        return searchLine2d;
      });
      const faceIndecies = normalLines.map((normalLine) => {
        for (let index = 0; index < lines.length; index++) {
          if (lines[index].findSegmentIntersection(normalLine, true))
            return index;
        }
      });
      topview.faceIndecies(faceIndecies);
      return topview;
    }

    let lastModState;
    this.topviewSnap = () => {
      const c = cabinet;
      if (c.modificationState() !== lastModState)  {
        lastModState = c.modificationState();
        const topview = build();
        topview.mirrorY();
        c.view.top =  topview;
        if (!c.snap3d  || c.snap3d.snap2d.top === undefined) {
          const layout = c.group().room().layout();
          const layoutObject = layout.addObject(c.id(), c, c.partName(), topview);
          c.snap3d = layoutObject;
        } else {
          // TODO: make this update cleaner
          const polygon = c.snap3d.snap2d.top().object();
          topview.centerOn(polygon.center());
          // topview.radians(polygon.radians())
          c.snap3d.snap2d.top().polyCopy(topview);
        }
      }
      return c.snap3d.snap2d.top();
    }

    function addComplexModelAttrs(model) {
      const max = new Vertex3D(Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER,Number.MIN_SAFE_INTEGER);
      const min = new Vertex3D(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER);
      const polys = model.polygons;
      for (let index = 0; index < polys.length; index++) {
        const poly = polys[index];
        const verts = poly.vertices;
        const targetAttrs = {'pos.x': 'x', 'pos.y': 'y', 'pos.z': 'z'};
        const midrangePoint = Math.midrange(poly.vertices, targetAttrs);
        poly.center = new Vertex3D(midrangePoint);
        poly.plane = new Plane(...verts.slice(0,3).map(v =>v.pos));
      }
      const targetAttrs = {'center.x': 'x', 'center.y': 'y', 'center.z': 'z'};
      model.center = new Vertex3D(Math.midrange(polys, targetAttrs));
      model.max = max;
      model.min = min;
    }

    this.complexModel = (model, options) => {
      if (model !== undefined) {
        try {
          // addComplexModelAttrs(model);
          complexModel = model;
          this.topviewSnap();
        } catch (e) {
          console.warn(e);
        }
      }
      return complexModel.clone();
    }

    this.topVector = () => Line3D.fromVector(this.normal(), undefined, {x:90,y:0,z:0}).vector();
    this.rightVector = () => Line3D.fromVector(this.normal(), undefined, {x:0,y:90,z:0}).vector();

    this.frontView = () => this.viewFromVector(this.normal(), true);
    this.topView = () => this.viewFromVector(this.topVector(), true);
    this.rightView = () => this.viewFromVector(this.rightVector(), true);

    models[cabinet.id()] = this;
  }
}

const models = {};
CabinetModel.get = (cabinet) => {
  cabinet ||= Global.cabinet();
  if (cabinet) return models[cabinet.id()];
}

module.exports = CabinetModel;
