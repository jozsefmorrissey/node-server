
const CustomEvent = require('../../custom-event.js');
const Vertex2d = require('../two-d/objects/vertex.js');
const Polygon2d = require('../two-d/objects/polygon.js');
const Vertex3D = require('../three-d/objects/vertex.js');

class ViewerHoverList {
  constructor() {
    let hoverable = [];
    CustomEvent.all(this, 'hover', 'click', 'hover.out');

    this.canHover = () => !!hoverable.length;
    this.add = (locator, payload) => hoverable.push({locator, payload});
    this.clear = () => hoverable = [];

    function locatorDistObj(point, target, relitivePos, hovering) {
      const locator = target.locator;
      if (locator instanceof Vertex3D) {
        const relCenter = relitivePos(locator.x, locator.y, locator.z);
        const distOffset = !hovering ? 0 : (hovering.relCenter.z > relCenter.z ? -20 : 20);
        const dist = point.distance(relCenter) + distOffset + relCenter.z;
        if (dist < 100 && (!hovering || hovering.dist > dist)) {
          return {dist, target, relCenter};
        } else return;
      } else if (Array.isArray(locator)) {
        if (locator.findIndex(v => !(v instanceof Vertex3D)) === -1) {
          const relVs = locator.map(v => relitivePos(v.x, v.y, v.z));
          const limits = Math.minMax(relVs, ['x','y','z']);
          const dems = {x: limits.x.max - limits.x.min, y: limits.y.max - limits.y.min, z: limits.z.max - limits.z.min}
          const relCenter = {x: dems.x/2 + limits.x.min, y: dems.y/2 + limits.y.min, z: dems.z/2 + limits.z.min};
          const poly = Polygon2d.fromDemensions(dems, relCenter);
          const maxZcenter = {x: relCenter.x, y: relCenter.y, z: limits.z.max};
          if (poly.isWithin(point)) return {dist: limits.z.min, target, relCenter: maxZcenter};
          return;
        }
      }
      throw new Error('Unrecognized Hover List Locator');
    }

    let lastHovered;
    let shouldHoverOut = false;
    this.lastHovered = () => lastHovered;
    this.hover = (point, relitivePos, bounds) => {
      let hovering;
      point = new Vertex2d(point);
      for (let index = 0; index < hoverable.length; index++) {
        const target = hoverable[index];
        const locDistObj = locatorDistObj(point, target, relitivePos);
        if (locDistObj && locDistObj.relCenter.z >= 0 && (!hovering || hovering.dist > locDistObj.dist)) {
          hovering = locDistObj;
        }
      }
      if (!hovering) {
        if (shouldHoverOut) {
          this.trigger.hover.out();
          shouldHoverOut = false;
        }
        return null;
      }
      shouldHoverOut = true;
      if (hovering.target !== lastHovered) this.trigger.hover(lastHovered = hovering.target);
      return hovering.target;
    }

    this.click = (point, relitivePos, bounds) => {
      const hovered = this.hover(point, relitivePos, bounds);
      if (hovered) this.trigger.click(hovered);
    }
  }
}

module.exports = ViewerHoverList;
