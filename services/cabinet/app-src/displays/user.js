
const du = require('../../../../public/js/utils/dom-utils.js');
const APP_ID = require('../../globals/CONSTANTS.js').APP_ID;
const Request = require('../../../../public/js/utils/request.js');
const EPNTS = require('../../generated/EPNTS');
const $t = require('../../../../public/js/utils/$t.js');

class User {
  constructor() {
    const stateAttr = 'user-state';
    let state, cnt, email, password;

    function updateDisplay(s) {
      state = s ? User.states[s] : state;
      cnt = cnt || du.id('login-cnt');
      cnt.innerHTML = state.template.render({email, password});
    }

    const hideLogin = () => du.id('login').hidden = true;
    const showLogin = () => du.id('login').hidden = false;
    function successfulRegistration(body) {
      updateDisplay('CONFIRMATION_MESSAGE');
    }

    function register(target) {password
      const fail = du.appendError(target, 'Registration Failed: Email already registered');
      const body = {email, password};
      document.cookie = `${APP_ID}=${email}:invalid`;
      Request.post(EPNTS.user.register(), body, successfulRegistration, fail);
    }

    function successfulLogin(body, res) {
      const newAuth = res.getResponseHeader('authorization');
      document.cookie = `${APP_ID}=${newAuth}`;
      hideLogin();
    }

    const getEmail = () => du.cookie.get(APP_ID, ':', 'email').email;
    this.credential = User.credential;

    function login(target) {
      const fail = du.appendError(target, 'Login Failed: Invalid Email and/or Password');
      const body = {email, password};
      Request.post(EPNTS.user.login(), body, successfulLogin, fail);
    }

    function resendActivation(target) {
      const fail = du.appendError(target, 'Email Not Registered Or Already Active');
      const body = {email: getEmail()};
      Request.post(EPNTS.user.resendActivation(), body, successfulRegistration, fail);
    }

    function logout() {
      du.cookie.remove(APP_ID);
      showLogin();
      updateDisplay('LOGIN')
    }

    function resetPassword(target) {
      const fail = du.appendError(target, 'Server Error Must have occured... try again in a few minutes');
      const body = {email, newPassword: password};
      Request.post(EPNTS.user.resetPasswordRequest(), body, successfulRegistration, fail);
    }

    du.on.match('click', `[${stateAttr}]`, (elem) => {
      const stateId = elem.getAttribute(stateAttr);
      if (User.states[stateId]) {
        updateDisplay(stateId);
      } else console.error(`Invalid State: '${stateId}'`);
    });

    du.on.match('click', '#register', register);
    du.on.match('click', '#login-btn', login);
    du.on.match('click', '#resend-activation', resendActivation);
    du.on.match('click', '#reset-password', resetPassword);
    du.on.match('click', '#logout-btn', logout);

    du.on.match('change', 'input[name="email"]', (elem) => email = elem.value);
    du.on.match('change', 'input[name="password"]', (elem) => password = elem.value);

    function statusCheck(body) {
      switch (body) {
        case 'Not Registered':
          updateDisplay('LOGIN')
          break;
        case 'Not Activated':
          updateDisplay('CONFIRMATION_MESSAGE');
          break;
        case 'Logged In':
          hideLogin();
          break;
        case 'Logged Out':
          updateDisplay('LOGIN')
          break;
        default:

      }
    }

    Request.globalHeader('Authorization', this.credential);
    if (this.credential()) Request.get(EPNTS.user.status(), statusCheck);
    else updateDisplay('LOGIN');
  }
}

User.states = {};
User.states.LOGIN = {
  template: new $t('login/login')
};
User.states.CONFIRMATION_MESSAGE = {
  template: new $t('login/confirmation-message')
};
User.states.CREATE_ACCOUNT = {
  template: new $t('login/create-account')
};
User.states.RESET_PASSWORD = {
  template: new $t('login/reset-password')
};

User.credential = () => du.cookie.get(APP_ID);


User = new User();
module.exports = User
