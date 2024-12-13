
const STL = require('../../3d-modeling/STL.js');
const OrientationArrows = require('../../display/orientation-arrows.js');
const $t = require('../../$t.js');
$t.loadFunctions(require('../../../../../services/cabinet/generated/html-templates.js'));

require('../../3d-modeling/csg');
require('../../utils');
const du = require('../../dom-utils');
const Viewer = require('../../3d-modeling/viewer.js').Viewer;
const addViewer = require('../../3d-modeling/viewer.js').addViewer;

function addLink (model, name) {
  const stl = STL.fromCSG(model, name);
  console.log(model.toDrawString());
  du.copy(model.toDrawString());

  const link = document.createElement('a');
  link.innerText = name;
  link.href = URL.createObjectURL(stl.binary.file());
  link.download = name.toKebab() + '.stl';

  // document.body.append(link);
  link.click();
  // link.remove();
}

let individual = false;
function addLinks(modelOmodels, name) {
  if (modelOmodels instanceof CSG) addLink(modelOmodels, name);
  else {
    if (individual) Object.keys(modelOmodels).forEach(k => addLink(modelOmodels[k], k));
    else {
      let collective = new CSG();
      Object.keys(modelOmodels).forEach(k => collective = collective.union(modelOmodels[k]));
      addLink(collective, name);
    }
  }
}

const models = {};

models['Axis'] = (length, diameter, isVector) => {
  length ||= 18; diameter ||= .5;
  const hl = length / 2;
  const hd = diameter / 2;
  const start = [-hl,hd,0];
  const end = isVector ? new CSG.Vector([hl,0,hd*2]) : [hl,hd,0];
  let lineDisplayType;
  if (isVector) lineDisplayType = CSG.Line.DISPLAY_TYPES.VECTOR;
  const axis = new CSG.Line({start,end, radius: hd, color: 'blue', lineDisplayType});
  let base = new CSG.cube({radius: [hl, hd/2, hd/2], center: [0,hd/2,0]});
  const elivated = axis.clone();
  elivated.translate({x:0,y:10,z:0});
  const ss = .2;
  const gap = .25;
  const chopper = new CSG.cube({radius:[gap/2,hd,hd], center: [-hl+gap/2+ss,hd,0]});
  const offset = {x:gap+ss,y:0,z:0};
  for (let index = 0; index < 100; index++) {
    base = base.subtract(chopper);
    chopper.translate(offset);
  }


  return axis;// base.subtract(axis).union(axis);//.subtract(axis);//elivated.union(base);
};

models['Shower Wheel Thingy!'] = (one,two) => {
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
  let notchThickness = .08;
  let slices = 64;
  const cylinder = new CSG.cylinder({slices, start: [0,0,0], end: [0,height,0], radius: width/2});
  const glassCutter = new CSG.cube({radius: [width, height/2, glassThickness/2], center: [0,(height/2) - flapThickness, glassThickness/2]});
  const backNotchCutter = new CSG.cube({radius: [width/2, notchThickness, notchThickness]});
  // backNotchCutter.rotate({x:45,y:0,z:0});
  backNotchCutter.center({x:0, y:(height) - flapThickness, z: glassThickness})
  const wheelScrewCyl = new CSG.cylinder({slices, radius: screwThickness/2 + .01, start: [0,0,wheelScrewCenterZ], end: [0,height,wheelScrewCenterZ]});
  const topScrewResess = new CSG.cylinder({slices, radius: .8/2 + .1, start: [0,height - (7/32)*2.54/2, wheelScrewCenterZ], end: [0,height, wheelScrewCenterZ]});
  const bottomScrewResess = new CSG.cylinder({slices, radius: .8/2 + .01, start: [0,(9/32)*2.54/2, wheelScrewCenterZ], end: [0,0, wheelScrewCenterZ]});
  const backScrewCyl = new CSG.cylinder({slices, radius: 1.09/2 - .01, start: [0,gsc[1], 0], end: [0,gsc[1], gsc[2]]});
  const backScrewHole = new CSG.cylinder({slices, radius: .28/2 + .01, start: [0,gsc[1], gsc[2] - 1], end: [0,gsc[1], 100]});
  const backScrewResess = new CSG.cylinder({slices, radius: .8/2, start: [0,gsc[1], width/2], end: [0,gsc[1], width/2 - (1/8) * 2.54]});
  const backScrewWell = new CSG.cylinder({slices: 6, radius: .365, start: [0,gsc[1], -1], end: [0,gsc[1], gsc[2] - .2]});
  const wheelCavity = new CSG.cube({radius: [100, ((15/16)*2.54)/2 - .01, width/2 - sbt], center: [0, height/2, width/-2 + sbt/2]})
  const supportCylR = new CSG.cylinder({slices, radius: scr, start: [width/2-scr, .635, 0], end: [width/2-scr, 2.54 + .635, 0]}).subtract(glassCutter);
  const supportCylL = new CSG.cylinder({slices, radius: scr, start: [width/-2+scr, .635, 0], end: [width/-2+scr, 2.54 + .635, 0]}).subtract(glassCutter);

  let supportSqR = new CSG.cube({radius: [scr,height/2,scr], center: [width/2-scr, height/2, scr/2]}).subtract(glassCutter);
  let supportSqL = new CSG.cube({radius: [scr,height/2,scr], center: [width/-2+scr, height/2, scr/2]}).subtract(glassCutter);

  const plierSlot = new CSG.cube({radius: [(3/16)*2.54/2, (7/32)*2.54/2, 5], center: [0,height,-5]});
  const backAngle = new CSG.cube({radius: [1.5*2.54/2, 1.5*2.54/2, .5/2], center: [0,0,0]});
  backAngle.rotate({x:-45});
  backAngle.translate([0,height,(width)/2.54+.1]);
  const crossSection = new CSG.cube({radius: [50,50,50], center: [0,0,50]});
  let body = cylinder.subtract(glassCutter)
    .subtract(wheelScrewCyl)
    .subtract(topScrewResess)
    .subtract(bottomScrewResess)
    .subtract(backScrewResess)
    .union(backScrewCyl)
    .subtract(wheelCavity)
    .union(supportCylR)
    .union(supportCylL)
    .union(supportSqR)
    .union(supportSqL)
    .subtract(backAngle)
    .subtract(plierSlot)
    .subtract(backNotchCutter)
    .subtract(backScrewWell)
    .subtract(backScrewHole)
  body.rotate({y:90});
  const pilotHole = new CSG.cylinder({slices, radius: .14, start: [0,gsc[1], -1], end: [0,gsc[1], gsc[2] + .2]});
  const dowel = backScrewCyl.intersect(backScrewHole.union(backScrewWell)).subtract(pilotHole);
  dowel.scale(.95);
  // body = body.subtract(crossSection);
  return body;//{body, dowel};
}

