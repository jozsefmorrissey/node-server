
const libs = ['function','boolean','color','gauge','data-view','math','string',
        'regex','number','json','array','object', 'measurement', 'progress',
        'computation-time', 'hashmap', 'cpu'];
libs.forEach(lib => require(`./${lib}.js`))
