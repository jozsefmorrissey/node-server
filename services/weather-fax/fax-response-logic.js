
const shell = require('shelljs');
const fs = require('fs');

const NUMBERS = require('./src/numbers');
const Sender = require('./src/sender');
const User = require('./src/user');

EVENTS = {};
EVENTS.FAX_DELIVERED = 'fax.delivered';
EVENTS.FAX_RECIEVED = 'fax.received';
EVENTS.FAX_FAILED = 'fax.failed';

EXCEPTIONS = {}

const HOOK_DIR = './services/weather-fax/hooks';
const MEDIA_DIR = './services/weather-fax/public/faxes/';

const dateStr = () => new Date().toISOString();
const hookFileName = (event_type) => `${HOOK_DIR}/${event_type}/${dateStr()}.json`;

async function saveFile(type, from, url) {
    const dir = `${SERVICE_DIR}faxes/${type}/`;
    const filename = `${dir}${from}-${dateStr()}.pdf`;
    shell.mkdir('-p', dir);
    shell.mkdir('-p', pdfLocation.replace(/(.*)\/.*/, '$1'))
    const pdfBuffer = await request.get({
      uri: url,
      encoding: null,
    });
    fs.writeFileSync(filename, pdfBuffer);
}

function logUnprocessed(data) {
  const filename = hookFileName(data.event_type);
  shell.mkdir('-p', filename.replace(/(.*)\/.*/, '$1'))
  fs.writeFile(filename, JSON.stringify(data, null, 2), console.log);
}

class FaxResponseLogic {
  constructor() {

    function weatherRequestRecieved(user) {
      console.log('request Recieved', user.faxNumber(), user.notInDB);
      if (user.notInDB) {
        console.log('initialResponse');
        Sender.initialResponse(user);
        user.save();
      } else if (user.canRequest()) {
        console.log('canRequest');
        Sender.weatherRequest(user);
      } else {
        console.log('requestsCapped');
        Sender.requestsCapped(user);
      }
    }
    function accountServiceRequestRecieved(user, pdfUrl) {
      const randStr = String.random();
      const saveLocation = `${FaxResponseLogic.incoming.directory}/${user.userId()}-${randStr}.txt`;
      const saveDirectory = saveLocation.replace(/(.*\/).*/, '$1');
      shell.mkdir('-p', saveDirectory);
      fs.writeFileSync(saveLocation, pdfUrl);
      Sender.orderForm(user);
    }
    function toggleSchedualedReportsRequestRecieved(user) {
      if (user.notInDB) return;// TODO: Always Send Something???...!!!
      user.toggleSchedualedReports();
      user.save();
      Sender.status(user);
    }

    this.recieved = (data) => {
      const eventType = data.event_type;
      const user = new User(data.payload.from);
      const mediaUrl = data.payload.media_url;
      const to = data.payload.to;
      console.log("TO?", to)
      if (eventType === EVENTS.FAX_RECIEVED) {
        switch (to) {
          case NUMBERS.WEATHER_REQUEST.faxNumber():
            weatherRequestRecieved(user);
            break;
          case NUMBERS.ACCOUNT_SERVICE.faxNumber():
            accountServiceRequestRecieved(user, mediaUrl);
            break;
          case NUMBERS.TOGGLE_SCHEDUALED_REPORTS.faxNumber():
            toggleSchedualedReportsRequestRecieved(user);
            break;
          default:
            logUnprocessed(data);
        }
      } else {
        logUnprocessed(data);
      }
    }
  }
}

FaxResponseLogic.incoming = {};
FaxResponseLogic.incoming.directory = `${global.DATA_DIRECTORY}/incoming/`;

module.exports =  new FaxResponseLogic();
