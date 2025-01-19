
const {Polygon3D} = require('../../../../public/js/utils/canvas/three-d/lib.js');

const tOfOnull = (tOfOnullOund) => Boolean.is(tOfOnullOund) ||
                                    tOfOnullOund === null ||
                                    tOfOnullOund === undefined;

class JointSettings {
  constructor(male, female, extend, extendTo, noDependencies, sliceAtOpening) {
    if (!Boolean.is(male)) male = true;
    if (!Boolean.is(female)) female = true;
    if (!Boolean.is(extend)) extend = true;
    if (!Boolean.is(extendTo)) extendTo = true;
    if (!Boolean.is(noDependencies)) noDependencies = false;
    if (!Boolean.is(sliceAtOpening)) sliceAtOpening = true;
    this.male = (trueOfalse) => Boolean.is(trueOfalse) ? (male = trueOfalse) : male;
    this.female = (trueOfalse) => Boolean.is(trueOfalse) ? (female = trueOfalse) : female;
    this.extend = (trueOfalse) => Boolean.is(trueOfalse) ? (extend = trueOfalse) : extend;
    this.extendTo = (trueOfalse) => Boolean.is(trueOfalse) ? (extendTo = trueOfalse) : extendTo;
    this.noDependencies = (trueOfalse) => Boolean.is(trueOfalse) ? (noDependencies = trueOfalse) : noDependencies;
    this.sliceAtOpening = (trueOfalse) => Boolean.is(trueOfalse) ? (sliceAtOpening = trueOfalse) : sliceAtOpening;
    this.directions = new Polygon3D.Directions();
    const normals = {y: true};
    this.normals = () => Object.copy(normals);
    this.normals.x = (tfnu) => tOfOnullOund(tfnu) ? (normals.x = tfnu) : normals.x;
    this.normals.y = (tfnu) => tOfOnullOund(tfnu) ? (normals.y = tfnu) : normals.y;
    this.normals.z = (tfnu) => tOfOnullOund(tfnu) ? (normals.z = tfnu) : normals.z;
    this.normals.any = (tf) => Boolean.is(tf) ? (normals.any = tf) : normals.any;
    this.toJson = () => JointSettings.toJson(this);
  }
}

Object.class.register(JointSettings, 'male', 'female', 'extend', 'extendTo', 'directions', 'sliceAtOpening', 'normals');
module.exports = JointSettings;
