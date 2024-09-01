
const STL = require('../../3d-modeling/STL.js');
require('../../3d-modeling/csg');
require('../../utils');

const cube = new CSG.cube({radius: [50,50,50]});
const stl = new STL('Cube! Mother Fucker');
cube.polygons.forEach(p => stl.add.polygon(p.vertices.map(v => v.pos), p.plane.normal));
const blob = stl.binary.file();

const link = document.createElement('a');
link.innerText = 'Cube!';
link.href = URL.createObjectURL(blob);
link.download = 'cube.stl'; // Set the desired filename

document.body.append(link);

let height = 1.5*2.54;
let width = 1 * 2.54;
let wheelScrewCenterZ = (5/16) * -2.54;
let glassThickness = (1/4) * 2.54;
let glassScrewCenter = [0, .5*2.54, glassThickness - .1];
let gsc = glassScrewCenter;
let flapThickness = (1/16) * 2.54;
let screwThickness = .5;
let smallBackThickness = .3
let sbt = smallBackThickness;
let supportCylRad = (13/32) * 2.54/2;
let scr = supportCylRad;
const cylinder = new CSG.cylinder({start: [0,0,0], end: [0,height,0], radius: width/2});
const glassCutter = new CSG.cube({radius: [width/2, height/2, glassThickness/2], center: [0,(height/2) - flapThickness, glassThickness/2]});
const wheelScrewCyl = new CSG.cylinder({radius: screwThickness/2 + .01, start: [0,0,wheelScrewCenterZ], end: [0,height,wheelScrewCenterZ]});
const topScrewResess = new CSG.cylinder({radius: .8/2 + .1, start: [0,height - (7/32)*2.54/2, wheelScrewCenterZ], end: [0,height, wheelScrewCenterZ]});
const bottomScrewResess = new CSG.cylinder({radius: .8/2 + .01, start: [0,(7/32)*2.54/2, wheelScrewCenterZ], end: [0,0, wheelScrewCenterZ]});
const backScrewCyl = new CSG.cylinder({radius: 1.2/2 - .01, start: [0,gsc[1], 0], end: [0,gsc[1], gsc[2]]});
const backScrewHole = new CSG.cylinder({radius: .4/2 + .01, start: [0,gsc[1], gsc[2] + .1], end: [0,gsc[1], 100]});
const backScrewResess = new CSG.cylinder({radius: .8/2, start: [0,gsc[1], width/2], end: [0,gsc[1], width/2 - (1/8) * 2.54]});
const backScrewWell = new CSG.cylinder({radius: .2/2, start: [0,gsc[1], 0], end: [0,gsc[1], gsc[2]]});
const wheelCavity = new CSG.cube({radius: [100, ((15/16)*2.54)/2 - .01, width/2 - sbt], center: [0, height/2, width/-2 + sbt/2]})
const supportCylR = new CSG.cylinder({radius: scr, start: [width/2-scr, .635, 0], end: [width/2-scr, 2.54 + .635, 0]}).subtract(glassCutter);
const supportCylL = new CSG.cylinder({radius: scr, start: [width/-2+scr, .635, 0], end: [width/-2+scr, 2.54 + .635, 0]}).subtract(glassCutter);
const plierSlot = new CSG.cube({radius: [(3/16)*2.54/2, (7/32)*2.54/2, 5], center: [0,height,-5]});
const backAngle = new CSG.cube({radius: [1.5*2.54/2, 1.5*2.54/2, .5/2], center: [0,0,0]});
backAngle.rotate({x:-45});
backAngle.translate([0,height,(width)/2.54+.1]);
const model = cylinder.subtract(glassCutter)
                      .subtract(wheelScrewCyl)
                      .subtract(topScrewResess)
                      .subtract(bottomScrewResess)
                      .subtract(backScrewHole)
                      .subtract(backScrewResess)
                      .union(backScrewCyl)
                      .subtract(backScrewWell)
                      .subtract(wheelCavity)
                      .union(supportCylR)
                      .union(supportCylL)
                      .subtract(backAngle)
                      .subtract(plierSlot)

// model.rotate({x:180});
// model.translate({x: 0, y: model.demensions().y, z: 0});



const stl2 = STL.fromCSG(model);
console.log(stl2.url());
console.log(model.toDrawString());


const link2 = document.createElement('a');
link2.innerText = 'Shower Wheel Thingy!';
link2.href = URL.createObjectURL(stl2.binary.file());
link2.download = 'shower-wheel-thingy.stl'; // Set the desired filename

document.body.append(link2);
