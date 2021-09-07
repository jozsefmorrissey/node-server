




class InvalidComputation {
  constructor(attributes) {
    this.errorCode = 400;
    this.message = 'Error within input parameters';
    const keys = Object.keys(attributes);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      this.message += `\n\t${key}: '${value}'`;
    }
  }
}
module.exports = InvalidComputation




