


const PartitionSection = require('../partition.js');
const Divider = require('../../../divider.js');
const Position = require('../../../../../../position.js');
const Panel = require('../../../panel.js');
const Frame = require('../../../frame.js');
const Assembly = require('../../../../assembly.js');
const Joint = require('../../../../../joint/joint');

class DividerSection extends PartitionSection {
  constructor(partCode, sectionProperties, parent) {
    super(partCode, 'Divider', sectionProperties, parent);
    if (sectionProperties === undefined) return;
    this.setParentAssembly(parent);
    const props = sectionProperties;
    const instance = this;
    let panel;

    function jointOffset(props) {
      instance.getAssembly('c').joints
      if (panel && panel.joints.length < 1) {
        const pc = panel.partCode();
        panel.joints = [
          new Joint(pc, props.borders.top.partCode()),
          new Joint(pc, props.borders.bottom.partCode()),
          new Joint(pc, props.borders.left.partCode()),
          new Joint(pc, props.borders.right.partCode())
        ];
        panel.joints.forEach((j) => j.parentAssemblyId(panel.uniqueId()));
      }
      return 0.9525;
    }

    this.position().center = (attr) => {
      const center = props().center;
      return attr ? center[attr] : center;
    };
    this.position().demension = (attr) =>
      Position.targeted(attr, () => this.value('frw'),
          () => props().dividerLength / 2, () => this.value('frt'));
    const panelCenterFunc = (attr) => {
      const props = sectionProperties();
      const dem = {
        x: props.center.x,
        y: props.center.y,
        z: props.depth / 2
      };
      return attr ? dem[attr] : dem;
    };
    const panelDemFunc = (attr) => {
      if (attr === 'z') return this.value('pwt34');
      const props = sectionProperties();
      const dem = {
        x: props.depth,
        y: props.dividerLength + jointOffset(props) * 2,
        z: this.value('pwt34')
      };
      return attr ? dem[attr] : dem;
    };
    const panelRotFunc = () => {
      const props = sectionProperties();
      const rotation = props.rotation || {x: 90, y: 90, z: 0};
      const isVertical = props.vertical;
      if (isVertical) rotation.z = 90;
      return rotation;
    }

    // const frameCenterFunc = (attr) => {
    //   const props = sectionProperties();
    //   const dem = {
    //     x: props.center.x,
    //     y: props.center.y,
    //     z: props.center.z
    //   };
    //   return attr ? dem[attr] : dem;
    // };
    //
    // const frameDemFunc = (attr) => {
    //   const reqHeight = attr === 'y' || attr === undefined;
    //   const dem = {
    //     x: this.value('frw'),
    //     y: reqHeight ? sectionProperties().dividerLength : undefined,
    //     z: this.value('frt'),
    //   };
    //   return attr ? dem[attr] : dem;
    // }
    //
    // const frameRotFunc = () => props().rotationFunc();

    const lastWidthCalc = {date: Number.MAX_SAFE_INTEGER};
    this.maxWidth = () => {
      const currentDate = new Date().getTime();
      if (lastWidthCalc.date < currentDate + 1000) {
        return lastWidthCalc.value;
      }
      if (!panel.included && !frame.included) return 0;

      let value;
      const panelWidth = panel.position().demension('z');
      // const frameWidth = frame.position().demension('x');
      // if (value === undefined && !frame.included) return panelWidth;
      // if (value === undefined && !panel.included) return frameWidth;
      // if (value === undefined) value = panelWidth > frameWidth ? panelWidth : frameWidth;
      lastWidthCalc.date = currentDate;
      lastWidthCalc.value = panelWidth;
      return lastWidthCalc.value;
    }

    const index = props().index;
    panel = new Panel(`dp-${index}`, 'Divider.Panel', panelCenterFunc, panelDemFunc, panelRotFunc);
    // const frame = new Frame(`df-${index}`, 'Divider.Frame', frameCenterFunc, frameDemFunc, frameRotFunc);
    this.addSubAssembly(panel);
    // this.addSubAssembly(frame);
  }
}

DividerSection.abbriviation = 'dvrs';


module.exports = DividerSection
