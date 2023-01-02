
class CabinetOpeningCorrdinates {
  constructor(cabinet, config, sectionProperties) {

    this.divide = sectionProperties.divide;
    this.setSection = sectionProperties.setSection;
    this.sections = sectionProperties.sections;
    this.vertical = sectionProperties.vertical;
    this.normal = sectionProperties.normal;
    this.sectionProperties = () => sectionProperties;
    this.pattern = sectionProperties.pattern;
    this.update = () => {
      let coords;
      if (config._Type === 'location') {
        coords = cabinet.evalObject(config.coordinates);
      } else {
        const right = cabinet.getAssembly(config.right);
        const left = cabinet.getAssembly(config.left);
        const top = cabinet.getAssembly(config.top);
        const bottom = cabinet.getAssembly(config.bottom);

        const topMax = top.position().centerAdjust('y', '+z');
        const topMin = top.position().centerAdjust('y', '-z');
        const leftMax = left.position().centerAdjust('x', '-z');
        const leftMin = left.position().centerAdjust('x', '+z');
        const rightMin = right.position().centerAdjust('x', '+z');
        const rightMax = right.position().centerAdjust('x', '-z');
        const bottomMin = bottom.position().centerAdjust('y', '-z');
        const bottomMax = bottom.position().centerAdjust('y', '+z');

        coords = {
          inner: [
            {x: leftMax, y: topMin, z: 0},
            {x: rightMin, y: topMin, z: 0},
            {x: rightMin, y: bottomMax, z: 0},
            {x: leftMax, y: bottomMax, z: 0}
          ],
          outer: [
            {x: leftMin, y: topMax, z: 0},
            {x: rightMax, y: topMax, z: 0},
            {x: rightMax, y: bottomMin, z: 0},
            {x: leftMin, y: bottomMin, z: 0}
          ]
        }
      }
      sectionProperties.updateCoordinates(coords);
      return coords;
    }
  }
}

module.exports = CabinetOpeningCorrdinates;
