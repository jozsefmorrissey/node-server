class ObjectValidator {
  constructor() {
    const validators =  {};
    this.add = (name, validator) => {
      if (!(validator instanceof ObjectValidator) && !(validator instanceof Validator)) {
        throw new Error('Invalid Validator');
      }
      validator[name] = validator;
    }
    this.validate = (obj) => {
      if (typeof obj !== 'object') throw new InvalidComputation()
      const keys = Object.keys(validators);
    }
  }
}


class Validator {
  constructor(validator, props, info) {
    let type, validate;
    const complement = props.explanation;

    let defaultExpl;
    if (validator instanceof Regex) {
      type = 'Regex';
      if (props.complement) {
        defaultExpl = 'Value must fit regex expression';
        validate = (value) => validator.match('value');
      } else {
        defaultExpl = 'Value must not fit regex expression';
        validate = (value) => !validator.match('value');
      }
    } else if (Array.isArray(validator)) {
      if (props.complement) {
        defaultExpl = 'Value must exist within array';
        validate = (value) => validator.indexOf(value) !== -1;
      } else {
        defaultExpl = 'Value must not exist within array';
        validate = (value) => validator.indexOf(value) === -1;
      }
    }

    props.explanation = props.explanation || defaultExpl;

    val = val === undefined && elem ? elem.value : val;
    if (val === undefined) return false;
    if (valid !== undefined && val === value) return valid;
    let valValid = true;
    if (props.validation instanceof RegExp) {
      valValid = val.match(props.validation) !== null;
    }
    else if ((typeof props.validation) === 'function') {
      valValid = props.validation.apply(null, arguments);
    }
    else if (Array.isArray(props.validation)) {
      valValid = props.validation.indexOf(val) !== -1;
    }

    return valValid;
  }
}
