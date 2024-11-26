const GL = require('./lightgl.js');

const LightDirection = require('./shaders/light-direction.frag');
const WireFrame = require('./shaders/wire-frame.vert');
const RealisticLight = require('./shaders/realistic-light-shader.frag');
const IlluminateAll = require('./shaders/illuminate-all.vert');
const shaders = {LightDirection, WireFrame, RealisticLight, IlluminateAll};

const splitReg = /\n\s*,\n/;
const templatize = (string) => {
  const func = (scope) => {
    let str = string;
    if (scope) {
      const keys = Object.keys(scope);
      keys.forEach(k => str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), scope[k]));
    }
    return str.split(splitReg);
  }
  func.raw = string.split(splitReg);
  return func;
}

module.exports = {};
Object.keys(shaders).forEach(k => module.exports[k] = templatize(shaders[k]));
