


const Section = require('../section.js');
const Assembly = require('../../../assembly.js');

class SpaceSection extends Section {
  constructor(partCode, partName, sectionProperties, parent) {
    super(false, partCode, partName, sectionProperties, parent);
    if ((typeof sectionProperties) !== 'function')
      Object.getSet(this, 'index');
    else
      Object.getSet(this, 'borderIds', 'index');
    this.setIndex();
    // this.important = ['partCode', 'partName', 'index'];
    this.borderIds = () => sectionProperties().borderIds;
    const instance = this;

    const parentValue = this.value;
    this.value = (attr, value) => {
      if ((typeof sectionProperties) !== 'function') return;
      const props = sectionProperties();
      if (props.borders) {
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
          case 'fpt':
          return top.position().center('y') - top.width() / 2;
          case 'fpb':
          return bottom.position().center('y') + bottom.width() / 2;
          case 'fpr':
          return right.position().center('x') - right.width() / 2;
          case 'fpl':
          return left.position().center('x') + left.width() / 2;
          case 'ppt':
          panel = top.getAssembly(top.partCode.replace(/f/, 'p'));
          return panel === undefined ?
          top.position().centerAdjust('y', '-x') :
          panel.position().centerAdjust('y', '-z');
          case 'ppb':
          panel = bottom.getAssembly(bottom.partCode.replace(/f/, 'p'));
          return panel === undefined ?
          bottom.position().centerAdjust('y', '+x') :
          panel.position().centerAdjust('y', '+z');
          case 'ppr':
          panel = right.getAssembly(right.partCode.replace(/f/, 'p'));
          return panel === undefined ?
          right.position().centerAdjust('x', '-x') :
          panel.position().centerAdjust('x', '-z');
          case 'ppl':
          panel = left.getAssembly(left.partCode.replace(/f/, 'p'));
          return panel === undefined ?
          left.position().centerAdjust('x', '+x') :
          panel.position().centerAdjust('x', '+z');
        }
      }
      return parentValue(attr, value);
    }
  }
}

SpaceSection.fromJson = (json, parent) => {
  const sectionProps = json.parent.borders(json.borderIds || json.index);
  const assembly = json._TYPE !== 'DivideSection' ?
          Assembly.new(json._TYPE, json.partCode, sectionProps, parent) :
          Assembly.new(json._TYPE, sectionProps, parent);
  assembly.partCode(json.partCode);
  assembly.partName(json.partName);
  assembly.id(json.id);
  assembly.values = json.values;
  // Object.values(json.subassemblies).forEach((json) => {
  //   console.log(json._TYPE);
  //   json.sectionProps = sectionProps();
  //   assembly.addSubAssembly(Assembly.class(json._TYPE)
  //                             .fromJson(json, assembly));
  //                           });
  return assembly;
}


module.exports = SpaceSection
