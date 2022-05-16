
const NUMBERS = {};

class FaxNumber {
  constructor(service, faxNumber, description) {
    this.service = () => service;
    this.faxNumber = () => faxNumber;
    this.description = () => description;
    NUMBERS[service.toPascal()] = this;
  }
}


NUMBERS.push(new FaxNumber('Weather Request', '2178171112',
  'Fax this number anything to recieve a weather report, whateverr you send will be disgaurded.'));

NUMBERS.push(new FaxNumber('Account Service', '2175729339',
  'This number will automatically send an account Information form that you can update and change all materials submitted to this number will be reviewed by a person'));

NUMBERS.push(new FaxNumber('Toggle Schedualed Reports', '2028732223',
  'This number allowed you to turn your schedualed reports on and off.'));

module.exports = NUMBERS;
