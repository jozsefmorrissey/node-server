
const Polygon3D = require('../../../app-src/three-d/objects/polygon.js');
const BiPolygon = require('../../../app-src/three-d/objects/bi-polygon.js');
const to = {};

to.SimpleModel = (simpleModelDto) => {
  const biPoly = BiPolygon.fromVectorObject(obj3D.width(), obj3D.height(), obj3D.thickness(), obj3D.center());
  return biPoly.toModel();
}

to.ShowerBase = (simpleModelDto) => {
  const curbHeight = 2*2.54;
  const curbWidth = 3*2.54;
  const objCenter = obj3D.center();
  const height = obj3D.height();
  const depth = obj3D.thickness();
  const base = BiPolygon.fromVectorObject(obj3D.width(), height-curbHeight, depth, objCenter);
  const curbCenter = new Vertex3D({
    x: objCenter.x,
    y: objCenter.y + height/2,
    z: objCenter.z + depth/2 - curbWidth/2
  });
  const curb = BiPolygon.fromVectorObject(obj3D.width(), curbHeight, curbWidth, curbCenter);
  return base.toModel().union(curb.toModel());
}

to.Toilet = (simpleModelDto) => {
  const third = obj3D.thickness()/3;
  const center = obj3D.center();
  const height = obj3D.height();
  const depth = obj3D.thickness();
  const bowlCenter = [
    center.x,
    center.y,
    center.z - third/2
  ];

  const bowl = CSG.sphere({
       center: bowlCenter,
       radius: third,
  });

  const cutterCenter = [
    center.x,
    center.y + third*2,
    center.z - third/2
  ];

  const bowlCutter = CSG.cube({
    radius: third*2,
    center: cutterCenter
  });

  const pedistalHeight = third;
  const wallOffset = 2*2.54;
  const pedistal = CSG.cube({
    radius: [third/2, pedistalHeight/2, third],
    center:[
      center.x,
      center.y - height/2 + third/2,
      center.z + third/2 - wallOffset
    ]
  });

  const tankHeight = height - pedistalHeight;
  const tankWidth = third - wallOffset;
  const tank = CSG.cube({
    radius: [obj3D.width()/2, tankHeight/2, tankWidth/2],
    center: [
      center.x,
      (center.y + height/2 - tankHeight/2),
      center.z + depth/2 - wallOffset - tankWidth/2
    ]
  });

  const model = bowl.subtract(bowlCutter).union(pedistal).union(tank);
  const modCenter = model.center();
  model.center({x:0,y:0,z:0});
  const rotation = obj3D.rotation().copy();
  model.rotate(rotation);
  model.center(modCenter);
  return model;
}

to.Stairs = () => {
  const count = this.count();
  const treadLength = this.treadLength();
  const rise = obj3D.height() / count;
  const width = obj3D.width();
  const height = obj3D.height();
  const center = obj3D.center();
  let model = new CSG();
  for (let index = 0; index < count; index++) {
    model = model.union(CSG.cube({
      radius: [width/2, rise/2, treadLength/2],
      center:[
        center.x,
        center.y - height / 2 + rise * index + rise/2,
        center.z - treadLength * count / 2 + treadLength/2 + treadLength * index
      ]
    }));
  }

  const modCenter = model.center();
  model.center({x:0,y:0,z:0});
  const rotation = obj3D.rotation().copy();
  model.rotate(rotation);
  model.center(modCenter);

  return model;
}

function drawerBox(length, width, depth) {
  const bottomHeight = 7/8;
  const box = CSG.cube({demensions: [width, length, depth], center: [0,0,0]});
  box.setColor(1, 0, 0);
  const inside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, bottomHeight, 0]});
  inside.setColor(0, 0, 1);
  const bInside = CSG.cube({demensions: [width-1.5, length, depth - 1.5], center: [0, (-length) + (bottomHeight) - 1/4, 0]});
  bInside.setColor(0, 0, 1);

  return box.subtract(bInside).subtract(inside);
}

function unionAll(...polygons) {
  let model = polygons[0].toModel();
  for (let index = 1; index < polygons.length; index++) {
    model = model.union(polygons[index].toModel());
  }
  return model;
}

