
const NUMBERS = require('./numbers');
const Sender = require('./sender');
const HTML = require('./src/html');
const PDF = HTML.PDF;

EVENTS = {};
EVENTS.FAX_DELIVERED = 'fax.delivered';
EVENTS.FAX_RECIEVED = 'fax.received';
EVENTS.FAX_FAILED = 'fax.failed';

EXCEPTIONS = {}

const HOOK_DIR = './services/weather-fax/hooks';
const MEDIA_DIR = './services/weather-fax/public/faxes/';

const hookFileName = (event_type) => `${HOOK_DIR}/${event_type}/${dateStr()}.json`;
const mediaFileName = (number, event_type) => `${HOOK_DIR}/${event_type}/${number} ${dateStr()}.json`;

async function saveFile(type, from, url) {
    const dir = `${SERVICE_DIR}faxes/${type}/`;
    const filename = `${dir}${from}-${dateStr()}.pdf`;
    shell.mkdir('-p', dir);
    shell.touch(filename);
    const pdfBuffer = await request.get({
      uri: url,
      encoding: null,
    });
    fs.writeFileSync(filename, pdfBuffer);
}

function logUnprocessed(data) {
  const filename = getFilename(data.event_type);
  shell.touch(filename);
  try {
    const eventType = req.body.data.event_type;
    if (eventType === 'fax.sending.started') {
      const mediaUrl = req.body.data.payload.original_media_url;
      const from = req.body.data.payload.from;
      saveFile('incoming', from, mediaUrl);
    }
    fs.writeFile(`${SERVICE_DIR}faxes/test.pdf`, templates.test());
  } catch (e) {console.error(e)};
  fs.writeFile(filename, JSON.stringify(req.body, null, 2), console.log);
  res.send(`success: ${filename}`);
}

class FaxResponseLogic {
  constructor() {

    function weatherRequestRecieved(user) {
      if (user.notInDB) {
        Sender.initialResponse(user);
        user.save();
      } else if (user.canRequest()) {
        Sender.weatherRequest(user);
      } else {
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
      userl.save();
      Sender.status(user);
    }

    this.recieved = (data) => {
      const eventType = data.event_type;
      const user = new User(data.payload.from);
      const mediaUrl = data.payload.media_url;
      const to = data.payload.to.replace(/[^0-9]/g, '');
      switch (to) {
        case NUMBERS.WEATHER_REQUEST:
          weatherRequestRecieved(user);
          break;
        case NUMBERS.ACCOUNT_SERVICE:
          accountServiceRequestRecieved(user, mediaUrl);
          break;
        case NUMBERS.TOGGLE_SCHEDUALED_REPORTS:
          toggleSchedualedReportsRequestRecieved(user);
          break;
        default:
          logUnprocessed(data);
      }
    }
  }
}

FaxResponseLogic.incoming = {};
FaxResponseLogic.incoming.directory = `${global.DATA_DIRECTORY}/incoming/`;

module.exports =  new FaxResponseLogic();
