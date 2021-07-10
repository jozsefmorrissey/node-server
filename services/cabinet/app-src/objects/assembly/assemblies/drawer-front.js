class DrawerFront extends Assembly {
  constructor(partCode, partName, centerStr, demensionStr, rotationStr, parent) {
    super(partCode, partName, centerStr, demensionStr, rotationStr);
    this.setParentAssembly(parent);
    const instance = this;
    let pulls;
    if (demensionStr === undefined) return;

    function pullCount(dems) {
      if (dems.x < 30) return 1;
      return 2;
    }

    this.demensionStr = (attr) => {
      const dems = demensionStr();
      return dems;
    };

    this.children = () => this.updatePulls();

    this.updatePulls = (dems, count) => {
      count = count || pullCount(this.demensionStr());
      pulls = [];
      for (let index = 0; index < count; index += 1) {
        pulls.push(new Pull(`${partCode}-p-${index}`, 'Drawer.Pull', this, Pull.location.CENTER, index, count));
      }
      return pulls;
    };
    this.updatePosition();
  }
}

DrawerFront.abbriviation = 'df';

Assembly.register(DrawerFront);
