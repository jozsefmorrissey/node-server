class SpaceSection extends Section {
  constructor(templatePath, partCode, partName, sectionProperties) {
    super(templatePath, false, partCode, partName, sectionProperties);
    if ((typeof sectionProperties) !== 'function')
      console.log('sectionProps', sectionProperties);
    this.important = ['partCode', 'partName', 'index'];
    this.borderIds = () => sectionProperties().borderIds;
  }
}

SpaceSection.fromJson = (json, parent) => {
  const sectionProps = parent.borders(json.borderIds || json.index);
  const assembly = json.type !== 'DivideSection' ?
          Assembly.new(json.type, json.partCode, sectionProps, parent) :
          Assembly.new(json.type, sectionProps, parent);
  assembly.partCode = json.partCode;
  assembly.partName = json.partName;
  assembly.values = json.values;
  json.subAssemblies.forEach((json) =>
    assembly.addSubAssembly(Assembly.class(json.type)
                              .fromJson(json, assembly)));
  return assembly;
}

Assembly.register(SpaceSection);
