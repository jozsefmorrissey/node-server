class PartitionSection extends Section {
  constructor(templatePath, partCode, partName, sectionProperties) {
    super(templatePath, true, partCode, partName, sectionProperties);
    this.important = ['partCode', 'partName', 'index'];
  }
}

PartitionSection.isPartition = () => true;

PartitionSection.fromJson = (json, parent) => {
  const sectionProps = parent.dividerProps(json.index);
  const assembly = Assembly.new(json.type, json.partCode, sectionProps, parent);
  assembly.partCode = json.partCode;
  assembly.partName = json.partName;
  assembly.values = json.values;
  return assembly;
}
