
const PanZoom = require('pan-zoom');
const HoverMap2d = require('hover-map');

const Vertex2d = require('./objects/vertex');


class PanZoomClick extends PanZoom {
  constructor(canvas, draw, getHoverMap) {
    super(canvas, draw);
    const instance = this;

    this.hoverMap = getHoverMap;

    const clickEvent = new CustomEvent('click');
    const dragEvent = new CustomEvent('dragging');
    const hoverEvent = new CustomEvent('hover');
    const hoverOutEvent = new CustomEvent('hoverOut');
    let active = true;
    let moveActive = true;
    let eventsEnabled = true;
    let clickHolding = false;

    this.on = {};
    this.on.click = clickEvent.on;
    this.on.hover = hoverEvent.on;
    this.on.hoverOut = hoverOutEvent.on;
    this.on.drag = dragEvent.on;
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
    this.onMove((event) => {
      dragging = false;
      if (!active || !moveActive) return;
      const vertex = new Vertex2d(event.imageX, event.imageY);
      if (clickHolding && eventsEnabled) {
        if (++clickHoldCount > 30) {
          dragEvent.trigger(clickHolding, event);
          dragging = true;
          clickHolding.move && clickHolding.move(vertex);
        }
        return true;
      }
      const hovering = this.hoverMap().hovering(vertex);
      const hovered = instance.hovered();
      if (hovering !== hovered) {
        if (eventsEnabled && hovered) {
          hoverOutEvent.trigger(hovered);
        }
        hoverStack = [hovering].concat(hoverStack);
        hoverStack.splice(stackLimit);
        if (eventsEnabled && hovering) {
          eventsEnabled && hoverEvent.trigger(hovering);
        }
      }
    });
    this.dragging = () => dragging;
    const parentCanvasSimple = this.canvasSimple;
    this.canvasSimple = () => dragging || parentCanvasSimple();

    this.onClick((event) => {
      if (!active) return;
      const vertex = new Vertex2d(event.imageX, event.imageY);
      const hovering = this.hoverMap().hovering(vertex);
      clickStack = [hovering].concat(clickStack);
      clickStack.splice(stackLimit);
      clickEvent.trigger(hovering);
    });
    this.onMouseup((event) => {
      if (!active) return;
      const vertex = new Vertex2d(event.imageX, event.imageY);
      const hovering = this.hoverMap().hovering(vertex);
      clickHolding = false;
      clickHoldCount = 0;
      return hovering !== null;
    });
    this.onMousedown((event) => {
      const vertex = new Vertex2d(event.imageX, event.imageY);
      const hovering = this.hoverMap().hovering(vertex);
      clickHolding = hovering;
      return hovering !== null;
    });
  }
}

module.exports = PanZoomClick;
