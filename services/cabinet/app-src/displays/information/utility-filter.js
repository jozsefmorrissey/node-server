class UFRow {
  constructor() {
    this.cabnetId = assembly.getAssembly('c').name;
    this.partName = assembly.partname;
    const dems = assembly.position().dementions();
    this.size = `${dems.y} x ${dems.x} x ${dems.z}`;
    this.partCode = assembly.partCode;
    this.cost = '$0';
    this.notes = assembly.notes || '';
  }
}
