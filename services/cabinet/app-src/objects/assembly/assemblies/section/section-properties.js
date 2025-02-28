
const {Vertex3D, Polygon3D, Line3D, Plane, BiPolygon} =
      require('../../../../../../../public/js/utils/canvas/three-d/lib');

const KeyValue = require('../../../../../../../public/js/utils/object/key-value.js');
const Assembly = require('../../assembly.js');
const Divider = require('../divider.js');
const Cutter = require('../cutter.js');
const CSG = require('../../../../../../../public/js/utils/3d-modeling/csg.js');
const Pattern = require('../../../../division-patterns.js');
const Joint = require('../../../joint/joint.js');
const Cut = require('../../../joint/joints/cut.js');
const Dado = require('../../../joint/joints/dado.js');
const ShelveJoint = require('../../../joint/joints/shelve.js');
const PlayJoint = require('../../../joint/joints/play.js');
const Dependency = require('../../../dependency.js');
const CustomEvent = require('../../../../../../../public/js/utils/custom-event.js')
const PropertyConfig = require('../../../../config/property/config.js');
//TODO: create shelve constructor
const Shelve = require('../shelve');
const SectionPropertiesResolver = require('../../resolvers/section-properties.js');

const v = (x,y,z) => new Vertex3D(x,y,z);
class SectionProperties extends KeyValue {
  constructor(config, index, sections, pattern) {
    super({childrenAttribute: 'sections', parentAttribute: 'parentAssembly'})
    const instance = this;
    new SectionPropertiesResolver(this);
    const getPartFunc = (dir) => config[dir] instanceof Function ? config[dir] : () => instance.getAssembly(config[dir]);
    this.top = getPartFunc('top');
    this.bottom = getPartFunc('bottom');
    this.left = getPartFunc('left');
    this.right = getPartFunc('right');
    this.back = getPartFunc('back');
    this.isVertical = () => this.vertical();

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
    this.userFriendlyIndex = () =>
      (this.userFriendlyId().replace(/^.*?([0-9]*)$/, '$1') || 0);
    // index ||= 0;
    const coordinates = {inner: [v(),v(10,0,0),v(10,10,0),v(0,10,0)], outer: [v(),v(20,0,0),v(20,20,0),v(0,20,0)]};
    const temporaryInitialVals = {parent, _TEMPORARY: true};
    Object.getSet(this, temporaryInitialVals, 'parentAssembly');
    Object.getSet(this, {divideRight: false, config, index}, 'divider', 'cover', 'name');
    this.normal = () => this.outerPoly().normal();
    this.normals = () => {
      const outer = this.coordinates().outer;
      const normals = {
        z: this.normal(),
        y: new Line3D(outer[1],outer[2]).vector().positiveUnit(),
      }
      normals.x = normals.z.crossProduct(normals.y).unit();
      return normals;
    }
    this.outerPoly = () => new Polygon3D(coordinates.outer).copy();
    this.innerPoly = () => new Polygon3D(coordinates.inner).copy();

    if (sections) {
      for (let index = 0; index < sections.length; index++) {
        const sectionJson = sections[index];
        sectionJson.config = this.childConfig(index);
        this.sections.push(Object.fromJson(sectionJson));
      }
    }
    this.index = () => index;

    const changeEvent = new CustomEvent('change');
    this.on.change = changeEvent.on;
    this.trigger.change = changeEvent.trigger;
    const keyValHash = this.hash;
    let lastHash;
    let running = false;
    this.hash = () => {
      let hash = this.pattern().hash();
      const cover = this.cover();
      if (cover) hash += cover.hash();
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

    this.divideRight = () => this.parentAssembly() && this.parentAssembly().sectionCount
      && this.parentAssembly().sectionCount() !== index;
    this.partCode = () => 'S';
    this.partName = () => undefined;

    let parentAssembly;
    this.parentAssembly = (pa) => {
      if (pa) {
        parentAssembly = pa;
        instance.trigger.parentSet();
      }
      return parentAssembly;
    }

    this.locationCode = () => {
      const parent = this.parentAssembly();
      const pc = this.partCode();
      if (parent && parent.locationCode) return `${parent.locationCode()}_${pc}`;
      return pc;
    };


    // this.partName = () => {
    //   const orientation = this.vertical() ? 'V' : 'H';
    //   if (!(this.parentAssembly() instanceof SectionProperties)) return orientation;
    //   const pPartName = this.parentAssembly().partName();
    //   return `${pPartName}${index}.${orientation}`;
    // }

    this.config = () => JSON.copy(config);
    const inOutCoord = (inOut) => coordinates[inOut === true ? 'inner' : 'outer'];
    this.coordinates = (inOut) =>  Boolean.is(inOut) ? inOutCoord(inOut) : JSON.clone(coordinates);
    this.inner = () => this.coordinates(true);
    this.outer = () => this.coordinates(false);
    this.coordinates.center = (inOut) => Vertex3D.center(inOutCoord(inOut));
    this.coordinates.len = (inOut) => inOutCoord(inOut)[0].distance(inOutCoord(inOut)[1]);
    this.coordinates.width = (inOut) => inOutCoord(inOut)[0].distance(inOutCoord(inOut)[3]);
    Object.keys(this.coordinates).forEach(key => key.match(/^(inner|outer)$/) ||
            ((this.inner[key] = () => this.coordinates[key](true)) &
            (this.outer[key] = () => this.coordinates[key](false))));


    this.reverseInner = () => CSG.reverseRotateAll(this.coordinates().inner);
    this.reverseOuter = () => CSG.reverseRotateAll(this.coordinates().outer);
    this.part = () => false;
    this.included = () => false;
    this.joints = [];
    this.coverType = () => this.cover() && this.cover().constructor.name;
    this.coverType.sentance = (name) => {
      if (name === undefined) name = this.coverType();
      return name ? name.replace(/Section$/, '').toSentance() : 'Open';
    }
    this.vertical = (is) => {
      const curr = instance.value('vertical', is);
      if (is !== undefined && curr !== is) setSectionCoordinates(true);
      return curr;
    }
    this.coordinates.valid = (inOut) => {
      if (!Boolean.is(inOut)) return this.coordinates.valid(true) && this.coordinates.valid(false);
      const c = this.coordinates(inOut);
      if (c === undefined) return false;
      const sum = c.sum(v => Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z));
      return sum !== 0 && !Number.isNaN(sum);
    }

    this.verticalDivisions = () => {
      const parent = this.parentAssembly();
      if (parent instanceof SectionProperties) return parent.isVertical();
      return false;
    }

    let rotation;
    this.rotation = () => {
      if (config.rotation === undefined || config._Type === 'part-code') return {x:0,y:0,z:0};
      if (rotation === undefined) rotation = this.getRoot().evalObject(config.rotation);
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
    const shelvelessCoverReg = /^(DrawerSection|PanelSection|FalseFrontSection)$/;
    this.getSubassemblies = (childrenOnly) => {
      const assems = Object.values(this.sections);
      assems.concatInPlace(sectionCutters);
      const cover = this.cover();
      if (cover) {
        assems.push(cover);
        if (!childrenOnly) assems.concatInPlace(cover.getSubassemblies());
      }
      assems.push(this.divider());
      if (!childrenOnly) assems.concatInPlace(this.divider().getSubassemblies());

      if (!cover || !cover.constructor.name.match(shelvelessCoverReg))
        assems.concatInPlace(this.shelves());
      for (let index = 0; !childrenOnly && index < this.sections.length; index++) {
        assems.concatInPlace(this.sections[index].getSubassemblies());
      }
      return assems;
    }
    this.children = () => this.getSubassemblies(true);
    this.ancestors = () => {
      const parents = [];
      let curr = this.parentAssembly();
      while (curr) {
        parents.push(curr);
        curr = curr.parentAssembly();
      }
      return parents;
    }

    this.propertyConfig = (...args) => this.getCabinet() ?
          this.getCabinet().propertyConfig(...args) : new PropertyConfig(...args);

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
      const propConfig = this.propertyConfig;
      const isReveal = propConfig('isReveal');
      const isInset = propConfig('isInset');
      const vertical = instance.vertical();
      info._TOTAL = isReveal ?
              (vertical ? instance.outer.len() : instance.outer.width()) :
              (vertical ? instance.inner.len() : instance.inner.width());

      let overlay, reveal, insetValue;
      if (isReveal) reveal = propConfig('r');
      else if (propConfig('isInset')) insetValue = propConfig('is');
      else overlay = propConfig('ov');

      for (let index = 0; index < this.sections.length * 2; index += 1) {
        const section = this.sections[Math.ceil((index - 1)/2)];
        let offset = 0;
        const divider = section.divider();
        const dividerWidth = divider.type() === 'none' ? 0 : divider.thickness();
        if (isReveal) {
          if (index % 2 === 0) {
            if (index === 0) info._TOTAL -= reveal;
            else info._TOTAL -= reveal;
          }
          if (index === 0) info.push({overlay: startOffset - reveal / 2});
          if (index === this.sections.length - 1) info.push({overlay: endOffset - reveal / 2});
          else info.push({overlay: (dividerWidth - reveal)/2});
        }  else if (isInset) {
          if (index % 2 === 0) {
            if (index === this.sections.length * 2 - 2) info._TOTAL -= insetValue * 2;
            else info._TOTAL -= (dividerWidth + insetValue * 2);
          }
          info.push({overlay: -insetValue});
        } else {
          if (index % 2 === 0) {
            if (index === this.sections.length * 2 - 2) info._TOTAL += overlay * 2;
            else info._TOTAL += overlay * 2 - dividerWidth;
          }
          info.push({overlay: overlay});
        }
      }
      return info;
    }

    this.approximateCoverPoly = () => {
      const style = this.resolve('style');
      let coords, offset;
      if (style === 'Inset') {
        coords = this.inner();
        offset = this.resolve('is') * -2;
      } else if (style === 'Reveal') {
        coords = this.outer();
        offset = -this.resolve('r');
      } else {
        coords = this.inner();
        offset = this.resolve('ov') * 2;
      }
      const poly = new Polygon3D(coords).copy();
      if (poly.normals().y.dot(this.normals().y) < .5) {
        poly.normals.swap();
      }
      poly.offset(offset);
      return poly;
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

    this.divide = (dividerCount, dontUpdateCoords) => {
      init();
      if (!Number.isNaN(dividerCount) && dividerCount !== this.dividerCount()) {
        dividerCount = dividerCount > 10 ? 10 : dividerCount;
        dividerCount = dividerCount < 0 ? 0 : dividerCount;
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount + 1);
          if (dividerCount > 2)this.pattern().setStr(this.pattern().str.substring(0, dividerCount));
          setSectionCoordinates(true);
          return true;
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = currDividerCount; index < dividerCount; index +=1) {
            const section = new SectionProperties(this.childConfig(), index + 2);
            this.sections.push(section);
          }
          const patStr = this.pattern().str;
          const patDiff = dividerCount - patStr.length + 1;
          if (patDiff > 0) this.pattern().setStr(patStr + new Array(patDiff).fill('z').join(''));
          if (patDiff < 0) this.pattern().setStr(patStr.substring(0, dividerCount));
          if (diff !== 0) setSectionCoordinates(true);
          return diff !== 0;
        }
      }

