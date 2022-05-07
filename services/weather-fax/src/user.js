
const shell = require('shelljs');
const fs = require('fs');
const utils = require('./utils.js');
const emailReg = /^\s*([^@]{1,})@([^@^.]{1,})(\.([^@^.]{1,}))*\s*$$/;
const Plan = require('./plan');

class SchedualedReport {
  constructor(time, dayIndexes, type) {
    const isJson = (typeof time) === 'object' && time._TYPE === 'SchedualedReport';
    Object.getSet(this, 'time', 'dayIndexes', 'type', 'id');
    let id = String.random();
    if (isJson) {
      id = time.id;
      type = time.type;
      dayIndexes = time.dayIndexes;
      time = time.time;
    }
    this.time = () => time;
    this.dayIndexes = () => dayIndexes;
    this.type = () => type;
    this.id = () => id;
  }
}
// SchedualedReport.fromJson = (obj) => new SchedualedReport(obj);
new SchedualedReport();

class User {
  constructor(faxNumberOemail) {
    Object.getSet(this, 'faxNumber', 'status', 'zipCode', 'timeZone', 'startDate',
                      'paidUntil', 'requestCount', 'requestMonth', 'overdueDate',
                      'schedualedReports', 'schedualedReportsActive', 'userId', 'plan');
    let user, email, faxNumber, userId;
    let instance = this;

    const replaceSpecial = (match) => match.charCodeAt(0);
    if (faxNumberOemail.match(emailReg)) {
      email = faxNumberOemail;
      userId = email;
    } else {
      faxNumber = faxNumberOemail.replace(/(^\+1|[^0-9])/g, '');
      if (faxNumber.length !== 10) throw new Error(`Invalid faxNumber: ${faxNumberOemail}`);
      userId = faxNumber;
      const m = faxNumber.match(/([0-9]{3})([0-9]{3})([0-9]{4})/);
      faxNumber = `+1(${m[1]})${m[2]}-${m[3]}`;
    }
    this.userId = () => userId;

    this.isFax = () => faxNumber !== undefined;
    this.faxNumber = () => faxNumber;
    this.email = () => email;
    this.schedualedReportsActive = () => user.schedualedReportsActive;
    this.schedualedReports = () => JSON.clone(user.schedualedReports || []);

    this.addReport = (time, dayIndexes, type) => {
        if (this.plan().reportCount() <= user.schedualedReports.length) {
          throw new Error(`Cannot add any more reports to User: ${userId}`);
        }
        user.schedualedReports.push(new SchedualedReport(time, dayIndexes, type));
    }

    this.removeReport = (id) =>  {
      console.log('removeId', id);
      for (let index = 0; index < user.schedualedReports.length; index += 1) {
        if (id === user.schedualedReports[index].id()) {
          return user.schedualedReports.splice(index,1);
        }
      }
    }

    this.toggledSchedualedReports = () => {
      user.schedualedReportsActive = !user.schedualedReportsActive;
    }
    this.requestMonth = () => user.requestMonth;
    this.requestCount = () => user.requestCount;
    this.request = () => {
      const month = new Date().getMonth();
      if (month !== this.requestMonth()) {
        user.requestMonth = month;
        user.requestCount = 0;
      }
      user.requestCount++;
    }

    this.userDataLocation = () => {
      return `${User.directory}${userId}.json`;
    }

    function get() {
      if (user) return user;
      const dfp = instance.userDataLocation();
      try {
        user = JSON.parse(fs.readFileSync(dfp));
        user.schedualedReports = Object.fromJson(user.schedualedReports);
        console.log('sr fr json', JSON.stringify(user.schedualedReports, null, 2))
        instance.timeZone(user.timeZone);
        instance.zipCode(user.zipCode);
        instance.startDate(new Date(user.startDate));
        instance.paidUntil(new Date(user.paidUntil));
        instance.plan(Object.fromJson(user.plan));
      } catch (e) {
        console.log('USER ERROR', dfp, e);
        user = {schedualedReports: []};
        instance.zipCode(utils.areaOzipOnumberToZip(faxNumber));
        instance.timeZone(utils.getTimeZone(instance.zipCode()));
        instance.plan(Plan.plans.casual);
        user.schedualedReportsActive = true;
        instance.startDate(new Date());
      }

      return user;
    }

    this.CONTACTED = () => user.status = 'CONTACTED';
    this.CONFIGURED = () => user.status = 'CONFIGURED';
    this.PAID = (paidUntilDate) => {
      instance.paidUntil(paidUntilDate);
      user.status = 'PAID';
    }
    this.paidUp = () => {
      if (this.overdueDate()) return false;
      const currDate = new Date();
      const paidUntil = this.paidUntil();
      if (paidUntil) {
        if (currDate > paidUntil) return true;
        else {
          user.status = 'OVERDUE';
          this.overdueDate(new Date());
        }
      }
      currDate.setMonth(currDate.getMonth() - 1);
      return this.startDate() > currDate;
    }
    this.status = () => {
      let user = get();
      if (user.status === undefined) user.status = 'UNCONTACTED'
      return user.status;
    }



    this.save = () => {
      try {
        const saveLocation = instance.userDataLocation();
        const saveDirectory = saveLocation.replace(/(.*\/).*/, '$1');
        shell.mkdir('-p', saveDirectory);
        fs.writeFileSync(saveLocation, JSON.stringify(instance.toJson(), null, 2));
        return true;
      } catch(e) {
        console.error('saveError', e)
        return false;
      }
    }
    get();
  }
}

User.directory = `${global.DATA_DIRECTORY}/user/`;

User.update = (obj) => {
  console.log('obj', obj ? JSON.stringify(obj) : obj);
  const user = new User(obj.accountId);
  if (utils.validZipCode(obj.zipCode)) user.zipCode(obj.zipCode);
  if (utils.validTimeZone(obj.timeZone)) user.timeZone(obj.timeZone);
  console.log("plan", obj.planName.toLowerCase(), JSON.stringify(Plan.plans[obj.planName.toLowerCase()].toJson()));
  user.plan(Plan.plans[obj.planName.toLowerCase()]);
  console.log('new len', obj.schedualedReports.new.length);
  obj.schedualedReports.new.forEach((sr) =>
      user.addReport(sr.time, sr.dayIndexes, sr.type));
  obj.schedualedReports.remove.forEach((srId) =>
      user.removeReport(srId));
  console.log(user.schedualedReports());
  user.save();
  console.log(JSON.stringify(user.toJson()));
}

module.exports = User;
