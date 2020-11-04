const axios = require('axios');
const buildWhite = async () => {
  let white = [];
  let res = await axios.get('https://katie-cah-api.herokuapp.com/0');
  let temp1 = res.data.white;
  white = temp1.map((x) => {
    return x.text;
  });
  // shuffle
  for (let i = 0; i < white.length * 2; i++) {
    const one = Math.floor(Math.random() * (white.length - 1));
    const two = Math.floor(Math.random() * (white.length - 1));
    let temp = white[one];
    white[one] = white[two];
    white[two] = temp;
  }
  return white;
};
const buildBlack = async () => {
  let black = [];
  let res = await axios.get('https://katie-cah-api.herokuapp.com/0');
  let temp1 = res.data.black;
  black = temp1
    .filter((x) => x.pick === 1)
    .map((x) => {
      return x.text;
    });
  // shuffle
  for (let i = 0; i < black.length * 2; i++) {
    const one = Math.floor(Math.random() * (black.length - 1));
    const two = Math.floor(Math.random() * (black.length - 1));
    let temp = black[one];
    black[one] = black[two];
    black[two] = temp;
  }
  return black;
};

const buildNameSocketMap = (players) => {
  let map = {};
  players.map((x) => {
    map[x.name] = x.socketID;
  });
  return map;
};

const buildNameIndexMap = (players) => {
  let map = {};
  players.map((x, i) => {
    map[x.name] = i;
  });
  return map;
};

const buildPlayers = async (players) => {
  let colors = [
    '#73C373',
    '#7AB8D3',
    '#DD6C75',
    '#8C6CE6',
    '#EA9158',
    '#CB8F8F',
    '#FFC303',
  ];
  for (let i = 0; i < colors.length * 2; i++) {
    const one = i % colors.length;
    const two = Math.floor(Math.random() * colors.length - 1);
    let temp = colors[one];
    colors[one] = colors[two];
    colors[two] = temp;
  }
  await players.forEach((x) => {
    delete x.chosen;
    x.cards = [];
    x.points = 0;
    x.color = colors.pop();
    delete x.isReady;
  });
  return players;
};

const exportPlayers = (players) => {
  players.forEach((x) => {
    delete x.socketID;
  });
  return players;
};

module.exports = {
  buildBlack,
  buildWhite,
  buildNameIndexMap,
  buildNameSocketMap,
  buildPlayers,
  exportPlayers,
};
