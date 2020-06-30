let net = require("net");
let readline = require("readline");

class Client {
  constructor(port, address, rl) {
    this.port = port;
    this.address = address;
    this.rl = rl;
  }

  connectToServer() {
    this.client = new net.Socket();

    this.client.connect(this.port, this.address, () => {
      console.log(
        `client connected on port ${this.port} and address ${this.address}`
      );
    });
    this.client.on("data", (data) => {
      if (data.toString().endsWith(`"exit"`)) {
        console.log(`exiting...`);
        return this.client.destroy();
      }
      console.log(`Client received: ${data.toString()}`);
    });

    this.client.on("error", (err) => {
      console.log(err);
    });

    this.client.on("end", () => {
      console.log(`disconnectd from server`);
    });

    this.client.on("close", () => {
      console.log(`Client closed`);
    });
  }

  sendReplies(message) {
    let action = "response";
    let body = message;
    let messageParts = message.split(":");
    console.log({"messageParts": messageParts});
    if (messageParts.length > 1) {
      action = messageParts[0];
      body = messageParts[1];
    }
    if (this.client != null) {
      
      console.log(`sending out replies client 51`)
      this.client.write(JSON.stringify({ action: action, data: body }));
    }
  }
}

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
// are these like default arguments
let address = "127.0.0.1";
let port = "5020";

if (process.argv.length > 2) {
  address = process.argv[2];
}
if (process.argv.length > 3) {
    port = process.argv[3]
}

let newClient = new Client(port, address, rl);

rl.on("line", (input) => {
    console.log(`Sending input from the server ${input}`);
    newClient.sendReplies(input);
});

newClient.connectToServer();
