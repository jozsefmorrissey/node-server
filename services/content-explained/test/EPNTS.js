
const { EPNTS } = require('../services/EPNTS.js');

const testing = require('testing');

function testUserEndpoints(callback) {
  testing.assertEquals(EPNTS.user.login(), "/user/login", "1", callback);
  testing.assertEquals(EPNTS.user.login(3), "/user/login", "2", callback);
  testing.assertEquals(EPNTS.user.get(), "/user/:ids", "3", callback);
  testing.assertEquals(EPNTS.user.get({ids: 'free'}), "/user/free", "3", callback);
  testing.assertEquals(EPNTS.user.get(1), "/user/1", "4", callback);
  testing.assertEquals(EPNTS.user.add(), "/user", "5", callback);
  testing.assertEquals(EPNTS.user.add(2), "/user", "6", callback);
  testing.success(callback);
}

function testCredentialEndpoints(callback) {
  testing.assertEquals(EPNTS.credential.add(), "/credential/:userId", "1", callback);
  testing.assertEquals(EPNTS.credential.add(2), "/credential/2", "2", callback);
  testing.assertEquals(EPNTS.credential.activate(), "/credential/activate/:userId/:activationSecret", "3", callback);
  testing.assertEquals(EPNTS.credential.activate({userId: 44, activationSecret: "shhhhhkabob"}), "/credential/activate/44/shhhhhkabob", "3", callback);
  testing.assertEquals(EPNTS.credential.activate(3), "/credential/activate/3/:activationSecret", "4", callback);
  testing.assertEquals(EPNTS.credential.activate('f', null), "/credential/activate/f/null", "5", callback);
  testing.assertEquals(EPNTS.credential.activate(undefined, 3), "/credential/activate/:userId/3", "6", callback);
  testing.assertEquals(EPNTS.credential.delete(), "/credential/:credId", "7", callback);
  testing.assertEquals(EPNTS.credential.delete(3), "/credential/3", "8", callback);
  testing.assertEquals(EPNTS.credential.get(), "/credential/:userId", "9", callback);
  testing.assertEquals(EPNTS.credential.get(11), "/credential/11", "10", callback);
  testing.success(callback);
}

testing.run([testUserEndpoints, testCredentialEndpoints]);
