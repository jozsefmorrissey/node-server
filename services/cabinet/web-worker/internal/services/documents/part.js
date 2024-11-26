
const JointInfo = require('./joint');
const CutInfo = require('./cuts/cut');
const ToolingInfo = require('./tooling-information');
const Utils = require('../modeling/utils/utils.js');
const ToleranceMap = require('../../../../../../public/js/utils/tolerance-map.js');

const Vertex3D = require('../../../../app-src/three-d/objects/vertex.js');
const Vector3D = require('../../../../app-src/three-d/objects/vector.js');
const Line3D = require('../../../../app-src/three-d/objects/line.js');
const Plane = require('../../../../app-src/three-d/objects/plane.js');
const Layer = require('../../../../app-src/three-d/objects/layer.js');
const Polygon3D = require('../../../../app-src/three-d/objects/polygon.js');
const BiPolygon = require('../../../../app-src/three-d/objects/bi-polygon.js')

const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Polygon2d = require('../../../../../../public/js/utils/canvas/two-d/objects/polygon.js');
const Parimeters2d = require('../../../../../../public/js/utils/canvas/two-d/maps/parimeters.js');

class PartInfo {
  constructor(part, env) {
    const instance = this;
    let parts = [part];
    this.part = () => part;
    this.parts = () => parts.map(p => p);
    this.environment = () => env;
    this.merge = (partInfo) => {
      // TODO: this Test definiatly needs to be more robust
      if (partInfo.cutInfo().length > 0) return;
      if (Object.equals(partInfo.demensions(), this.demensions())) {
        parts.concatInPlace(partInfo.parts());
        return true;
      }
      return false;
    }

    let normals = Utils.normals(part, env);
    this.normals = (array) => {
      if (array) return [normals.x, normals.y, normals.z];
      return normals;
    }

    this.normals.to2D = (zOnz, array) => {
      const norms = this.normals();
      const x = this.normalize(zOnz, Line3D.fromVector(norms.x)).to2D();
      const y = this.normalize(zOnz, Line3D.fromVector(norms.y)).to2D();
      const z = this.normalize(zOnz, Line3D.fromVector(norms.z)).to2D();
      return array ? [x,y,z] : {x,y,z};
    }

    const sideFilter = (vect) => c => c.set().filter(p => vect.equals(p.normal())).length > 0;
    this.primarySide = (boolean) => {
      const sideLabel = Vector3D.sector(normals.z);
      const leftOright = sideLabel.match(/^(Left|Front|Top)$/) !== null;
      return boolean ? leftOright : (leftOright ? 'z' : 'nz');
    };

    const normRotz = Vector3D.coDirectionalRotations(this.normals(true));
    let noJointModel = env.getModel(part, 'cut');
    let poly;
    if (!(noJointModel instanceof CSG)) noJointModel = CSG.fromPolygons(noJointModel.polygons, true);
    const normInfoNZ = noJointModel.normalize(normRotz, true, false);
    const normInfoZ = noJointModel.normalize(normRotz, false, false);

    this.normalize = (zOnz, model) => {
      if (model === undefined) return;
      if (Array.isArray(model)) return model.map(e => {
        const normed = this.normalize(zOnz, e);
        normed.label = e.label;
        return normed;
      });
      let normalizeInfo;
      if (zOnz === true) normalizeInfo = normInfoZ;
      else if (zOnz === false) normalizeInfo = normInfoNZ;
      else return model.clone ? model.clone() : model.copy();
      if (model.clone) {
        model = model.clone();
        model.rotate(normalizeInfo.rotations, {x:0, y:0, z:0});
        if (model.translate) model.translate(normalizeInfo.translationVector);
      } else {
        model = model.copy();
        model.rotate(normalizeInfo.rotations, {x:0, y:0, z:0});
        if (model.translate) model = model.translate(normalizeInfo.translationVector);
      }
      return model;
    };

    this.model = (zOnz, joints) => {
      let model = this.joinedModel();
      if (joints !== undefined)
        console.warn('joints is no longer a valid argument');
      return this.normalize(zOnz, model);
    };

    this.zOnz = (zOnz) => {
      const sector = Vector3D.sector(this.normals().z);
      const tf = sector.match(/Left|Top|Front/) ? true : false;
      if (zOnz === true) return tf ? 'z' : '-z';
      // console.log(part.locationCode, sector, tf);
      return tf;
    }

    this.layers = (zOnz) => {
      const model = this.model(zOnz);
      const layers = Layer.fromCSG(model);
      layers.sort((a,b) => a.center().z - b.center().z);
      return layers;
    }

    this.polygons = (zOnz, joints) => {
      let model = this.model(zOnz, joints);

      const polys = Polygon3D.merge(Polygon3D.fromCSG(model));
      return polys;
    };

    this.noJointModel = (zOnz) => {
      return this.normalize(zOnz, noJointModel);
    };
    this.joinedModel = (id) => {
      let model = env.getModel(id || this.part().id, 'joined');
      if (!(model instanceof CSG)) model = CSG.fromPolygons(model.polygons, true);
      return model;
    }

    let currentModel = this.noJointModel();
    this.currentModel = (zOnz) => {
      return this.normalize(zOnz, currentModel);
    };

    const nzFilter = (type) => ji => ji.primarySide() === 'Both' || (ji.primarySide() === 'z' && (type === undefined || type === ji.type()));
    const zFilter = (type) => ji => ji.primarySide() === 'Both' || (ji.primarySide() === 'nz' && (type === undefined || type === ji.type()));
    const jointMap = {};
    this.jointInfo = (zOnz, type) => {
      let femaleMap = env.jointMap.female[part.id];
      if(femaleMap === undefined) return [];
      femaleMap = femaleMap.filter(jid => !jid.startsWith('Dependency_'));
      let filter = zOnz === true ? nzFilter(type) :
                   (zOnz === false ? zFilter(type) : null);
      const joints = femaleMap.map(jid => env.byId[jid]);
      let jointInfos = joints.map(j => {
        const hash = Object.hash(j);
        if (jointMap[hash] === undefined) {
          jointMap[hash] = new JointInfo(j, this);
        }
        return jointMap[hash];
      });
      jointInfos.sortByAttr('joint.priority', true)
      if (filter === null) return jointInfos;
      return jointInfos.filter(filter);
    };

    const center = new Vertex3D(this.noJointModel().center());
    this.center = (zOnz) => this.normalize(zOnz, center);

    const round = (val) => Math.round(val * 1000)/1000;
    this.demensions = () => {
      let model = this.model();
      if (model.polygons.length === 0) return {x:0, y:0, z:0};
      model = this.normalize(true, model);
      const dems = model.demensions();
      dems.x = round(dems.x); dems.y = round(dems.y); dems.z = round(dems.z);
      return dems;
    };

    this.axis = () => {
      const dems = this.demensions();
      const norms = this.normals();
      const center = this.center();
      return {
        x: Line3D.fromVector(norms.x.scale(dems.x), center.clone(), null),
        y: Line3D.fromVector(norms.y.scale(dems.y), center.clone(), null),
        z: Line3D.fromVector(norms.z.scale(dems.z), center.clone(), null)
      }
    }
    this.axis();

    let toolingInformation;
    this.toolingInformation = () => {
      const edgePolys = this.edges3D();
      const cutPolys = this.cutInfo.map(c => c.axis.poly('y', 'z'));
      if (toolingInformation === undefined) toolingInformation = new ToolingInfo(this.cutInfo);
      return toolingInformation;
    }

    this.to2D = (zOnz, csgOpolyOlineOvertex) => {
      const normalized = this.normalize(zOnz, csgOpolyOlineOvertex);
      if(csgOpolyOlineOvertex instanceof Vertex3D || csgOpolyOlineOvertex instanceof Line3D ||
          csgOpolyOlineOvertex instanceof Layer) {
        return normalized.to2D('x', 'y');
      }
      return Polygon3D.lines2d(normalized, 'x', 'y');
    }


    const furthestVertexFromOrign = (zOnz) => {
      const polys = Polygon3D.fromCSG(this.noJointModel());
      const verts = [];
      polys.forEach(p => verts.concatInPlace(p.vertices()));
      verts.sort(Vertex3D.sortByCenter(Vertex3D.origin));
      const vert2d = this.normalize(zOnz, verts[verts.length - 1]).to2D('x', 'y');
      return vert2d;
    }

    this.demensionPolys = (zOnz) => {
      const dems = this.demensions();
      const biPoly = BiPolygon.fromVectorObject(dems.x, dems.y, dems.z, this.center(), this.normals());
      this.normalize(zOnz, biPoly);
      return biPoly.sides();
    }

    this.fenceEdges = (zOnz) => {
      let edges = this.edges2D(zOnz);
      const norms = this.normals.to2D(zOnz);
      edges = edges.filter(e => norms.y.isParrelle(e) || norms.x.isParrelle(e));
      edges = Line2d.unique(edges);
      let center;
      center = Line2d.center(edges);

      const sets = Line2d.parrelleSets(edges);
      sets.forEach(s => s.sort(Line2d.distanceSort(center, false)));

      sets.map(s => s.map(l => l.length()))

      const fenceEdges = [];
      const pushIndex = (s, index) => s[index] && fenceEdges.push(s[index]);
      sets.forEach(s => pushIndex(s, s.length - 1) & pushIndex(s, s.length - 2));
      return fenceEdges;
    }

    const edgePolys = {};
    this.edgePolys = (zOnz, merge) => {
      const model = this.noJointModel();
      const zNorm = this.normals().z;
      const allPolys = Polygon3D.fromCSG(model);
      const polys = []
      const frontBack = []
      for (let index = 0; index < allPolys.length; index++) {
        const poly = allPolys[index];
        if (Math.abs(poly.normal().dot(zNorm)) < .999) polys.push(poly);
        else if (poly.normal().dot(zNorm) > .999) frontBack[0] = poly;
        else if (poly.normal().dot(zNorm) < -.999) frontBack[1] = poly;
        else throw new Error('This should never happen');
      }
      if(merge) Polygon3D.merge(polys);
      Polygon3D.radialSort2D(polys, zNorm);

      const normalized = polys.map(p => this.normalize(zOnz, p));
      normalized.frontBack = frontBack.map(p => this.normalize(zOnz, p));
      let index = 'A'.charCodeAt(0);
      normalized.forEach(p => p.label = String.fromCharCode(index++));
      return normalized;
    }

    this.nonDemensionEdgePolys = (zOnz) => {
      const zNorm = this.normals().z;
      const edge2dLines = this.edgePolys.lines2d(zOnz);
      const demensionPolys = this.demensionPolys.lines2d(zOnz);

      const nonDemEdges = edge2dLines.filter(l =>
          !zNorm.perpendicular(l.poly.normal()) || !demensionPolys.find(dl => dl.combine(l)))

      return nonDemEdges.map(l => l.poly);
    }

    this.edgePolys.toDrawString = (faces, polys) => {
      polys ||= this.edgePolys();
      const c = noJointModel.center();
      const norms = this.normals();
      const normStrs = [norms.x.toDrawString('red', .1, c, 20),
                        norms.y.toDrawString('green', .1, c, 20),
                        norms.z.toDrawString('blue', .1, c, 20)];
      let edgeStrs = polys.map(p => p.toDrawString(String.color.distinct()));
      if (!faces) return edgeStrs.concat(normStrs).join('\n');
      let faceStrs = [polys.frontBack[0].toDrawString('blue'), polys.frontBack[1].toDrawString('black')];
      return faceStrs.concat(edgeStrs).concat(normStrs).join('\n');
    }

    const dotLessThan = (val, target) => (l) => Math.abs(l.vector().unit().dot(target)) < val;
    function groupInlinePoly(poly) {
      const zNorm = instance.normals().z;
      const dotLess = dotLessThan(.5, zNorm);
      const lines = poly.lines();
      if (lines.length < 3 || lines.length > 4)
        console.warn.logarithmic('This algorithum expects 3 or 4 sided polygons');
      const inline = lines.filter((l) => !dotLess(l));
      const perp = lines.filter(dotLess);
      inline.sort(sortByNorm(zNorm));
      perp.sort(sortByNorm(zNorm));
      return {inline, perp, label: poly.label};
    }

    const edgesTo3DLines = (polyFunc) => (zOnz) => {
      const polys = polyFunc(undefined, true);
      const center = new Vertex3D(noJointModel.center());
      const distSorter = Line3D.distanceSort(center, true);
      const edges = [];
      polys.forEach(poly => {
        const perp = groupInlinePoly(poly).perp.sort(distSorter);
        const furthestEdge = instance.normalize(zOnz, perp[1] || perp[0]);
        furthestEdge.poly = poly;
        edges.push(furthestEdge);
        furthestEdge.label = poly.label;
      });
      return edges
    }

    const lines3DTo2D = (linesFunc) => (zOnz) => {
      const edges = [];
      if ((typeof zOnz) !== 'boolean') zOnz = instance.zOnz();
      linesFunc(zOnz).forEach(line => {
        const l2d = line.to2D('x', 'y');
        l2d.label = line.label;
        l2d.poly = line.poly;
        edges.push(l2d);
      });
      Line2d.radialSort(edges, true)
      return edges;
    }
    this.demensionPolys.lines3D = edgesTo3DLines(this.demensionPolys);
    this.demensionPolys.lines2d = lines3DTo2D(this.demensionPolys.lines3D);
    this.edgePolys.lines3D = edgesTo3DLines(this.edgePolys);
    this.edgePolys.lines2d = lines3DTo2D(this.edgePolys.lines3D);


    const sortByNorm = (norm) => (l1, l2) => {
      const mid1 = l1.midpoint();
      const mid2 = l2.midpoint();
      if (mid1.equals(mid2)) return 0;
      const trans = mid1.translate(norm, true);
      return mid2.distance(mid1) < mid2.distance(trans) ? -1 : 1;

    }

    this.edges3D = (zOnz) => {
      const polys = this.edgePolys(undefined, true);
      const center = new Vertex3D(noJointModel.center());
      const distSorter = Line3D.distanceSort(center, true);
      const edges = [];
      polys.forEach(poly => {
        const perp = groupInlinePoly(poly).perp.sort(distSorter);
        const furthestEdge = perp[1] || perp[0];
        edges.push(furthestEdge);
        furthestEdge.label = poly.label;
      });
      return zOnz !== true && zOnz !== false ? edges :
        this.normalize(zOnz, edges);
    }

    this.edges2D = (zOnz) => {
      const edges = [];
      if ((typeof zOnz) !== 'boolean') zOnz = this.zOnz();
      this.edges3D(zOnz).forEach(line => {
        const l2d = line.to2D('x', 'y');
        l2d.label = line.label;
        edges.push(l2d);
      });
      Line2d.radialSort(edges, true)
      return edges;
    }

    this.fencePlanes = (zOnz) => {
      const edges = this.edges3D(zOnz);
      const planes = [];
      const zNorm = this.normals().z;
      edges.forEach(line => {
        const thirdPoint = line.midpoint().translate(zNorm);
        const plane = new Plane(line[0], line[1], thirdPoint);
        plane.label = line.label;
        planes.push(plane);
      });
      return planes
    }

    if (!this.part().outsourced) {
      if (this.cuts && this.cuts.length > 0) return this.cuts;
      const jointInfo = this.jointInfo();
      const cutInfo = [];
      jointInfo.forEach(ji => cutInfo.concatInPlace(ji.cutInfo()));
      const edgeJoint = new JointInfo({descriptor: 'edge'}, this);
      const nonDemEdgePolys = this.nonDemensionEdgePolys();
      cutInfo.concatInPlace(CutInfo.fromEdges(nonDemEdgePolys, this.normals(), edgeJoint));
      this.cuts = CutInfo.clean(cutInfo, this.fenceEdges(true));
      this.cutInfo = cutInfo;
    }
  }
}

module.exports = PartInfo;
