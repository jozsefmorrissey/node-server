
const mySql = require('mysql');
var Mutex = require('async-mutex').Mutex;

function toPascal(string) {
  if ((typeof string) !== 'string') return string;
  function fixSeperation(match, one, two) {
    return `${one}_${two}`;
  }
  return string.replace(/[^a-z^A-Z]/, '_')
              .replace(/([a-z])([A-Z])/g, fixSeperation)
              .toUpperCase();
}

class Field {
  /*
    options:  type: (($field typeof) === type)
    instance: ($field instanceof instance)
    null: true | false
    format: $field.toString().match(format)
  */
  constructor(name, options, parent) {
    const o = options || {};
    let value;
    this.name = name;
    this.index = options.index;
    this.isPrimative = function () {return o.class === undefined;};
    this.getClass = function () {return o.class;};
    this.getRelation = function () {return o.relation;};
    this.isValid = function (value) {
      return (!o.type || ((typeof value) == o.type)) &&
            (!o.class || (value instanceof o.class ));
    };
    this.setValue = function (newValue) {
      if (this.isList()) {
        value = value || [];
        if (newValue !== undefined) {
          value.push(newValue);
        }
      } else {
        if (newValue instanceof Buffer) {
          newValue = String.fromCharCode.apply(null, newValue);
        }
        value = newValue;
      }
      parent[this.name] = value;
    }

    this.uniqueName = function () {
      if (this.isPrimative()) {
        return toPascal(`${parent.$d.table()}_${this.name}`);
      } else {
        return toPascal(`${parent.$d.table()}_${this.name}Id`);
      }
     }

    this.isList = function () {
      return o.relation ? o.relation.trim().toLowerCase()
                              .split('to')[1] === 'many' : false;
    }



    this.sqlKeyDefine = function () {
      if (this.isList()) {
        return;
      }
      const suffix = ` as ${this.uniqueName()}`;
      return `${this.sqlKey()}${suffix}`
    }
    this.sqlKey = function (notSelect) {
      const prefix = notSelect ? '' : `${parent.$d.table()}.`;
      if (this.isPrimative()) {
        return toPascal(`${prefix}${this.name}`);
      } else {
        return toPascal(`${prefix}${this.name}Id`);
      }
    }

    function applicableKey (result, table, name) {
      let index = 0;
      const keys = Object.keys(result);
      let firstId, id, match;
      do {
        if (match && match[1] !== table) return;
        if (match && match[3] === name) return keys[index - 1];
        match = keys[index++].match(/(.*)_([0-9]*)_(.*)/);
        id = Number.parseInt(match[2]);
        firstId = firstId || id;
      } while (id === firstId && index < keys.length);
    }

    function resultValue (result, table, name) {
      let index = 0;
      const keys = Object.keys(result);
      if (keys.length === 0) return;
      let firstId, id, match;
      do {
        match = keys[index++].match(/(.*)_([0-9]{1,})_(.*)/);
        id = Number.parseInt(match[2]);
        firstId = firstId || id;
        if (match[1] !== table) return;
        if (match[3] === name) {
          const key = keys[index - 1];
          const returnValue = result[key];
          delete result[key];
          return returnValue;
        }
      } while (id === firstId && index < keys.length);
    }

    this.setFromResult = function (result, object) {
      if (this.isPrimative()) {
        const val = resultValue(result, object.$d.table(), this.sqlKey());
        object.$d.setValueFunc(this.name)(val);
      } else {
        // TODO: Refactor so that an instance is not required for fromResult call;
        const instance = new (o.class.prototype.constructor)();
        this.setValue(instance.$d.fromResult(result));
      }
    }
    this.getValue = function () {return value;}
  }
}

