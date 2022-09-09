
const Test = require('../../../../public/js/utils/test/test').Test;
const Polygon2d = require('../../app-src/two-d/objects/polygon.js');
const Line2d = require('../../app-src/two-d/objects/line.js');

const extraLinePoly = new Polygon2d([[0,0],[0,1],[0,2],[0,3],
                [1,3],[1,4],[0,4],[0,5],[0,6],[1,6],[2,6],[3,6],
                [3,5],[4,5],[5,4],[6,3],[5,3],[5,2],[6,2],[6,1],
                [6,0],[5,0],[4,0],[4,-1],[4,-2],[1,0]]);

const consisePoly = new Polygon2d([[0,0],[0,3],[1,3],[1,4],
                [0,4],[0,6],[3,6],[3,5],[4,5],[6,3],[5,3],[5,2],
                [6,2],[6,0],[4,0],[4,-2],[1,0]])


// const A = new Polygon3D([[,],[,],[,],[,]])
Test.add('Line2d: consolidate',(ts) => {
  const lines = Polygon2d.lines(extraLinePoly);
  ts.assertTrue(lines.length === consisePoly.lines().length);
  ts.success();
});
