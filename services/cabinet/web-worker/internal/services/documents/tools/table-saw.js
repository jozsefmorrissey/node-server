
const CutInfo = require('../cuts/cut');

const Vector3D = require('../../../../../app-src/three-d/objects/vector.js');
const Vertex3D = require('../../../../../app-src/three-d/objects/vertex.js');
const Line3D = require('../../../../../app-src/three-d/objects/line.js');
const Plane = require('../../../../../app-src/three-d/objects/plane.js');

const Line2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');
const Tolerance = require('../../../../../../../public/js/utils/tolerance.js');

const within = Tolerance.within(.0001);
const FENCE = Line2d.startAndTheta(null, Math.PI12, 10000);
const HAND_SAW_ERROR = new Error('hand-saw');

/**
                     +z
                      |
     y+   0   --------o-------   y-  tableTop: xy-plane
         -|- |__Table | Saw___|      fence: y-axis (right hand side of table)
         / \  /      -z      \
**/
class TableSawDocumentation {
  constructor(cut) {
    this.display = CutInfo.display;
    this.cut = cut;
    this.angle = cut.angle();
    this.jointInfo = cut.jointInfo();
    this.partInfo = this.jointInfo.partInfo();
    this.type = TableSawDocumentation.type;
    this.valid = true;
    const instance = this;
    let makeCut = false;

    function cutInfoDirectionalCutLine(yAxis, rightOleft) {
      const edges = instance.partInfo.fenceEdges(rightOleft, true);
      const cut = yAxis.to2D('x', 'y');
      let foundStart = false; let foundEnd = false; let intersections = [];
      for (let index = 0; index < edges.length; index++) {
        const edge = edges[index];
        foundStart ||= edge.isOn(cut.startVertex());
        foundEnd ||= edge.isOn(cut.endVertex());
        if(!foundStart || !foundEnd) {
          const int = edge.findSegmentIntersection(cut, true);
          if (int && !int.equals(cut[0]) && !int.equals(cut[1])) intersections.push(int);
        }
      }
      const foundBoth = (foundStart && foundEnd);
      const found1andIntersection = !foundBoth && ((foundStart || foundEnd) && intersections.length === 1);
      const found2Intersections = !foundBoth && intersections.length === 2;
      if (foundBoth || found1andIntersection || found2Intersections) {
        makeCut = true;
        return null;
      }
      if (foundStart) return cut.negitive();
      if (foundEnd) return cut;

      if (intersections.length === 1) {
        const center = Line2d.center(edges);
        const startCloser = cut[0].distance(center) < cut[1].distance(center);
        return new Line2d(intersections[0], (startCloser ? cut[0] : cut[1]));
      }

      throw HAND_SAW_ERROR;
    }

    function defaultDirectionalCutLine(yAxis, rightOleft, edges) {
      const setNormalized = cut.set().map(p => cut.normalize(rightOleft, p));
      const blockingPolys = setNormalized.filter(p => !within(0, yAxis.vector().unit().dot(p.normal())));
      if (blockingPolys.length > 1)
        throw new Error('This Should Not Happen');
      if (blockingPolys[0] === undefined) return null;
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

    function fenceEdge0deg(y2d, edges, yCutL, rightOleft) {
      const parrelleSets = Line2d.parrelleSets(edges);
      if (parrelleSets.length === 0) throw HAND_SAW_ERROR;
      const parrelleEdges = parrelleSets.filter(s => s[0].isParrelle(y2d))[0];
      if (yCutL === null) {
        return parrelleEdges[0].distance(y2d) > parrelleEdges[1].distance(y2d) ?
              parrelleEdges[0] : parrelleEdges[1];
      }

      const possibleFenceEdges = parrelleEdges.filter(fe => !within(yCutL.radianDifference(fe), 0));

      const y2dExt = Line2d.startAndTheta(y2d.midpoint(), y2d.radians(), 1000)
          .combine(Line2d.startAndTheta(y2d.midpoint(), y2d.negitive().radians(), 1000));
      if (!possibleFenceEdges) {
        throw HAND_SAW_ERROR;
      }
      if (possibleFenceEdges.length === 0) throw HAND_SAW_ERROR;
      if (possibleFenceEdges.length > 1)
        throw new Error('This shouldnt happen, the fenceEdge algorithm should only provide one valid Edge');
      if (goDownTheRabbitHole) {
        console.log(instance.toDrawString() + '\n\nyellow' + possibleFenceEdges[0].toString());
      }
      return possibleFenceEdges[0];
    }

    function outsideOfBlade(rightOleft, y2d) {
      let outsideOfBlade = instance.width === 0;
      if (outsideOfBlade) {
        const model = cut.intersectModel();
        //TODO: make .to2D('x', 'y') default args;
        const normCenter = cut.axis(rightOleft).y.midpoint().to2D('x', 'y');
        const jointCenter = cut.intersectCenter(rightOleft).to2D('x', 'y');
        outsideOfBlade = instance.fenceEdge.distance(jointCenter, false) <
                            instance.fenceEdge.distance(normCenter, false);
      }
      return outsideOfBlade;
    }

    function determinePosition0deg(upside, secondCall) {
      instance.upSide = upside || cut.secondarySide();
      if (instance.upSide === 'Both') instance.upSide = 'Right';
      const rightOleft = instance.upSide === 'Left' ? true : false;
      instance.rightOleft = rightOleft;
      const axis = cut.axis(rightOleft);
      const y2d = axis.y.to2D('x', 'y');
      const edges = instance.partInfo.fenceEdges(rightOleft);
      let yCutL = directionalCutLine(axis.y, rightOleft, edges);
      instance.fenceEdge = fenceEdge0deg(y2d, edges, yCutL, rightOleft);
      instance.length = yCutL ? yCutL.length() : null;
      instance.width = axis.x.length();
      instance.depth = cut.constructor === CutInfo ? null : axis.z.length();
      instance.fenceDistance = instance.fenceEdge.distance(y2d, false) - instance.width/2;
      instance.outsideOfBlade = outsideOfBlade(rightOleft, y2d);
      if (Math.round(instance.fenceDistance*10000)/10000 === 19.75*2.54) {
        console.log(instance.toDrawString());
      }
      if (instance.outsideOfBlade) {
        if (!secondCall)
          determinePosition0deg(instance.upSide === 'Left' ? 'Right' : 'Left', true);
        else
          throw new Error('this shouldnt happen');
      }
    }

    function determineFenceEdgeNonO(rightOleft) {
      const axis = cut.axis(rightOleft);
      const fencePlanes = instance.partInfo.fencePlanes(rightOleft);

      // console.log(fencePlanes.map(p => p.toDrawString()).join('\n\n'));

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

      const valid = yCutLine === null || within(yCutLine.radianDifference(edge2d), 0);
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
      instance.outsideOfBlade = outsideOfBlade(fenceInfo.rightOleft, y2d);
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

    this.toDrawString = (rightOleft) => {
      rightOleft ||= instance.rightOleft || false;
      return instance.partInfo.fenceEdges(rightOleft) + '\ngreen' +
              instance.fenceEdge.toString() + '\nred' +
              cut.axis(rightOleft).y.to2D('x', 'y');
    }

    function build(callAgaine) {
      if (!callAgaine && instance.partInfo.part().partCode.startsWith('dv')) {
        build(true);
        console.log(instance.toDrawString());
        console.log(instance.toDrawString(true));
        console.log('foundIt!');
      }
      const angle = cut.angle();
      if (angle > 45) determinePositionGreaterThan45(angle);
      else if (angle !== 0) determinePositionNon0To45(angle);
      else determinePosition0deg();
      if (makeCut)
      instance.partInfo.cutMade(cut);
    }
    build();
  }
}

TableSawDocumentation.type = 'table-saw';

module.exports = TableSawDocumentation;
