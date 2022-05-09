
dg = DebugGuiClient.browser('Weather-Fax.admin.webpage')
const IS_ADMIN=true;

const password = du.param.get('adminPassword');
du.param.remove('adminPassword');
Request.globalHeader('Authorization', password);

function load() {
  const userId = du.find('input[name="user-id"]').value;
  function update(data) {
    du.find('#user-info').innerHTML = data;
  }
  function noRecord(xhr) {
    let msg = xhr.response;
    if (xhr.status === 404) {
      document.body.innerHTML = `<h2>This interface is no longer valid</h2>`;
    } else if (xhr.status === 400) {
      du.find('#user-info').innerHTML = `<h2>Bad Request: ${msg}</h2>`;
    } else {
      du.find('#user-info').innerHTML = `<h2>Unknown Server Error: ${userId}</h2>`;
    }
  }
  Request.get(`/weather-fax/admin/manage/${userId}`, update, noRecord);
}

function save() {
  function success() {
    dg.log('saved Successfully');
  }
  function fail() {
    dg.log('save failed');
  }
  dg.log('admin save');
  const user = buildUser();
  dg.log(user);
  Request.post(`/weather-fax/admin/save`, user, success, fail);
}

function updateReports() {
  function success() {
    dg.log('Report Schedule Updated Successfully');
  }
  Request.get(`/weather-fax/admin/update/report/schedule`, success);
}

function toggleDebug() {
  function success(isDebugging) {
    dg.setDebug(isDebugging);
    dg.log('Debug has been toggled!');
  }
  Request.get(`/weather-fax/admin/debug/toggle`, success);
}

du.on.match('click', '#update-reports', updateReports);
du.on.match('click', '#toggle-debug', toggleDebug);
du.on.match('enter', 'input[name="user-id"]', load);
du.on.match('click', 'button', save);
