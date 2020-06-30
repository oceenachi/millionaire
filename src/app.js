const Game = require("./gameFactory").GameServer;
const moment = require("moment");
const GameClient = require("./gameFactory").GameClient;
const GameServer = require("./server");
const randomNumberString = require("../utils").randomNumberString;

const TWENTY_SECS = 10;

let addr = "127.0.0.1";
const port = process.env.PORT || "5020";

if (process.argv.length > 2) {
  addr = process.argv[2];
}
if (process.argv.length > 3) {
  port = process.argv[3];
}

const startTime = moment().add(TWENTY_SECS, "seconds").toDate().toISOString();

const subject = randomNumberString();

const gameServer = new GameServer(addr, port);

const game = new Game(subject, startTime, TWENTY_SECS, (message) => {
  gameServer.broadcast({ action: "info", data: message });
});

gameServer.onClientConnected((client) => {
  game.addPlayers(
    new GameClient(client.name, () => {
      return new Promise((resolve, reject) => {
        client.onMessageReceived((message) => {
          if (message.action === "response") {
            console.log({ "message.data": message.data });
            resolve(message.data);
          }
        });
      });
    })
  );
});
game.play();
gameServer.start();
