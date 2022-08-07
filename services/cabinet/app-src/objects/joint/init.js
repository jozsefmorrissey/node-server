
const Joint = require('./joint');

const Butt = require('./joints/butt.js');
const Dado = require('./joints/dado.js');
const Miter = require('./joints/miter.js');
const Rabbet = require('./joints/rabbet.js');

Joint.types = {
  Butt, Dado, Miter, Rabbet
};