class DataObject {
  constructor() {
    const fields = {};
    const primitives = [];
    const relations = [];
    const instance = this;
    const $d = {};
    let mapId;
    this.$d = $d;
    let fieldIndex = 0;
    $d.addField = function (name, options) {
      options = options || {};
      options.index = fieldIndex++;
      const field = new Field(name, options, instance);
      fields[name] = field;
    }

    $d.table = function (onlyTableName) {
      const suffix = onlyTableName || mapId === undefined ? '' : `_${mapId}`;
      return toPascal(instance.constructor.name + suffix);
    };
    $d.refId = function (instance) {
      const prefix = mapId ? `${$d.table()}.` : '';
      return toPascal(`${prefix}${instance.constructor.name}Id`);
    };
    $d.getField = function (id) {return fields[id];};

    $d.getFields = function (type) {
      switch (type) {
        case 'relation':
          return relations;
          break;
        case 'primative':
          return primitives;
          break;
        default:
          return Object.values(fields);
      }
    };

    $d.getValues = function (type) {
      const names = [];
      instance.$d.getFields(type).map((field) => names.push(field.name));

      const values = [];
      for (let index = 0; index < names.length; index += 1) {
        values.push(instance[names[index]])
      }
      return values;
    };

    $d.setValueFunc = function (name) {
      return function (value) {
        fields[name].setValue(value);
      }
    }

    $d.getValueFunc = function (name) {
      return function () {
        return instance[name];
      }
    }

    $d.init = function(args) {
      const idConstructor = args.length === 1  && Number.isInteger(args[0]);
      if (idConstructor) {
        $d.setValueFunc('id')(args[0]);
      }
      const fieldNames = Object.keys(fields);
      for (let index = 0; index < fieldNames.length; index += 1) {
        const field = fields[fieldNames[index]];
        if (!idConstructor) {
          $d.setValueFunc(field.name)(args[index]);
        }
        const upperFirst = `${field.name.substr(0,1).toUpperCase()}${field.name.substr(1)}`;
        const getterName = `get${upperFirst}`
        const setterName = `set${upperFirst}`
        instance[getterName] = $d.getValueFunc(field.name);
        instance[setterName] = $d.setValueFunc(field.name);
        if (field.isPrimative()) {
          primitives.push(field);
        } else {
          DataObject.prototype.addChildTable(instance, field);
          relations.push(field);
        }
      }
    }

    $d.setMapId = function (id) {
      if (mapId !== undefined) throw Error('Attempting to map a single object to two tables');
      mapId = id;
    }
    $d.getMapId = function() {return mapId;}
    $d.mapObject = function (id) {
      const obj = new instance.constructor();
      obj.$d.setMapId(id);
      return obj;
    }

    $d.fromResult = function (result) {
      // const obj = new instance.constructor();
      if (result === undefined) return instance;
      let fs = instance.$d.getFields('primative');
      for (let index = 0; index < fs.length; index += 1) {
        fs[index].setFromResult(result, instance);
      }

      fs = instance.$d.getFields('relation');
      for (let index = 0; index < fs.length; index += 1) {
        fs[index].setFromResult(result, instance);
      }
      return instance;
    }

    $d.constructors = function () {
      const constName = instance.constructor.name;
      const fieldNames = Object.keys(fields);
      const fieldStr = fieldNames.join(', ');
      return `new ${constName}(id)\nnew ${constName} (${fieldStr})`;
    }
  }
}

const childTableFuncs = function () {
  let childTables = {};
  function add(instance, field) {
    const relation = field.getRelation();
    let targetClass;// = field.getClass().name;
    if (relation) {
      const toOne = relation.trim().toLowerCase().split('to') === 'one';
      if (toOne) {
        targetClass = field.getClass().name;
      } else {
        targetClass = field.getClass().name;
      }
    }

    if (!childTables[targetClass]) {
      childTables[targetClass] = {};
    }
    childTables[targetClass][`${instance.constructor.name}-${field.name}`] =
                {instance, field};
  }
  function get(instance) {
    const obj = childTables[instance.constructor.name] || {};
    return Object.values(obj);
  }
  return {add, get}
}()

DataObject.prototype.addChildTable = childTableFuncs.add;
DataObject.prototype.getChildTables = childTableFuncs.get;

