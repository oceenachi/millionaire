const moment = require("moment");
const readline = require("readline-sync");

const STATE_IDLE = "IDLE";
const STATE_WAITING = "WAITING";
const STATE_START = "START";
const STATE_PAUSED = "PAUSED";
const STATE_ENDED = "ENDED";

const VALID_STATES = [
  STATE_IDLE,
  STATE_START,
  STATE_WAITING,
  STATE_PAUSED,
  STATE_ENDED,
];

class GameClient {
  //are name and response resolver like getter and setter
  constructor(nameString, responseResolver) {
    this.nameString = nameString;
    this.responseResolver = responseResolver;
    // this.broadcastTime = null;
  }

  name() {
    return this.nameString;
  }

  /**
   * returns promise
   */
  getGameResponse() {
    if (
      this.responseResolver != null &&
      typeof this.responseResolver === "function"
    ) {
      return this.responseResolver();
    }
    // return Promise.resolve(this.responseResolver);
    return Promise.resolve("jack");
  }
}

class GameServer {
  constructor(subject, startTime, subjectDelayInSeconds, output) {
    this.subject = subject;
    this.startTime = startTime;
    this.connectedClients = [];
    this.output = output;
    //i dont know wht output should be......
    this.responses = [];
    this.clientRespondTimeInMins = 0.7;
    // why dosnt my server write to my client when i have transistionState(STATE_IDLE)
    // this.transistionState(STATE_IDLE);
    this.currentState = STATE_IDLE;
    this.promisesArray = [];
    this.subjectDisplayTime = moment(this.startTime).add(
      subjectDelayInSeconds,
      "seconds"
    );
  }

  sendOutput(message) {
    console.log(message);
    if (this.output !== null && typeof this.output === "function") {
      this.output(message);
    }
    //why did he do this here
    //Bt what the hell is output
  }

  addPlayers(player) {
    if (!(this.connectedClients.length > 20)) {
      this.connectedClients.push(player);
    } else {
      console.log(`Enough players already for this session`);
      return;
    }
  }
  //Here i was having an error: was throwing inside an async function without a catch block
  broadcastSubject(subject) {
    console.log(this.connectedClients);
    if (this.currentState === STATE_WAITING) {
      console.log(`before i broadcasted`);
      console.log({ broadcastTime: +new Date() });
      this.broadcastTime = +new Date();
      // console.log(broadcastTime);
      // this.connectedClients.forEach((player) =>
      this.sendOutput(`First to type ${subject}`);
      // );
    }
  }

  //my clientAndResponses is an array of object of the client Name, 
  // client response and client response time
  computeResult(clientAndResponses) {
    console.log({ clientAndResponses: clientAndResponses });
    let filteredResponses = clientAndResponses.filter(
      (element) => element.result === this.subject
    );

    console.log({
      "successful responses filtered out =>": JSON.stringify(filteredResponses),
    });
    let winners = {};

    let result = filteredResponses.map((element) => {
      winners[element.time]
        ? winners[element.time].push({
            clientName: element.name,
            timeCompleted: element.time,
            inputResponse: element.result,
          })
        : [
            {
              clientName: element.name,
              timeCompleted: element.time,
              inputResponse: element.result,
            },
          ];
    });

    console.log({ winners: winners });
    console.log({ resultcomp: result });

    result.sort((a, b) => a.time - b.time);

    if (result[0]) {
      return this.sendOutput(result[0]);
    } else {
      return this.sendOutput(`No winners`);
    }
  }

  play() {
    console.log({ connectClients: this.connectedClients });
    let intervalID = setInterval(() => {
      this.ticker();
      if (this.isOver()) {
        clearInterval(intervalID);
      }
    }, 1000);
  }

  isOver() {
    return this.currentState === STATE_ENDED;
  }

