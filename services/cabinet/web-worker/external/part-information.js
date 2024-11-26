
const Measurement = require('../../../../public/js/utils/measurement.js');

const disp = val => new Measurement(val).display();
const vertDisp = v => `${disp(v.x)}x${disp(v.y)}`;
const lineDisp = l => `${vertDisp(l[0])}=>${vertDisp(l[1])}`;

const partInfo = {};
let infos = {};
const path = ['group', 'room', 'order'];
class PartInformation {
  constructor(orderOroomOgroupOcabinet) {
    let order = orderOroomOgroupOcabinet;
    path.forEach(k => order[k] && (order = order[k]()));
    const id = order.id();
    const hash = order.hash();
    const rooms = Object.values(order.rooms);
    const groups = rooms.map(r => r.groups.map(g=>g)).concatElements();
    const assemblies = groups.map(g => g.objects.map(o=>o)).concatElements();
    if (partInfo[id] && partInfo[id].hash !== hash) assemblies.forEach(a => a.generatedParts = []);

    Object.values(order.rooms).map(r => r.groups.map(g => g.objects).concatElements()).concatElements();
    const instance = this;
    this.id = String.random();
    this.order = () => order;
    this.finished = (tRuE) =>
      !!(tRuE === true ? (partInfo[id].finished = true) : partInfo[id] && partInfo[id].finished);

    this.hashMap = (empty) => partInfo[id] && partInfo[id].hash === hash ?
    partInfo[id].hashMap : (partInfo[id] = {hash, partCount: 0, hashMap: {}}).hashMap;
    this.parts = () => Object.values(instance.hashMap()).concatElements();

    const nameSort = (o1,o2) => {
      const n1 = o1.parts[0].getRoot().name();
      const n2 = o2.parts[0].getRoot().name();
      return n1 === n2 ? 0 : (n1 < n2 ? 1 : -1);
    };
    const area = (dem) => dem.x * dem.y;
    const areaSort = (pi1, pi2) => area(pi1.demensions) - area(pi2.demensions);
    this.byCategory = (type, parts, sorter) => {
      sorter = sorter === 'area' ? areaSort : nameSort;
      // if (!this.finished()) return null;
      const hashMap = this.hashMap();
      const byCat = {};
      const partLists = {};
      parts ||= this.parts();
      parts.forEach(p => {
        const paths = p.categories.map((g,i) => p.categories.slice(0,i+1).join('.subCategories.'));
        paths.forEach(p => byCat.pathValue(p) || byCat.pathValue(p, {PARTS: []}))
        const path = paths[paths.length - 1];
        const obj = byCat.pathValue(path);
        obj.PARTS.sort(sorter);
        partLists.pathValue(path, obj.PARTS);
        obj.PARTS.push(p);
      });
      if (type) return byCat[type];
      delete byCat.Cabinet;
      return byCat;
    }

    this.byCabinet = (partFilter) => {
      const parts = this.parts().filter(partFilter || (() => true))
                    .filterSplit(p => p.parts[0].getRoot().name());
      Object.keys(parts).forEach((key) => {
        const root = parts[key][0].parts[0].getRoot();
        parts[key] = this.byCategory(null, parts[key], 'area');
        parts[key].property('root', root, false)
      });
      return parts;
    }

    this.cabinets = () => this.byCategory('Cabinet').PARTS;

    this.all = () => {
      // if (!this.finished()) return null;
      const hashMap = this.hashMap();
      return Object.values(instance.hashMap()).concatElements();
    }

    this.match = (regex, attribute) => {
      if (!this.finished()) return null;
      attribute ||= 'category';
      const all = this.all();
      return all.filter(info => info[attribute].match(regex));
    }

    function initialize(info) {
      if (info.model) {
        info.model.part = {};
        info.partsId = String.fromInt(partInfo[id].partCount++, String.range.upper);
        info.model.part[info.partIds[0]] = info.model.csg;
      }
      info.categories =  info.subCategory ? [info.category].concat(info.subCategory) : [info.category];
      return info;
    }

    function mergeParts(target, other) {
      if (target.model) target.model.part[other.partIds[0]] = other.model.csg;
      target.partIds.push(other.partIds[0]);
      target.parts.concatInPlace(other.parts);
      return target;
    }

    const convert = value => (typeof value) === 'number' ?
                          new Measurement(value).display() : value;
    convert.vertex = (v) => [convert(v.x),convert(v.y),convert(v.z)].join(',');
    convert.csg = (csg) => csg.vertices().map(v => convert.vertex(v.pos));

    const eqToString = (csg1, csg2) => csg1.toString() === csg2.toString();
    const eqDisplay = (csg1, csg2) => {
      const dispList1 = convert.csg(csg1);
      dispList1.sort();
      const dispList2 = convert.csg(csg2);
      dispList2.sort();
      return Object.hash(dispList1) === Object.hash(dispList2);
    }
    const eqSubtract = (csg1, csg2) => {
      csg1.center(csg2.center());
      const remaining = csg2.subtract(csg1);
      const eq = remaining.polygons.length === 0;
      if (!eq)
        return console.warn.logarithmic('verify Result') || false;
      const bothEq = csg1.subtract(csg2).polygons.length === 0;
      if (!bothEq)
        console.warn.logarithmic('verify Result');
      return bothEq;
    }
    const equalFuncs = [eqToString, eqDisplay, eqSubtract];
    const equals = (csg1, csg2) => {
        for (let index = 0; index < equalFuncs.length; index++) {
          if (equalFuncs[index](csg1, csg2)) return true;
        }
        return false;
    };

    function infoHash(info) {
      const identifiers = (info.cuts || []).map(c => c.locationRef.identifiers).concatElements();
      const values = identifiers.map(vals => vals.map(v => convert(v)).join(':'));
      values.sort();
      const dems = info.demensions;
      const catDems = [info.category, convert(dems.x), convert(dems.y), convert(dems.z)];
      const hash = Object.hash(catDems.concat(values));
      const hashMap = instance.hashMap();
      // if (info.parts[0].partCode() === 'T:f' || info.parts[0].partCode() === 'dv:f') {
      //   console.log(catDems.concat(values).join('\n'))
      // }
      if (hashMap[hash] === undefined) return (hashMap[hash] = [initialize(info)])[0];
      else {
        const potentalMatches = hashMap[hash];
        if (info.model) {
          for (let index = 0; index < potentalMatches.length; index++) {
            const target = potentalMatches[index].model.csg;
            const other = info.model.csg;
            if (equals(target, other)) {
              return mergeParts(potentalMatches[index], info);
            }
          }
          return hashMap[hash].push(initialize(info));
        } else {
          return mergeParts(potentalMatches[0], info);
        }
      }
    }

    function addHardware(hardware, parentInfo) {
      const demensions = hardware.demensions(parentInfo);
      if (!hardware.composite()) {
        let info = {
          category: hardware.category(),
          hardware: true,
          demensions,
          partId: hardware.id(),
          partIds: [hardware.id()],
          parts: [hardware]
        }
        parentInfo = infoHash(info);
      }
      hardware.hardware.forEach(h => addHardware(h, parentInfo));
    }

    this.add = (info) => {
      info.parts = info.partIds.map(id => Lookup.get(id));
      let part = info.parts[0];
      if (!part) {
        part = new (Object.class.get(info.category))(info.partCode, info.partName);
        part.parentAssembly(Lookup.get(info.parentId))
        info.parts[0] = part;
        part.getRoot().generatedParts.push(part);
      }
      if (!info.model && !part.outsourced())
        console.warn('model was not returned');
      if (info.model) {
        info.model.csg = CSG.fromPolygons(info.model.polygons, true);
        delete info.model.polygons;
      }
      if (info.boxOnly) info.model.boxOnly = CSG.fromPolygons(info.boxOnly.polygons, true);
      info = infoHash(info);
      if (part) part.hardware.forEach(h => addHardware(h, info));
    }
  }
}


module.exports = PartInformation;
