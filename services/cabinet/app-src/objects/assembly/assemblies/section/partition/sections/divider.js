class DividerSection extends PartitionSection {
  constructor(partCode, sectionProperties, parent) {
    super(sectionFilePath('divider'), partCode, 'Divider', sectionProperties, parent);
    if (sectionProperties === undefined) return;
    const props = sectionProperties;
    const instance = this;
    this.position().center = (attr) => {
      const center = props().center;
      return attr ? center[attr] : center;
    };
    this.position().demension = (attr) =>
      Position.targeted(attr, () => this.value('frw'),
          () => props().dividerLength / 2, () => this.value('frt'));
    const panelCenterFunc = () => {return '0,0,0'};
    const panelDemFunc = () => {return '0,0,0'};
    const panelRotFunc = () => {return '0,0,0'};

    const frameCenterFunc = (attr) => {
      const props = sectionProperties();
      const dem = {
        x: props.center.x,
        y: props.center.y,
        z: props.center.z
      };
      return attr ? dem[attr] : dem;
    };

    const frameDemFunc = (attr) => {
      const dem = {
        x: this.value('frw'),
        y: sectionProperties().dividerLength,
        z: this.value('frt'),
      };
      return attr ? dem[attr] : dem;
    }

    const frameRotFunc = () => sectionProperties().rotationFunc();


    this.addSubAssembly(new Panel(`dp-${Divider.count}`, 'Divider.Panel', panelCenterFunc, panelDemFunc, panelRotFunc));
    this.addSubAssembly(new Frame(`df-${Divider.count}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc));
  }
}

DividerSection.abbriviation = 'dvrs';

Assembly.register(DividerSection);
