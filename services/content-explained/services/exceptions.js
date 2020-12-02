
class CustomError extends Error {
  constructor(msg, code) {
    super(msg + (code ? `\nError Code:${code}` : ''))
    console.log('heerrr', msg + (code ? `<br>Error Code:${code}` : ''));
  }
}

class UsernameAlreadyTaken extends Error {
  constructor(username) {
    super(`Username '${username}' has already been taken`);
    this.name = "UsernameAlreadyTaken";
    this.status = 400;
  }
}
exports.UsernameAlreadyTaken = UsernameAlreadyTaken;

class ExplanationNotFound extends Error {
  constructor(words) {
    super(`No explanation found for '${words}'.`);
    this.name = "ExplanationNotFound";
    this.status = 404;
  }
}
exports.ExplanationNotFound = ExplanationNotFound;

class NoSiteFound extends Error {
  constructor(url) {
    super(`No Site associated with url '${url}'.`);
    this.name = "NoSiteFound";
    this.status = 404;
  }
}
exports.NoSiteFound = NoSiteFound;

class InvalidRequest extends CustomError {
  constructor(msg, errorCode) {
    super(msg, errorCode);
    this.name = "InvalidRequest";
    this.status = 400.1;
  }
}
exports.InvalidRequest = InvalidRequest;


class MerriamRequestFailed extends CustomError {
  constructor() {
    super(`Merriam Request Failed`, 666);
    this.name = "MerriamRequestFailed";
    this.status = 500;
  }
}
exports.MerriamRequestFailed = MerriamRequestFailed;


class InvalidDataFormat extends Error {
  constructor(data, format, status) {
    super(`Recieved data:\n\t${data}\nRequired Format:\n\t${format}`);
    this.name = "InvalidDataFormat";
    this.status = 400;
  }
}
exports.InvalidDataFormat = InvalidDataFormat;

class UnAuthorized extends Error {
  constructor(msg) {
    super(msg || 'Access Denied');
    this.name = 'UnAuthorized';
    this.status = 401;
  }
}
exports.UnAuthorized = UnAuthorized;

class InvalidType extends Error {
  constructor(type, invalidType, ...validTypes) {
    super(`Invalid ${type} value: '${invalidType}'\n\tAcceptableTypes: ${validTypes.join()}`);
    this.name = "InvalidType";
    this.status = 400;
  }
}
exports.InvalidType = InvalidType;

function where(conditions) {
  if (conditions) {
    const cond = [];
    const keys = Object.keys(conditions);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      cond.push(`${key}=${conditions[key]}`);
    }
    return `\n\twhere ${keys.join}`;
  }
  return '';
}
class SqlOperationFailed extends Error {
  constructor(operation, table, conditions) {
    super(`Failed to perform '${operation}' on '${table}'${where(conditions)}`);
    this.name = "SqlOperationFailed";
    this.status = 500;
  }
}
exports.SqlOperationFailed = SqlOperationFailed;

class EmailServiceFailure extends Error {
  constructor() {
    super(`Email failed to send`);
    this.name = "EmailServiceFailure";
    this.status = 500;
  }
}
exports.EmailServiceFailure = EmailServiceFailure;


class ShouldNeverHappen extends Error {
  constructor(reason) {
    super(reason);
    this.name = "ShouldNeverHappen";
    this.status = 500;
  }
}
exports.ShouldNeverHappen = ShouldNeverHappen;

class DuplacateUniqueValue extends Error {
  constructor() {
    super();
    this.name = "DuplacateUniqueValue";
    this.status = 400;
  }
}
exports.DuplacateUniqueValue = DuplacateUniqueValue;

class NotFound extends Error {
  constructor(type, id) {
    super(arguments.length === 1 ? type : `No '${type}' found with id ${id}`);
    this.name = "NotFound";
    this.status = 404;
  }
}
exports.NotFound = NotFound;

class CredentialNotActive extends Error {
  constructor() {
    super('Account needs activated check your email');
    this.name = "CredentialNotActive";
    this.status = 400;
  }
}
exports.CredentialNotActive = CredentialNotActive;


// class  extends Error {
//   constructor(words) {
//     super(``);
//     this.name = "";
//     this.status = ;
//   }
// }
//exports. = ;
//
// class  extends Error {
//   constructor(words) {
//     super(``);
//     this.name = "";
//     this.status = ;
//   }
// }
//exports. = ;
//
// class  extends Error {
//   constructor(words) {
//     super(``);
//     this.name = "";
//     this.status = ;
//   }
// }
//exports. = ;
