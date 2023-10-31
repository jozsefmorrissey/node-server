
const Vector3D = require('../../../../../services/cabinet/app-src/three-d/objects/vector.js');
const Line3D = require('../../../../../services/cabinet/app-src/three-d/objects/line.js');
const Test = require('../test.js').Test;

function closeEnough(alignTo, realigned, ts) {
  for (let index = 0; index < alignTo.length; index++) {
    ts.assertTrue(realigned[index].equals(alignTo[index], .0001));
  }
}

function testRotations(rotations, ts) {
  rotations.x ||= 0;
  rotations.z ||= 0;
  rotations.y ||= 0;
  const alignTo = [new Vector3D(1,0,0),new Vector3D(0,1,0),new Vector3D(0,0,1)];
  let align = alignTo;
  align = align.map(v => Line3D.fromVector(v).rotate(rotations).vector());
  const calculated = Line3D.coDirectionalRotations(align, alignTo);
  const revCalculated = Line3D.coDirectionalRotations(align, alignTo, true);
  ts.assertTrue(Object.equals(rotations, revCalculated));
  const realignedRev = align.map(v => Line3D.fromVector(v).reverseRotate(revCalculated).vector());
  const realigned = align.map(v => Line3D.fromVector(v).rotate(calculated).vector());

  ts.assertTrue(realignedRev.equals(alignTo));
  closeEnough(alignTo, realigned, ts);
}

Test.add('Vector3D: coDirectionalRotations(simple)', (ts) => {
  testRotations({x:12}, ts);
  testRotations({y:12}, ts);
  testRotations({z:12}, ts);

  testRotations({x:12, z:18}, ts);
  testRotations({x:12, y:18}, ts);
  testRotations({z:12, y:18}, ts);

  testRotations({z:33, y:18, x:12}, ts);
  testRotations({z:27, y:48, x:13}, ts);
  testRotations({z:11, y:6, x:25}, ts);

  ts.success();
});

function multipleRotations(rotations, ts) {
  const alignTo = [new Vector3D(1,0,0),new Vector3D(0,1,0),new Vector3D(0,0,1)];
  align = alignTo.map(v => Line3D.fromVector(v).rotate(rotations).vector());
  const calculated = Line3D.coDirectionalRotations(align, alignTo, true);

  const realigned = align.map(v => Line3D.fromVector(v).reverseRotate(calculated).vector());
  closeEnough(alignTo, realigned, ts);
}

Test.add('Vector3D: coDirectionalRotations(complex)', (ts) => {
  let rotations = [{x:22, y:33, z:124}, {x:-88, y:14, z:-682}];
  multipleRotations(rotations, ts);
  rotations = [{x:2600, y:3311, z:1243}, {x:-188, y:1400, z:-6821}];
  multipleRotations(rotations, ts);
  rotations = [{x:2782, y:3330, z:4899}, {x:-888, y:-25677, z:-3000}];
  multipleRotations(rotations, ts);

  rotations = [{x:2782, y:3330, z:4899}, {x:-888, y:-25677, z:-3000}, {x:2600, y:3311, z:1243}, {x:-188, y:1400, z:-6821}];
  multipleRotations(rotations, ts);

  ts.success();
});
