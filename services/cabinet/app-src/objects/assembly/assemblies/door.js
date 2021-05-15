
class Door extends Assembly {
  constructor(partCode, partName, coverCenter, coverDems, rotationStr) {
    super(partCode, partName, coverCenter, coverDems, rotationStr);
    let location = Pull.location.TOP_RIGHT;
    let pull = new Pull(`${partCode}-dp`, 'Door.Pull', this, location);
    this.addSubAssembly(pull);
  }
}

Door.abbriviation = 'dr';

Assembly.register(Door);