models['Rack'] =  (one)  => {
  const w = 1.93;
  const h = 3.5;
  const t = 1;
  const cw = .75;
  const ct = t + 2;
  const blockCenter = {x:cw+w/2, y:h/2, z:t/2};
  const _3_32 = 0.238125;
  const _3_16 = _3_32*2;
  let block = new CSG.cube({radius: [w/2, h/2, t/2], center: blockCenter});
  const through = new CSG.cylinder({slices: 8, start: [0,0,0], end: [0,0,ct/2], radius: _3_32});
  through.center(blockCenter);
  const recess = new CSG.cylinder({slices: 8, start: [0,0,0], end: [0,0,ct/4], radius: _3_16});
  recess.center({x:blockCenter.x, y:blockCenter.y, z:t-t/4})
  block = block.subtract(through).subtract(recess);

  const cer = cw*.6;
  let clip = new CSG.cube({radius: [cw/2, h/2, ct/2], center: [cw/2, h/2, ct/2]});
  const champherLeft = new CSG.cube({radius: [w/10,h*2,w/10]});
  champherLeft.rotate({y:45});
  champherLeft.rotate({x:-45});
  champherLeft.center({x: 0, y:h, z:2*ct/4});
  clip = clip.subtract(champherLeft);
  const champherRight = champherLeft.clone();
  champherLeft.center({x: 0, y:0, z:2*ct/4});
  champherLeft.rotate({x:90});
  clip = clip.subtract(champherLeft);
  champherRight.translate({x: cw, z:0, y:0});
  champherLeft.translate({x: cw, z:0, y:0});
  clip = clip.subtract(champherRight).subtract(champherLeft);

  const clipEnd = new CSG.cylinder({start: [0,0,0], end: [0,h,0], radius: cer});
  clipEnd.center({x: cw/2, y:h/2, z:ct-cer/2});

  const clip2 = clip.clone();
  const translation = {x: w + cw, y:0, z:0};
  clip2.translate(translation)
  const blockClip2 = block.union(clip2);
  let m = clip.union(blockClip2);
  const spots = 6;
  for (let i = 0; i < spots; i++) {
    blockClip2.translate(translation);
    m = m.union(blockClip2);
  }

  const dems = m.demensions();
  const epts = m.endpoints();
  const champher = new CSG.cube({radius: [dems.x*2,h/3,h/3]});
  champher.rotate({x:45})
  champher.center({x:dems.x/2, y:epts.y, z:epts.z});
  m = m.subtract(champher);
  champher.center({x:dems.x/2, y:0, z:epts.z});
  m = m.subtract(champher);

  const bAse = m.clone();
  bAse.rotate({x:-90});
  bAse.translate({x:0,y:0,z:h});
  let mBase = m.union(bAse);
  mBase.translate({x:0, y:0, z:h + .3});
  m.rotate({x:-90});
  m.translate({x:0,y:0,z:h});
  mBase.polygons.concatInPlace(m.polygons);
  return mBase;
}

