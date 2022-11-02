


const Section = require('../section.js');
const Assembly = require('../../../assembly.js');

class PartitionSection extends Section {
  constructor(partCode, partName, sectionProperties) {
    super(true, partCode, partName, sectionProperties);
    Object.getSet(this, 'index');
    this.setIndex();

    const parentToJson = this.toJson;
    this.toJson = () => {
      const json = parentToJson();
      delete json.subassemblies;
      return json;
    }
  }
}

PartitionSection.isPartition = () => true;

PartitionSection.fromJson = (json) => {
  const sectionProps = json.parent.dividerProps(json.index);
  const assembly = Assembly.new(json._TYPE, json.partCode, sectionProps, json.parent);
  assembly.partCode(json.partCode);
  assembly.partName(json.partName);
  assembly.id(json.id);
  assembly.values = json.values;
  return assembly;
}
module.exports = PartitionSection
