const net = require("net");

class MessageBuffer {
  constructor(delimeters) {
    this.delimeters = delimeters || [];
    this.buffer = "";
  }
  isFinished() {
    if (this.buffer.length === 0) {
      return true;
    }
    if (this.bufferContainsDelimeters()) {
      return true;
    }
    return false;
  }
  bufferContainsDelimeters() {
    for (let index = 0; index < this.delimeters.length; index++) {
      if (this.buffer.indexOf(this.delimeters[index]) === -1) {
        return true;
      }
    }
    return false;
  }

  push(data) {
    this.buffer += data;
  }

  getMessage() {
    return this.buffer;
  }
}

class ClientConnection {
  constructor( clientID, socket, onMessage) {
    this.socket = socket;
    this.clientID = clientID;
    this.sendMessage({
      message: `Welcome to Millionaire game, ${clientID}`,
      sender: "Server",
      id: clientID,
    });
    this.isActive = true;
    this.onMessageReceivedHandler = null;
    this._listenForMessages(onMessage);
  }
  onMessageReceived(message) {
    this.onMessageReceivedHandler = message;
    console.log(`In client connection class`);
  }

  sendMessage(message) {
    this.socket.write(JSON.stringify(message));
    console.log(`i actually entered the client connection class server 55`);
  }

  _listenForMessages(callback) {
    this.socket.setEncoding("utf8");
    let inflowMessage = new MessageBuffer(["\r", "\n"]);
    this.socket.on("data", (data) => {
      inflowMessage.push(data);
      if(inflowMessage.isFinished()){
        let message = inflowMessage.getMessage();
        console.log(`Received fromm ${this.clientID}=> ${message}`);

        if(callback != null && typeof callback == "function") {
          callback(message);
        }

        if(this.onMessageReceivedHandler != null){
          this.onMessageReceivedHandler(JSON.parse(message));
        }
      }
    });
  }
}

class GameServer {
  constructor(address, port) {
    this.isConnected = false;
    this.address = address;
    this.port = port;
    this.onClientConnectedHandler = null;
    this.connectClients = [];
    // this.rl = rl;
  }

  onClientConnected(callback) {
    this.onClientConnectedHandler = callback;
  }

  broadcast(message) {
    if (!this.isConnected) {
      console.log("server not connected here");
      return;
    }
    this.connectClients.forEach((client) => {
      if (client.isActive) {
        try {
          console.log('entered 1')
          client.sendMessage(message);
        } catch (err) {
          client.isActive = false;
        }
      }
      if (!client.isActive) {
        console.log(`Client is no longer connected`);
        this.connectClients = this.connectClients.splice(
          this.connectClients.indexOf(client),
          1
        );
      }
    });
  }

  start() {
    this.serverConn = net.createServer();
    this.serverConn.on("error", (err) => {
      console.log("connection error", err);
    });
    this.serverConn.on("close", () => {
      console.log("Connection closed");
      this.isConnected = false;
    });

    this.serverConn.on("connection", (socket) => {
      // let clientName = socket.write(rl.question(`please enter your name`));
      let clientID = this.getClientID();
      let clientConn = new ClientConnection(
        clientID,
        socket,
        (message) => {
          this.newMessageFromClient(message, clientID);
        }
      );
      this.connectClients.push(clientConn);
      console.log(`Connections: ${this.connectClients.length} \n`);

      if (this.onClientConnectedHandler != null) {
        this.onClientConnectedHandler(clientConn);
      }
    });
    this.serverConn.listen(this.port, this.address, () => {
      this.isConnected = true;
      console.log(`Server listening on ${this.address}: ${this.port}`);
    });
  }

  newMessageFromClient(message, clientID) {
    console.log("message", message, "clientID", clientID);
  }

  getClientID() {
    return `Client0${this.connectClients.length + 1}`;
  }
}

// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });


module.exports = GameServer;