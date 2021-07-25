
class Door extends Assembly {
  constructor(partCode, partName, coverCenter, coverDems, rotationStr) {
    super(partCode, partName, coverCenter, coverDems, rotationStr);
    let location = Handle.location.TOP_RIGHT;
    let pull = new Handle(`${partCode}-dp`, 'Door.Handle', this, location);
    this.setHandleLocation = (l) => location = l;
    this.addSubAssembly(pull);
  }
}

Door.abbriviation = 'dr';

Assembly.register(Door);
