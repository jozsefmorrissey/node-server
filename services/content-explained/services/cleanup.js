
const cleanupFuncs = [];

function run() {
  for (let index = 0; index < cleanupFuncs.length; index += 1) {
    cleanupFuncs[index](...arguments)
  }
}

function exit() {
  process.exit();
}

function exitHandler(options, exitCode) {
  // if (options.cleanup) ;
  // if (exitCode || exitCode === 0) console.log(exitCode);
  if (options.exit) run(exitCode); exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

function add() {
  for (let index = 0; index < arguments.length; index += 1) {
    const func = arguments[index];
    if ((typeof func) === 'function') {
      cleanupFuncs.push(func);
    } else {
      throw new Error('cleanup requires functions as arguments');
    }
  }
}

exports.add = add;
