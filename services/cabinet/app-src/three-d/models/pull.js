

const CSG = require('../../../public/js/3d-modeling/csg');

function pull(length, height) {
  var rspx = length - .75;
  var h = height-.125;
  var gerth = .27
  // var rCyl = CSG.cylinder({start: [rspx, .125, .125-height], end: [rspx, .125, .125], radius: .25})
  // var lCyl = CSG.cylinder({start: [.75, .125, .125 - height], end: [.75, .125, .125], radius: .25})
  // var mainCyl = CSG.cylinder({start: [0, .125, .125], end: [length, .125, .125], radius: .25})
  var rCyl = CSG.cube({demensions: [gerth, gerth, h], center: [rspx/2, 0, h/-2]});
  var lCyl = CSG.cube({demensions: [gerth, gerth, h], center: [rspx/-2, 0, h/-2]});
  var mainCyl = CSG.cube({demensions: [length, gerth, gerth], center: [0, 0, 0]});

  return mainCyl.union(lCyl).union(rCyl);
}
module.exports = pull
