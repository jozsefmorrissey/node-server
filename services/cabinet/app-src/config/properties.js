

const Property = require('./property');
const Defs = require('./property/definitions');
const Measurement = require('../../../../public/js/utils/measurement.js');
const EPNTS = require('../../generated/EPNTS');
const Request = require('../../../../public/js/utils/request.js');

let unitCount = 0;
const UNITS = [];
Measurement.units().forEach((unit) =>
      UNITS.push(new Property('Unit' + ++unitCount, unit, unit === Measurement.unit())));
UNITS._VALUE = Measurement.unit();

const assemProps = {}
const allProps = {}
const propertyToSetMap = {}
const add = (key, ...properties) => {
  if (assemProps[key] !== undefined) throw new Error(`Redifining Property Key ${key}`);
  assemProps[key] = properties;
  properties.forEach((prop) => {
    if (allProps[prop.code()]) throw new Error(`Redifining Property Code ${prop.code()}`)
    allProps[prop.code()] = prop;
    propertyToSetMap[prop.code()] = key;
  });
};

add('Overlay', Defs.ov,Defs.ovfrd,Defs.ovfls);
add('Reveal', Defs.r,Defs.rvt,Defs.rvb,Defs.rvr,Defs.rvl);
add('Inset', Defs.is);
add('Cabinet', Defs.style,Defs.fls,Defs.tid,Defs.dsc,Defs.rvibr,Defs.ddg,Defs.tkbw,Defs.tkd,
                Defs.tkh,Defs.pbt,Defs.iph, Defs.brr,Defs.ddd,Defs.crh,Defs.crw);
add('Panel', Defs.pt14,Defs.pt12,Defs.pt34,Defs.pt18,Defs.vpt);
add('Guides', Defs.dbtos,Defs.dbsos,Defs.dbbos,Defs.dbn,Defs.dbid, Defs.dbdepths);
add('DoorAndFront', Defs.daffrw,Defs.dafip)
// add('Door', [];
add('DrawerBox', Defs.dbst,Defs.dbbt);
add('DrawerFront', Defs.mfdfd, Defs.daft, Defs.dafbt);
// add('Frame', Defs.fw,Defs.ft);
add('Handle', Defs.c2c,Defs.proj);
add('Hinge', Defs.maxtab,Defs.mintab,Defs.maxol,Defs.minol);
// add('Opening', []);
add('Divider', Defs.dpt,Defs.dft,Defs.dfw,Defs.dpw,Defs.sc);
add('Material', Defs.linw, Defs.munit);



class Properties {
  constructor(config) {
    config ||= Properties.copyConfig(allProps);
    Object.keys(config).filter(k => config[k] === 'Function' && (config[k] = allProps[k]))
    const excludeKeys = ['_ID', '_NAME', '_GROUP', 'properties'];
    function assemProperties(code, value, notMetric) {
      const prop = config[code];
      if (value !== undefined) {
        if (prop) prop.value(value, notMetric);
        else return config[code] = new Property(code, null, {value, notMetric});
      }
      return prop;
    }


    assemProperties.toJson = () => {
      const json = Object.toJson(config);
      json._TYPE = 'Properties';
      return json;
    }
    assemProperties.config = () => Object.fromJson(Object.toJson(config));
    assemProperties.keys = () => Object.keys(allProps);
    assemProperties.clone = () => new Properties(this.config());
    assemProperties.set = (name) => {
      const set = {};
      if (assemProps[name] === undefined) return null;
      Object.keys(assemProps[name]).forEach(k => set[k] = config[k]);
    }
    assemProperties.values = (resolve, allProperties) => {
        const values = {};
        const runFunc = resolve instanceof Function;
        const conf = allProperties ? {}.merge(allProps, config) : config;
        Object.keys(conf).forEach(k => {
          if (conf[k] && conf[k].value) {
            const raw = conf[k].value();
            const resolved = runFunc ? resolve(raw) : raw;
            values[k] = Number.isNaN(resolved) ? raw : resolved;
            const set = propertyToSetMap[k];
            if(values[set] === undefined) values[set] = [];
            values[set].push(k);
          }
        });
        return values;
    }

    return assemProperties;
  }
}
Object.class.register(Properties);

