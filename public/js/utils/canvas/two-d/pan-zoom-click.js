
const PanZoom = require('pan-zoom');
const HoverMap2d = require('hover-map');
const CustomEvent = require('../../custom-event.js');

const Vertex2d = require('./objects/vertex');

class PanZoomClick extends PanZoom {
  constructor(canvas, draw, getHoverMap) {
    super(canvas, draw);
    const instance = this;

    this.hoverMap = getHoverMap;

    CustomEvent.all(this, 'click', 'drag', 'hover', 'hoverOut');
    let active = true;
    let moveActive = true;
    let eventsEnabled = true;
    let clickHolding = false;

    this.disable = () => active = false;
    this.enable = () => active = true;
    this.disable.move = () => moveActive = false;
    this.enable.move = () => moveActive = true;

    this.eventsDisabled = () => !(eventsEnabled = false);
    this.eventsEnabled = () => eventsEnabled = true;

    let stackLimit = 10;
    let hoverStack = new Array(stackLimit).fill(null);
    let clickStack = new Array(stackLimit).fill(null);
    this.hovered = (startIndex, toIndex) => {
      if (startIndex === undefined && toIndex === undefined) {
        return hoverStack[0];
      }
      return hoverStack.slice(startIndex, toIndex);
    }
    this.clicked = (startIndex, toIndex) => {
      if (startIndex === undefined && toIndex === undefined) {
        return clickStack[0];
      }
      return clickStack.slice(startIndex, toIndex);
    }

    let clickHoldCount = 0;
    let dragging = false;
    this.on.move((event) => {
      dragging = false;
      if (!active || !moveActive) return;
      const vertex = new Vertex2d(event.imageX, event.imageY);
      if (clickHolding && eventsEnabled) {
        if (++clickHoldCount > 30) {
          this.trigger.drag(clickHolding, event);
          dragging = true;
          clickHolding.move && clickHolding.move(vertex);
        }
        return true;
      }
      const hovering = this.hoverMap().hovering(vertex);
      const hovered = instance.hovered();
      if (hovering !== hovered) {
        if (eventsEnabled && hovered) {
          this.trigger.hoverOut(hovered);
        }
        hoverStack = [hovering].concat(hoverStack);
        hoverStack.splice(stackLimit);
        if (eventsEnabled && hovering) {
          eventsEnabled && this.trigger.hover(hovering);
        }
      }
    });
    this.dragging = () => dragging;
    const parentCanvasSimple = this.canvasSimple;
    this.canvasSimple = () => dragging || parentCanvasSimple();

    this.on.click((event) => {
      if (!active) return;
      const vertex = new Vertex2d(event.imageX, event.imageY);
      const hovering = this.hoverMap().hovering(vertex);
      clickStack = [hovering].concat(clickStack);
      clickStack.splice(stackLimit);
      this.trigger.click(hovering);
    });
    this.on.mouseup((event) => {
      if (!active) return;
      const vertex = new Vertex2d(event.imageX, event.imageY);
      const hovering = this.hoverMap().hovering(vertex);
      clickHolding = false;
      clickHoldCount = 0;
      return hovering !== null;
    });
    this.on.mousedown((event) => {
      const vertex = new Vertex2d(event.imageX, event.imageY);
      const hovering = this.hoverMap().hovering(vertex);
      clickHolding = hovering;
      return hovering !== null;
    });
  }
}

module.exports = PanZoomClick;
