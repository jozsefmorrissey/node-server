function onExit(func) {
  for (let index = 0; index < arguments.length; index += 1) {
    process.on(arguments[index], func.bind(null, {exit: true}));
  }
}


function groupArguments(args,...argTypes) {
  let correctTypeCount = 0;
  let correctArgCount  = 0;
  let groupedArgs = new Array(argTypes.length).fill(true);
  groupedArgs.map((value, index) => groupedArgs[index] = []);
  args = Array.from(args).filter((value) => value !== undefined);
  for (let index = 0; correctTypeCount < argTypes.length && index < args.length; index += 1) {
    const arg = args[index];
    const constraint = argTypes[correctTypeCount];
    let invalid = false;
    if ((typeof constraint) === 'string') {
      if ((typeof arg) === constraint) {
        groupedArgs[correctTypeCount].push(arg);
        correctArgCount++;
      } else {
        invalid = true;
        index--;
      }
    } else {
      if (arg instanceof constraint) {
        groupedArgs[correctTypeCount].push(arg);
        correctArgCount++;
      } else {
        invalid = true;
        index--;
      }
    }
    if (invalid) {
      correctTypeCount++;
    }
  }
  if (correctArgCount !== args.length) {
    const expectedArgs = [];
    for (let index = 0; index < argTypes.length; index += 1) {
      const constraint = argTypes[index];
      if ((typeof constraint) === 'string') {
        expectedArgs.push(` ...[type: '${constraint}']`);
      } else {
        expectedArgs.push(` ...[class: '${constraint.prototype.constructor.name}]`);
      }
    }
    const funcName = 'functionName';
    const arg = args[correctArgCount];
    const type = (typeof arg);
    const clazz = arg && arg.constructor ? (arg.constructor.name) : 'Unknown';
    const value = (arg);
    const expected = `\n\tFunction Format:\n\t\t${funcName}(${expectedArgs.toString()})`;
    const recieved = `\n\tError at
    Index: ${correctArgCount}
    Type: ${type}
    Class: ${clazz}
    Value: ${value}`;
    throw Error(`Invalid Input Arguments${expected}${recieved}`)
  }
  return groupedArgs;
}



exports.onExit = onExit;