to.DrawerBox = (frontPoly, normal, length, props) => {
  const sideThickness = props.dbst.value();
  const bottomThickness = props.dbbt.value();
  const bottomHeight = props.dbid.value();
  const norm = normal;

  // In order (front, (frontMoved), back, left, right, top, bottom) Polygon: vertices are if facing polygon topLeft, topRight, bottomRight, bottomLeft
  const fP = frontPoly;
  const fPm = fP.translate(norm.scale(-length));
  const bP = new Polygon3D([fPm.vertex(1), fPm.vertex(0), fPm.vertex(3), fPm.vertex(2)]);
  const lP = new Polygon3D([bP.vertex(1), fP.vertex(0), fP.vertex(3), bP.vertex(2)]);
  const rP = new Polygon3D([fP.vertex(1), bP.vertex(0), bP.vertex(3), fP.vertex(2)]);
  const tP = new Polygon3D([bP.vertex(1), bP.vertex(0), fP.vertex(1), bP.vertex(0)]);
  const btmP = new Polygon3D([bP.vertex(2), bP.vertex(3), fP.vertex(2), fP.vertex(3)]);

  const front = BiPolygon.fromPolygon(fP, 0, sideThickness);
  const back = BiPolygon.fromPolygon(bP, 0, sideThickness);
  const left = BiPolygon.fromPolygon(lP, 0, sideThickness);
  const right = BiPolygon.fromPolygon(rP, 0, sideThickness);
  const bottom = BiPolygon.fromPolygon(btmP, -bottomHeight, -bottomHeight-bottomThickness);
  return unionAll(front, back, left, right, bottom);
}

function pull(length, height) {
  var rspx = length - .75;
  var h = height-.125;
  var gerth = 2.54/4;
  // var rCyl = CSG.cylinder({start: [rspx, .125, .125-height], end: [rspx, .125, .125], radius: .25})
  // var lCyl = CSG.cylinder({start: [.75, .125, .125 - height], end: [.75, .125, .125], radius: .25})
  // var mainCyl = CSG.cylinder({start: [0, .125, .125], end: [length, .125, .125], radius: .25})
  var rCyl = CSG.cube({demensions: [gerth, gerth, h], center: [rspx/2, 0, h/-2]});
  var lCyl = CSG.cube({demensions: [gerth, gerth, h], center: [rspx/-2, 0, h/-2]});
  var mainCyl = CSG.cube({demensions: [length, gerth, gerth], center: [0, 0, 0]});

  return mainCyl.union(lCyl).union(rCyl);
}

function getVectorObj(line, normal) {
  const midNormOffset = line.midpoint().translate(normal);
  const lineNormPoly = new Polygon3D([line.startVertex.copy(), line.endVertex.copy(), midNormOffset]);
  return {
    z: normal,
    x: line.vector().unit(),
    y: lineNormPoly.normal(),
  };
}

to.Pull = (baseCenter, line, normal, projection, cTOc) => {
  var gerth = 2.54/4;
  let length = cTOc + gerth;
  const vecObj = getVectorObj(line, normal);

  let sideProjection = projection - gerth;
  const centerRL = baseCenter.translate(vecObj.z.scale(sideProjection/2), true);
  const centerLeft = centerRL.translate(vecObj.x.scale(cTOc/-2), true);
  const centerRight = centerRL.translate(vecObj.x.scale(cTOc/2), true);
  const centerMain = baseCenter.translate(vecObj.z.scale(projection - gerth/2));

  var lCyl = BiPolygon.fromVectorObject(gerth, gerth, sideProjection, centerLeft, vecObj);
  var rCyl = BiPolygon.fromVectorObject(gerth, gerth, sideProjection, centerRight, vecObj);
  var mainCyl = BiPolygon.fromVectorObject(length, gerth, gerth, centerMain, vecObj);

  return mainCyl.toModel().union(lCyl.toModel()).union(rCyl.toModel());
}

to.Pull.Simple = (baseCenter, line, normal, projection, cTOc) => {
  var gerth = 2.54/4;
  let length = cTOc + gerth;
  const vecObj = getVectorObj(line, normal);

  let sideProjection = projection - gerth;
  const center = baseCenter.translate(vecObj.depth.scale((sideProjection + gerth) /2), true);

  return BiPolygon.fromVectorObject(length, gerth, projection, center, vecObj).toModel();
}
