const { startGame } = require('./cah2');
module.exports = class CahGame {
  start(players, gameSocket) {
    startGame(players, gameSocket);
  }
};
