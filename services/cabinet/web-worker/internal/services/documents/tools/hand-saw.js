
const Line2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/line.js');
const Vertex2d = require('../../../../../../../public/js/utils/canvas/two-d/objects/vertex.js');

function printRelLoc(targetEdges, edge, y2d, niegbors) {
  console.log(targetEdges.join('\n') + '\n\ngreen' + edge + '\n\nred' + y2d + '\n\nblue' + niegbors[0][0] + '\n' + niegbors[0][1] + '\nred' + niegbors[1][1]);
}

const round = (val) => Math.round(val*1000)/1000;

class HandSawDocumentation {
  constructor(cut) {
    this.type = HandSawDocumentation.type;

    const rightOleft = cut.primarySide() === 'Left' ? false : true;
    const edges = cut.jointInfo().partInfo().edges(rightOleft, true);
    const center = cut.jointInfo().partInfo().edges(rightOleft).center;
    const axis = cut.axis(rightOleft);
    const y2d = axis.y.to2D('x', 'y');
    const verticies = Line2d.vertices(edges);
    const endPoints = edges.map(l => l.findSegmentIntersection(y2d, true)).filter(v => v instanceof Vertex2d);
    const targetEdges = edges.filter(l => !l.combine(y2d));

    this.width = axis.x.length();
    if (endPoints.length === 1) {
      console.warn('Not tested should probably add angle information or something...');
      this.length = axis.y.length();
    }
    this.depth = axis.z.length();

    // console.log(cut.jointInfo().partInfo().model().toString().replace(/(^|\[)/g, 'blue$1'));
    // console.log(edges.map(l => l.toString()).join('\n') + '\n\nred' + y2d.toString());
    // console.log(cut.jointInfo().partInfo().edges(rightOleft).map(l => l.toString()).join('\n') + '\n\nred' + y2d.toString());

    this.relitiveLocations = [];
    for (let index = 0; index < endPoints.length; index++) {
      const endPoint = endPoints[index];
      for (let ti = 0; ti < targetEdges.length; ti++) {
        let edge = targetEdges[ti];
        try {
          if (edge.isOn(endPoint)) {
            const closestToCenterIndex = edge[0].distance(center) < edge[1].distance(center) ? 0 : 1;
            let targetIndex = edge[closestToCenterIndex].equals(endPoint) ? (closestToCenterIndex + 1) % 2 : closestToCenterIndex;
            let niegbors = targetEdges.filter(l => l.isOn(edge[targetIndex]));
            const reverse = edge.equals(niegbors[0]);
            if (reverse) niegbors.reverse();
            const vertexLabel = niegbors.map(l => l.label).join('');
            const negate = niegbors[0][0].equals(niegbors[1][1]);
            if (negate) niegbors = niegbors.map(l => l.negitive());

            const length = niegbors[0][1].distance(endPoint);
            printRelLoc(targetEdges, edge, y2d, niegbors);
            this.relitiveLocations.push({vertexLabel, length});
          }
        }catch (e) {
          'wtf';
        }
      }
    }
  }
}

HandSawDocumentation.type = 'hand-saw';

module.exports = HandSawDocumentation;
