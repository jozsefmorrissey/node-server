
const Vertex3D = require('../../../../three-d/objects/vertex.js');
const Polygon3D = require('../../../../three-d/objects/polygon.js');
const Line3D = require('../../../../three-d/objects/line.js');
const Plane = require('../../../../three-d/objects/plane.js');
const BiPolygon = require('../../../../three-d/objects/bi-polygon.js');
const KeyValue = require('../../../../../../../public/js/utils/object/key-value.js');
const Assembly = require('../../assembly.js');
const Cutter = require('../cutter.js');
const CSG = require('../../../../../../../public/js/utils/3d-modeling/csg.js');
const DividerSection = require('./partition/divider.js');
const Pattern = require('../../../../division-patterns.js');
const Joint = require('../../../joint/joint.js');
const CustomEvent = require('../../../../../../../public/js/utils/custom-event.js')
const FunctionCache = require('../../../../../../../public/js/utils/services/function-cache.js');

const v = (x,y,z) => new Vertex3D(x,y,z);
class SectionProperties extends KeyValue{
  constructor(config, index, sections, pattern) {
    super({childrenAttribute: 'sections', parentAttribute: 'parentAssembly'})
    const instance = this;
    const getPartFunc = (dir) => config[dir] instanceof Function ? config[dir] : () => instance.getAssembly(config[dir]);
    this.top = getPartFunc('top');
    this.bottom = getPartFunc('bottom');
    this.left = getPartFunc('left');
    this.right = getPartFunc('right');
    this.back = getPartFunc('back');
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();

    this.childConfig = (index) => {
      const iv = this.isVertical;
      if (index === undefined) index = this.sections.length;
      const vert = {
          top: this.top,
          bottom: this.bottom,
          left: () => index === 0 ? this.left() : this.sections[index-1].divider(),
          right: () => index === this.sections.length - 1 ? this.right() : this.sections[index].divider()
        };
      const hor = {
        left: this.left,
        right: this.right,
        top: () => index === 0 ? this.top() : this.sections[index-1].divider(),
        bottom: () => index === this.sections.length - 1 ? this.bottom() : this.sections[index].divider()
      };
      const conf = {
        rotation: config.rotation,
        back: this.back
      };
      const dirFunc = (dir) => conf[dir] = () => iv() ? vert[dir]() : hor[dir]();
      dirFunc('top');dirFunc('bottom');dirFunc('left');dirFunc('right');
      return conf;
    }

    this.subassemblies = [];
    const sectionCutters = [];
    this.userFriendlyId = () => this.getRoot().userFriendlyId(this.id());
    this.allAssemblies = () => this.getRoot().allAssemblies();

    // index ||= 0;
    const coordinates = {inner: [v(),v(10,0,0),v(10,10,0),v(0,0,10)], outer: [v(),v(20,0,0),v(20,20,0),v(0,0,20)]};
    let rotation, innerCenter, outerCenter, outerLength, innerLength, outerWidth, innerWidth = null;
    const temporaryInitialVals = {parent, _TEMPORARY: true};
    Object.getSet(this, temporaryInitialVals, 'parentAssembly');
    Object.getSet(this, {divideRight: false, config, index}, 'divider', 'cover');

    if (sections) {
      for (let index = 0; index < sections.length; index++) {
        const sectionJson = sections[index];
        sectionJson.config = this.childConfig(index);
        this.sections.push(Object.fromJson(sectionJson));
      }
    }
    this.index = () => index;
    pattern ||= new Pattern('z');

    const changeEvent = new CustomEvent('change', true);
    this.on.change = changeEvent.on;
    this.trigger.change = changeEvent.trigger;
    const keyValHash = this.hash;
    let lastHash;
    let running = false;
    this.hash = () => {
      const cover = this.cover();
      let hash = (cover ? cover.hash() : 0) + pattern.toString().hash();
      hash += keyValHash();
      hash += JSON.stringify(coordinates).hash();
      for (let index = 0; index < this.subassemblies.length; index++) {
        hash += this.subassemblies[index].hash(true);
      }
      for (let index = 0; index < this.sections.length; index++) {
        hash += this.sections[index].hash(true);
      }
      if (hash !== lastHash) {
        changeEvent.trigger(instance);
        this.children().forEach(c => c.trigger.change())
      }
      if (this.divideRight()) {
        hash += divider.hash();
      }
      lastHash = hash;
      running = false;
      return hash;
    }

    this.divideRight = () =>
      this.parentAssembly().sectionCount && this.parentAssembly().sectionCount() !== index;
    this.partCode = () => 'S';

    this.locationCode = () => {
      const parent = this.parentAssembly();
      const pc = 'S' + index;
      if (parent && parent.locationCode) return `${parent.locationCode()}_${pc}`;
      return pc;
    };


    this.partName = () => {
      const orientation = this.vertical() ? 'V' : 'H';
      if (!(this.parentAssembly() instanceof SectionProperties)) return orientation;
      const pPartName = this.parentAssembly().partName();
      return `${pPartName}${index}.${orientation}`;
    }

    this.config = () => JSON.copy(config);
    this.coordinates = () => JSON.clone(coordinates);
    this.reverseInner = () => CSG.reverseRotateAll(this.coordinates().inner);
    this.reverseOuter = () => CSG.reverseRotateAll(this.coordinates().outer);
    this.part = () => false;
    this.included = () => false;
    this.joints = [];
    this.coverType = () => this.cover() && this.cover().constructor.name;
    this.vertical = (is) => {
      const curr = instance.value('vertical', is);
      if (is !== undefined && curr !== is) removeCachedValues();
      return curr;
    }
    this.coordinates.valid = () => {
      const c = coordinates
      if (c.inner === undefined || c.outer === undefined)
        return false;
      const abs = Math.abs;
      const iSum = c.inner.map(v => abs(v.x) + abs(v.y) + abs(v.z)).sum()
      const oSum = c.inner.map(v => abs(v.x) + abs(v.y) + abs(v.z)).sum()
      return iSum !== 0 && oSum !== 0 && !Number.isNaN(iSum + oSum);
    }

    this.verticalDivisions = () => {
      const parent = this.parentAssembly();
      if (parent instanceof SectionProperties) return parent.isVertical();
      return false;
    }
    this.rotation = () => {
      if (config.rotation === undefined || config._Type === 'part-code') return {x:0,y:0,z:0};
      if (true || rotation === null) rotation = this.getRoot().evalObject(config.rotation);
      return JSON.copy(rotation);
    }

    this.getCabinet = () => {
      const root = this.getRoot();
      return root.constructor.name === 'Cabinet' ? root : undefined;
    }

    this.root = () => {
      let curr = this;
      while(curr.parentAssembly() instanceof SectionProperties) curr = curr.parentAssembly();
      return curr;
    }

    this.isRoot = () => this.root() === this;



    const clear = (attr) => {
      if (this[attr] instanceof Function && this[attr].clearCache instanceof Function)
      this[attr].clearCache();
      return clear;
    }

    function init () {
      if (instance.sections.length === 0) {
        instance.sections.push(new SectionProperties(instance.childConfig(), 1));
      }
    }

    this.init = init;
    this.dividerCount = () => this.sections.length - 1;
    this.sectionCount = () => this.sections.length || 1;
    this.getSubassemblies = (childrenOnly) => {
      const assems = Object.values(this.sections);
      assems.concatInPlace(sectionCutters);
      const cover = this.cover();
      if (cover) {
        assems.push(cover);
        if (!childrenOnly) assems.concatInPlace(cover.getSubassemblies());
      }
      if (this.divideRight()) {
        assems.push(this.divider());
        if (!childrenOnly) assems.concatInPlace(this.divider().getSubassemblies());
      }
      for (let index = 0; !childrenOnly && index < this.sections.length; index++) {
        assems.concatInPlace(this.sections[index].getSubassemblies());
      }
      return assems;
    }
    this.children = () => this.getSubassemblies(true);

    this.propertyConfig = () => this.getCabinet().propertyConfig();

    this.getAssembly = (locationCode, callingAssem) => {
      if (callingAssem === this) return undefined;
      if (this.locationCode() === locationCode) return this;
      const subAssems = ({}).merge(this.subassemblies);
      sectionCutters.forEach(sc => subAssems[sc.locationCode()] = sc);
      if (subAssems[locationCode]) return subAssems[locationCode];
      if (callingAssem !== undefined) {
        const children = Object.values(this.subassemblies);
        if (this.divideRight()) children.concatInPlace(divider);
        const cover = this.cover()
        if (cover) children.concatInPlace(cover);
        for (let index = 0; index < children.length; index += 1) {
          const assem = children[index].getAssembly(locationCode, this);
          if (assem !== undefined) return assem;
        }
      }
      const pa = this.parentAssembly();
      if (pa !== undefined && pa !== callingAssem && pa.getAssembly)
        return pa.getAssembly(locationCode, this);
      return undefined;
    }

    this.dividerLayout = () => {
      init();
      const dividerOffsetInfo = instance.dividerOffsetInfo();
      const coverage = instance.coverage(dividerOffsetInfo.startOffset, dividerOffsetInfo.endOffset);
      return calcPattern(coverage._TOTAL);
    }

    this.coverage = (startOffset, endOffset) => {
      const info = [];
      const propConfig = this.propertyConfig();
      const isReveal = propConfig.isReveal();
      const isInset = propConfig.isInset();
      const vertical = instance.vertical();
      info._TOTAL = isReveal ?
              (!vertical ? instance.outerLength() : instance.outerWidth()) :
              (!vertical ? instance.innerLength() : instance.innerWidth());

      let overlay, reveal, insetValue;
      if (isReveal) reveal = propConfig.reveal().r.value();
      else if (propConfig.isInset()) insetValue = propConfig('Inset').is.value();
      else overlay = propConfig.overlay();

      for (let index = 0; index < this.sections.length * 2; index += 1) {
        const section = this.sections[Math.ceil((index - 1)/2)];
        let offset = 0;
        const divider = section.divider();
        if (isReveal) {
          if (index % 2 === 0) {
            if (index === 0) info._TOTAL -= reveal;
            else info._TOTAL -= reveal;
          }
          if (index === 0) info.push({overlay: startOffset - reveal / 2});
          if (index === this.sections.length - 1) info.push({overlay: endOffset - reveal / 2});
          else info.push({overlay: (divider.maxWidth() - reveal)/2});
        }  else if (isInset) {
          if (index % 2 === 0) {
            if (index === this.sections.length * 2 - 2) info._TOTAL -= insetValue * 2;
            else info._TOTAL -= (divider.maxWidth() + insetValue * 2);
          }
          info.push({overlay: -insetValue});
        } else {
          if (index % 2 === 0) {
            if (index === this.sections.length * 2 - 2) info._TOTAL += overlay * 2;
            else info._TOTAL += overlay * 2 - divider.maxWidth();
          }
          info.push({overlay: overlay});
        }
      }
      return info;
    }


    // TODO: innerOffset - proorly named and implemented values produced are in the ball park but not correct.
    function updatdSectionPropertiesCoordinates(section, startOuter, startInner, endInner, endOuter, innerOffset) {
      const coords = {};
      const fresh = instance.coordinates();
      const outer = fresh.outer;
      const inner = fresh.inner;
      const rotation = instance.rotation();
      if (!instance.vertical()) {
        const leftOutLine = new Line3D(outer[0], outer[3]);
        const leftInnerLine = new Line3D(inner[0], inner[3]);
        const rightOutLine = new Line3D(outer[1], outer[2]);
        const rightInnerLine = new Line3D(inner[1], inner[2]);
        coords.outer = [leftOutLine.pointAtDistance(startOuter),
                        rightOutLine.pointAtDistance(startOuter),
                        rightOutLine.pointAtDistance(endOuter),
                        leftOutLine.pointAtDistance(endOuter)];
        coords.inner = [
                        leftInnerLine.pointAtDistance((startInner - innerOffset)),
                        rightInnerLine.pointAtDistance((startInner - innerOffset)),
                        rightInnerLine.pointAtDistance((endInner - innerOffset)),
                        leftInnerLine.pointAtDistance((endInner - innerOffset))
                                    ];


      } else {
        const topOutLine = new Line3D(outer[0], outer[1]);
        const topInnerLine = new Line3D(inner[0], inner[1]);
        const bottomOutLine = new Line3D(outer[3], outer[2]);
        const bottomInnerLine = new Line3D(inner[3], inner[2]);
        coords.outer = [topOutLine.pointAtDistance(startOuter),
                        topOutLine.pointAtDistance(endOuter),
                        bottomOutLine.pointAtDistance(endOuter),
                        bottomOutLine.pointAtDistance(startOuter)];
        coords.inner = [topInnerLine.pointAtDistance(startInner - innerOffset),
                        topInnerLine.pointAtDistance(endInner - innerOffset),
                        bottomInnerLine.pointAtDistance(endInner - innerOffset),
                        bottomInnerLine.pointAtDistance(startInner - innerOffset)];
      }
      section.updateCoordinates(coords);
    }


    function calcPattern(dist) {
      try {
        return instance.pattern().calc(dist);
      } catch (e) {
        instance.pattern().calc(dist);
        return instance.pattern('z').calc(dist);
      }
    }


    function setSectionCoordinates(force) {
      if (!force) {
        console.log('Found One!!!!!')
        return;
      }
      if (!instance.coordinates.valid()) {
        console.warn('invalid coordinates');
        return;
      }

      const dividerOffsetInfo = instance.dividerOffsetInfo();
      const coverage = instance.coverage(dividerOffsetInfo.startOffset, dividerOffsetInfo.endOffset);

      if (coverage.length > 1) {
        const patternInfo = calcPattern(coverage._TOTAL);

        let offset = 0;
        const innerOffset = dividerOffsetInfo[0].offset;
        for (let index = 0; index < instance.sections.length; index++) {
          const section = instance.sections[index];
          const patVal = patternInfo.list;
          const overlayOffset = coverage[index * 2].overlay + coverage[index * 2 + 1].overlay;
          let startOuter, startInner, endInner, endOuter;

          startOuter = offset;
          if (index === 0) {
            startInner = dividerOffsetInfo[0].offset;
          } else {
            startInner = startOuter + dividerOffsetInfo[index].offset/2;
          }

          endInner = (startInner + patVal[index] - overlayOffset);
          if (index === instance.sections.length - 1) endOuter = endInner + dividerOffsetInfo[index + 1].offset;
          else endOuter = endInner + dividerOffsetInfo[index + 1].offset / 2;
          if (index < instance.sections.length - 1) section.divideRight(true);
          updatdSectionPropertiesCoordinates(section, startOuter, startInner, endInner, endOuter, innerOffset);
          offset = endOuter;
        }
      }
    }

    this.outerCenter = () => {
      if (true || outerCenter === null) outerCenter = Vertex3D.center(coordinates.outer);
      return outerCenter;
    }

    this.innerCenter = () => {
      if (true || innerCenter === null) innerCenter = Vertex3D.center(coordinates.inner);
      return innerCenter;
    }

    this.outerLength = () => {
      if (true || outerLength === null)
        outerLength = coordinates.outer[0].distance(coordinates.outer[3]);
      return outerLength;
    }

    this.outerWidth = () => {
      if (true || outerWidth === null)
        outerWidth = coordinates.outer[0].distance(coordinates.outer[1]);
      return outerWidth;
    }

    this.innerLength = () => {
      if (true || innerLength === null)
        innerLength = coordinates.inner[0].distance(coordinates.inner[3]);
      return innerLength;
    }

    this.innerWidth = () => {
      if (true || innerWidth === null)
        innerWidth = coordinates.inner[0].distance(coordinates.inner[1]);
      return innerWidth;
    }

    this.divide = (dividerCount, dontUpdateCoords) => {
      init();
      if (!Number.isNaN(dividerCount) && dividerCount !== this.dividerCount()) {
        dividerCount = dividerCount > 10 ? 10 : dividerCount;
        dividerCount = dividerCount < 0 ? 0 : dividerCount;
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount + 1);
          if (!dontUpdateCoords) setSectionCoordinates(true);
          return true;
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = currDividerCount; index < dividerCount; index +=1) {
            const section = new SectionProperties(this.childConfig(), index + 2);
            this.sections.push(section);
          }
          if (!dontUpdateCoords && diff !== 0) setSectionCoordinates(true);
          return diff !== 0;
        }
      }
      return false;
    }

    this.setPattern = (patternObj) => {
      if (patternObj instanceof Pattern) {
        pattern = patternObj;
      }
    }

    this.pattern = (patternStr) => {
      if ((typeof patternStr) === 'string') {
        const sectionCount = patternStr.length;
        const group = this.getCabinet().group().id();
        pattern = new Pattern(patternStr, {group});
        this.divide(sectionCount - 1, true);
        setSectionCoordinates(true);
      } else {
        if (!pattern || pattern.str.length !== this.sectionCount()) {
          const patStr = new Array(this.sectionCount()).fill('z').join('');
          pattern = pattern.clone(patStr);
        }
      }
      return pattern;
    }


    this.longestRadius = () => {
      const oc = this.outerCenter();
      let max = oc.distance(outerCoordinates[0]);
      for (let index = 1; index < outerCoordinates.length; index++) {
        const dist = oc.distance(coordinates.outer[index]);
        if (dist > max) max = dist;
      }
      return max;
    };

    const assemToJson = this.toJson;
    this.toJson = () => {
      const json = assemToJson.apply(this);
      json.pattern = this.pattern().toJson();
      json.subassemblies = this.sections.map((section) => section.toJson());
      return json;
    }

    function removeCachedValues() {
      rotation = innerCenter = outerCenter = innerLength = innerWidth = outerLength = outerWidth = null;
    }

    function updateCoordinates(obj, newCoords) {
      let change = false;
      for (let i = 0; i < 4; i++) {
        const v = obj[i];
        const nv = newCoords[i];
        if (v.x !== nv.x || v.y !== nv.y || v.z !== nv.z) change = true;
        v.x = nv.x;
        v.y = nv.y;
        v.z = nv.z;
        if (Number.isNaN(v.x + v.y + v.z)) {
          console.error('coordinate is NaN!')
        }
      }
      return change
    }

    this.updateCoordinates = (newCoords) => {
      updateCoordinates(coordinates.outer, newCoords.outer) | updateCoordinates(coordinates.inner, newCoords.inner);
      setSectionCoordinates(true);
      removeCachedValues();
    }

    this.reevaluate = () => {
      removeCachedValues(true);
      setSectionCoordinates(true);
    }

    function perpendicularDistance(point, line) {
      if (instance.sectionCount() !== 0) {
        const plane = Plane.fromPointNormal(point, line.vector());
        const intersection = plane.intersection.line(line);
        const distance = line.startVertex.distance(intersection);
        return distance;
      }
      return 0;
    }

    this.dividerOffsetInfo = () => {
    let startOffset = 0;
    let endOffset = 0;

    const coords = this.coordinates();
    const outer = coords.outer;
    const inner = coords.inner;
    if (this.vertical()) {
       startOffset = perpendicularDistance(outer[3], new Line3D(inner[3], inner[2]));
       endOffset = perpendicularDistance(outer[2], new Line3D(inner[2], inner[3]));
     } else {
       startOffset = perpendicularDistance(outer[0], new Line3D(inner[0], inner[3]));
       endOffset = perpendicularDistance(outer[3], new Line3D(inner[3], inner[0]));
     }
     const info = [{offset: startOffset}];
     info.startOffset = startOffset;
     info.endOffset = endOffset;

    let offset = this.isVertical() ? this.outerLength() : this.outerWidth();
    const propConfig = this.propertyConfig();
    for (let index = 0; index < this.sections.length; index += 1) {
      if (index < this.sections.length - 1) {
        const section = this.sections[index];
        const divider = section.divider();
        const offset = divider.maxWidth();
        info[index + 1] = {offset, divider};
      } else {
        info[index + 1] = {offset: endOffset};
      }
    }
    return info;
  }

    let dividerJoint;
    this.dividerJoint = (joint) => {
      if (joint instanceof Joint) dividerJoint = joint;
      else joint = this.getCabinet().value('dividerJoint');
      return joint.clone();
    }

    this.setSection = (constructorIdOobject) => {
      if (constructorIdOobject === null) this.cover(null);
      else {
        let section = SectionProperties.new(constructorIdOobject);
        this.cover(section);
        if (section) {
          section.parentAssembly(this);
        }
      }
    }

    const divider = new DividerSection(this);
    this.divider(divider);
    divider.parentAssembly(this);
    this.value('vertical', false);
    this.pattern().onChange(this.reevaluate);

    const isMatch = (assem, dir) => instance[dir]().isSubPart(assem);
    function isNeigbor(assem) {
      if (instance.divideRight()) {
        if (instance.parentAssembly().isVertical()) {
          return isMatch(assem, 'top') || isMatch(assem, 'bottom');
        } else {
          return isMatch(assem, 'left') || isMatch(assem, 'right');
        }
      }
    }
    const neigborJoint = new Joint(divider.isSubPart, isNeigbor);
    divider.addJoints(neigborJoint);


    function buildCutters () {
      const cabinet = instance.getCabinet();
      const subAssems = Object.values(cabinet.subassemblies).filter((assem) => !assem.constructor.name.match(/^(Cutter|Void|Auto|Section)/))
      for (let index = 0; index < subAssems.length; index++) {
        const reference = subAssems[index];
        let offset = instance.dividerJoint().maleOffset();
        if (reference.thickness() < offset * 1.9) offset = 0;
        const cutter = new Cutter.Reference(reference, cabinet.buildCenter, offset);
        sectionCutters.push(cutter);
        cutter.parentAssembly(instance);
        const dvReg = new RegExp(`${instance.locationCode()}_.*dv(|:.)$`);
        instance.addJoints(new Joint(cutter.locationCode(), dvReg));
      }
    }

    this.borders = () => [this.right, this.left, this.top, this.bottom, this.back]

    this.addJoints = function () {
      for (let i = 0; i < arguments.length; i += 1) {
        const joint = arguments[i];
        if (joint instanceof Joint) {
          const parent = joint.parentAssembly();
          if (parent === undefined) joint.parentAssembly(this);
          const mpc = joint.maleJointSelector();
          const fpc = joint.femaleJointSelector();
          const pc = this.locationCode();
          const locId = joint.locationId();
          if (locId) {
            this.joints.removeWhere(j => j.locationId() === locId);
          }
        }
        this.joints.push(joint.clone(this));
      }
    }

    this.on.parentSet(p => this.getAssembly('c') && this.isRoot() && buildCutters());

    this.toDrawString = (notRecursive) => {
      let str = `//  ${this.userFriendlyId()}:${this.locationCode()}`;
      if (notRecursive !== true)
        this.children().forEach(c => {try {str += c.toDrawString() + '\n\n'} catch (e) {}});
      return str;
    }

    // setTimeout(() => this.addJoints(this.divider()));
  }
}

