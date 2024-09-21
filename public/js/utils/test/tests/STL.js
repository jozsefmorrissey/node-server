
const STL = require('../../3d-modeling/STL.js');
require('../../3d-modeling/csg');
require('../../utils');
const du = require('../../dom-utils');
const Viewer = require('../../3d-modeling/viewer.js').Viewer;
const addViewer = require('../../3d-modeling/viewer.js').addViewer;

function addLink (model, name) {
  const stl = STL.fromCSG(model);
  console.log(model.toDrawString());
  du.copy(model.toDrawString());

  const link = document.createElement('a');
  link.innerText = name;
  link.href = URL.createObjectURL(stl.binary.file());
  link.download = name.toKebab() + '.stl';

  document.body.append(link);
  link.click();
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
  let notchThickness = .06;
  const cylinder = new CSG.cylinder({start: [0,0,0], end: [0,height,0], radius: width/2});
  const glassCutter = new CSG.cube({radius: [width, height/2, glassThickness/2], center: [0,(height/2) - flapThickness, glassThickness/2]});
  const backNotchCutter = new CSG.cube({radius: [width/2, notchThickness, notchThickness]});
  backNotchCutter.rotate({x:45,y:0,z:0});
  backNotchCutter.center({x:0, y:(height) - flapThickness, z: glassThickness})
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

  let supportSqR = new CSG.cube({radius: [scr,height/2,scr], center: [width/2-scr, height/2, scr/2]}).subtract(glassCutter);
  let supportSqL = new CSG.cube({radius: [scr,height/2,scr], center: [width/-2+scr, height/2, scr/2]}).subtract(glassCutter);


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
    .union(supportSqR)
    .union(supportSqL)
    .subtract(backAngle)
    .subtract(plierSlot)
    .subtract(backNotchCutter);
  return model;
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
  const solidBottomRadius = diameter / 2 - sealRingWidth;
  let topPlate = new CSG.cylinder({start: [0,0,0], end: [0,thickness,0], radius: diameter/2 + overhang});

  let bottomStructure = new CSG.cylinder({start: [0,0,0], end: [0,-subThickness,0], radius: solidBottomRadius});
  const stopperWidth = sealRingWidth/3;
  let sealStopper = new CSG.cylinder({start: [0,-subThickness,0], end: [0,-subThickness + stopperWidth,0], radius: diameter / 2 - stopperWidth});
  sealStopper = sealStopper.subtract(bottomStructure);
  let sealRing = new CSG.cylinder({start: [0,-subThickness+stopperWidth,0], end: [0,-subThickness + sealRingWidth + stopperWidth,0], radius: diameter / 2});
  let sealRing2 = new CSG.cylinder({start: [0,-subThickness+stopperWidth,0], end: [0,-subThickness + sealRingWidth + stopperWidth,0], radius: diameter / 2 + 2.54/16});
  sealRing2 = sealRing2.subtract(bottomStructure);
  sealRing2.translate({x: 3.5*2.54, y:0,z:0});
  sealRing = sealRing.subtract(bottomStructure);
  sealRing = sealRing.union(sealRing2);
  sealRing.setColor('black');
  const bottomCutter = new CSG.cylinder({start: [0,0,0], end: [0,-subThickness,0], radius: solidBottomRadius - subWallThickness/2});
  bottomStructure = bottomStructure.subtract(bottomCutter);
  const structureSupport = new CSG.cube({radius: [solidBottomRadius - .1, subThickness/2, subWallThickness/2], center: [0,-subThickness/2,0]});

  let sideChannel = new CSG.cylinder({slices: 8, start: [diameter, 0,0], end: [-diameter, 0, 0], radius: 3*thickness/4});
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
  handle = handle.union(handleLeg);
  handleLeg.translate({x:-2*handleWidth + 2*legRadius,y:0,z:0});
  handle = handle.union(handleLeg);
  handle.rotate({x:0, y:-30,z:0});

  const explodedHandle = handle.clone();
  explodedHandle.explode(.1);
  // topPlate = topPlate.subtract(handle);

  structureSupport.rotate({x:0,y:15,z:0});
  bottomStructure = bottomStructure.union(structureSupport);
  structureSupport.rotate({x:0,y:90,z:0});
  bottomStructure = bottomStructure.union(structureSupport);
  let model = topPlate;
  model.polygons.concatInPlace(bottomStructure.polygons.concat(sealStopper.polygons));
  sealStopper.translate({x:0,y:sealRingWidth+stopperWidth+.03,z:0});
  for (let index = 0; index < 6; index ++) {
    model  = model.subtract(sideChannel);
    sideChannel.rotate({x:0, y: 180/6, z:0});
  }

  model = model.union(sealStopper);
  model.polygons.concatInPlace(handle.polygons);
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

const cnt = du.create.element('div');
const controls = du.create.element('div', {style: 'float: left'});
const display = du.create.element('div', {style: 'float: right', id: 'display'});
document.body.append(cnt);cnt.append(controls,display);

const select = document.createElement('select');
select.innerHTML = Object.keys(models).map(k => `<option>${k}</option>`);
const argCnt = document.createElement('div');
const downloadBtn = document.createElement('button');
downloadBtn.innerText = 'Stl';
controls.append(select);
controls.append(argCnt);
controls.append(downloadBtn);

const inputValue = i => i.type === 'checkbox' ? i.checked : i.value;
const model = () => {
  let args = du.find.downAll('input', argCnt).map(inputValue);
  args = args.map(a => Boolean.is(a) ? a : Number.parseFloat(a));
  return models[select.value](...args);
}
viewer = new Viewer(new CSG(), 500, 500, 50);

const updateModel = () => {
  console.log(model().toDrawString())
  viewer.mesh = model().toMesh();
  viewer.gl.ondraw();
}

const updateArgs = () => {
  const name = select.value;
  argCnt.innerHTML = models[name].Arguments().map(a => {
    const type = a.match(/^is[A-Z]/) ? 'checkbox' : 'number';
    return `<label>${a}</label><br/><input type='${type}'\><br/>`;
  }).join('\n');
  updateModel();
}

const download = () => {
  addLink(model(), select.value);
}

select.value = 'hingeRouterFence';

du.on.match('change', 'input', updateModel);

select.addEventListener('change', updateArgs);
downloadBtn.addEventListener('click', download);
updateArgs();

addViewer(viewer, '#display');
