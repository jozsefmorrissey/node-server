function onExit(func) {
  for (let index = 0; index < arguments.length; index += 1) {
    process.on(arguments[index], func.bind(null, {exit: true}));
  }
}

exports.onExit = onExit;