  ticker() {
    if (this.currentState === STATE_PAUSED) {
      return;
    }

    if (this.currentState === STATE_IDLE) {
      this.sendOutput(
        `Game will Start In .. ${moment
          .duration(moment(this.startTime).diff(moment()))
          .asSeconds()
          .toFixed(0)} seconds`
      );

      if (moment().isSameOrAfter(this.startTime)) {
        this.sendOutput(`Game just started ...`);
        this.transistionState(STATE_START);
      }
      return;
    }

    if (this.currentState === STATE_START) {
      this.sendOutput(
        `Will call the numbers in.. ${moment
          .duration(moment(this.subjectDisplayTime).diff(moment()))
          .asSeconds()
          .toFixed(0)} seconds`
      );
      if (moment().isSameOrAfter(this.subjectDisplayTime)) {
        this.currentState = STATE_WAITING;

        try {
          this.broadcastSubject(this.subject);
        } catch (err) {
          throw new Error(`something went wrong: ` + err);
        }
      }
      return;
    }

    if (this.currentState === STATE_WAITING) {
      if (
        moment().isSameOrAfter(
          moment(this.subjectDisplayTime).add(
            this.clientRespondTimeInMins,
            "minute"
          )
        )
      ) {
        this.asyncGetResponses().then((result) => {
          console.log({ result198: result });
          this.computeResult(result);
        });

        this.sendOutput(`Game has Ended. Thanks for playing`);
        this.currentState = STATE_ENDED;
      }
    }
  }

  //I dont understand transistion state yet
  transistionState(state) {
    if (!VALID_STATES.indexOf(state) < 0) {
      return false;
    }
    this.currentState = state;
    return true;
  }

  pause() {
    this.transistionState(STATE_PAUSED);
    this.pausedAt = new Date();
    console.log(`Game has been paused`);
  }

  resume() {
    let resumeTime = new Date();
    let pausedAtMoment = moment(this.pausedAt);
    let resumeTimeMoment = moment(resumeTime);
    let diffInMoment = resumeTimeMoment.diff(pausedAtMoment);
    let diffInSeconds = parseInt(
      moment.duration(diffInMoment).asSeconds().toFixed(0)
    );
    this.subjectDisplayTime = moment(this.subjectDisplayTime).add(
      diffInSeconds + 1,
      "seconds"
    );
    this.transistionState(STATE_START);
    this.sendOutput(`Game has been resumed`);
  }

  replay() {}

  async asyncGetResponses() {
    if (this.getResultFromClientIsRunning) return;

    this.getResultFromClientIsRunning = true;

    //receive responses
    for (let i = 0; i < this.connectedClients.length; i++) {
      try {
        const client = this.connectedClients[i];
        console.log({ client: client });
        // console.log(`second connect clients`, client);
        //Had an await her before and it abruptly terminates
        //const result =
        // client.getGameResponse().then((result)=>{
        //   this.promisesArray.push({
        //     result: result,
        //     name: client.name(),
        //     time: +new Date(),
        //   });
        // })
        this.promisesArray.push(
          client.getGameResponse().then((result) => {
            return {
              result,
              name: client.name(),
              time: +new Date(),
            };
          })
        );
        // });
        console.log({ result: " result" });
      } catch (err) {
        console.log({ error: err });
      }
    }

    // this.connectedClients.forEach((client, key) => {
    //   // this.responseObject.name = client.name();

    //   //latre try out this block with a string rather than a method
    //   this.promisesArray.push(
    //     client.getGameResponse().then((result) => {
    //       return {
    //         result,
    //         name: client.name(),
    //         time: +new Date(),
    //       };
    //     })
    //   );
    // });

    console.log({ "this.promisesArray": this.promisesArray });

    Promise.all(this.promisesArray.map(error => error.catch(err => err))).then(data =>  {
      console.log({'resolved promise all': data})
    }).catch((err) => {
      console.log(err);
    })
    //I dont know why he has this code here
    //this.getResultFromClientIsRunning = false;
    if (this.promisesArray.length > 0) {
      console.log(`await return`);

      try {
        Promise.all(this.promisesArray).then(data =>  {
          console.log({'resolved promise all': data})
        })
        this.result = await Promise.all(this.promisesArray);
        console.log({ "resolved promise.all": this.promisesArray });
        return this.result;
      } catch (err) {
        console.log({ "error num 305": err });
      }
    }
    if (this.promisesArray.length <= 0) {
      console.log(`method failing`);
      return [];
    }
  }
}

module.exports.GameClient = GameClient;
module.exports.GameServer = GameServer;
