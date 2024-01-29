
const Vertex3D = require('../../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js');

const CabinetUtil = require('cabinet');

const defaultDepth = 4*2.54;

class SectionPropertiesUtil {
  constructor(spDto, env) {
    const instance = this;
    let innerDepth;
    let coordinates = spDto.coordinates;
    this.innerDepth = () => {
      if (innerDepth) return innerDepth;
      const back = spDto.back();

      if (back) {
        const biPolyArr = env.modelInfo.biPolygonArray[back.id];
        const biPoly = new BiPolygon(biPolyArr[0], biPolyArr[1]);
        if(biPoly) {
          innerDepth = biPoly.distance(this.innerPoly.center());
        }
      }
      if (innerDepth < defaultDepth) innerDepth = defaultDepth;
      return innerDepth;
    }

    this.outerPoly = spDto.coordinates.outer.object();
    this.innerPoly = spDto.coordinates.inner.object();

    this.outerCenter = Vertex3D.center(coordinates.outer);
    this.innerCenter = Vertex3D.center(coordinates.inner);
    this.outerLength = this.outerPoly.vertex(0).distance(coordinates.outer[3]);
    this.outerWidth = this.outerPoly.vertex(0).distance(coordinates.outer[1]);
    this.innerLength = this.innerPoly.vertex(0).distance(coordinates.inner[3]);
    this.innerWidth = this.innerPoly.vertex(0).distance(coordinates.inner[1]);

    let drawerDepth;
    this.drawerDepth = () => {
      if (drawerDepth) return drawerDepth;
      const polyInfo = cabUtil.polyInformation();
      const polyList = polyInfo.polys;
      const assems = polyInfo.assemblies;
      const innerPoly = this.innerPoly;
      const mi = Polygon3D.mostInformation([innerPoly]);
      const vector = innerPoly.normal().inverse();
      const verts = [];
      innerPoly.lines().forEach(l => verts.push(l.startVertex) | verts.push(l.midpoint()));
      const lines = verts.map(v => Line3D.fromVector(vector, v));
      let closest;
      for (let index = 0; index < polyList.length; index++) {
        const biPoly = polyList[index];
        for (let lIndex = 0; lIndex < lines.length; lIndex++) {
          const line = lines[lIndex];
          const plane = biPoly.closerPlane(line.startVertex);
          const intersection = plane.intersection.line(line);
          if (intersection) {
            const poly = new Polygon3D(plane);
            const withinPoly = poly.isWithin2d(intersection, true);
            if (withinPoly) {
              poly.isWithin2d(intersection);
              innerPoly.isWithin2d(intersection, false)
              const dist = intersection.distance(line.startVertex);
              if (dist > 0 && (closest === undefined || closest.dist > dist)) {
                closest = {dist, line};
              }
            }
          }
        }
      }
      drawerDepth = closest ? closest.dist : 0;
      return drawerDepth;
    };

    const depthPartReg = /^Panel/;
    const depthDvReg = /_dv/;
    const depthPartFilter = spDto => spDto.id.match(depthPartReg) &&
                                  !spDto.locationCode.match(depthDvReg);

    const root = spDto.find.root();
    const cabUtil = new CabinetUtil(root, env);
    const rootSp = spDto.find.root().find.down('S');

    let polyInfo;
    this.polyInformation = () => {
      let assems = Object.values(env.byId).filter(depthPartFilter);
      const mi = Polygon3D.mostInformation([this.innerPoly]);
      const assemblies = []; const polys = [];
      assems.forEach(mDto => {
        try {
          const biPolyArr = env.modelInfo[mDto.id].biPolygonArray;
          const biPoly = new BiPolygon(biPolyArr[0], biPolyArr[1]);
          polys.push(biPoly);
          assemblies.push(mDto);
        } catch (e) {
          console.warn(`toBiPolygon issue with part ${spDto.locationCode}\n`, e);
        }
      });
      return {assemblies, polys};
    }

    let coverInfo;
    this.coverInfo = () => {
      if (coverInfo) return coverInfo;
      let biPolygon, backOffset, frontOffset, offset, coords;
      const doorThickness = 3 * 2.54/4;
      const bumperThickness = 3 * 2.54 / 16;
      if (spDto.isInset) {
        coords = spDto.coordinates.inner;
        offset = env.propertyConfig.Inset.is * -2;
        const projection = 3 * 2.54/64;
        frontOffset = projection;
        backOffset = projection - doorThickness;
      } else if (spDto.isReveal) {
        coords = spDto.coordinates.outer;
        offset = -env.propertyConfig.Reveal.r;
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      } else {
        coords = spDto.coordinates.inner;
        offset = env.propertyConfig.Overlay.ov * 2;
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      }

      frontOffset *= -1;
      backOffset *= -1;
      const offsetObj = {x: offset, y: offset};
      biPolygon = BiPolygon.fromPolygon(new Polygon3D(coords), frontOffset, backOffset, offsetObj);
      coverInfo = {biPolygon, frontOffset, backOffset};
      return coverInfo;
    }

    this.normal = () => this.coverInfo().biPolygon.normal();

    let dvInfo;
    this.dividerInfo = (panelThickness) => {
      if (dvInfo === undefined) {
        const coverInfo = this.coverInfo();
        const normal = coverInfo.biPolygon.normal().inverse();
        const depth = this.innerDepth();
        const length = this.innerLength;
        const width = this.innerWidth;
        const innerCenter = this.innerCenter;
        const outer = coordinates.outer;
        const point1 = this.outerPoly.vertex(spDto.verticalDivisions ? 1 : 3);
        const point2 = this.outerPoly.vertex(2);
        let depthVector = normal.scale(depth);
        let heightVector = new Line3D(point1, point2).vector().unit();
        let thicknessVector  = depthVector.crossProduct(heightVector);
        // need to set normals somewhere else.
        // divider.panel().normals(true, [heightVector, depthVector.unit(), thicknessVector]);
        const point3 = point2.translate(depthVector, true);
        const point4 = point1.translate(depthVector, true);
        const points = [point1, point2, point3, point4];
        const offset = spDto.divider().divider().maxWidth / 2;
        dvInfo = BiPolygon.fromPolygon(new Polygon3D(points), offset, -offset);
      }
      return dvInfo;
    }

    this.biPolygon = BiPolygon.fromPolygon(this.innerPoly, 0, this.innerDepth());
  }
}

const built = {};
SectionPropertiesUtil.instance = (rMdto, environment) => {
  let secProps = rMdto.find.up('S');
  if (built[secProps.id] === undefined) {
    built[secProps.id] = new SectionPropertiesUtil(secProps, environment);
  }
  return built[secProps.id];
}

module.exports = SectionPropertiesUtil;
