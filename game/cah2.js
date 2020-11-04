const utils = require('./utils');
let nameSocketMap = null;
let nameIndexMap = null;
let players = null;
let currentJudge = 0;
let whiteDeck = null;
let blackDeck = null;
let gameSocket = null;
let judgeCards = [];
const resetGame = async () => {
  currentJudge = 0;
  for (let i = 0; i < players.length; i++) {
    players[i].cards = [
      whiteDeck.pop(),
      whiteDeck.pop(),
      whiteDeck.pop(),
      whiteDeck.pop(),
      whiteDeck.pop(),
      whiteDeck.pop(),
    ];
    players[i].points = 0;
  }
};
const listen = () => {
  players.map((x) => {
    const socket = gameSocket.sockets[x.socketID];
    socket.on('g-sendCard', (card, from) => {
      judgeCards.push(card);
      socket
        .to(players[currentJudge].socketID)
        .emit('g-receiveCards', judgeCards, from);
    });
    socket.on('g-newCard', async (cards) => {
      gameSocket.sockets[x.cards] = [...cards, await whiteDeck.pop()];
      let i = players.indexOf(x);
      players[i].cards = gameSocket.sockets[x.cards];
      // updatePlayers(players.filter((x) => players.indexOf(x) !== currentJudge));
      updatePlayers();
    });
    socket.on('g-judgeDone', (card, winner) => {
      let i = nameIndexMap[winner];
      players[i].points++;
      gameSocket.emit('g-revealWinner', card, winner);
      // updatePlayers([winner]);
      updatePlayers();
    });
    socket.on('g-nextRound', () => {
      gameSocket.emit('g-startNextRound');
      nextTurn();
    });
  });
};
// todo: only update the players that need updating
const updatePlayers = () => {
  gameSocket.emit(
    'g-updatePlayers',
    utils.exportPlayers(JSON.parse(JSON.stringify(players))),
  );
  // we need separate emit for cards bc only u can see ur cards
  players.map((player) => {
    gameSocket.to(nameSocketMap[player.name]).emit('g-cardUpdate', player);
  });
};
const nextTurn = () => {
  currentJudge = currentJudge + 1;
  currentJudge = currentJudge % players.length;
  gameSocket.emit('g-newJudge', players[currentJudge], blackDeck.pop());
  judgeCards = [];
  // updatePlayers(players);
  updatePlayers();
};
const startGame = async (playerss, gameSocke) => {
  nameSocketMap = utils.buildNameSocketMap(playerss);
  nameIndexMap = utils.buildNameIndexMap(playerss);
  players = await utils.buildPlayers(playerss);
  currentJudge = 0;
  whiteDeck = await utils.buildWhite();
  blackDeck = await utils.buildBlack();
  gameSocket = gameSocke;
  await resetGame();
  listen();
  // updatePlayers(players);
  gameSocket.emit('g-newJudge', players[currentJudge], blackDeck.pop());
  judgeCards = [];
  updatePlayers();
};

module.exports = {
  startGame,
  resetGame,
  listen,
  updatePlayers,
};