models['Sink Drain Plate'] =  (isTpuSeal)  => {
  const diameter = (2/16 + 3.25) * 2.54;
  const overhang = 3*2.54 / 8;
  const sealRingWidth = 2.54/8;
  const thickness = 2.54/4;
  const subThickness = 2.54/2;
  const subWallThickness = 2.54/4;
  const solidBottomRadius = diameter / 2;// - sealRingWidth;
  const slices = 64;
  let topPlate = new CSG.cylinder({slices, start: [0,0,0], end: [0,thickness,0], radius: diameter/2 + overhang});

  let bottomStructure = new CSG.cylinder({slices, start: [0,0,0], end: [0,-subThickness,0], radius: solidBottomRadius});
  const stopperWidth = sealRingWidth/3;
  let sealStopper = new CSG.cylinder({slices, start: [0,-subThickness,0], end: [0,-subThickness + stopperWidth,0], radius: diameter / 2 - stopperWidth});
  sealStopper = sealStopper.subtract(bottomStructure);
  let sealRing = new CSG.cylinder({start: [0,-subThickness+stopperWidth,0], end: [0,-subThickness + sealRingWidth + stopperWidth,0], radius: diameter / 2});
  let sealRing2 = new CSG.cylinder({start: [0,-subThickness+stopperWidth,0], end: [0,-subThickness + sealRingWidth + stopperWidth,0], radius: diameter / 2 + 2.54/16});
  sealRing2 = sealRing2.subtract(bottomStructure);
  sealRing2.translate({x: 3.5*2.54, y:0,z:0});
  sealRing = sealRing.subtract(bottomStructure);
  sealRing.add(sealRing2);
  sealRing.setColor('black');
  const bottomCutter = new CSG.cylinder({slices, start: [0,0,0], end: [0,-subThickness,0], radius: solidBottomRadius - subWallThickness/2});
  bottomStructure = bottomStructure.subtract(bottomCutter);
  const structureSupport = new CSG.cube({radius: [solidBottomRadius - .1, subThickness/2, subWallThickness/2], center: [0,-subThickness/2,0]});

  let sideChannel = new CSG.cylinder({slices, start: [diameter, 0,0], end: [-diameter, 0, 0], radius: 3*thickness/4});
  const centerSupportRadius = 2*solidBottomRadius/3;
  const sideChannelCutter = new CSG.cube({radius: [centerSupportRadius, subThickness, centerSupportRadius], center: [0,0, 0]});
  sideChannel = sideChannel.subtract(sideChannelCutter);

  const handleWidth = .9*centerSupportRadius;
  const handleYoff = 2.54;
  const legRadius = 2*thickness/3
  let handle =  new CSG.cube({radius: [handleWidth, thickness, thickness/2], center: [0,thickness + handleYoff,0]});
  const handleLeg = new CSG.cylinder({slices: 4, start:[0,-subThickness,0], end: [0,subThickness+handleYoff,0], radius: legRadius});
  handleLeg.rotate({x:0, y:45,z:0});
  handleLeg.translate({x:handleWidth - legRadius,y:0,z:0});
  handle.add(handleLeg);
  handleLeg.translate({x:-2*handleWidth + 2*legRadius,y:0,z:0});
  handle.add(handleLeg);
  handle.rotate({x:0, y:-30,z:0});

  const explodedHandle = handle.clone();
  explodedHandle.explode(.1);
  // topPlate = topPlate.subtract(handle);

  structureSupport.rotate({x:0,y:15,z:0});
  bottomStructure.add(structureSupport);
  structureSupport.rotate({x:0,y:90,z:0});
  bottomStructure.add(structureSupport);
  let model = topPlate;
  model.add(bottomStructure);
  // model.add(sealStopper);
  // sealStopper.translate({x:0,y:sealRingWidth+stopperWidth+.03,z:0});
  // model.add(sealStopper);
  for (let index = 0; index < 8; index ++) {
    model  = model.subtract(sideChannel);
    sideChannel.rotate({x:0, y: 180/8, z:0});
  }

  model.add(sealStopper);
  // model.polygons.concatInPlace(handle.polygons);
  return isTpuSeal ? sealRing : model;
}