Properties.copyConfig = (config) => {
  config ||= Object.fromJson(Object.toJson(allProps));
  Object.keys(config).filter(k => config[k] === 'Function' && (config[k] = allProps[k]));
  return config;
}
const funcReg = /^Function:(.{1,})$/;
Properties.fromJson = (json) => {
  const propObj = Object.merge({}, json);
  delete propObj._TYPE;
  Object.keys(json).filter(k => (typeof json[k]) === 'string' && json[k].match(funcReg) ?
          (propObj[k] = allProps[k]) : propObj[k] = Object.fromJson(json[k]));
  return new Properties(propObj);
}
Properties.groups = () => {
  const groups = Object.fromJson(Object.toJson(assemProps));
  Object.keys(groups).forEach(k => groups[k].forEach((p,i) => {
    if (!p.match) return;
    const match = p.match(funcReg);
    groups[k][i] = allProps[match[1]];
  }));
  return groups;
}
Properties.all = () => Properties.copyConfig(allProps);
Properties.UNITS = UNITS;
// assemProperties.changes = {
  //   saveAll: () => Object.values(changes).forEach((list) => assemProperties.changes.save(list._ID)),
  //   save: (id) => {
    //     const list = changes[id];
    //     if (!list) throw new Error(`Unkown change id '${id}'`);
    //     const group = list._GROUP;
    //     if (config[group] === undefined) config[group] = [];
    //     if(copyMap[id] === undefined) {
      //       config[group][list._NAME] = {name: list._NAME, properties: JSON.clone(list, excludeKeys, true)};
      //       copyMap[list._ID] = config[group][list._NAME].properties;
      //     } else {
        //       const tempList = changes[id];
        //       for (let index = 0; index < tempList.length; index += 1) {
          //         const tempProp = tempList[index];
          //         const configProp = copyMap[id][index];
          //         configProp.value(tempProp.value());
          //       }
          //     }
          //    },
          //   deleteAll: () => Object.values(changes).forEach((list) => assemProperties.changes.delete(list._GROUP)),
          //   delete: (id) => {
            //     delete config[changes[id][0].name()][changes[id]._NAME];
            //     delete changes[id];
            //     delete copyMap[id];
            //   },
            //   changed: (id) => {
              //     const list = changes[id];
              //     if (list === undefined) return false;
              //     for (let index = 0; index < list.length; index += 1) {
                //       const prop = list[index];
                //       if (prop === undefined || (copyMap[list._ID] !== undefined && copyMap[list._ID][index] === undefined)) {
                  //         console.log('booyacka!');
                  //       }
                  //       if (copyMap[list._ID] === undefined || !copyMap[list._ID][index].equals(prop)) {
                    //         return true;
                    //       }
                    //     }
                    //     return false;
                    //   },
                    //   changesExist: () => {
                      //       const lists = Object.values(changes);
                      //       for (let index = 0; index < lists.length; index += 1) {
                        //         if (assemProperties.changes.changed(lists[index]._ID)) {
                          //           return true;
                          //         }
                          //       }
                          //       return false;
                          //   }
                          // }
// assemProperties.load = (body) => {
//   config = Object.fromJson(body);
// }
Properties.default = (code) => {
  try {
    return allProps[code].value();
  } catch (e) {
    if (code.length < 10 && !code.match(/Overlay|Inset|Reveal|pattern/))
      console.warn.logarithmic(`code '${code}' is not defined`);
  }
}
Properties.cabinetStyles = () => ['Overlay', 'Inset', 'Reveal'];


module.exports = Properties;
