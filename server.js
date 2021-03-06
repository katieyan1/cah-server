const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cors = require('cors');
const CahGame = require('./game/cah');
app.use(cors());
function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

let namespaces = {};

const whitelist = [
  'http://localhost:3000',
  'https://kards-against-humanity.herokuapp.com',
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('** Origin of request ' + origin);
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      console.log('Origin acceptable');
      callback(null, true);
    } else {
      console.log('Origin rejected');
      callback(new Error('Not allowed by CORS'));
    }
  },
};
app.use(cors(corsOptions));

app.get('/createNamespace', (req, res) => {
  let newNamespace = '';
  while (newNamespace === '' || newNamespace in namespaces) {
    newNamespace = makeid(6);
  }
  const newSocket = io.of(`/${newNamespace}`);
  openSocket(newSocket, `/${newNamespace}`);
  namespaces[newNamespace] = null;
  res.json({ namespace: newNamespace });
  console.log(newNamespace);
});

app.get('/exists/:namespace', (req, res) => {
  const namespace = req.params.namespace;
  res.json({ exists: namespace in namespaces });
});

const openSocket = (gameSocket, namespace) => {
  let players = [];
  let partyMembers = [];
  let partyLeader = '';
  let started = false;
  gameSocket.on('connection', (socket) => {
    players.push({
      player: '',
      socket_id: `${socket.id}`,
      isReady: false,
    });
    socket.join(socket.id);
    const index = players.length - 1;
    const updatePartyList = () => {
      partyMembers = players
        .map((x) => {
          return { name: x.player, socketID: x.socket_id, isReady: x.isReady };
        })
        .filter((x) => x.name !== '');
      gameSocket.emit('partyUpdate', partyMembers);
    };
    socket.on('setName', (name) => {
      if (partyMembers.length === 0) {
        partyLeader = players[index].socket_id;
        players[index].isReady = true;
      }
      players[index].player = name;
      updatePartyList();
      gameSocket
        .to(players[index].socket_id)
        .emit('joinSuccess', players[index].socket_id);
    });
    socket.on('setReady', (isReady) => {
      players[index].isReady = isReady;
      updatePartyList();
      gameSocket.to(players[index].socket_id).emit('readyConfirm');
    });
    socket.on('startGameSignal', (players) => {
      started = true;
      gameSocket.emit('startGame');
      startGame(players, gameSocket, namespace, io);
    });
    // todo: add logs
    socket.on('disconnect', () => {
      console.log('disconnected: ' + socket.id);
      socket.removeAllListeners('connection');
      socket.removeAllListeners('disconnect');
      players.map((x, index) => {
        if (x.socket_id == socket.id) {
          players[index].player = '';
        }
      });
      updatePartyList();
    });
  });
};

const startGame = (players, gameSocket, namespace) => {
  namespaces[namespace.substring(1)] = new CahGame();
  namespaces[namespace.substring(1)].start(players, gameSocket);
};

http.listen(process.env.PORT || 5000, () => {
  console.log(`listening on port ${process.env.PORT || 5000}`);
});
