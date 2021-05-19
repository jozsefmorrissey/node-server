
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const fs = require('fs');
const shell = require('shelljs');

class CustomError extends Error {
  constructor(msg, code) {
    super(msg + (code ? `\nError Code:${code}` : ''))
    this.msg = msg;
    this.code = code;
  }
}

class BadRequest extends CustomError {
  constructor(string, code) {
    super(string, code);
    this.name = this.constructor.name;
    this.status = 400;
  }
}

class FieldsMustBeDefined extends BadRequest {
  constructor(fieldStr) {
    super(`Fields Must Be Defined: ${fieldStr}`, 'osh1Ah');
  }
}

class EmailAlreadyRegistered extends BadRequest {
  constructor(email) {
    super(`Email Already Registered: ${email}`, 'OuV7oo');
  }
}

class Invalid extends BadRequest {
  constructor(attr, value, code) {
    super(`Invalid ${attr}: ${value}`, Invalid.codes[attr.toUpperCase()]);
  }
}

class UnAuthorized extends Error {
  constructor(msg) {
    super(msg || 'Credentials not valid');
    this.status = 401;
    this.msg = msg;
  }
}

Invalid.codes = {};
Invalid.codes.EMAIL = 'Hohs8E';
Invalid.codes.PASSWORD = 'ooqu0N';
Invalid.codes.SECRET = 'bae0Ei';

class UserAlreadyActivated extends BadRequest {
  constructor(email) {
    super(`User already activated: ${email}`, 'Mesh1o');
  }
}

class User {
  constructor(email, secret, password) {
    const instance = this;
    let user;
    let token;

    const replaceSpecial = (match) => match.charCodeAt(0);

    function userDataFilePath(name) {
      if (email === undefined) return false;
      name = name || 'userInfo';
      name = name.replace(/\./g, '/');
      return `${instance.dataDirectory()}${name}.json`;
    }

    this.dataDirectory = (path) => {
      path = path || '';
      path.replace(/\./g, '/');
      const cleanEmail = email.replace(/[^a-z^A-Z^0-9]/g, replaceSpecial);
      return `${User.directory}${cleanEmail}/${path}`;
    }

    function get() {
      const dfp = userDataFilePath();
      if (user) return user;
      try {
        user = JSON.parse(fs.readFileSync(dfp));
      } catch (e) {
        return false;
      }

      return user;
    }

    this.status = () => {
      let user = get();
      if (user === false) return 'Not Registered';
      if (user.activated === false) return 'Not Activated';
      console.log(email, secret);
      if (this.validate(true)) return 'Logged In';
      return 'Logged Out';
    }

    function getToken(s, e) {
      s = s || secret;
      const expire = e || User.experation();
      console.log(s, secret)
      if (s === undefined && e === undefined && token)
        return token;
      if (s !== undefined)
        return {secret: bcrypt.hashSync(s, salt), expire};
      return false;
    }

    function toJson(tokens) {
      return {email, password, tokens};
    }

    const notExpired = (token) => new Date().getTime() < token.expire;

    function validToken() {
      const user = get();
      if (!user || secret === undefined) return false;
      var hash = bcrypt.hashSync(secret, salt);
      for(let index = 0; index < user.tokens.length; index += 1) {
          const token = user.tokens[index];
          if (bcrypt.compareSync(secret, token.secret) && notExpired(token))
          return token;
      }
      return false;
    }

    this.removeToken = function (secret) {
      const user = get();
      const tokens = user.tokens;
      const now = new Date().getTime();
      for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        if (token.expire < now || bcrypt.compareSync(secret, token.secret)) {
          tokens.splice(index, 1);
          index--;
        }
      }
    }

    function addToken(token) {
      get().tokens.push(token)
    }

    function save(user) {
      user = user || get();
      try {
        shell.mkdir('-p', instance.dataDirectory());
        const userData = JSON.stringify(user, null, 2);
        fs.writeFileSync(userDataFilePath(), userData);
        return true;
      } catch(e) {
        console.error('saveError', e)
        return false;
      }
    }

