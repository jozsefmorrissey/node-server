require('../public/js/utils/std-lib/init');
const CustomEvent = require('./custom-event');
const shell = require('shelljs');

class Bundler {
  constructor() {
    this.change = () => {throw Error('change must be implemented');};
    this.write = () => {throw Error('write must be implemented');};

    const onChangeEvent = new CustomEvent('change');
    this.trigger = onChangeEvent.trigger;
    this.onChange = onChangeEvent.on;
  }
}

//Todo: this only works in linux although a generalized solurtion is probably difficult;
Bundler.alarm = (frequency, millSecs) => {
  let childProcess = shell.exec(`speaker-test --frequency ${frequency || 650} --test sine`, {async: true, silent: true});
  setTimeout(() => {
    // console.log('killed', childProcess.pid);
    // Todo: this is a sledge hammer... This whole process is klunky;
    console.error('!!!!!!!!!!!!BUNDLER ALARM!!!!!!!!!!!');
    shell.exec(`kill -9 $(ps -aef | grep "speaker-test" | awk '{print $2}')`);
  }, millSecs || 300);
}

exports.Bundler = Bundler;
