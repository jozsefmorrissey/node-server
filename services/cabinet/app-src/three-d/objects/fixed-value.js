
// This is just a flag object that indicates if a value that normally changes is fixed.
class FixedValue extends Number {
  constructor(value, column) {
    super(value);
    this.column = () => column;
    this.equals = (other) => {
      if (!(other instanceof FixedValue)) return false;
      return this.valueOf() === other.valueOf();
    }
  }
}

module.exports = FixedValue;
