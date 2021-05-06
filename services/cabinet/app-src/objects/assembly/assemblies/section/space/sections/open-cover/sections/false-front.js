class FalseFrontSection extends OpeningCoverSection {
  constructor(partCode, divideProps, parent) {
    super(sectionFilePath('false-front'), partCode, 'False.Front.Section', divideProps, PULL_TYPE.DRAWER);
    this.addSubAssembly(new DrawerFront('ff', 'DrawerFront', this.coverCenter, this.coverDems, '', this));
  }
}

Assembly.register(FalseFrontSection);
