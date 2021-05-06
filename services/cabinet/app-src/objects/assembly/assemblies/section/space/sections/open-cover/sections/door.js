class DoorSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('door'), partCode, 'Door.Section', divideProps);
    this.addSubAssembly(new Door('d', 'Door', this.coverCenter, this.coverDems));
  }
}

Assembly.register(DoorSection);