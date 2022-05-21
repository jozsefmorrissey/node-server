
const NUMBERS = {};

class FaxNumber {
  constructor(service, faxNumber, description) {
    this.service = () => service;
    this.faxNumber = () => faxNumber;
    this.description = () => description;
    NUMBERS[service.toPascal()] = this;
  }
}


new FaxNumber('Weather Request', '+12178171112',
  'Fax this number anything to recieve a weather report, whateverr you send will be disgaurded.');

new FaxNumber('Account Service', '+12175729339',
  'This number will automatically send an account Information form that you can update and change all materials submitted to this number will be reviewed by a person');

new FaxNumber('Toggle Schedualed Reports', '+12028732223',
  'This number allowed you to turn your schedualed reports on and off.');

module.exports = NUMBERS;
