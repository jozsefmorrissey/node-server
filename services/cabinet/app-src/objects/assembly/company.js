class Company {
  constructor(properties) {
    if (!properties.name) throw new Error('Company name must be defined')
    if (Company.list[properties.name] !== undefined) throw new Error('Company name must be unique: name already registered');
    this.name = () => properties.name;
    this.email = () => properties.email;
    this.address = () => properties.address;
    Company.list[this.name()] = this;
  }
}

Company.list = {};
new Company({name: 'ADC'});
new Company({name: 'Top Knobs'});
new Company({name: 'Richelieu'});
