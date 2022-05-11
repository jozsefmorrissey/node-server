
class Plan {
  constructor(level, name, description, price, reportCount) {
    Object.getSet(this, 'level', 'name', 'description', 'price', 'reportCount');
    if ((typeof level === 'object') && level._type === this.constructor.name) {
      reportCount = level.reportCount;
      price = level.price;
      description = level.description;
      name = level.name;
      level = level.level;
    }
    this.name = () => name;
    this.level = () => level;
    this.description = () => description;
    this.price = () => price;
    this.reportCount = () => reportCount || 0;
  }
}

Plan.fromJson = (json) =>
  new Plan(json.level, json.name, json.description, json.price, json.reportCount);

Plan.plans = {}
Plan.plans.casual = new Plan(1, 'Casual', 'Our services are free if you do not utilize more than 5 times in a given month', 0);
Plan.plans.daily = new Plan(2, 'Daily', 'You are allowed to request up to 31 per month', 20);
Plan.plans.structured = new Plan(3, 'Structured', 'Request up to 10 per Month and up to 2 shedualed Reports', 35, 2);
Plan.plans.structuredPlus = new Plan(4, 'Structured Plus', 'Request up to4 31 per Month and up to 2 shedualed Reports', 45, 2);
Plan.plans.crutial = new Plan(5, 'Crutial', 'Request up to 10 and up to 5 shedualed Reports', 60, 24);
Plan.plans.crutialPlus = new Plan(6, 'Crutial Plus', 'Request up to 30 and up to 5 shedualed Reports', 70, 24);

Plan.getPlan = (planId) => {
  planId = planId.toCamel();
  console.log(planId, '=>', Plan.plans[planId]);
  return Plan.plans[planId];
}

module.exports = Plan;
