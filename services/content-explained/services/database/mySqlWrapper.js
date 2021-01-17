
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
    this.default = () => o.default;
    this.isId = () => o.key;
    this.isPrimative = function () {return o.class === undefined;};
    this.getClass = function () {return o.class;};
    this.merge = function () {return o.merge;};
    this.getRelation = function () {return o.relation;};
    this.isReadOnly = function() {return o.readOnly === true;};
    this.isWriteOnly = function() {return o.writeOnly === true;};
    this.isValid = function (value) {
      return (!o.type || ((typeof value) == o.type)) &&
            (!o.class || (value instanceof o.class ));
    };

    this.getValue = function () {return value;}

    this.setValue = function (newValue) {
      if (this.isList()) {
        value = value || [];
        // TODO: try to get rid of indexOf... Hacky Fix
        if (newValue !== undefined && value.indexOf(newValue) === -1) {
          value.push(newValue);
        }
      } else {
        if (newValue instanceof Buffer) {
          newValue = String.fromCharCode.apply(null, newValue);
        }
        value = newValue;
      }
      if (!o.writeOnly) {
        parent[this.name] = this.getValue();
      }
    }

    this.uniqueName = function () {
      if (this.isPrimative()) {
        return toPascal(`${parent.$d().readTable()}_${this.name}`);
      } else {
        return toPascal(`${parent.$d().readTable()}_${this.name}Id`);
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
      const prefix = notSelect ? '' : `${parent.$d().readTable()}.`;
      if (this.isPrimative()) {
        return parent.$d().sqlKey(this.name, notSelect);
      } else if (o.isKey) {
        return parent.$d().sqlKey(`${this.getClass().name}_${this.name}`, notSelect);
      } else {
        return parent.$d().sqlKey(`${this.name}Id`, notSelect);
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

    this.getInstance = function () {
      return new (o.class.prototype.constructor)(...arguments)
    };

    this.setFromResult = function (result, object) {
      if (this.isPrimative()) {
        const val = resultValue(result, object.$d().readTable(), this.sqlKey());
        object.$d().setValueFunc(this.name)(val);
      } else {
        // TODO: Refactor so that an instance is not required for fromResult call;
        const instance = this.getInstance();
        this.setValue(instance.$d().fromResult(result));
      }
    }

    if (this.isList()) {
      value = [];
    }
  }
}

function mapObject (instance) {
  return function (id) {
    const mapObj = new (instance.constructor)();
    mapObj.$d().setMapId(id);
    return mapObj;
  }
}

function fromObject (instance) {
  return function(object) {
    const c = instance.constructor.mapObject();
    const flds = c.$d().getFields();
    for (let index = 0; index < flds.length; index += 1) {
      const field = flds[index];
      const value = object[field.name];
      c.$d().setValueFunc(field.name)(value);
    }
    return c;
  }
}

class DataObject {
  constructor() {
    const fields = {};
    const primitives = [];
    const relations = [];
    const ids = [];
    const instance = this;
    const tableNames = {};
    let mappings;
    const $d = {};
    let mapId;
    this.$d = function () {return $d;};
    let fieldIndex = 0;
    $d.addField = function (name, options) {
      options = options || {};
      options.index = fieldIndex++;
      const field = new Field(name, options, instance);
      fields[name] = field;
    }

    $d.getIdFields = () => ids;
    $d.getIdAttrs = () => {
      const attrs = [];
      ids.forEach((field) => attrs.push(field.name));
      return attrs;
    }

    $d.oneToManyCondStr = (mapRelObj, conditions) => {
      conditions = conditions || [];
      for (let index = 0; index < ids.length; index += 1) {
        const field = ids[index];
        const refIdVar = mapRelObj.$d().refId(instance.constructor.name, field.name);
        const idVar = field.sqlKey();
        conditions.push(`${idVar} = ${refIdVar}`)
      }
      return conditions;
    }

    $d.manyToOneCondStr = (mapRelObj, targetField, conditions) => {
      conditions = conditions || [];
      const relIds = mapRelObj.$d().getIdFields();
      for (let index = 0; index < relIds.length; index += 1) {
        const field = relIds[index];
        const refIdVar = $d.refId(targetField.name, field.name);
        const idVar = field.sqlKey();
        conditions.push(`${idVar} = ${refIdVar}`)
      }
      return conditions;
    }

    $d.joinStr = (mapRelObj, field, depth) => {
      let conditions = [];
      let idAttrs = $d.getIdAttrs();
      const name = field.name;
      if (field.isList()) {
        $d.oneToManyCondStr(mapRelObj, conditions);
      } else {
        // TODO: make this call on instance function
        $d.manyToOneCondStr(mapRelObj, field, conditions);
      }
      conditions = conditions.join(' AND ');
      const table = mapRelObj.$d().readTable(true);
      const tab = new Array(depth).fill('\t').join('');
      const joinStr = `${tab}left join ${table} as ${mapRelObj.$d().readTable()} on ${conditions}\n`;
      return joinStr;
    }

    $d.addMapping = function (mapObject, field) {
      if (mappings === undefined) {
        mappings = [];
      }
      mapObject.field = field;
      mappings.push(mapObject);
    };

    $d.getMappings = function () {return mappings;};

    $d.setTableNames = function (readName, writeName) {
      tableNames.read = readName;
      tableNames.write = writeName;
    };

    function table (type, onlyTableName) {
      let tableName = instance.constructor.name;
      if (type === 'read' && tableNames.read) {
        tableName = tableNames.read;
      } else if (type === 'write' && tableNames.write) {
        tableName = tableNames.write;
      }
      const suffix = onlyTableName || mapId === undefined ? '' : `_${mapId}`;
      return toPascal(tableName + suffix);
    };

    $d.readTable = function (onlyTableName) {return table('read', onlyTableName)};
    $d.writeTable = function (onlyTableName) {return table('write', onlyTableName)};


    $d.refId = function (namePrefix, name) {
      const prefix = mapId ? `${$d.readTable()}.` : '';
      name = name.substr(0,1) + name.substr(1);
      return toPascal(`${prefix}${namePrefix}_${name}`);
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
        return fields[name].getValue();
      }
    }

    $d.init = function(args) {
      if (instance.constructor.mapObject === undefined) {
        instance.constructor.mapObject = mapObject(instance);
        instance.constructor.fromObject = fromObject(instance);
      }
      const idConstructor = args.length === 1  && Number.isInteger(args[0]) &&
              fields['id'] !== undefined;
      if (idConstructor) {
        $d.setValueFunc('id')(args[0]);
      }
      const fieldNames = Object.keys(fields);
      let argsIndex = 0;
      for (let index = 0; index < fieldNames.length; index += 1) {
        const field = fields[fieldNames[index]];
        if (!idConstructor && !field.default()) {
          $d.setValueFunc(field.name)(args[argsIndex++]);
        }
        const upperFirst = `${field.name.substr(0,1).toUpperCase()}${field.name.substr(1)}`;
        const getterName = `get${upperFirst}`
        const setterName = `set${upperFirst}`
        instance[getterName] = $d.getValueFunc(field.name);
        instance[setterName] = $d.setValueFunc(field.name);
        if (field.isPrimative()) {
          primitives.push(field);
        } else {
          DataObject.addChildTable(instance, field);
          relations.push(field);
        }
        if (field.isId()) {
          ids.push(field);
        }
      }
      if (ids.length === 0) {
        ids.push(fields['id']);
      }
    }

    $d.setMapId = function (id) {
      // if (mapId !== undefined) throw Error('Attempting to map a single object to two tables');
      mapId = id;
    }
    $d.getInstance = function () {return new instance.constructor()}
    $d.getMapId = function() {return mapId;}

    $d.uniqueName = function (result) {
      let values = '';
      let invalidId = false;
      if (result) {
        ids.forEach((field) => {
          const value = result[field.uniqueName()];
          if (value === null) {
            invalidId = true;
          }
          values += `_${value}`;
        });
      }
      if (invalidId) {
        return null;
      }
      return toPascal(`${$d.readTable()}${values}`);
    }

    $d.sqlKey = function (value, notSelect) {
      const prefix = notSelect ? '' : `${$d.readTable()}.`;
      return toPascal(`${prefix}${value}`);
    }

    $d.clone = function () {
      const c = instance.constructor.mapObject();
      const flds = $d.getFields();
      for (let index = 0; index < flds.length; index += 1) {
        const field = flds[index];
        c.$d().setValueFunc(field.name)(field.getValue());
      }
      return c;
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

DataObject.addChildTable = childTableFuncs.add;
DataObject.getChildTables = childTableFuncs.get;


class Crud {
  constructor(options) {
    const connMutex = new Mutex();
    const crudMutex = new Mutex();
    let connection = null;
    let tableIdInc = 0;
    let crudRelease;
    const instance = this;

    function closeConnection () {connection.end();process.exit()}
    process.on('SIGINT', closeConnection);

    function connect() {
      const connInfo = {
        host: options.host || 'localhost',
        user: options.user || 'CE',
        password: options.password || 'ITSJUSTATESTDB',
        database: options.database || 'CE'
      };
      connection = mySql.createConnection(connInfo);
      connection.connect((err) => {
        if(err) {
          console.log('error when connecting to db:', err);
          setTimeout(connect, 2000);
        }
      });

      connection.on('error', function (err) {
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
          connect();
        } else {
          throw err;
        }
      });
    }
    connect();


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

    // TODO: Refactor
    function mapResults(objects, success, one, fail) {
      return function (results) {
        if (success === undefined) return;
        const resultMap = {};
        const mappedResults = results && results.length ? [] : results;
        let targetObj;
        for (let index = 0; results && index < results.length; index += 1) {
          const result = results[index];
          for (let oIndex = objects.length - 1; oIndex > -1; oIndex -= 1) {
            const mappedObj = objects[oIndex];
            const mapping = mappedObj.$d().uniqueName();
            // TODO: remove when composite key is supported.
            const id = mappedObj.$d().uniqueName(result);// || Math.floor(Math.random() * 9999999999);
            if (oIndex === 0) targetObj = mapping;
            if (id != null && id !== undefined) {
              if (!resultMap[mapping]) {
                resultMap[mapping] = {};
              }
              if (!resultMap[mapping][id]) {
                const mapId = mappedObj.$d().getMapId();
                const newObj = mappedObj.constructor.mapObject(mapId);
                const fields = newObj.$d().getFields();
                for (let fIndex = 0; fIndex < fields.length; fIndex += 1) {
                  const field = fields[fIndex];
                  if (field.isPrimative()) {
                    field.setValue(result[field.uniqueName()]);
                  }
                }
                resultMap[mapping][id] = newObj;
              }
              const mappings = mappedObj.$d().getMappings();
              for (let index = 0; mappings && index < mappings.length; index += 1) {
                const map = mappings[index];
                if (map) {
                  // TODO: make composite resolving function
                  const uniqueIdParent = mappedObj.$d().uniqueName();
                  const uniqueIdChild = map.$d().uniqueName();
                  const parentObj = resultMap[uniqueIdParent][id];
                  const childId = map.$d().uniqueName(result);
                  if (childId !== null && childId !== null) {
                    const fieldName = map.field.name;
                    const childObj = resultMap[uniqueIdChild][childId];
                    const mergeAttr = map.field.merge();
                    if (mergeAttr) {
                      parentObj.$d().setValueFunc(fieldName)(childObj[mergeAttr]);
                    } else {
                      parentObj.$d().setValueFunc(fieldName)(childObj);
                    }
                  }
                }
              }
            }
          }
        }
        const objResults = resultMap[targetObj] ? Object.values(resultMap[targetObj]) : [];
        print('\nMapped object results:\n', objResults);

        if (one) {
          if (objResults.length !== 1) {
            fail(objResults);
            return;
          }
          success(objResults[0]);
        } else {
          success(objResults);
        }
      }
    }

    let logger;
    this.setLogger = (l) => logger = l;
    function print() {
      if (!options.silent) {
        console.log.apply(null, arguments);
      }
      if (logger) {
        logger.apply(null, arguments);
      }
    }

    let lastQueryId = 0;
    function query(queryString, values, success, fail){
      if (!options.dryRun) {
        let currQueryId = ++lastQueryId;
        function closeConnection(error, results){
          if (crudRelease) {
            crudRelease();
            crudRelease = undefined;
          }
          print('\nRaw mySql:\nerror:\n', error, '\nresults:\n', results);

          const callFailed = error !== null;
          if (!callFailed && (typeof success) === 'function'){
            success(results);
          }
          if (callFailed && (typeof fail) === 'function') {
            fail(error);
          }
        };

        connection.query(queryString, values, closeConnection);
      }
    }

    function pushKeyAndValue(field, keys, values) {
      const sqlKey = field.sqlKey(true);
      if (field.getValue() !== undefined) {
        if (field.isPrimative()) {
          keys.push(sqlKey);
          values.push(field.getValue());
        } else if (!field.isList()) {
          keys.push(sqlKey);
          values.push(field.getValue().id);
        }
      }
    }

    this.insert = function (array, success, fail) {
      function buildQuery(dataObj) {
        print('\nInsert:', dataObj)
        const keys = [];
        const values = [];
        dataObj.$d().getFields().map((field) => pushKeyAndValue(field, keys, values));

        const qs = new Array(keys.length).fill('?').join(',');
        const table = dataObj.$d().writeTable(true);
        const query = `insert into ${table} (${keys.join(',')}) values (${qs});\n`;
        return {query, values};
      }

      function insertQuery() {
        if (!Array.isArray(array)) {
          array = [array];
        }
        let queryStr = '';
        let values = [];
        array.forEach((dataObj) => {
          const queryObj = buildQuery(dataObj);
          queryStr += queryObj.query;
          values = values.concat(queryObj.values);
        });
        print(queryStr, '\n', values);
        query(queryStr, values, success, fail);
      }


      getMutex(insertQuery);
    }

    this.insertGet = function (object, success, fail) {
      function inserted(data) {
        function got(data) {
          success(data);
        }
        const idOnly = object.$d().getInstance();
        idOnly.setId(data.insertId);
        instance.selectOne(idOnly, success, () => {throw new Error('this should never happen')});
      }
      instance.insert(object, inserted, fail);
    }

    function pushPrimativeCondition(field, conds, values, notSelect) {
      const sqlKey = field.sqlKey(notSelect);
      const value = field.getValue();
      if (Array.isArray(value)) {
        const qs = new Array(value.length).fill('?').join(', ');
        conds.push(`${sqlKey} in (${qs})`);
        value.map((value) => values.push(value));
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
      if (!field.isList()) {
        const sqlKey = field.sqlKey(notSelect);
        const value = field.getValue().id;
        conds.push(`${sqlKey} = ?`);
        values.push(value);
      }
    }

    // TODO: fix to support composite keys
    // function pushRelationCondition(field, conds, values, notSelect) {
    //   console.log('relations!!', fields)
    //   if (!field.isList()) {
    //     field.$d().getIdFields().forEach((field) => {
    //       const sqlKey = field.sqlKey(notSelect);
    //       const value = field.getValue();
    //       conds.push(`${sqlKey} = ?`);
    //       values.push(value);
    //     });
    //   }
    // }

    function conditionalObj(object, joinStr, notSelect) {
      const conds = [];
      let values = [];
      const fields = object.$d().getFields();
      for (let index = 0; index <  fields.length; index += 1) {
        const field = fields[index];
        if (field.getValue() !== undefined) {
          if (field.isPrimative()) {
            pushPrimativeCondition(field, conds, values, notSelect);
          } else {
            pushRelationCondition(field, conds, values, notSelect);
          }
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
        mapObject = object.constructor.mapObject(tableIdInc++);
        mapObject.$d().getFields().map(addSqlString);
      }
      const relations = mapObject.$d().getFields('relation');
      let joinString = '';
      let objects = [mapObject];
      depth = depth || 2;
      for (let index = 0; index < relations.length; index += 1) {
        const field = relations[index];
        const mapRelObj = field.getClass().prototype.constructor.mapObject(tableIdInc++);

        mapRelObj.$d().getFields().map(addSqlString);
        mapObject.$d().addMapping(mapRelObj, field);

        joinString += mapObject.$d().joinStr(mapRelObj, field, depth);
        const recurseRet = joinLogic(mapRelObj, keys, depth + 1);
        joinString += recurseRet.joinString;
        objects = objects.concat(recurseRet.objects);
      }
      return { joinString, objects };
    }

    function select(object, or) {
      const joinStr = or ? ' OR ' : ' AND ';
      const keys = [];
      const table = object.$d().readTable(true);
      const joinVal = joinLogic(object, keys);
      const tableId = joinVal.objects[0].$d().readTable();
      const joins = joinVal.joinString;
      object.$d().setMapId(joinVal.objects[0].$d().getMapId());
      const condObj = conditionalObj.apply(this, [object, joinStr]);
      const whereClause = condObj.string ? `\tWHERE ${condObj.string}` : "";
      const queryString = `SELECT ${keys.join(',\n')}\n` +
                            `\tFROM ${table} as ${tableId}\n` +
                            `${joins + whereClause}`;
      print(queryString, '\n', condObj.values);
      return {query: queryString, values: condObj.values, objects: joinVal.objects};
    }

    this.select = function (object, or, success, fail) {
      if ((typeof or) === 'function') {
        fail = success;
        success = or;
        or = undefined;
      }
      function selectQuery() {
        print('\nSelect:')
        const selectObj = select(object, or);
        const mapSuccess = mapResults(selectObj.objects, success);
        query(selectObj.query, selectObj.values, mapSuccess, fail);
      }
      getMutex(selectQuery);
    }

    this.selectOne = function (object, or, success, fail) {
      if ((typeof or) === 'function') {
        fail = success;
        success = or;
        or = undefined;
      }
      function selectQuery() {
        print('\nSelectOne:')
        const selectObj = select(object, or);
        const mapSuccess = mapResults(selectObj.objects, success, true, fail);
        query(selectObj.query, selectObj.values, mapSuccess, fail);
      }
      getMutex(selectQuery);
    }

    function deleteRecurse(object) {
      const relations = DataObject.getChildTables(object);
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

    this.delete = function (object, or, success, fail) {
      if ((typeof or) === 'function') {
        fail = success;
        success = or;
        or = undefined;
      }
      function deleteQuery() {
        print('\nDelete:')
        const joinStr = or ? ' OR ' : ' AND ';
        const table = object.$d().writeTable(true);
        const condObj = conditionalObj.apply(this, [object, joinStr, true]);
        const queryString = `delete from ${table} where ${condObj.string}`;
        print(queryString, '\n', condObj.values);
        query(queryString, condObj.values, success, fail);
      }
      // deleteRecurse(object);
      getMutex(deleteQuery);
    }

    function updateObj (object) {
      const fields = object.$d().getFields('primative');
      const obj = {values: [], setArr: []};
      for (let index = 0; index < fields.length; index += 1) {
        const field = fields[index];
        const value = field.getValue();
        if (field.name !== 'id' && value !== undefined && !field.isList() && !field.isReadOnly()) {
          obj.setArr.push(`${field.sqlKey(true)}=?`);
          obj.values.push(value);
        }
      }
      obj.values.push(object.id);
      return obj;
    }

    this.update = function (object, success, fail) {
      function updateQuery() {
        print('\nUpdate:')
        const table = object.$d().writeTable(true);
        const upObj = updateObj(object);
        const queryString = `update ${table} set ${upObj.setArr.join()} where id=?`;
        print(queryString, '\n', upObj.values);
        query(queryString, upObj.values, success, fail);
      }
      getMutex(updateQuery);
    }
  }
}

Crud.instances = {};
Crud.set = (name, options) => Crud.instances[name] = new Crud(options);
Crud.instance = (name) => Crud.instances[name];

exports.Crud = Crud;
exports.DataObject = DataObject;
