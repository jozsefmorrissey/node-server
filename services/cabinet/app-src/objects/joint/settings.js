

class JointSettings {
  constructor(male, female, extend, extendTo) {
    if (male === undefined) male = true;
    if (female === undefined) female = true;
    if (extend === undefined) extend = true;
    if (extendTo === undefined) extendTo = true;
    this.male = () => male;
    this.female = () => female;
    this.extend = () => extend;
    this.extendTo = () => extendTo;
    this.false = () => !male && !female && !extend && !extendTo;
    this.toJson = () => JointSettings.toJson(this);
  }
}

Object.class.register(JointSettings, 'male', 'female', 'extend', 'extendTo');
module.exports = JointSettings;
