
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
    const instance = this;
    this.id = String.random();
    this.order = () => order;
    this.finished = (tRuE) =>
      !!(tRuE === true ? (partInfo[id].finished = true) : partInfo[id] && partInfo[id].finished);

    this.hashMap = (empty) => partInfo[id] && partInfo[id].hash === order.hash() ?
    partInfo[id].hashMap : (partInfo[id] = {hash: order.hash(), hashMap: {order}});

    this.byCategory = (type) => {
      if (!this.finished()) return null;
      const hashMap = this.hashMap();
      const byCat = Object.values(instance.hashMap()).concatElements().filterSplit(p => p.category);
      return type ? byCat[type] : byCat;
    }

    this.byCabinet = (type) => {
      if (!finished) return null;
      return Object.values(instance.hashMap()).concatElements()
          .filterSplit(p => {
              const ids = p.parts.map(p => p.getRoot().id() + '').unique();
              return ids.length === 1 ? ids[0] : 'MULTIPLE';
      });
    }

    this.all = () => {
      if (!this.finished()) return null;
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
        info.model.part[info.partId] = info.model.csg.clone();
        delete info.model.polygons;
      }
      info.MATERIAL_UNIT = info.parts[0].MATERIAL_UNIT;
      return info;
    }

    function mergeParts(target, other) {
      if (target.model) target.model.part[other.partId] = other.model.csg;
      target.partIds.push(other.partId);
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
      const csg1s = csg1.clone();
      csg1s.explode(.001);
      const remaining = csg2.subtract(csg1s);
      const eq = remaining.polygons.length === 0;
      if (!eq)
        console.warn('verify Result');
      const csg2s = csg2.clone();
      csg2s.explode(.001);
      const bothEq = csg1.subtract(csg2s).polygons.length === 0;
      if (!bothEq)
        console.warn('verify Result');
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
          mergeParts(potentalMatches[0], info);
        }
      }
    }

    this.add = (info) => {
      const id = info.id;
      info.parts = info.partIds.map(id => Lookup.get(id));
      if (!info.model && !info.parts[0].outsourced())
        console.warn('model was not returned');
      if (info.model) info.model.csg = CSG.fromPolygons(info.model.polygons, true);
      infoHash(info);
    }
  }
}


module.exports = PartInformation;