models['hingeRouterFence'] =  (isStopper, plateWidth, plateDepth, bitSize, routerDiameter, plateCornerRadius, slotWidth)  => {
  plateWidth ||= 4*2.54;
  plateDepth ||= 1.75 * 2.54;
  routerDiameter ||= 4*2.54;
  bitSize ||= 2.54/2;
  plateCornerRadius ||= 2.54/2;
  routerRadius = routerDiameter/2 - bitSize/2;
  slotWidth ||= 3*2.54/16;
  const cutterRadius = routerRadius + plateCornerRadius;

  const gerth = 2;
  const width = plateWidth + routerRadius*2 + .01;
  const height = plateDepth + routerRadius*2;
  let fence = new CSG.cube({radius: [(width + gerth*2)/2, gerth/4, (height+gerth)/2], center: [0,0, 0]});
  let stopper = new CSG.cube({radius: [(width + gerth*2)/2, gerth/4, gerth/2], center: [0,0, 0]});
  const squareCutter = new CSG.cube({radius: [width/2 - cutterRadius, gerth/2, height/2], center: [0,0, 0]});
  const freeSideCutter = new CSG.cube({radius: [width/2, gerth, height/2 + gerth], center: [0,0, 0]});
  freeSideCutter.translate({x:0,y:0,z:-cutterRadius-gerth});

  const roundCutterLeft = new CSG.cylinder({start: [width/2 - cutterRadius, -gerth, height/2 - cutterRadius],
                                            end: [width/2 - cutterRadius, gerth, height/2 - cutterRadius],
                                            radius: cutterRadius,
                                            slices:32
                                          });
  const roundCutterRight = roundCutterLeft.clone();
  roundCutterRight.translate({x: -width + 2*cutterRadius,y:0,z:0});

  const adjustmentGrooveRight = new CSG.cube({radius: [slotWidth/2, gerth, (height-gerth)/2,], center: [width/2 + gerth/2, 0,0]});
  const adjustmentGrooveLeft = adjustmentGrooveRight.clone();
  adjustmentGrooveLeft.translate({x:-width - gerth, y:0, z:0});

  const threeSixtenths = new CSG.cylinder({slices: 24, radius: slotWidth/2});
  threeSixtenths.center(adjustmentGrooveLeft.center());
  stopper = stopper.subtract(threeSixtenths);
  threeSixtenths.center(adjustmentGrooveRight.center());
  stopper = stopper.subtract(threeSixtenths);

  stopper.rotate({x:90,y:0,z:0});
  stopper.setColors(String.color.next);
  if (isStopper) return stopper;
  fence = fence.subtract(roundCutterLeft).subtract(roundCutterRight);
  const model = fence.subtract(freeSideCutter).subtract(squareCutter).subtract(adjustmentGrooveRight).subtract(adjustmentGrooveLeft);
  model.rotate({x:90,y:0,z:0});
  model.setColors(String.color.next);
  return model;
}

models['Well Spacer'] =  (width, length, depth, slot, lipOverlay, lipThickness, lengthOffset)  => {
  width ||= 3*2.54/8 - .01;
  length ||= (1.75 * 2.54 + 3)*2; -.01;
  depth ||= 2.9;
  slot ||= 3*2.54/16;
  lipOverlay ||= .5;
  lipThickness ||= 2.54/8;
  const offset = lengthOffset || width-slot;
  const well = new CSG.cube({radius: [width/2,length/2,depth/2]});
  const lip = new CSG.cube({radius: [width/2 + lipOverlay, length/2+lipOverlay, lipThickness/2],
                            center: [0,0,depth/2 - lipThickness/4]});
  const slotCutter = new CSG.cube({radius: [slot/2, length/2 - offset/2, depth]});
  return well.union(lip).subtract(slotCutter);
};

models['screen door latch spacer'] = () =>{
  let offset = 2.54/2 - 2.54/16;
  let stepLen = 5*2.54/16;
  let stepHeight = 2.54/2 + 2.54/16;
  let length = 5*2.54/2;
  let width = 3*2.54/4;
  const spacer = new CSG.cube({radius: [width/2,length/2,offset/2]});
  const step = new CSG.cube({radius: [(width - stepLen)/2, length/2, stepHeight/2],
                        center: [width/2 - (width - stepLen)/2, 0, offset/2 + stepHeight/2]});
  let topScrewHole = new CSG.cylinder({slices: 8, start: [.2,0,-stepHeight - offset],
                                    radius: 3*2.54/32, end: [.2,0,stepHeight + offset]});
  let topScrewResess = new CSG.cylinder({slices: 8, start: [.2,0, -offset/2],
                                    radius: 5*2.54/32, end: [.2,0, -offset/2 + 3*2.54/16 ]});
  topScrewHole = topScrewHole.union(topScrewResess);
  const bottomScrewHole = topScrewHole.clone();
  topScrewHole.translate({x:0,y:length/2 - 2.54/4,z:0});
  bottomScrewHole.translate({x:0,y:length/-2 + 2.54/4,z:0});
  return spacer.union(step).subtract(topScrewHole).subtract(bottomScrewHole);
}

models['screen door latch'] = () =>{
  const barRadius = 5*2.54/32 - .01;
  const bar = new CSG.cube({radius: [barRadius, barRadius, 3]});
  return bar;
}

