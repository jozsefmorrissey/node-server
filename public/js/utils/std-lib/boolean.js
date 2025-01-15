

Function.safeStdLibAddition(Boolean, 'is', (boolean) =>
    (typeof boolean) === 'boolean' || boolean instanceof Boolean, true);
Function.safeStdLibAddition(Boolean, 'first', (...booleans) => booleans.find(b => Boolean.is(b)), true);
