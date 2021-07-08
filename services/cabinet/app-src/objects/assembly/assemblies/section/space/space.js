class SpaceSection extends Section {
  constructor(templatePath, partCode, partName, sectionProperties) {
    super(templatePath, false, partCode, partName, sectionProperties);
    if ((typeof sectionProperties) !== 'function')
    this.important = ['partCode', 'partName', 'index'];
    this.borderIds = () => sectionProperties().borderIds;
    const instance = this;

    const parentValue = this.value;
    this.value = (attr, value) => {
      const props = sectionProperties();
      const top = props.borders.top;
      const bottom = props.borders.bottom;
      const right = props.borders.right;
      const left = props.borders.left;
      let panel;
      switch (attr) {
        case 'opt':
          if (props.position.top) return props.position.top;
          return top.position().center('y');
        case 'opb':
          if (props.position.bottom) return props.position.bottom;
          return bottom.position().center('y');
        case 'opr':
          if (props.position.right) return props.position.right;
          return right.position().center('x');
        case 'opl':
          if (props.position.left) return props.position.left;
          return left.position().center('x');
        case 'ppt':
          return top.position().center('y') - top.width() / 2;
        case 'ppb':
          return bottom.position().center('y') + bottom.width() / 2;
        case 'ppr':
          return right.position().center('x') - right.width() / 2;
        case 'ppl':
          return left.position().center('x') + left.width() / 2;
        case 'ipt':
          panel = top.getAssembly(top.partCode.replace(/f/, 'p'));
          return panel === undefined ?
            top.position().centerAdjust('y', '-x') :
            panel.position().centerAdjust('y', '-z');
        case 'ipb':
          panel = bottom.getAssembly(bottom.partCode.replace(/f/, 'p'));
          return panel === undefined ?
            bottom.position().centerAdjust('y', '+x') :
            panel.position().centerAdjust('y', '+z');
        case 'ipr':
          panel = right.getAssembly(right.partCode.replace(/f/, 'p'));
          return panel === undefined ?
            right.position().centerAdjust('x', '-x') :
            panel.position().centerAdjust('x', '-z');
        case 'ipl':
          panel = left.getAssembly(left.partCode.replace(/f/, 'p'));
          return panel === undefined ?
            left.position().centerAdjust('x', '+x') :
            panel.position().centerAdjust('x', '+z');
        default:
          return parentValue(attr, value);
      }
    }
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
