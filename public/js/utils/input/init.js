
const Input = require('./input');
Input.styles = [];
Input.styles.push(Object.class.register(require('./styles/select/relation')));
Input.styles.push(Object.class.register(require('./styles/list')));
Input.styles.push(Object.class.register(require('./styles/measurement')));
Input.styles.push(Object.class.register(require('./styles/multiple-entries')));
Input.styles.push(Object.class.register(require('./styles/number')));
Input.styles.push(Object.class.register(require('./styles/object')));
Input.styles.push(Object.class.register(require('./styles/radio')));
Input.styles.push(Object.class.register(require('./styles/select')));
Input.styles.push(Object.class.register(require('./styles/list')));
Input.styles.push(Object.class.register(require('./styles/table')));
Input.styles.push(Object.class.register(require('./styles/textarea')));


Object.class.register(require('./decision/decision'));
