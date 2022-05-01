
class Plan {
  constructor(name, description, price, reportCount) {
    Object.getSet(this, 'name', 'description', 'price', 'reportCount');
    if ((typeof name === 'object') && name._type === this.constructor.name) {
      reportCount = name.reportCount;
      price = name.price;
      description = name. description;
      name = name.name;
    }
    this.name = () => name;
    this.description = () => description;
    this.price = () => price;
    this.reportCount = () => reportCount || 0;
  }
}

Plan.fromJson = (json) =>
  new Plan(json.name, json.description, json.price, json.reportCount);

Plan.plans = {}
Plan.plans.casual = new Plan('Casual', 'Our services are free if you do not utilize more than 5 times in a given month', 0);
Plan.plans.daily = new Plan('Daily', 'You are allowed to request up to 30 per month', 20);
Plan.plans.structured = new Plan('Structured', 'Requests unlimited and up to 2 shedualed Reports', 30, 2);
Plan.plans.crutial = new Plan('Crutial', 'Requests unlimited and up to 10 shedualed Reports', 40, 24);

module.exports = Plan;