SectionProperties.joinable = false;

const list = [];
const byId = {};
const tolerance = .04
SectionProperties.updateLinks = (sectionProp) => {
  const id = sectionProp.id();
  if (byId[id] === undefined) {
    byId[id] = sectionProp;
    list.push(sectionProp);
  }
  sectionProp.clearDirections();
  const sectRad = section.longestRadius();
  const sectionOuterCenter = sectionProp.outerCenter();
  const centerDist = {};
  for (let index = 0; index < list.length; index++) {
    if (!other.rotation().equals(this.rotation()))  {
      const other = list[index];
      const otherRad = other.longestRadius();
      const centerDist = sectionOuterCenter.distance(other.outerCenter());
      if (centerDist - tolerance < otherRad + sectRad) {
        const direction = Vertex3D.direction(sectionProp.outerCoordinates(), other.outerCoordinates(), tolerance, true);
        if (direction) {
          if (sectionProp[direction]() === undefined || centerDist < centerDistObj[distance]) {
            sectionProp[direction](other);
            centerDistObj[distance] = centerDist;
          }
        }
      }
    }
  }
}

SectionProperties.new = function (constructorId) {
  const section = Assembly.new.apply(null, arguments);
  return section;
}

SectionProperties.fromJson = (json) => {
  const sections = [];
  const pattern = Pattern.fromJson(json.pattern);
  const sp  = new SectionProperties(json.config, json.index, json.subassemblies, pattern);
  sp.value.all(json.value.values);
  sp.parentAssembly(json.parent);
  sp.cover(Object.fromJson(json.cover));
  if (sp.cover()) sp.cover().parentAssembly(sp);

  json.constructed(() => {
    // sp.addJoints()
    sp.divider().panel().fromJson(json.divider.subassemblies.dv);
    sp.divider().panel().build();
  });
  return sp;
}

SectionProperties.toDrawString = (sp) => {
  const inner = sp.coordinates().inner;
  let coords = inner.map(v => v.to2D('x','y').toString()).join(',');
  const color = String.nextColor();
  let str = `${color}[${coords},${inner[0].to2D('x','y').toString()}]\n`;
  for (let index = 0; index < sp.sections.length; index++)  {
    str += SectionProperties.toDrawString(sp.sections[index]);
  }
  return str;
}

const sections = [];
SectionProperties.addSection = (clazz) => sections.push(clazz);
SectionProperties.list = () => [].concat(sections);

Object.class.register(SectionProperties);
module.exports = SectionProperties;