models['shifter boot bracket'] = (innerWidth, innerDepth, innerHeight, bracketWidth, bracketHeight,
                      innerLip, bracketThickness, topHoleDia, bottomHoleDia, champherAngle,
                      champherDepth, prongHeight, prongDia) => {
  innerWidth ||= 10;
  innerDepth ||= 13.75;
  innerHeight ||= 3;
  bracketWidth ||= 3.9;
  bracketHeight ||= 1.5;
  innerLip ||= 1;
  bracketThickness ||= .25;
  topHoleDia ||= 1;
  bottomHoleDia ||= 3*2.54/16;
  champherAngle ||= 45;
  champherDepth ||= 2;
  prongHeight ||= .9;
  prongDia ||= .3;

  const bt = bracketThickness;

  const insideCutout = new CSG.cube({demensions: [innerWidth, innerHeight, innerDepth]});
  const dbw = bracketWidth * 2;
  let bracket = new CSG.cube({demensions: [innerWidth+dbw, bracketHeight, innerDepth+dbw]});
  bracket.translate({x: 0, y: innerHeight/2-bracketHeight/2, z: 0});
  bracket = bracket.subtract(insideCutout);

  const champerBracket = (innerLen, rotation, offset, direction, xOz) => {
    const champher = new CSG.cube({demensions: [champherDepth, champherDepth, 100]});
    let underCut = new CSG.cube({demensions: [champherDepth, champherDepth, innerLen]});

    const x = xOz ? 'x' : 'z';
    const z = xOz ? 'z' : 'x';
    const depth = xOz ? innerDepth : innerWidth;
    const width = xOz ? innerWidth : innerDepth;
    const radius = 6;
    const hype = Math.sqrt((radius)*(radius)*2)/2

    let innerMiter1 = new CSG.cube({radius});
    const innerOffset1 = new CSG.Vector(offset).clone();
    innerOffset1[z] = -depth/2 - hype;
    innerOffset1[x] = direction * (-width/2 + hype);
    innerMiter1.rotate({y:-45});
    innerMiter1.translate(innerOffset1);

    let innerMiter2 = new CSG.cube({radius});
    const innerOffset2 = new CSG.Vector(offset).clone();
    innerOffset2[z] = depth/2 + hype;
    innerOffset2[x] = direction * (-width/2 + hype);
    innerMiter2.rotate({y:-45});
    innerMiter2.translate(innerOffset2);


    champher.rotate(rotation);
    underCut.rotate(rotation);
    champher.translate(offset);
    underCut.translate(offset);
    const translation = {y: -Math.sin(Math.toRadians(45)) * (bt + champherDepth), x:0, z:0};
    if (xOz) translation.x = direction * Math.cos(Math.toRadians(45)) * (bt + champherDepth);
    else translation.z = direction * Math.cos(Math.toRadians(45)) * (bt + champherDepth);
    underCut.translate(translation);
    underCut = underCut.subtract(innerMiter1).subtract(innerMiter2);
    bracket = bracket.subtract(champher).subtract(underCut);
  }

  let rotation = {z:champherAngle};
  let offset = {x: innerWidth/2 + bracketWidth, y: innerHeight/2, z:0};
  champerBracket(innerDepth+bracketWidth*2, rotation, offset, -1, true);

  rotation = {z:-champherAngle};
  offset = {x: -(innerWidth/2 + bracketWidth), y: innerHeight/2, z:0};
  champerBracket(innerDepth+bracketWidth*2, rotation, offset, 1, true);

  rotation = [{y: 90}, {x:-champherAngle}];
  offset = {z: -(innerDepth/2 + bracketWidth), y: innerHeight/2, x:0};
  champerBracket(innerWidth+bracketWidth*2, rotation, offset, 1, false);

  rotation = [{y: 90}, {x:champherAngle}];
  offset = {z: innerDepth/2 + bracketWidth, y: innerHeight/2, x:0};
  champerBracket(innerWidth+bracketWidth*2, rotation, offset, -1, false);

  const dil = innerLip * 2;
  const dbt = bracketThickness * 2
  const dilAdbt = dil + dbt;
  let squareSupport = new CSG.cube({demensions: [innerWidth + dilAdbt, innerHeight, innerDepth+dilAdbt]});
  const squareSupportCutter = new CSG.cube({demensions: [innerWidth + dil, innerHeight, innerDepth+dil]});
  squareSupportCutter.translate({x:0,y:-bracketThickness,z:0});
  let model = bracket.union(squareSupport).subtract(squareSupportCutter).subtract(insideCutout);


  const slices = 48;
  const hole = new CSG.cylinder({slices, start: [0,-innerHeight/2 + bt, 0], end: [0,100,0], radius: topHoleDia/2});
  const screwWell = new CSG.cylinder({slices, start: [0,-innerHeight/2, 0], end: [0,innerHeight/2,0], radius: topHoleDia/2 + bt});
  const pilotHole = new CSG.cylinder({slices, start: [0,-100, 0], end: [0,100,0], radius: bottomHoleDia/2});

  offset = {x: innerWidth/2 + topHoleDia/2 + dbt/2, z: innerDepth/2 + topHoleDia/2 + dbt/2, y:0};
  hole.translate(offset);
  screwWell.translate(offset);
  pilotHole.translate(offset);
  model = model.union(screwWell).subtract(hole).subtract(pilotHole);

  offset = {x: -(innerWidth + topHoleDia + dbt), z:0 , y:0};
  hole.translate(offset);
  screwWell.translate(offset);
  pilotHole.translate(offset);
  model = model.union(screwWell).subtract(hole).subtract(pilotHole);

  offset = {x: 0, z: -(innerDepth + topHoleDia + dbt), y:0};
  hole.translate(offset);
  screwWell.translate(offset);
  pilotHole.translate(offset);
  model = model.union(screwWell).subtract(hole).subtract(pilotHole);

  offset = {x: innerWidth + topHoleDia + dbt, z:0 , y:0};
  hole.translate(offset);
  screwWell.translate(offset);
  pilotHole.translate(offset);
  model = model.union(screwWell).subtract(hole).subtract(pilotHole);

  let start = [0, innerHeight/2 - bracketThickness, 0];
  let end = [0, innerHeight/2 - bracketThickness - 2*prongHeight/3, 0];
  let prong = new CSG.cylinder({slices, start, end, radius: prongDia/2});
  start = end;
  end = [0, innerHeight/2 - bracketThickness - prongHeight, 0];
  let coneTip = new CSG.cone({slices, start, end, radius: prongDia/2, color: 'red'});
  let bluntTip = new CSG.cube({radius:.1, center: end});
  prong = prong.union(coneTip.subtract(bluntTip));

  const y = prong.center().y;
  const x = 5.2;
  const z = 7.075;
  const prongPoints = [
    {x: -2.95, y, z},
    {x: 1.65, y, z},
    {x: 2.95, y, z},
    {x, y, z: -5.24},
    {x, y, z: -1.785},
    {x, y, z: 1.785},
    {x, y, z: 5.24},
    {x: 2.95, y, z: -z},
    {x: -2.95, y, z: -z},
    {x: -x, y, z: 5.24},
    {x: -x, y, z: 1.785},
    {x: -x, y, z: -1.785},
    {x: -x, y, z: -5.24}
  ];

  prongPoints.forEach(p => {
    prong.center(p);
    model = model.union(prong);
  });

  let prongClip = new CSG.cylinder({slices, radius: .5, start: [0,0,0], end: [0,.3,0]});
  let splitCone = new CSG.cone({slices, radius: .5, start: [0,0,0], end: [0,.6,0]});
  // prongClip = prongClip.subtract(splitCone);
  const splitConeCavity = new CSG.cone({slices, radius: .4, start: [0,0,0], end: [0,.4,0]});
  splitCone = splitCone.subtract(splitConeCavity);
  splitter = new CSG.cube({demensions: [10, 10, .08]});
  splitCone = splitCone.subtract(splitter);
  splitter.rotate({y:60});
  splitCone = splitCone.subtract(splitter);
  splitter.rotate({y:60});
  splitCone = splitCone.subtract(splitter);
  // prongClip = splitCone.union(prongClip);
  const prongHole = new CSG.cylinder({slices, radius: prongDia/2 - .01, start: [0,-10,0], end: [0,10,0]});
  prongClip = prongClip.subtract(prongHole);
  prongClip.rotate({x:90})

  return prongClip;
}

