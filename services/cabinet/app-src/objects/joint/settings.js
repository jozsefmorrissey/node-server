
const Polygon3D = require('../../three-d/objects/polygon.js');

class JointSettings {
  constructor(male, female, extend, extendTo, noDependencies) {
    if (!Boolean.is(male)) male = true;
    if (!Boolean.is(female)) female = true;
    if (!Boolean.is(extend)) extend = true;
    if (!Boolean.is(extendTo)) extendTo = true;
    if (!Boolean.is(noDependencies)) noDependencies = false;
    this.male = (trueOfalse) => Boolean.is(trueOfalse) ? (male = trueOfalse) : male;
    this.female = (trueOfalse) => Boolean.is(trueOfalse) ? (female = trueOfalse) : female;
    this.extend = (trueOfalse) => Boolean.is(trueOfalse) ? (extend = trueOfalse) : extend;
    this.extendTo = (trueOfalse) => Boolean.is(trueOfalse) ? (extendTo = trueOfalse) : extendTo;
    this.noDependencies = (trueOfalse) => Boolean.is(trueOfalse) ? (noDependencies = trueOfalse) : noDependencies;
    this.directions = new Polygon3D.Directions();
    this.toJson = () => JointSettings.toJson(this);
  }
}

Object.class.register(JointSettings, 'male', 'female', 'extend', 'extendTo', 'directions');
module.exports = JointSettings;
