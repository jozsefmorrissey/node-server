
const Vertex3D = require('./objects/vertex');
const Line3D = require('./objects/line');
const Vector3D = require('./objects/vector');
const Polygon3D = require('./objects/polygon');
const BiPolygon = require('./objects/bi-polygon');
const Plane = require('./objects/plane');
const Polygon2d = require('../two-d/objects/polygon');
const Vertex2d = require('../two-d/objects/vertex');
const Line2d = require('../two-d/objects/line');
const SnapPolygon = require('../two-d/objects/snap/polygon');


class CabinetModel {
  constructor(cabinet) {
    const assemblies = [];
    let cabinetCSG;
    const instance = this;
    let center, threeView, silhouette, complexModel;
    cabinet.snap2d = {};
    cabinet.view = {};

    this.cabinet = () => cabinet;
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
        threeView.front = Polygon2d.toParimeter(threeView.front).lines();
        threeView.right = Polygon2d.toParimeter(threeView.right).lines();
        const topPoly2d = Polygon2d.toParimeter(threeView.top);
        threeView.top = topPoly2d.lines();
      }
      return threeView;
    }

    this.cabinetSilhouette = () => {
      if (!silhouette) {
        let polygons = cabinetCSG.polygons;
        const polys = Polygon3D.fromCSG(polygons);
        const threeView = Polygon3D.toThreeView(polys);
        threeView.front = Polygon2d.toParimeter(threeView.front).lines();
        threeView.right = Polygon2d.toParimeter(threeView.right).lines();
        const topPoly2d = Polygon2d.toParimeter(threeView.top);
        threeView.top = topPoly2d.lines();

        const frontMinMax = Vertex2d.minMax(Line2d.vertices(threeView.front));
        const height = frontMinMax.diff.y();
        const width = frontMinMax.diff.x();
        const depth = Vertex2d.minMax(Line2d.vertices(threeView.right)).diff.x();
        const topPoly = Polygon3D.from2D(topPoly2d);
        topPoly.rotate({x:90,y:0,z:0});
        silhouette = BiPolygon.fromPolygon(topPoly, 0, height);
        silhouette.center(this.center());
      }
      return silhouette;
    }

    this.toModel = (simpler, centerOn) => {
      const offset = new Vertex3D(new Vertex3D(centerOn).minus(this.center()));
      let model = this.cabinetSilhouette().toModel();
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
        output = Polygon2d.toParimeter(output).lines();
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
      const polys = instance.cabinetSilhouette().toPolygons();
      const threeView = Polygon3D.toThreeView(polys);
      let topview = Polygon2d.toParimeter(threeView.top);
      const layout = c.group().room().layout();
      const normals = c.normals();
      const dist = c.width() > c.thickness() ? c.width() : c.thickness();
      const lines = topview.lines();
      const topCenter = Vertex2d.center(Line2d.vertices(lines));
      const normalLines = normals.map((n) => {
        const searchLine = Line3D.startAndVector(instance.center(), n.scale(dist));
        const searchLine2d = searchLine.to2D(threeView.axis.top[0], threeView.axis.top[1]);
        searchLine2d.translate(new Line2d(searchLine2d.startVertex(), topCenter));
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

    this.topviewSnap = () => {
      const c = cabinet;
      const shouldBuild = !c.snapObject || c.width() !== c.snapObject.width ||
        c.thickness() !== c.snapObject.thickness;
      if (shouldBuild)  {
        const topview = build();
        c.view.top =  topview;
        if (!c.snap3d  || c.snap3d.snap2d.top === undefined) {
          const layout = c.group().room().layout();
          const layoutObject = layout.addObject(c.id(), c, c.partName(), topview);
          c.snap3d = layoutObject;
        } else {
          const polygon = c.snap3d.snap2d.top().object();
          topview.centerOn(polygon.center());
          topview.radians(polygon.radians())
          const lines = polygon.lines();
          for (let index = 0; index < lines.length; index++) {
            const startVertex = lines[index].startVertex();
            startVertex.point(topview.vertex(index).point());
          }
          console.log('merging?');
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
        addComplexModelAttrs(model);
        complexModel = model;
        this.topviewSnap();
      }
      return complexModel;
    }

    this.frontView = () => this.viewFromVector(this.normal(), true);
  }
}

module.exports = CabinetModel;
