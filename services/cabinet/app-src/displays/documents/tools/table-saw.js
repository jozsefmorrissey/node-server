
const Vector3D = require('../../../three-d/objects/vector.js');
const Vertex3D = require('../../../three-d/objects/vertex.js');
const Line3D = require('../../../three-d/objects/line.js');
const Plane = require('../../../three-d/objects/plane.js');
const Line2d = require('../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const CutInfo = require('../cuts/cut');
const Tolerance = require('../../../../../../public/js/utils/tolerance.js');
const $t = require('../../../../../../public/js/utils/$t.js');

const within = Tolerance.within(.0001);
const FENCE = Line2d.startAndTheta(null, Math.PI12, 10000);
/**    y+         0        y-
  +z|-------------------------
    |
   0|   0   ------o-----       tableTop: xy-plane
    |  -|- |__TableSaw__|      fence: y-axis (right hand side of table)
  -z|  / \  /          \
**/
class TableSawDocumentation {
  constructor(cut) {
    this.display = CutInfo.display;
    this.cut = cut;
    this.angle = cut.angle();
    this.jointInfo = cut.jointInfo();
    this.partInfo = this.jointInfo.partInfo();
    this.type = () => TableSawDocumentation.type;
    this.valid = true;
    const instance = this;

    function cutInfoDirectionalCutLine(yAxis, rightOleft) {
      const edges = instance.partInfo.edges(rightOleft, true);
      const cut = yAxis.to2D('x', 'y');
      let foundStart = false; let foundEnd = false;
      for (let index = 0; index < edges.length; index++) {
        foundStart ||= edges[index].isOn(cut.startVertex());
        foundEnd ||= edges[index].isOn(cut.endVertex());
      }
      if (foundStart && foundEnd) return null;
      if (foundStart) return cut;
      if (foundEnd) return cut.negitive();
      throw new Error('This shouldnt happen!10/29/2023');
    }

    function defaultDirectionalCutLine(yAxis, rightOleft, edges) {
      const setNormalized = cut.set().map(p => cut.normalize(rightOleft, p));
      const blockingPolys = setNormalized.filter(p => !within(0, yAxis.vector().unit().dot(p.normal())));
      if (blockingPolys.length > 1) throw new Error('This Should Not Happen');
      if (blockingPolys[0] === undefined) return;
      const intersectingLine = Line3D.fromVector(blockingPolys[0].normal(), yAxis.midpoint());
      const intersection = blockingPolys[0].toPlane().intersection.line(intersectingLine);
      const line3D = new Line3D(intersection, yAxis.midpoint());
      let line2d = instance.partInfo.to2D(null, line3D);
      let intersections = edges.map(e => line2d.findDirectionalIntersection(e))
                               .filter(v => v instanceof Vertex2d);
      intersections.sort(Vertex2d.sortByCenter(yAxis.midpoint()));
      line2d.endVertex(intersections[intersections.length - 1]);
      return line2d.negitive();
    }

    function directionalCutLine(yAxis, rightOleft, edges) {
      if (cut.constructor === CutInfo) return cutInfoDirectionalCutLine(yAxis, rightOleft);
      else return defaultDirectionalCutLine(yAxis, rightOleft, edges);
    }

    function fenceEdge0deg(y2d, edges, yCutL) {
      const parrelleSets = Line2d.parrelleSets(edges);
      const possibleFenceEdges = parrelleSets.filter(s => s[0].isParrelle(y2d))[0];
      const y2dExt = Line2d.startAndTheta(y2d.midpoint(), y2d.radians(), 1000)
          .combine(Line2d.startAndTheta(y2d.midpoint(), y2d.negitive().radians(), 1000));
      let fenceEdge = possibleFenceEdges[0];
      if (yCutL) {
        if (!within(fenceEdge.radians(), yCutL.radians()))
          fenceEdge = possibleFenceEdges[1];
        if (!within(fenceEdge.radians(), yCutL.radians()))
          throw new Error('Shouldn\'t happen!28Nov2023');
      }
      return fenceEdge;
    }

    function outsideOfBlade(rightOleft) {
      let outsideOfBlade = instance.length !== null && within(instance.width, 0);
      if (outsideOfBlade) {
        const model = cut.intersectModel();
        const normCenter = cut.normalize(rightOleft, model).center();
        const jointCenter = new Vertex3D(normCenter).to2D('x', 'y');
        outsideOfBlade = instance.fenceEdge.distance(jointCenter, false) < instance.fenceDistance + instance.width;
      }
      return outsideOfBlade;
    }

    function determinePosition0deg() {
      instance.upSide = cut.primarySide();
      const rightOleft = instance.upSide === 'Left' ? true : false;
      const axis = cut.axis(rightOleft);
      const y2d = axis.y.to2D('x', 'y');
      const edges = instance.partInfo.fenceEdges(rightOleft);
      let yCutL = directionalCutLine(axis.y, rightOleft, edges);

      instance.fenceEdge = fenceEdge0deg(y2d, edges, yCutL);
      instance.length = yCutL ? yCutL.length() : null;
      instance.width = axis.x.length();
      instance.depth = cut.constructor === CutInfo ? null : axis.z.length();
      instance.fenceDistance = instance.fenceEdge.distance(y2d, false) - instance.width/2;
      instance.outsideOfBlade = outsideOfBlade(rightOleft);
    }

    function determineFenceEdgeNonO(rightOleft) {
      const axis = cut.axis(rightOleft);
      const fencePlanes = instance.partInfo.fencePlanes(rightOleft);

      console.log(fencePlanes.map(p => p.toDrawString()).join('\n\n'));

      const model = instance.partInfo.model(rightOleft);
      const modelCenter = new Vertex3D(model.center());
      const halfZ = axis.z.vector().unit().scale(axis.z.length()/2);
      let topY = axis.y.clone();
      topY.translate(halfZ);
      let bottomY = axis.y.clone();
      bottomY.translate(halfZ.inverse());
      const tDist = Plane.xy.connect.line(topY).length();
      const bDist = Plane.xy.connect.line(bottomY).length();
      if (bDist < tDist) {
        const temp = topY; topY = bottomY; bottomY = temp;
      }
      const applicablePlanes = fencePlanes.map((p, i) => ({p, i}))
                                  .filter(o => o.p.parrelle.line(topY) &&
                                  o.p.connect.line(bottomY).length() >=
                                  o.p.connect.line(topY).length());
      const edges = fencePlanes.LINES;
      const edge = edges[applicablePlanes[0].i];
      const yCutLine = directionalCutLine(axis.y, rightOleft, edges);
      const edge2d = edge.to2D('x', 'y');
      edge2d.label = edge.label;
      const topFenceDist = applicablePlanes[0].p.connect.line(topY).length();
      const bottomFenceDist = applicablePlanes[0].p.connect.line(bottomY).length();
      const distance = Math.min(topFenceDist, bottomFenceDist);

      const valid = yCutLine === null || within(edge2d.radians(), yCutLine.radians());

      return {
        rightOleft, edge, edges, yCutLine, axis, edge2d, distance, valid,
        planes: fencePlanes
      };
    }

    function determinePositionNon0To45(angle) {
      const fiR = determineFenceEdgeNonO(true);
      const fiL = determineFenceEdgeNonO(false);
      const fenceInfo = !fiR.valid ? fiL : (!fiL.valid ? fiR : (fiL.distance > fiR.distance) ? fiL : fiR);

      instance.valid = fenceInfo.valid;
      instance.upSide = fenceInfo.rightOleft ? 'Left' : 'Right';
      instance.length = fenceInfo.yCutLine ? fenceInfo.yCutLine.length() : null;
      instance.width = fenceInfo.axis.x.length();
      instance.depth = cut.constructor === CutInfo ? null : fenceInfo.axis.z.length();
      instance.fenceEdge = fenceInfo.edge2d;
      const y2d = fenceInfo.axis.y.to2D('x', 'y');
      instance.fenceDistance = fenceInfo.distance;
      instance.outsideOfBlade = outsideOfBlade(fenceInfo.rightOleft);
    }

    function determinePositionGreaterThan45(angle) {
      instance.angle = 90 - angle;
      let fiR = determineFenceEdgeNonO(true);
      let fiL = determineFenceEdgeNonO(false);
      let closer, further;
      if (fiL.distance === 0 || (fiR.distance !== 0 && fiL.distance < fiR.distance)) {
        closer = fiL; further = fiR;
      } else {
        closer = fiR; further = fiL;
      }
      instance.length = closer.yCutLine ? closer.yCutLine.length() : null;
      instance.valid = closer.distance === 0;
      instance.fenceEdge = {label: closer.rightOleft ? 'Right' : 'Left'};
      instance.width = closer.axis.x.length();
      instance.depth = cut.constructor === CutInfo ? null : fenceInfo.axis.z.length();
      instance.upSide = further.edge2d.label;
      const y2d = closer.axis.y.to2D('x', 'y');
      instance.fenceDistance = 'S.t';
      instance.outsideOfBlade = false;
    }


    const angle = cut.angle();
    if (angle > 45) {
      return determinePositionGreaterThan45(angle);
    } else if (angle !== 0) {
      return determinePositionNon0To45(angle);
    }
    return determinePosition0deg();
  }
}

TableSawDocumentation.template = new $t('documents/cuts/table-saw');
TableSawDocumentation.render = (list) => TableSawDocumentation.template.render({list});
TableSawDocumentation.type = 'table-saw';

module.exports = TableSawDocumentation;