models['Blum Narrow Rear Bracket Jig'] = () => {
  const height = 7.5;
  const width = 4;

  const sleeveOuterRadius = .435;
  const retainingLip = .1;
  const sleeveInnerRadius = sleeveOuterRadius - retainingLip;
  const sleeveLength = 2.54/2;
  const thickness = sleeveLength + .01 + retainingLip*2;

  const slices = 128;

  let body = new CSG.cube({demensions: [width, height, thickness]});

  const steps = [{length: sleeveLength, radius: sleeveOuterRadius + .05},
                  {length: thickness*2, radius: sleeveInnerRadius}];
  const stepCyl = new CSG.cylinder.step(steps, {slices});

  const holeCenters = [{x:-width/2+1.44,y:-height/2+1.6, z:0},
                        {x:-width/2+2.88,y:-height/2+4.6, z:0}];

  holeCenters.forEach(c => {
    stepCyl.center(c);
    body = body.subtract(stepCyl);
  });

  const cornerCutter = new CSG.cylinder({start:[0,0,0], end: [0,0,thickness*2], radius: 2.54/2, slices});
  const corners = [{x: width/2, y: height/2, z:0}, {x: -width/2, y: height/2, z:0}, {x: width/2, y: -height/2, z:0}]
  corners.forEach(c => {
    cornerCutter.center(c);
    body = body.subtract(cornerCutter);
  });

  const champh = .5;
  const champerCorner = new CSG.cube({demensions: [champh,champh*4,champh*4]});
  champerCorner.rotate({z:45});
  champerCorner.center({x:-width/2, y:-height/2, z:0});

  body = body.subtract(champerCorner);

  return body;//.union(champerCorner);// base.subtract(axis).union(axis);//.subtract(axis);//elivated.union(base);
};

