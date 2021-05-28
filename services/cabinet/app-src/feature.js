class Feature {
  constructor(id, subFeatures, properties, parent) {
    subFeatures = subFeatures || [];
    this.properties = properties || {};
    this.enabled = false;
    this.features = [];
    const radioFeatures = [];
    this.name = id.replace(/([a-z])([A-Z])/g, '$1.$2')
                  .replace(/\.([a-zA-Z0-9])/g, Feature.formatName);
    this.id = id;
    this.isRoot = (path) => path === 'root';
    this.multipleFeatures = () => this.features.length > 1;
    this.isInput = () => (typeof this.properties.inputValidation) === 'function';
    this.showInput = () => (this.isInput() && !this.isCheckbox() && !this.isRadio())
                          || (this.enabled && (this.isCheckbox() || this.isRadio()));
    this.isCheckbox = () => this.id.indexOf('has') === 0;
    this.radioFeature = (feature) => radioFeatures.length > 1 && radioFeatures.indexOf[feature] !== -1;
    this.isRadio = () => (!this.isCheckbox() && parent !== undefined && parent.radioFeature(this));
    this.addFeature = (featureOrId) => {
      let feature;
      if (featureOrId instanceof Feature) feature = featureOrId;
      else feature = Feature.byId[featureOrId];
      if (!(feature instanceof Feature)) {
        throw new Error(`Invalid feature '${id}'`);
      }
      this.features.push(feature);
      if (!feature.isCheckbox()) radioFeatures.push(feature);
    };
    subFeatures.forEach((featureId) => this.addFeature(featureId))
    Feature.byId[id] = this;
  }
}

Feature.byId = {};
Feature.objMap = {};
Feature.addRelations = (objId, featureIds) => {
  featureIds.forEach((id) => {
    if (Feature.objMap[objId] === undefined) Feature.objMap[objId] = [];
    const feature = Feature.byId[id];
    if (!(feature instanceof Feature)) {
      throw new Error('Trying to add none Feature object');
    }
    else Feature.objMap[objId].push(feature);
  });
};
Feature.clone = (feature, parent) => {
  const clone = new feature.constructor(feature.id, undefined, feature.properties, parent);
  feature.features.forEach((f) => clone.addFeature(Feature.clone(f, feature)));
  return clone;
}
Feature.getList = (id) => {
  const masterList = Feature.objMap[id];
  if (masterList === undefined) return [];
  const list = [];
  masterList.forEach((feature) => list.push(Feature.clone(feature)));
  return list;
}
Feature.formatName = (match) => ` ${match[1].toUpperCase()}`;

new Feature('thickness', undefined, {inputValidation: (value) => !new Measurement(value).isNaN()});
new Feature('inset');
new Feature('fullOverlay');
new Feature('1/8');
new Feature('1/4');
new Feature('1/2');
new Feature('roundOver', ['1/8', '1/4', '1/2']);
new Feature('knockedOff');
new Feature('hasFrame', ['thickness']);
new Feature('hasPanel', ['thickness']);
new Feature('insetProfile');
new Feature('glass');
new Feature('edgeProfile', ['roundOver', 'knockedOff']);
new Feature('drawerFront', ['edgeProfile'])
new Feature('doveTail');
new Feature('miter');
new Feature('drawerBox', ['doveTail', 'miter'])
new Feature('insetPanel', ['glass', 'insetProfile'])
new Feature('solid');
new Feature('doorType', ['fullOverlay', 'inset']);
new Feature('doorStyle', ['insetPanel', 'solid'])
new Feature('drawerType', ['fullOverlay', 'inset']);

Feature.addRelations('DrawerBox', ['drawerType', 'drawerFront', 'drawerBox']);
Feature.addRelations('PartitionSection', ['hasFrame', 'hasPanel']);
Feature.addRelations('Door', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('DoubleDoor', ['doorType', 'doorStyle', 'edgeProfile', 'thickness']);
Feature.addRelations('FalseFront', ['drawerType', 'edgeProfile']);
