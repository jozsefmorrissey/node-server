
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
const StarLineMap = require('../../../../public/js/utils/canvas/two-d/maps/star-line-map');
const EscapeMap = require('../../../../public/js/utils/canvas/two-d/maps/escape');


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
      if (cabinet.children().indexOf(assembly) !== -1) {
        // TODO: Hacky fix errors created by toModel not including joint information
        if (cabinetCSG === undefined) cabinetCSG = csg;//assembly.toModel(true);
        else cabinetCSG = cabinetCSG.union(csg);//assembly.toModel(true));
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

    this.center = () => {
      if (!center) {
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
      }
      return center;
    }

    this.threeView = () => {
      if (!threeView) {
        const polys = Polygon3D.fromCSG(cabinetCSG.polygons);
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

    this.toModel = (simpler, centerOn) => {
      const offset = new Vertex3D(new Vertex3D(centerOn).minus(this.center()));
      let model = this.cabinetSilhouette().top.toModel();
      model.translate(offset);
      for (let index = 0; !simpler && index < assemblies.length; index++) {
        const csg = assemblies[index].toModel(true);
        csg.translate(offset);
        model = model.union(csg);
      }
      return model;
    }

    this.viewFromVector = (vector, in2D, axis) => {
      let output = cabinet.toBiPolygon();
      output.center(this.center());
      if (in2D) {
        output = Polygon3D.toTwoD(output.toPolygons(), vector, axis);
        axis ||= output.axis;
        // output = Polygon2d.toParimeter(output).lines();
      } else {
        output = output.toModel();
      }
      for (let i = 0; i < assemblies.length; i++) {
        if (in2D) {
          // TODO: overwiting this.toModel causes the commented line to fail.... should be rectified.
          // const twoDlines = Polygon3D.toTwoD(assemblies[i].toBiPolygon().toPolygons(), vector, axis);
          const polygons = Polygon3D.fromCSG(assemblies[i].toModel(true).polygons);
          const twoDlines = Polygon3D.toTwoD(polygons, vector, axis);
          output.concatInPlace(twoDlines);
        } else
          output.union(assemblies[i].toModel());
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

    let modifiableStr;
    const shouldBuild = (c) => !c.snapObject ||
              c.width() !== c.snapObject.width ||
              c.thickness() !== c.snapObject.thickness ||
              modifiableStr !== c.modifiableString();

    this.topviewSnap = () => {
      const c = cabinet;
      if (shouldBuild(c))  {
        modifiableStr = c.modifiableString();
        const topview = build();
        topview.mirrorY();
        c.view.top =  topview;
        if (!c.snap3d  || c.snap3d.snap2d.top === undefined) {
          const layout = c.group().room().layout();
          const layoutObject = layout.addObject(c.id(), c, c.partName(), topview);
          c.snap3d = layoutObject;
        } else {
          const polygon = c.snap3d.snap2d.top().polygon();
          topview.centerOn(polygon.center());
          topview.radians(polygon.radians())
          const lines = polygon.lines();
          for (let index = 0; index < lines.length; index++) {
            const startVertex = lines[index].startVertex();
            startVertex.point(topview.vertex(index).point());
          }
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

    this.complexModel = (model) => {
      if (model !== undefined) {
        try {
          addComplexModelAttrs(model);
          complexModel = model;
          this.topviewSnap();
        } catch (e) {
          console.warn(e);
        }
      }
      return complexModel;
    }

    this.topVector = () => Line3D.fromVector(this.normal(), undefined, {x:90,y:0,z:0}).vector();
    this.rightVector = () => Line3D.fromVector(this.normal(), undefined, {x:0,y:90,z:0}).vector();

    this.frontView = () => this.viewFromVector(this.normal(), true);
    this.topView = () => this.viewFromVector(this.topVector(), true);
    this.rightView = () => this.viewFromVector(this.rightVector(), true);
  }
}

module.exports = CabinetModel;
