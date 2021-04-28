class DualDoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('dual-door'), partCode, 'Duel.Door.Section', divideProps);
    if (divideProps === undefined) return;
    this.addSubAssembly(new Door('dr', 'DrawerFront', this.duelDoorCenter(true), this.duelDoorDems));
    this.addSubAssembly(new Door('dl', 'DrawerFront', this.duelDoorCenter(), this.duelDoorDems));
  }
}
new DualDoorSection();