models['Uberest Drawer Jigs'] = (guideHeight, guideReveal, bottomGap,
      bumperThickness, sleeveOuterRadius, retainingLip, sleeveLength,
      innerRailHeight, innerRailInsetDepth) => {
  bumperThickness ||= 2.54/8;
  guideHeight ||= 3.95
  guideReveal ||= 2.54/16;
  bottomGap ||= 2.54/8;
  retainingLip ||= .1;
  sleeveOuterRadius ||= .435;
  sleeveInnerRadius = sleeveOuterRadius - retainingLip;
  sleeveLength ||= 2.54/2;
  innerRailHeight ||= 2;
  innerRailInsetDepth ||= .2;
  thickness = sleeveLength + .01 + retainingLip*2;
  const minDbGuideReveal = 2.54/4;

  const centerCabinetGuide = {
    y: guideHeight/2 + bottomGap + minDbGuideReveal, x: .65 + guideReveal, z:thickness/2
  }
  let cabinetGuideJig = new CSG.cube.champhered({radius: [centerCabinetGuide.x, centerCabinetGuide.y, thickness/2], edges: [true], depth: .2});
  cabinetGuideJig.center({x: centerCabinetGuide.x, y:centerCabinetGuide.y, z: thickness/2})

  const lipSize = [2.54/4, centerCabinetGuide.y * 2 + 2.54/2, thickness + 2.54/2];
  const lipCenter = [lipSize[0]/-2, lipSize[1]/2 - 2.54/4, lipSize[2]/2 - 2.54/4];
  const lip = new CSG.cube({demensions: lipSize, center: lipCenter})

  const slices = 128;
  // const steps = [{length: sleeveLength, radius: sleeveOuterRadius + .05},
  //                 {length: thickness*2, radius: sleeveInnerRadius}];
  const steps = [{length: thickness*2, radius: sleeveInnerRadius}];
  let drillHole = new CSG.cylinder.step(steps, {slices});
  drillHole.center(centerCabinetGuide);
  cabinetGuideJig = cabinetGuideJig.union(lip).subtract(drillHole);

  const guideLen = 2.54*6;
  const demsBase = [guideLen, 2.54/4, 2.54*5/4];
  const centerBase = [demsBase[0]/2, demsBase[1]/2, 0];
  let drawerGuideJig = new CSG.cube({demensions: demsBase, center: centerBase});

  const demsRail = [guideLen, (guideHeight - innerRailHeight)/2 + minDbGuideReveal, 2.54/4];
  const railCenter = [demsRail[0]/2, demsBase[1] + demsRail[1]/2, 0];
  const centerRail = new CSG.cube({demensions: demsRail, center: railCenter});

  const shimSize = innerRailInsetDepth + bumperThickness + guideReveal;
  const demsStop = [shimSize, 2.54/2, 2.54/4];
  const centerStop = [shimSize / 2, demsBase[1] + demsRail[1] + demsStop[1]/2, 0];
  const stopShim = new CSG.cube({demensions: demsStop, center: centerStop});

  drawerGuideJig = drawerGuideJig.union(centerRail).union(stopShim);
  drawerGuideJig.rotate({x: 90, z: 90});
  cabinetGuideJig.rotate({y: -90});
  drawerGuideJig.center({x: 2.54,y: drawerGuideJig.demensions().y/2, z: drawerGuideJig.demensions().z/2});
  cabinetGuideJig.center({x:-2.54, y: cabinetGuideJig.demensions().y/2, z:cabinetGuideJig.demensions().z/2});

  return {cabinetGuideJig, drawerGuideJig};
}

models['chrismas tree leg'] = (guideHeight, guideReveal, bottomGap) => {
  const body = new CSG.cube({demensions: [9*2.54, 7.5, 1.4]});
  const bottomCutter = new CSG.cube({demensions: [8.25*2.54, .75, 1.4]})
  const slotCutter = new CSG.cube({demensions: [.92, 7.5, .725]});
  const endPiece = new CSG.cube({demensions: [.32, 7.5 - .75 - .28, 1.4]});
  const angleCutter = body.clone();
  let stopperRadius = .1
  const stopper = new CSG.Point({x:9*2.54/2 - .32, y: -7.5/2 + 1 + .75, z: -.725/2}, stopperRadius, 'green');
  angleCutter.rotate({z:15.5});
  angleCutter.translate({x:-2,y:4.3,z:0});

  body.center({x:0,y:0,z:0});
  bottomCutter.center({x:3*2.54/8, y:-3.75 + 3/8, z:0});
  body.setColor('blue');
  bottomCutter.setColor('green');
  angleCutter.setColor('blue');
  slotCutter.setColor('blue');
  endPiece.setColor('red')
  stopper.setColor('green');

  let model = body.subtract(angleCutter);
  slotCutter.center({x:9*2.54/2 - .46, y: 1.1, z: -.57/2 - .725/2});
  endPiece.center({x:9*2.54/2 - .16, y: .14 + .375, z: 0});
  let stopper2 = stopper.clone();
  stopper2.translate({x:0,y:0,z:stopperRadius*-2});
  model=model.subtract(slotCutter).union(stopper).union(stopper2);
  stopper.translate({x:0,y:0,z:.725});
  slotCutter.translate({x:0,y:0,z:.57+.725});
  const cropper = body.clone();
  cropper.translate({x:-1.1,y:0,z:0});
  stopper2 = stopper.clone();
  stopper2.translate({x:0,y:0,z:stopperRadius*2});
  return model.subtract(slotCutter).union(endPiece).subtract(bottomCutter)
      .union(stopper2).union(stopper);//.subtract(cropper);
}

