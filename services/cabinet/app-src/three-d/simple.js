
const Vertex3D = require('./objects/vertex');
const Vector3D = require('./objects/vector');
const Polygon3D = require('./objects/polygon');
const BiPolygon = require('./objects/bi-polygon');
const Plane = require('./objects/plane');
const Polygon2d = require('../two-d/objects/polygon');
const Vertex2d = require('../two-d/objects/vertex');
const Line2d = require('../two-d/objects/line');

class ThreeDModelSimple {
  constructor(cabinet) {
    const assemblies = [];
    let cabinetCSG;
    let center, threeView, silhouette;

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
        threeView.front = Polygon2d.outline(threeView.front).lines();
        threeView.right = Polygon2d.outline(threeView.right).lines();
        const topPoly2d = Polygon2d.outline(threeView.top);
        threeView.top = topPoly2d.lines();
      }
      return threeView;
    }

    this.cabinetSilhouette = () => {
      if (!silhouette) {
        let polygons = cabinetCSG.polygons;
        const polys = Polygon3D.fromCSG(polygons);
        const threeView = Polygon3D.toThreeView(polys);
        threeView.front = Polygon2d.outline(threeView.front).lines();
        threeView.right = Polygon2d.outline(threeView.right).lines();
        const topPoly2d = Polygon2d.outline(threeView.top);
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
      } else {
        output = output.toModel();
      }
      for (let i = 0; i < assemblies.length; i++) {
        if (in2D) {
          // TODO: overwiting this.toModel causes the commented line to fail.... should be rectified.
          // const twoDlines = Polygon3D.toTwoD(assemblies[i].toBiPolygon().toPolygons(), vector, axis);
          const polygons = Polygon3D.fromCSG(assemblies[i].toModel(true).polygons);
          const twoDlines = Polygon3D.toTwoD(polygons, vector.inverse(), axis);
          output.concatInPlace(twoDlines);
        } else
          output.union(assemblies[i].toModel());
      }
      return output;
    }

    this.frontView = () => this.viewFromVector(this.normal(), true);
  }
}

module.exports = ThreeDModelSimple;
