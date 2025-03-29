
const libs = ['function','boolean','color','gauge','data-view','math','string',
        'regex','number','json','array','object', 'measurement', 'progress',
        'computation-time', 'hashmap', 'cpu'];
libs.forEach(lib => require(`./${lib}.js`))

Defined = (...args) => args.findIndex(a => a === undefined) !== -1;
Defined.none = (...args) => args.findIndex(a => a !== undefined) === -1;
Defined.count = (count, ...args) => args.count(a => a !== undefined) === count;
Defined.one = (...args) =>  args.count(a => a !== undefined) === 1;
Defined.lessThan = (count, ...args) => args.count(a => a !== undefined) < count;
Defined.greaterThan = (count, ...args) => args.count(a => a !== undefined) > count;
Defined.lessThan.equal = (count, ...args) => args.count(a => a !== undefined) <= count;
Defined.greaterThan.equal =  (count, ...args) => args.count(a => a !== undefined) >= count;
