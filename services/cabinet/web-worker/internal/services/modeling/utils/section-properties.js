
const Vertex3D = require('../../../../../app-src/three-d/objects/vertex.js');
const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');
const Polygon3D = require('../../../../../app-src/three-d/objects/polygon.js');
const BiPolygon = require('../../../../../app-src/three-d/objects/bi-polygon.js');
const SpatialMap = require('../../../../../app-src/three-d/objects/maps/spatial-map.js');

const CabinetUtil = require('cabinet');
const Utils = require('utils');

const defaultDepth = 4*2.54;

class SectionPropertiesUtil {
  constructor(spDto, env) {
    const instance = this;

    let innerDepth;
    this.isRoot = spDto.parentAssembly().find.up(a => a.id.startsWith('SectionProperties')) === undefined;
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
    this.outerPoly.normals(spDto.normals.x);
    this.innerPoly.normals(spDto.normals.x);

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
      innerPoly.lines().forEach(l => verts.push(l[0]) | verts.push(l.midpoint()));
      const lines = verts.map(v => Line3D.fromVector(vector, v));
      let closest;
      for (let index = 0; index < polyList.length; index++) {
        const biPoly = polyList[index];
        for (let lIndex = 0; lIndex < lines.length; lIndex++) {
          const line = lines[lIndex];
          const plane = biPoly.closerPlane(line[0]);
          const intersection = plane.intersection.line(line);
          if (intersection) {
            const poly = new Polygon3D(plane);
            const withinPoly = poly.isWithin2d(intersection, true);
            if (withinPoly) {
              poly.isWithin2d(intersection);
              innerPoly.isWithin2d(intersection, false)
              const dist = intersection.distance(line[0]);
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
    this.coverInfo = (rMdto) => {
      if (!rMdto && coverInfo) return coverInfo;
      rMdto ||= spDto;
      let biPolygon, backOffset, frontOffset, offset, coords;
      const doorThickness = Utils.property('daft', rMdto, env);
      const bumperThickness = Utils.property('dafbt', rMdto, env);
      const style = Utils.property('style', rMdto, env);
      if (style === 'Inset') {
        coords = spDto.coordinates.inner;
        offset = Utils.property('is', rMdto, env) * -2;
        const projection = 3 * 2.54/64;
        frontOffset = projection;
        backOffset = projection - doorThickness;
      } else if (style === 'Reveal') {
        coords = spDto.coordinates.outer;
        offset = -Utils.property('r', rMdto, env);
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      } else {
        coords = spDto.coordinates.inner;
        offset = Utils.property('ov', rMdto, env) * 2;
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      }

      frontOffset *= -1;
      backOffset *= -1;
      const offsetObj = {x: offset, y: offset};
      biPolygon = BiPolygon.fromPolygon(new Polygon3D(coords), frontOffset, backOffset, offsetObj);
      const normals = spDto.normals;
      if (!rMdto) return (coverInfo = {biPolygon, frontOffset, backOffset, normals});
      return {biPolygon, frontOffset, backOffset, normals};
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

        const normals = spDto.divider().position.current.normals;
        normals.y = heightVector; normals.x = depthVector.unit(); normals.z = thicknessVector.unit().inverse();

        const point3 = point2.translate(depthVector, true);
        const point4 = point1.translate(depthVector, true);
        const points = [point1, point2, point3, point4];
        const offset = spDto.divider().thickness / 2;
        dvInfo = BiPolygon.fromPolygon(new Polygon3D(points), offset, -offset);
      }
      return dvInfo;
    }

    this.leafSpatialMap = () => {
      const spatialMap = new SpatialMap(3*2.54);
      const leafSections = env.find(/^SectionProperties_/).filter(sp => sp.sections.length < 1)
          .map(sp => SectionPropertiesUtil.instance(sp, env));
      leafSections.forEach(section => {
        const norms = section.outerPoly.normals();
        delete norms.z;
        spatialMap.add(section.outerPoly, new Vector3D.SectorMap(norms, 1), section);
      });
      return spatialMap;
    }

    this.sectionProps = () => spDto;
    this.biPolygon = BiPolygon.fromPolygon(this.innerPoly, 0, this.innerDepth());
  }
}

const expandDirections = ['Right', 'Left', 'Top', 'Bottom'];
function expandToNeigbors(poly, spatialMap) {
  const spatialNode = spatialMap.nodes().find(n => n.object().equals(poly));
  for (let index = 0; index < expandDirections.length; index++) {
    const neighbor = spatialNode[expandDirections[index]]()[0];
    if (neighbor) {
      const nPoly = neighbor.payload().innerPoly;
      const dirVect = spatialNode.sectorMap()[expandDirections[index]];
      const sides = BiPolygon.fromPolygon(nPoly, 0, panelSectionThickness).sides();
      const targetSide = sides.find(p => p.normal().equals(dirVect.inverse()));
      poly.extendTo(targetSide);
    }
  }
}
// Iron Ore: 7069 CabinetColor https://www.loveandrenovations.com/wp-content/uploads/2023/04/side-by-side-5-1000x833.jpg

const panelSectionThickness = .75 * 2.54;
function panelSectionInformation(sectionUtil, env) {
  const panelSections = Object.values(env.byId).filter(a => a.id.startsWith('PanelSection_'));
  if (panelSections.length === 0) return;
  const spatialMap = sectionUtil.leafSpatialMap();
  const models = [];
  for (let index = 0; index < panelSections.length; index++) {
    const spu = SectionPropertiesUtil.instance(panelSections[index], env);
    const poly = spu.outerPoly.copy();
    expandToNeigbors(poly, spatialMap);
    const width = panelSectionThickness;
    const model = BiPolygon.fromPolygon(poly, 0, width).model();
    models.push(model);
  }
  return models;
}

function combineModels(models) {
  let found;
  let tol = .0001;
  do {
    found = false;
    for (let i = 0; i < models.length; i++) {
      let modelI = models[i];
      for (let j = i + 1; j > i && j < models.length; j++) {
        const modelJ = models[j];
        const demsi = modelI.demensions();
        const demsj = modelJ.demensions();
        const addedDems = {x: demsi.x + demsj.x, y: demsi.y + demsj.y, z: demsi.z + demsj.z};
        const combined = modelI.union(modelJ);
        const combinedDems = combined.demensions();
        if (addedDems.x + tol > combinedDems.x && addedDems.y + tol > combinedDems.y &&
                addedDems.z + tol > combinedDems.z) {
          modelI = models[i] = combined;
          models.splice(j--, 1);
          found = true;
        }
      }
    }
  } while (found);
}

const partName = 'Panel Section Panel';
const prefix = 'PanelSectionPanel';
const id = (index) => `${prefix}_${index}`;
const partCode = 'psp'
function buildPanels(sectionUtil, env) {
  if (env.pathValue(`building-${prefix}`)) return;
  env.pathValue(`building-${prefix}`, true);
  const models = panelSectionInformation(sectionUtil, env);
  if (!models) return;
  combineModels(models);
  if (models.length > 1) console.warn('Not tested for multiple panel Sections');
  const root = sectionUtil.sectionProps().find.root();
  models.forEach((model, index) => {
    const blockModel = new CSG.cube({demensions: model.demensions(), center: model.center()});
    const assem = {id: id(index), category: 'Panel', partCode, partName};
    const rdto = Utils.generated(assem, env, blockModel, prefix, root);
    env.modelInfo.cut[rdto.id] = model;
    const joints = env.find(/^PanelSection-/, 'locationId');
    joints.forEach(j => env.jointMap[j.id].male.push(rdto.id))
  });
}

const built = {};
const dataPath = (assem) => 'proccessData.SectionPropertiesUtil.' + assem.id;
SectionPropertiesUtil.instance = (rMdto, env) => {
  let secProps = rMdto.find.up(/_S$/) || rMdto.find(/_S$/);
  if (!secProps) return null;
  let rootHash = rMdto.find.root().hash;
  const path = dataPath(secProps);
  if (env.pathValue(path) === undefined || env.pathValue(path).rootHash !== rootHash) {
    const secPropsUtil = new SectionPropertiesUtil(secProps, env);
    secPropsUtil.rootHash = rootHash;
    env.pathValue(path, secPropsUtil);
  }
  if (env.pathValue(path).isRoot) buildPanels(env.pathValue(path), env);
  return env.pathValue(path);
}

SectionPropertiesUtil.stdCoverObject = (rMdto, env) => {
  const info = SectionPropertiesUtil.instance(rMdto, env).coverInfo(rMdto);
  rMdto.position.current.normals = info.normals;
  return info.biPolygon;
}

module.exports = SectionPropertiesUtil;
