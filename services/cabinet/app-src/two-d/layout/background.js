
class Background {
  constructor(layout) {
    let _color = 'yellow';
    this.color = (color) => color !== undefined ? (_color = color) : _color;
  }
}

Object.class.register(Background, 'color');

module.exports = Background;
