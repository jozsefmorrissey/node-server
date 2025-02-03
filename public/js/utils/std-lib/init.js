
const libs = ['function','boolean','color','gauge','data-view','math','string',
        'regex','number','json','array','object', 'measurement', 'progress'];
libs.forEach(lib => require(`./${lib}.js`))