function crownSupportShape(rise, run, backOffset, edgeOffset, bracketWidth, bracketGerth) {
  const points = [
    {x: bracketGerth, y: backOffset + bracketGerth, z:0},
    {x: bracketGerth, y: rise - edgeOffset-bracketGerth, z:0},
    {x: (edgeOffset * rise) / run, y: rise - edgeOffset - bracketGerth, z:0},


    {y: (edgeOffset * run) / rise, x: run - edgeOffset - bracketGerth, z:0},
    {x: run-edgeOffset-bracketGerth, y:bracketGerth, z:0},
    {x: backOffset + bracketGerth, y:bracketGerth, z:0}
  ];
  const poly = CSG.Polygon.fromVertices(points);
  const csg = CSG.fromPolygon(poly, bracketWidth);
  return csg;
}

const inch = v => v*2.54;
models['crown support'] = (bracketGerth) => {
  bracketGerth = inch(.25);
  let crownSS = crownSupportShape(inch(3.5), inch(3.5), inch(.5), inch(.5), inch(1/2), 0);
  const crownSSCutter = crownSupportShape(inch(3.5), inch(3.5), inch(.5), inch(.5), inch(1/2), inch(.25));
  crownSSCutter.center(crownSS.center());
  crownSS = crownSS.subtract(crownSSCutter);
  const screwHole = new CSG.cylinder.step([{length: bracketGerth*2}]);

  const fontVerts = crownSSCutter.polygons[0].vertices;
  const backVerts = crownSSCutter.polygons[1].vertices.map(v => v.clone()).reverse();
  [2,4,6].forEach(i => {
    const poly = crownSSCutter.polygons[i];
    const center = new CSG.Vector(poly.center().pos);
    const translation = poly.plane.normal.times(bracketGerth*2);
    const outerCenter = center.plus(translation);
    const start = [center.x, center.y, center.z];
    const end = [outerCenter.x, outerCenter.y, outerCenter.z];
    const screwHole = new CSG.cylinder({start, end, radius: inch(3/32), slices: 36});
    crownSS = crownSS.subtract(screwHole);
  });

  return crownSS;
}


const cnt = du.create.element('div');
const controls = du.create.element('div', {style: 'float: left'});
const display = du.create.element('div', {id: 'stl-three-d-model-cnt'});
const orientCnt = du.create.element('div', {class: 'orientation-controls'});
document.body.append(cnt);cnt.append(controls,display);display.append(orientCnt);

const select = document.createElement('select');
select.innerHTML = Object.keys(models).map(k => `<option>${k}</option>`);
const argCnt = document.createElement('div');
const downloadBtn = document.createElement('button');
downloadBtn.innerText = 'Stl';
controls.append(select);
controls.append(argCnt);
controls.append(downloadBtn);

const inputValue = i => i.type === 'checkbox' ? i.checked : i.value;
const getSelected = () => {
  let args = du.find.downAll('input', argCnt).map(inputValue);
  args = args.map(a => Boolean.is(a) ? a : Number.parseFloat(a));
  return models[select.value](...args);
}

const getModel = () => {
  const modelOmodels = getSelected();
  modelList = modelOmodels instanceof CSG ? [modelOmodels] : Object.values(modelOmodels);
  const model = new CSG();
  modelList.forEach(m => model.polygons.concatInPlace(m.polygons));
  // console.log(modelList.map(m => m.toDrawString(String.color.next())).join('\n\n'));
  model.scale(10);
  return model;
  // return new CSG.text('Hello World');
}

viewer = new Viewer(new CSG(), 500, 500, 50);
const orientSelector = `#stl-three-d-model-cnt .orientation-controls`;
const orientArrows = OrientationArrows.forCSG(orientSelector, viewer, getModel);


const updateModel = () => {
  const model = getModel();
  viewer.mesh = model.toMesh();
  viewer.gl.ondraw();
}


const updateArgs = (arg) => {
  if (arg !== undefined){
    const name = select.value;
    argCnt.innerHTML = models[name].Arguments().map(a => {
      const type = a.match(/^is[A-Z]/) ? 'checkbox' : 'number';
      return `<label>${a}</label><br/><input type='${type}'\><br/>`;
    }).join('\n');
  }
  updateModel();
}



const download = () => {
  addLinks(getSelected(), select.value);
}

select.value = 'crown support';

du.on.match('change', 'input', updateModel);

select.addEventListener('change', updateArgs);
downloadBtn.addEventListener('click', download);
updateArgs();

addViewer(viewer, '#stl-three-d-model-cnt');
