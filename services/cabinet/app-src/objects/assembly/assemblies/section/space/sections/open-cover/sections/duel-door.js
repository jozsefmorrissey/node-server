class DualDoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('dual-door'), partCode, 'Duel.Door.Section', divideProps);
    if (divideProps === undefined) return;
    const rightDoor = new Door('dr', 'DoorRight', this.duelDoorCenter(true), this.duelDoorDems);
    this.addSubAssembly(rightDoor);
    rightDoor.setPullLocation(Pull.location.TOP_LEFT);

    const leftDoor = new Door('dl', 'DoorLeft', this.duelDoorCenter(), this.duelDoorDems);
    this.addSubAssembly(leftDoor);
    leftDoor.setPullLocation(Pull.location.TOP_RIGHT);
  }
}

DualDoorSection.abbriviation = 'dds';

Assembly.register(DualDoorSection);
