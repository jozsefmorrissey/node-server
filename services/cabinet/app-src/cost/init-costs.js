



const Cost = require('./cost.js');
const Material = require('./types/material.js');
const Labor = require('./types/labor.js');

Cost.register(Material);
Cost.register(Labor);
