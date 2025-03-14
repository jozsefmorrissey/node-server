
CPU = {usage: {}};
CPU.property('usage', {}, false, false, false);

let lastCallTime;
let interval = 50;
let usageIndex = 4;
const usage = () => {
  const time = new Date().getTime();
  if (lastCallTime) {
    const ratio = (time - lastCallTime)/ interval;
    let usageLog = Math.floor(Math.log2(ratio)-1);
    if (usageLog < 1) usageLog = 1;
    else if (usageLog > 4) usageLog = 4;
    if (usageIndex < usageLog && usageIndex !== 4) usageLog = usageIndex + 1;
    const isLower = usageIndex > usageLog;
    for (let i = 1; i < 5; i++)
      if (!isLower || i < usageLog || i > usageIndex) usage.counts[i] =  0;
      else usage.counts[i]++;
    if (usage.counts < 3) usageLog = usageIndex;
    cpuUsage = usage.levels[usageIndex = usageLog];
  }
  lastCallTime = time;
  setTimeout(usage, interval);
}

usage.levels = [,'Low', 'Medium', 'High', 'Overloaded'];
usage.counts = [,0,0,0,0];
cpuUsage = usage.levels[usageIndex];

CPU.usage.property('index', undefined, false, false, false, () => usageIndex);
CPU.usage.property('level', undefined, false, false, false, () => cpuUsage);
CPU.usage.property('overloaded', undefined, false, false, false, () => usageIndex === 4);
CPU.usage.property('low', undefined, false, false, false, () => usageIndex === 1);

usage();
