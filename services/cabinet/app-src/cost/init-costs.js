



const Cost = require('./cost.js');
const SelectCost = require('./types/select.js');
const Material = require('./types/material.js');
const Category = require('./types/category.js');
const Labor = require('./types/material/labor.js');
const ConditionalCost = require('./types/category/conditional.js');

Cost.register(SelectCost);
Cost.register(Material);
Cost.register(Category);
Cost.register(Labor);
Cost.register(ConditionalCost);
