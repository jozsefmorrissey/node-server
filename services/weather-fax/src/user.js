
const shell = require('shelljs');
const fs = require('fs');
const utils = require('./utils.js');
const emailReg = /^\s*([^@]{1,})@([^@^.]{1,})(\.([^@^.]{1,}))*\s*$$/;
const Plan = require('./plan');
const dg = require('./debug-gui-interface');

class SchedualedReport {
  constructor(time, dayIndexes, type) {
    const isJson = (typeof time) === 'object' && time._TYPE === 'SchedualedReport';
    Object.getSet(this, 'time', 'dayIndexes', 'type', 'id', 'contractEndDate');
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
                      'schedualedReports', 'schedualedReportsActive', 'userId',
                      'plan', 'balance', 'contractEndDate');
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
    this.adjustBalance = (balance) =>
      this.balance(this.balance() + balance);

    this.isFax = () => faxNumber !== undefined;
    this.faxNumber = () => faxNumber;
    this.faxNumbersOnly = () => faxNumber.replace(/[^0-9^+]/g, '');
    this.email = () => email;
    this.schedualedReportsActive = () => user.schedualedReportsActive;
    this.schedualedReports = () => JSON.clone(user.schedualedReports || []);
    this.schedualedReportStatus = () =>
        user.schedualedReportsActive ? 'Acitve' : 'Inactive';

    this.addReport = (time, dayIndexes, type) => {
        if (this.plan().reportLimit() <= user.schedualedReports.length) {
          throw new Error(`Cannot add any more reports to User: ${userId}`);
        }
        user.schedualedReports.push(new SchedualedReport(time, dayIndexes, type));
    }

    this.removeReport = (id) =>  {
      dg.log(`removed userId: '${id}'`);
      for (let index = 0; index < user.schedualedReports.length; index += 1) {
        if (id === user.schedualedReports[index].id()) {
          return user.schedualedReports.splice(index,1);
        }
      }
    }

    this.toggleSchedualedReports = () => {
      user.schedualedReportsActive = !user.schedualedReportsActive;
    }
    this.requestMonth = () => user.requestMonth || new Date().getMonth();
    this.requestCount = () => user.requestCount || 0;
    this.reportCount = () => user.reportCount() || 0;
    this.request = () => {
      const month = new Date().getMonth();
      if (month !== this.requestMonth()) {
        user.requestMonth = month;
        user.requestCount = 0;
      }
      user.requestCount++;
      this.save();
    }
    this.canRequest = () => {
      console.log(`${this.plan().requestLimit()} > ${this.requestCount()}`)
      return this.plan().requestLimit() > this.requestCount();
    }

    this.userDataLocation = () => {
      return `${User.directory}${userId}.json`;
    }

    function get() {
      if (user) return user;
      const dfp = instance.userDataLocation();
      try {
        user = JSON.parse(fs.readFileSync(dfp));
        dg.object('user.get', user);
        user.schedualedReports = Object.fromJson(user.schedualedReports);
        instance.timeZone(user.timeZone);
        instance.zipCode(user.zipCode);
        instance.balance(user.balance);
        instance.startDate(new Date(user.startDate));
        instance.paidUntil(new Date(user.paidUntil));
        instance.plan(Object.fromJson(user.plan));
      } catch (e) {
        dg.exception('user.get', e);
        user = {schedualedReports: []};
        instance.balance(0);
        instance.zipCode(utils.areaOzipOnumberToZip(faxNumber));
        instance.timeZone(utils.getTimeZone(instance.zipCode(), true));
        instance.plan(Plan.plans.casual);
        instance.notInDB = true;
        user.schedualedReportsActive = true;
        instance.startDate(new Date());
        dg.object('user.new', instance.toJson());
      }

      return user;
    }

    this.CONTACTED = () => user.status = 'CONTACTED';
    this.CONFIGURED = () => user.status = 'CONFIGURED';
    this.PAID = () => {
      instance.paidUntil(this.contractEndDate());
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

User.directory = `${global.WEATHER_FAX_DATA_DIR}/user/`;

User.addBalance = (user, plan, years) => {
  if (plan === undefined) return;
  dg.object('user.addBalance', {user: user.toJson(), plan: plan.toJson(), years});
  if (!plan || (user.plan() && user.plan().level() >= plan.level())) return;
  console.log('level????', user.plan().level(), '=>', plan.level());

  if (years < 1) years = 1;
  if (years > 5) years = 5;
  const pricePerYear = plan.price();
  const multipleYearDiscount = (1 - ((years - 1) * 0.0625));
  const emailDiscount = user.isFax() ? 1 : .8;
  const totalDiscount = multipleYearDiscount * emailDiscount;
  const cost = Math.round(100 * (pricePerYear * years * totalDiscount)) / 100;
  dg.value('user.addBalance', 'cost' , cost);
  user.adjustBalance(-1 * cost);
  user.plan(plan);
  const endDate = new Date();
  endDate.setYear(endDate.getYear() + years);
  dg.value('user.addBalance', 'contractEndDate' , endDate);
  user.contractEndDate(endDate);
}

User.update = (obj) => {
  const user = new User(obj.accountId);
  if (utils.validZipCode(obj.zipCode)) user.zipCode(obj.zipCode);
  if (utils.validTimeZone(obj.timeZone)) user.timeZone(obj.timeZone);
  User.addBalance(user, Plan.getPlan(obj.planName), obj.years);
  obj.schedualedReports.new.forEach((sr) =>
      user.addReport(sr.time, sr.dayIndexes, sr.type));
  obj.schedualedReports.remove.forEach((srId) =>
      user.removeReport(srId));
  dg.object('user.update', user.toJson());
  user.save();
}

module.exports = User;