class Crud {
  constructor(options) {
    const connMutex = new Mutex();
    const crudMutex = new Mutex();
    let connection = null;
    let tableIdInc = 0;
    let crudRelease;
    const instance = this;

    function updateConnection(callback) {
      connMutex.acquire().then(function (release) {
        if (callback === undefined) {
          if (connection !== null) {
            connection.end();
            connection = null;
            tableIdInc = 0;
          }
          release();
          return;
        } else if (connection === null) {
          connection = mySql.createConnection({
            host: 'localhost',
            user: 'CE',
            password: 'ITSJUSTATESTDB',
            database: 'CE'
          });
          connection.connect();
        }
        release();
        callback();
      });
    }

    function getMutex(callback) {
      if (options.mutex) {
        crudMutex.acquire().then(function(release) {
          crudRelease = release;
          callback();
        });
      } else {
        callback();
      }
    }

    function mapResults(objects, callback) {
      return function (results, error) {
        if (callback === undefined) return;
        if (results === undefined || results.length === 0) {
            callback(results, error);
            return;
        }
        const resultMap = {};
        const mappedResults = results && results.length ? [] : results;
        for (let index = 0; results && index < results.length; index += 1) {
          const result = results[index];
          for (let oIndex = 0; oIndex < objects.length; oIndex += 1) {
            const mappedObj = objects[oIndex];
            const mapping = mappedObj.$d.getField('id').uniqueName();
            const id = result[mapping];
            if (!resultMap[mapping]) {
              resultMap[mapping] = {};
            }
            if (!resultMap[mapping][id]) {
              const newObj = mappedObj.$d.mapObject(mappedObj.$d.getMapId());
              const fields = newObj.$d.getFields();
              for (let fIndex = 0; fIndex < fields.length; fIndex += 1) {
                const field = fields[fIndex];
                if (field.isPrimative()) {
                  field.setValue(result[field.uniqueName()]);
                }
              }
              resultMap[mapping][id] = newObj;
              const relation = mappedObj.relation;
              if (relation) {
                const parentId = result[relation.objectId];
                const parentObj = resultMap[relation.objectId][parentId];
                parentObj.$d.setValueFunc(relation.field)(newObj);
              }
            }
          }
          // mappedResults.push(object[0].$d.fromResult(results[index]));
        }
        const targetObj = objects[0].$d.getField('id').uniqueName();
        const objResults = Object.values(resultMap[targetObj]);
        print('\nMapped object results:\n', objResults)
        callback(objResults, error);
      }
    }

    function print() {
      if (!options.silent) {
        console.log.apply(null, arguments);
      }
    }

    let lastQueryId = 0;
    function query(queryString, values, callback){
      if (!options.dryRun) {
        let currQueryId = ++lastQueryId;
        function closeConnection(error, results, fields){
          if (crudRelease) {
            crudRelease();
            crudRelease = undefined;
          }
          if (!options.silent) {
            print('\nRaw mySql:\nerror:\n', error, '\nresults:\n', results);
          }
          if (lastQueryId === currQueryId) {
            updateConnection();
          }
          if ((typeof callback) === 'function') {
            callback(results, error);
          }
        };

        function submitQuery() {
          connection.query(queryString, values, closeConnection);
        }

        updateConnection(submitQuery);
      }
    }

    function validateDataObject(object) {
      if (object instanceof DataObject) {

      }
    }

    function pushKeyAndValue(field, keys, values) {
      const sqlKey = field.sqlKey(true);
      keys.push(sqlKey);
      if (field.isPrimative()) {
        values.push(field.getValue());
      } else if (field.getValue()) {
        values.push(field.getValue().id);
      }
    }

    this.insert = function (object, callback) {
      function insertQuery() {
        print('\nInsert:')
        const keys = [];
        const values = [];
        object.$d.getFields().map((field) => pushKeyAndValue(field, keys, values));

        const qs = new Array(keys.length).fill('?').join(',');
        const table = object.$d.table();
        const queryString = `insert into ${table} (${keys.join(',')}) values (${qs})`;
        print(queryString, '\n', values);
        query(queryString, values, callback);
      }
      getMutex(insertQuery);
    }

    function pushPrimativeCondition(field, conds, values, notSelect) {
      const sqlKey = field.sqlKey(notSelect);
      const value = field.getValue();
      if (Array.isArray(value)) {
        const qs = new Array(value.length).fill('?').join(', ');
        conds.push(`${sqlKey} in (${qs})`);
        values = values.concat(value);
      } else if (value instanceof RegExp) {
        const regStr = value.toString();
        const sqlReg = regStr.substr(1, regStr.length - 2);
        conds.push(`${sqlKey} REGEXP ?`);
        values.push(sqlReg);
      } else if (value != undefined && field.isValid(value)) {
        conds.push(`${sqlKey} = ?`);
        values.push(value);
      }
    }

    function pushRelationCondition(field, conds, values, notSelect) {
      if (field.getValue() !== undefined) {
        const sqlKey = field.sqlKey(notSelect);
        const value = field.getValue().id;
        conds.push(`${sqlKey} = ?`);
        values.push(value);
      }
    }

    function conditionalObj(object, joinStr, notSelect) {
      const conds = [];
      let values = [];
      const fields = object.$d.getFields();
      for (let index = 0; index <  fields.length; index += 1) {
        const field = fields[index];
        if (field.isPrimative()) {
          pushPrimativeCondition(field, conds, values, notSelect);
        } else {
          pushRelationCondition(field, conds, values, notSelect);
        }
      }
      const string = conds.join(joinStr);
      return  {string, values}
    }

    function joinLogic(object, keys, depth) {
      function addSqlString(field) {
          if (!field.isList())
            keys.push(field.sqlKeyDefine());
      }

      let mapObject = object;
      if (depth === undefined) {
        mapObject = object.$d.mapObject(tableIdInc++);
        mapObject.$d.getFields().map(addSqlString);
      }
      const relations = mapObject.$d.getFields('relation');
      let joinString = '';
      let objects = [mapObject];
      depth = depth || 2;
      for (let index = 0; index < relations.length; index += 1) {
        const field = relations[index];
        const mapRelObj = new (field.getClass().prototype.constructor)().$d.mapObject(tableIdInc++, );
        // mapObject.$d.setValueFunc(field.name)(mapRelObj);

        const table = mapRelObj.$d.table(true);
        mapRelObj.$d.getFields().map(addSqlString);
        let refIdVar, idVar;
        if (field.isList()) {
          idVar = mapObject.$d.getField('id').sqlKey();
          refIdVar = mapRelObj.$d.refId(mapObject);
          mapRelObj.relation = {objectId: mapObject.$d.getField('id').uniqueName(),
                                field: field.name,
                                idField: refIdVar.replace(/./, '_')};
        } else {
          idVar = mapRelObj.$d.getField('id').sqlKey();
          refIdVar = field.sqlKey();
          mapRelObj.relation = {objectId: mapObject.$d.getField('id').uniqueName(),
                                field: field.name,
                                idField: field.uniqueName()};
        }

        const tab = new Array(depth).fill('\t').join('');
        joinString += `${tab}join ${table} as ${mapRelObj.$d.table()} on ${refIdVar} = ${idVar}\n`;
        const recurseRet = joinLogic(mapRelObj, keys, depth + 1);
        joinString += recurseRet.joinString;
        objects = objects.concat(recurseRet.objects);
      }
      return { joinString, objects };
    }

    this.select = function (object, callback, or) {
      function selectQuery() {
        print('\nSelect:')
        const joinStr = or ? ' OR ' : ' AND ';
        const keys = [];
        const table = object.$d.table(true);
        const joinVal = joinLogic(object, keys);
        const tableId = joinVal.objects[0].$d.table();
        const joins = joinVal.joinString;
        object.$d.setMapId(joinVal.objects[0].$d.getMapId());
        const condObj = conditionalObj.apply(this, [object, joinStr]);
        const queryString = `select ${keys.join(',\n')}\n` +
                              `\tfrom ${table} as ${tableId}\n` +
                              `${joins}\twhere ${condObj.string}`;
        print(queryString, '\n', condObj.values);
        query(queryString, condObj.values, mapResults(joinVal.objects, callback));
      }
      getMutex(selectQuery);
    }

    function deleteRecurse(object) {
      const relations = DataObject.prototype.getChildTables(object);
      for (let index = 0; index < relations.length; index += 1) {
        const relInstance = relations[index].instance;
        const field = relations[index].field;
        const args = []
        args[field.index] = object;
        const removeInstance = new (relInstance).constructor(...args);
        instance.delete(removeInstance);
        // class A { constructor(first) {this.one = first;}}
        // new (new A()).constructor(...[2]);
        // new A.prototype.constructor(...[1]);
      }
    }

    this.delete = function (object, callback, or) {
      function deleteQuery() {
        print('\nDelete:')
        const joinStr = or ? ' OR ' : ' AND ';
        const table = object.$d.table();
        const condObj = conditionalObj.apply(this, [object, joinStr, true]);
        const queryString = `delete from ${table} where ${condObj.string}`;
        print(queryString, '\n', condObj.values);
        query(queryString, condObj.values, callback);
      }
      deleteRecurse(object);
      getMutex(deleteQuery);
    }
  }
}

exports.Crud = Crud;
exports.DataObject = DataObject;
