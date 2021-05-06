class DualDoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('dual-door'), partCode, 'Duel.Door.Section', divideProps);
    if (divideProps === undefined) return;
    this.addSubAssembly(new Door('dr', 'DoorRight', this.duelDoorCenter(true), this.duelDoorDems));
    this.addSubAssembly(new Door('dl', 'DoorLeft', this.duelDoorCenter(), this.duelDoorDems));
  }
}

Assembly.register(DualDoorSection);
