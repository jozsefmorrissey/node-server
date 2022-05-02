

// function between(date1, date2, getValueFunc, incrementFunc) {
//   if (date1 > date2) {
//     const dateT = date1;
//     date1 = date2;
//     date2 = dateT;
//   }
//   const currDate = new Date(date2);
//   let values = [];
//   while(getValueFunc(currDate) !== values[0] && currDate > date1) {
//     values.push(getValueFunc(currDate));
//     incrementFunc(currDate);
//   }
//   if (getValueFunc(currDate) === values[0]) values._ALL = true;
//   values.sort((a,b) => a - b);
//   return values;
// }
//
// monthsBetween = (date1, date2) => between(date1, date2, (d) => d.getMo nth(), (d) => d.setMonth(d.getMonth() -1))
// daysBetween = (date1, date2) => between(date1, date2, (d) => d.getDay(), (d) => d.setDate(d.getDate() -1))
// hoursBetween = (date1, date2) => between(date1, date2, (d) => d.getHours(), (d) => d.setHours(d.getHours() - 1));
// minutesBetween = (date1, date2) => between(date1, date2, (d) => d.getMinutes(), (d) => d.setMinutes(d.getMinutes() - 1));
// secondsBetween = (date1, date2) => between(date1, date2, (d) => d.getSeconds(), (d) => d.setSeconds(d.getSeconds() - 1));
// millisecondsBetween = (date1, date2) => between(date1, date2, (d) => d.getMilliseconds(), (d) => d.setMilliseconds(d.getMilliseconds() - 1));
//
//
// function betweenRegex (array) {
//   if (!array._ALL) {
//     return `(${array.join("|")})`;
//   }
//   let min = array[0] + '';
//   let max = array[array.length - 1] + '';
//   const minLength = min.length;
//   const maxLength = max.length;
//   const minStart = min[0];
//   const maxStart = max[0];
//   const maxEnd = max[maxLength - 1];
//   placeCount = max.length - min.length
//   if (placeCount === 0) return `[${minStart}-${maxEnd}]`;
//   if (placeCount === 1) return `[${minStart}-9]|[${minStart}-${maxStart}][0-${maxEnd}]`;
//   const placeStr = new Array(placeCount-1).fill('[0-9]').join('')
//   return `[${minStart}-9]${placeStr}|[${minStart}-${maxStart}]${placeStr}[0-${maxEnd}]`;
// }
//
// function dateBetweenRegex(date1, date2) {
//   const regObj = {};
//   regObj.month = betweenRegex(monthsBetween(date1, date2));
//
// }

const User = require('./user');
const shell = require('shelljs');
const fs = require('fs');
const { Mutex, Semaphore } = require('async-mutex');
const mutex = new Mutex();
const sender = require('./sender');


const REPORT_DIR = `${global.DATA_DIRECTORY}/reports`;

function fileLocation(day, hour) {
  return `${REPORT_DIR}/${day}/${hour}.json`;
}

function readable(reports) {
  let list = '';
  reports.forEach((rep) => list += `\t{"id": "${rep.id}", "userId": "${rep.userId}", "time": "${rep.time}", "type": "${rep.type}"},\n`)
  return `[\n${list.substr(0, list.length - 2)}\n]\n`;
}


const timeReg = /([0-9][0-9]):([0-9][0-9])/;
function buildReportDirs() {
  const reports = {};
  const files = shell.find(`${User.directory}/*.json`).stdout.trim().split('\n');
  const semaphore = new Semaphore(files.length);

  function process(err, data) {
    function save() {
      mutex.acquire().then((release) => {
        Object.keys(reports).forEach((day) => {
          Object.keys(reports[day]).forEach((hour) => {
            const data = readable(reports[day][hour]);
            const fileLoc = fileLocation(day, hour);
            shell.mkdir('-p', fileLoc.replace(/(.*)\/.*\.json/, '$1'));
            fs.writeFileSync(fileLoc, data);
          });
        });
        release();
      });
    }
    const userInfo = JSON.parse(data);
    const schedualedReports = userInfo.schedualedReports;
    schedualedReports.forEach((report) => {
      report.dayIndexes.forEach((day) => {
        const match = report.time.match(timeReg);
        const hour = match[1];
        const minute = match[2];
        if (reports[day] === undefined) reports[day] = {};
        if (reports[day][hour] === undefined) reports[day][hour] = [];
        reports[day][hour].push({userId: userInfo.userId, time: report.time, type: report.type.toLowerCase(), id: report.id});
      });
    });
    semaphore.acquire().then(([value, release]) => {
      value--;
      if (value === 0) save();
    });
  }
  files.forEach((file) => {
    if (file) fs.readFile(file, process);
  });
}