    this.saveData = (path, data) => {
      if (!this.validate(true)) throw new UnAuthorized();
      // console.log(JSON.stringify(data))
      try {
        let dirPath = path.split(".");
        dirPath = dirPath.splice(0, dirPath.length - 1).join('.');
        const filePath = userDataFilePath(path);
        const directory = this.dataDirectory(dirPath);
        console.log('dir:', dirPath, directory)
        shell.mkdir('-p', directory);
        shell.touch(filePath);
        fs.writeFileSync(filePath, JSON.stringify(data));
        return true;
      } catch(e) {
        console.error('saveError', e);
        return false;
      }
    }

    this.loadData = (name) => {
      try {
        return JSON.parse(fs.readFileSync(userDataFilePath(name)));
      } catch (e) {
        console.error(e);
        return undefined;
      }
    }

    this.saveAttribute = (name, attr, attrData) => {
      let data = this.loadData(name) || {};
      data[attr] = attrData;
      return this.saveData(name, data);
    }

    this.list = (dirPath) => {
      let list = shell.ls(this.dataDirectory(dirPath)).stdout;
      if (!list) return [];
      list = list.trim().split('\n');
      for(let index = 0; index < list.length; index += 1) {
        list[index] = list[index].replace(/\.json$/, '');
      }
      return list;
    }

    function createActivationToken(p) {
      const user = get() || { email, activated: false };
      const s = User.randomString(32);
      user.tokens = [getToken(s, Number.MAX_SAFE_INTEGER)]
      user.password = user.password || bcrypt.hashSync(p, salt);
      save(user);
      return s;
    }

    this.register = function () {
      if (email == undefined || password === undefined)
        throw new FieldsMustBeDefined('email, password');
      if (get())
        throw new EmailAlreadyRegistered(email);
      return createActivationToken(password);
    };

    this.login = function () {
      secret = User.randomString(32);
      console.log(get());
      if (!this.validate(true))
        throw new Invalid('password', password);
      addToken(getToken());
      save();
      return secret;
    }

    this.activationSecret = function () {
      const user = get();
      if (!user)
        throw new Invalid('email', email);
      if (user.activated !== false)
        throw new UserAlreadyActivated(email);
      return createActivationToken();
    }

    this.validate = function (soft) {
      const user = get();
      if (!user || user.activated === false) {
        if (soft) return false;
        throw new UnAuthorized();
      }

      if (password !== undefined) {
        if (bcrypt.compareSync(password, user.password)) return true;
      }

      const token = validToken();
      if (token === false) {
        if (soft) return false;
        throw new UnAuthorized();
      }
      return true;
    }

    this.activate = function () {
      const token = validToken();
      if (!token)
        throw new Invalid('secret', secret);
      const user = get();
      if (!user)
        throw new Invalid('email', email);
      if (user.activated !== false)
        throw new UserAlreadyActivated(email);
      delete user.activated;
      this.removeToken(secret);
      save();
    }

    this.resetPasswordToken = function (newPassword) {
      const user = get(true);
      if (!user)
        throw new Invalid('email', email);
      if ((typeof newPassword) !== 'string')
        throw new FieldsMustBeDefined('password');
      const expire = new Date().getTime() + 300000; // 5 minutes
      const secret = User.randomString(32);
      const resetToken = {
        secret: bcrypt.hashSync(secret, salt),
        type: User.RESET,
        password: bcrypt.hashSync(newPassword, salt),
        passwordRaw: newPassword,
        expire
      };
      addToken(resetToken);
      save();
      return secret;
    }

    this.resetPassword = function () {
      const token = validToken();
      if (!token || token.type !== User.RESET)
        throw new Invalid('secret', secret);
      get().password = token.password;
      get().rawPass = token.passwordRaw;
      this.removeToken(secret);
      save();
    }
  }
}

User.fromJson = (json) => new User(json.email, json.password, json.token);
User.directory = shell.exec('realpath ~/.opsc/cabinet/user/').stdout.trim() + '/';
User.RESET = 'reset';
User.experation = () => new Date().getTime() + 15552000000; // 6 Months
User.randomString = function (len) {
  let str = '';
  while (str.length < len) str += Math.random().toString(36).substr(2);
  return str.substr(0, len);
}

exports.User = User;
exports.UnAuthorized = UnAuthorized;
