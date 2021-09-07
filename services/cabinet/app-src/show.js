


const Panel = require('./objects/assembly/assemblies/panel.js');

class Show {
  constructor(name) {
    this.name = name;
    Show.types[name] = this;
  }
}
Show.types = {};
Show.listTypes = () => Object.values(Show.types);
new Show('None');
new Show('Flat');
new Show('Inset Panel');
module.exports = Show




