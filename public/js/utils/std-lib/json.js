Function.safeStdLibAddition(JSON, 'copy',   function  (obj) {
  if (!(obj instanceof Object)) return obj;
  return JSON.parse(JSON.stringify(obj));
}, true);

function processValue(value) {
  let retVal;
  if ((typeof value) === 'object' && value !== null) {
    if (value.toJson) {
      retVal = value.toJson();
    } else if (value.toJSON) {
      retVal = value.toJSON();
    } else if (value.constructor.toJson) {
      retVal = value.constructor.toJson(value);
    } else if (Array.isArray(value)){
      const arr = [];
      value.forEach((val) => arr.push(JSON.value(val)));
      retVal = arr;
    } else {
      const keys = Object.keys(value);
      const obj = {};
      for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        obj[key] = JSON.value(value[key]);
      }
      retVal = obj;
    }
  } else {
    retVal = value;
  }
  return retVal;
}
 Function.safeStdLibAddition(JSON, 'value', processValue, true);

 // Swiped from https://stackoverflow.com/a/43197340
 function isClass(obj) {
   const isCtorClass = obj.constructor
       && obj.constructor.toString().substring(0, 5) === 'class'
   if(obj.prototype === undefined) {
     return isCtorClass
   }
   const isPrototypeCtorClass = obj.prototype.constructor
     && obj.prototype.constructor.toString
     && obj.prototype.constructor.toString().substring(0, 5) === 'class'
   return isCtorClass || isPrototypeCtorClass
 }

 const checked = {};
 Function.safeStdLibAddition(JSON, 'clone',   function  (obj) {
   if ((typeof obj) != 'object') return obj;
   const keys = Object.keys(obj);
   if (!checked[obj.constructor.name]) {
     checked[obj.constructor.name] = true;
   }

   const clone = ((typeof obj.clone) === 'function') ? obj.clone() :
                   Array.isArray(obj) ? [] : {};
   for(let index = 0; index < keys.length; index += 1) {
     const key = keys[index];
     const member = obj[key];
     if (member && (member.DO_NOT_CLONE || member.constructor.DO_NOT_CLONE)) {
       clone[key] = member;
     } else if ((typeof member) !== 'function') {
       if ((typeof member) === 'object') {
         if ((typeof member.clone) === 'function') {
           clone[key] = member.clone();
         } else {
           clone[key] = JSON.clone(member);
         }
       } else {
         clone[key] = member;
       }
     }
     else if (isClass(member)) {
       clone[key] = member;
     }
   }
   return clone;
 }, true);