      return false;
    }

    this.setPattern = (patternObj) => {
      if (patternObj instanceof Pattern) {
        pattern = patternObj;
        pattern.getter((char) =>
          this.resolve('pattern_a'));
        pattern.on.change(this.reevaluate);
      }
    }
    this.setPattern(pattern || new Pattern('z'));

    this.pattern = (patternStr) => {
      if ((typeof patternStr) === 'string') {
        const sectionCount = patternStr.length;
        const group = this.getCabinet().group().id();
        pattern.setStr(patternStr);
        this.divide(sectionCount - 1, true);
        setSectionCoordinates(true);
      } else {
        if (!pattern) {
          const patStr = new Array(this.sectionCount()).fill('z').join('');
          pattern.setStr(patStr);
        }
      }
      return pattern;
    }


    this.longestRadius = () => {
      const oc = this.outer.center();
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
          throw new Error('opening coordinate is calculation came out to Not A Number')
        }
      }
      return change
    }

    this.updateCoordinates = (newCoords) => {
      updateCoordinates(coordinates.outer, newCoords.outer) | updateCoordinates(coordinates.inner, newCoords.inner);
      setSectionCoordinates(true);
    }

    this.reevaluate = () => {
      if (instance.getRoot() !== instance) setSectionCoordinates(true);
    }

    function perpendicularDistance(point, line) {
      if (instance.sectionCount() !== 0) {
        const plane = Plane.fromPointNormal(point, line.vector());
        const intersection = plane.intersection.line(line);
        const distance = line[0].distance(intersection);
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

      let offset = this.isVertical() ? this.outer.len() : this.outer.width();
      for (let index = 0; index < this.sections.length; index += 1) {
        if (index < this.sections.length - 1) {
          const section = this.sections[index];
          const divider = section.divider();
          const offset = divider.type() === 'none' ? 0 : divider.thickness();
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
        let section = SectionProperties.section(constructorIdOobject);
        this.cover(section);
        if (section) {
          section.parentAssembly(this);
        }
      }
    }

    const divider = new Divider(null, 'Section');
    this.divider(divider);
    divider.included = this.divideRight;
    divider.parentAssembly(this);
    this.pattern().on.change(this.reevaluate);

    const isMatch = (assem, dir) => {
      let target = instance[dir]();
      return target.isPanel(assem);
    }
    function isBorder(assem) {
      return isMatch(assem, 'top') || isMatch(assem, 'bottom') ||
             isMatch(assem, 'left') || isMatch(assem, 'right');
    }
    function isNeigbor(assem) {
      if (instance.divideRight()) {
        if (instance.parentAssembly().isVertical()) {
          return isMatch(assem, 'top') || isMatch(assem, 'bottom');
        } else {
          return isMatch(assem, 'left') || isMatch(assem, 'right');
        }
      }
    }
    const neigborJoint = new Dado(divider.isPanel, isNeigbor, null, 'NEIGHBOR_JOINT');
    neigborJoint.maleOffset(0.635);
    divider.addDependencies(neigborJoint);

    this.neighbors = (divider) => {
      let target = instance[dir]();
      return target.isPanel(assem);

      console.log(assem);
    }


    function shelveNiegbor(assem) {
      if (assem.constructor.name.match(/^(Cabinet|Cutter|Void|Auto|Section|Shelve)/)) return false;
      if (isMatch(assem, 'left') || isMatch(assem, 'right')) return true;
      if (assem instanceof Divider) return false;
      if (assem.locationCode().startsWith('c_S($|:|_)')) return false;
      if (assem.locationCode().match(/^c_[^_]*$/))
        return true;
      return false;
    }

    function shelveNiegbor(assem) {
      if (assem.constructor.name.match(/^(Cabinet|Cutter|Void|Auto|Section|Shelve)/)) return false;
      if (isMatch(assem, 'left') || isMatch(assem, 'right')) return true;
      if (assem instanceof Divider) return false;
      if (assem.locationCode().startsWith('c_S($|:|_)')) return false;
      if (assem.locationCode().match(/^c_[^_]*$/))
        return true;
      return false;
    }


    const shelves = [];
    this.shelves = () => {
      const shelveCount = this.value('shelves') || 0;
      const newShelveCount = shelveCount - shelves.length
      for (let index = 0; index < newShelveCount; index++) {
        const shelve = new Shelve(`:sh${shelves.length + 1}`, 'Shelve');
        shelve.parentAssembly(this);
        const shelveJoint = new ShelveJoint(shelve, shelveNiegbor, null, "shelveJoint");
        const playJoint = new PlayJoint(shelve, /_dv:.{1,}$/, null, 'shelvePlay');
        shelve.addDependencies(shelveJoint, playJoint);
        shelves.push(shelve);
        shelve.getJointList();
      }
      return shelves.slice(0, shelveCount);
    }


    function referenceFront(reference, cabinet) {
      const refCenter = new Vertex3D(reference.position().center());
      const cabCenter = cabinet.buildCenter(true);
      const refDist = refCenter.distance(cabCenter);
      refCenter.translate(reference.position().normals().z);
      const transDist = refCenter.distance(cabCenter);
      return transDist < refDist;
    }


    const boxJoint = (selector, index) => {
      const bj = new Dado(/^dv:[^_]{1,}$/, new RegExp(`^${selector}$`), null, `boxJoint${index}`);
      bj.maleOffset(.9525);
      return bj;
    }

    function cabinetBoxDados() {
      const cabinet = instance.getCabinet();
      const subAssems = Object.values(cabinet.subassemblies).filter((assem) => !assem.constructor.name.match(/^(Cabinet|Cutter|Void|Auto|Section)/));
      const joints = [new Dado(null, isBorder, null,  'f-Joint'),
                      new Cut(null, (a) => a.part(), null,  'PanelSection-Cut')];
      for (let index = 0; index < subAssems.length; index++) {
        const assem = subAssems[index];
        if (assem instanceof Divider) {
          joints.push(boxJoint(assem.locationCode() + ':.*', index));
        } else {
          joints.push(boxJoint(assem.locationCode(), index));
        }
      }
      // TODO: allow dependencies to be added to sectionProperties
      instance.parentAssembly().addDependencies(...joints);
    }

    const borderOrder = ['right', 'left', 'top', 'bottom', 'back'];
    this.borders = () => borderOrder.map(dir => this[dir]);
    this.borders.direction = (border) => {
      const index = borderOrder.findIndex(dir => border === this[dir]());
      if (index === -1)
        throw new Error('invalid border input');
      return borderOrder[index];
    }
    this.borders.neighbors = (border) => {
      switch (this.borders.direction(border)) {
        case 'right': return [this.top(), this.bottom()];
        case 'left': return [this.top(), this.bottom()];
        case 'top': return [this.right(), this.left()];
        case 'bottom': return [this.right(), this.left()];
        case 'back' : throw new Error('this.borders.neighbors is not applicable for back');
      }
    }

    this.on.parentSet(p =>
        this.getAssembly('c') && this.isRoot() && cabinetBoxDados());

    this.toDrawString = (notRecursive) => {
      const color = Color.next();
      const innerStr = this.coordinates().inner.map(v => color + v.toString()).join('\n');
      const outerStr = this.coordinates().outer.map(v => color + v.toString()).join('\n');
      let str = `//  ${this.userFriendlyId()}:${this.locationCode()}\n${outerStr}\n${innerStr}`;
      if (notRecursive !== true)
        this.sections.forEach(c => {try {str += c.toDrawString() + '\n\n'} catch (e) {}});
      return str;
    }
    this.toDrawString2D = (notRecursive) => {
      const color = Color.next();
      const innerStr = this.coordinates().inner.map(v => v.viewFromVector(this.normal()).to2D('x', 'y')).join('\n');
      const outerStr = this.coordinates().outer.map(v => v.viewFromVector(this.normal()).to2D('x', 'y')).join('\n');
      let str = `//  ${this.userFriendlyId()}:${this.locationCode()}\n${outerStr}\n${innerStr}`;
      if (notRecursive !== true)
        this.sections.forEach(c => {try {str += c.toDrawString2D() + '\n\n'} catch (e) {}});
      return str;
    }
  }
}

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
  const sectionOuterCenter = sectionProp.outer.center();
  const centerDist = {};
  for (let index = 0; index < list.length; index++) {
    if (!other.rotation().equals(this.rotation()))  {
      const other = list[index];
      const otherRad = other.longestRadius();
      const centerDist = sectionOuterCenter.distance(other.outer.center());
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

SectionProperties.section = function (constructorId) {
  const section = Assembly.new.apply(null, arguments);
  return section;
}

SectionProperties.toDrawString = (sp) => {
  const inner = sp.coordinates().inner;
  let coords = inner.map(v => v.to2D('x','y').toString()).join(',');
  const color = Color.next();
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

SectionProperties.fromJson = (json) => {
  const sections = [];
  const pattern = Pattern.fromJson(json.pattern);
  const sp  = new SectionProperties(json.config, json.index, json.subassemblies, pattern);
  sp.value.all(json.value.values);
  sp.parentAssembly(json.parent);
  sp.cover(Object.fromJson(json.cover));
  if (sp.cover()) sp.cover().parentAssembly(sp);
  sp.divider().fromJson(json.divider);
  return sp;
}
module.exports = SectionProperties;