function dateFromReport(report) {
  const match = report.time.match(timeReg);
  const repDate = new Date();
  repDate.setHours(match[1]);
  repDate.setMinutes(match[2]);
  return repDate;
}

function pullDates(day, hour) {
  console.log('pulling dates:', day, hour)
  hour = hour.length === 2 ? hour : `0${hour}`;
  const fileLoc = fileLocation(day, hour);
  let list = [];
  console.log('fileLocation', fileLoc)
  if (fs.existsSync(fileLoc)) {
    console.log('found')
    list = JSON.parse(fs.readFileSync(fileLoc));
  }
  list.forEach((report) => {
    report.date = dateFromReport(report);
  });
  return list;
}

function get2hours() {
  const currDate = new Date();
  const hourLater = new Date();
  hourLater.setHours(hourLater.getHours() + 1)
  hourLater.setMinutes(59);
  let list = pullDates(currDate.getDay(), currDate.getHours());
  list = list.concat(pullDates(hourLater.getDay(), hourLater.getHours()));
  list.push({date: hourLater});
  return list;
}

const threshhold = 60000
function wakeIn(report) {
  const sleepTime = report.date.getTime() - new Date().getTime();
  return sleepTime < threshhold ? sleepTime : threshhold;
}

let lastReportSentId = String.random();
function currReports() {
  console.log('lastReportSentId', lastReportSentId);
  const nextMinute = new Date();
  nextMinute.setHours(nextMinute.getHours());
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);
  nextMinute.setSeconds(0);

  function nextMinuteFilter(report) {
    return new Date(report.date) < nextMinute;
  }

  reps = [{"id":"t8dsbdx","userId":"2172548654","time":"08:03","type":"Both","date":"2022-04-30T13:03:20.420Z"},{"id":"ze4tlyb","userId":"2172548654","time":"08:04","type":"Both","date":"2022-04-30T13:04:20.420Z"},{"id":"ks65y05","userId":"2172548654","time":"08:09","type":"Both","date":"2022-04-30T13:09:20.420Z"},{"id":"kv0tzom","userId":"2172548654","time":"09:03","type":"Both","date":"2022-04-30T14:03:20.420Z"},{"id":"noxcmkn","userId":"2172941286","time":"09:59","type":"Hourly","date":"2022-04-30T14:59:20.420Z"},{"id":"1puqgki","userId":"2172941286","time":"09:58","type":"Both","date":"2022-04-30T14:58:20.420Z"},{"date":"2022-04-30T14:59:20.419Z"}]
  reps.filter(nextMinuteFilter);

  const twoHours = get2hours();
  const idMap = twoHours.map((r) => r.id);
  let lastRepIndex = idMap.indexOf(lastReportSentId);
  let startIndex = lastRepIndex === -1 ? 0 : lastRepIndex + 1;
  console.log(startIndex, ') th', JSON.stringify(twoHours));
  const slice = twoHours.slice(startIndex);
  console.log('slice', JSON.stringify(slice));
  const nextMinuteArray = slice.filter(nextMinuteFilter);
  console.log('nma', JSON.stringify(nextMinuteArray));
  const firstUnsent = slice[nextMinuteArray.length];
  console.log('firstUnsent', firstUnsent);
  return {nextMinuteArray, wakeIn: wakeIn(firstUnsent)};
}



function runReports() {
  buildReportDirs();
  function run() {
    const currReps = currReports();
    const scheduleList = currReps.nextMinuteArray;
    console.log('schdlist', scheduleList);
    const wakeIn = currReps.wakeIn;
    scheduleList.forEach((report) => {
      try {
        console.log('run report', report);
        sender.weatherReport(new User(report.userId), report.type);
        lastReportSentId = report.id;
      } catch (e) {
        console.log(e);
      }
    });
    console.log(currReps, '\nwakeIn:', wakeIn);
    setTimeout(run, wakeIn);
  }
  run();
  console.log('running');
}

runReports.buildReportDirs = buildReportDirs;

module.exports = runReports;
