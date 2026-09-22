var net = require('net');
var events = require('events');
var util = require('util');
var makeRequestBuffer = require('./utils').makeRequestBuffer;
var parseMessage = require('./utils').parseMessage;
var merge = require('./utils').merge;
var timestamp = require('./utils').timestamp;

var Server = function(host, port, username, password, options) {
    events.EventEmitter.call(this);
    this.responseBuffer = Buffer.from([]);
    this.host = host;
    this.port = port;
    this.connected = false;
    this.timeoutSet = false;
    this.connectCallbacks = [];
    this.responseCallbacks = {};
    this.requestTimeouts = [];
    this.errorCallbacks = {};
    this.options = merge(options || {}, {
        timeout: 0.5,
        keepAlive: false,
        keepAliveDelay: 30
    });
    if (this.options.conntimeout === undefined || this.options.conntimeout === null) {
        this.options.conntimeout = 2 * this.options.timeout;
    }
    this.username = username || this.options.username || process.env.MEMCACHIER_USERNAME || process.env.MEMCACHE_USERNAME;
    this.password = password || this.options.password || process.env.MEMCACHIER_PASSWORD || process.env.MEMCACHE_PASSWORD;
    return this;
};

util.inherits(Server, events.EventEmitter);

Server.prototype.onConnect = function(func) {
    this.connectCallbacks.push(func);
};

Server.prototype.onResponse = function(seq, func_name,  func) {
    this.responseCallbacks[seq] = {func_name:func_name, func: func };
    // console.log(this.responseCallbacks[seq])
    // console.log(this.responseCallbacks[seq].toString())
};
function parse_response_data(data){


  // switch (requesttype[1].trim()) {

  //               case "mg":

  //                   // response_data = {data: true, key: "", seq: seq };
  //                   let ret_data = data[0].split(" ");

               

  //                   response_data.data = data[1];
  //                   response_data.key = ret_data[3].slice(1);
  //                   // response_data.seq = seq
  //                   response_data.size = ret_data[1]
  //           seq = data[0].split(" ")[4]

  //             // console.log(response_data)

  //                 //  console.log()
  //   // throw new Error("WOOF")

  //               break;

  //               case "mgs":

  //                   //this is for gets
  //           seq = data[0].split(" ")[4]
  //             // console.log(seq);

  //             // throw new Error("WOOF")
  //                   //todo - pass if we are doing get or gets so I can know if we pass back array or straight object
  //                   function parse_gets(data) {

  //                       let return_data = {
  //                           seq: "",
  //                           data: [],
  //                           response_code: 0,
  //                           missing_some: false
  //                       };

  //                       for (let index = 0; index < (data.length - 1); index += 2) {
  //                           // return_data.response_code = data[index].split(" ")[0].trim()
  //                           let response_data = {};
  //                           switch (data[index].split(" ")[0].trim()) {
  //                               case "VA":
  //                                   response_data.data = []
  //                                   response_data.data.push(data[index + 1]);
  //                                   response_data.key = data[index].split(" ")[3].trim()
  //                                   response_data.seq = data[index].split(" ")[4].trim()
  //                                   response_data.code = data[index].split(" ")[0].trim()
  //                                   // return_data.seq = data[index].split(" ")[4].trim()
  //                                   return_data.data.push(response_data)

  //                                   break;
  //                               case "EN":
  //                                   // console.log(data[index].split(" "))
  //                                   response_data.data = []
  //                                   response_data.data = undefined
  //                                   response_data.key = data[index].split(" ")[1].trim()
  //                                   response_data.code = data[index].split(" ")[0].trim()
  //                                   // response_data.seq = data[0].split(" ")[4].trim()
  //                                   // return_data.missing_some = true;
  //                                   return_data.data.push(response_data)

  //                                   break;

  //                           }

  //                       }

  //                       return return_data
  //                   }
  //                   response_data = parse_gets(data)

  //                   break;
  //           }
}
Server.prototype.respond = function(response) {
  // console.log(response)
    const response_split = response.trim().split("\r\n");
    let seq;
    let data;
    let response_data = {
      response_code : 0,
      data: [],
      missing_keys:[]
    };
    let opaque_value = ""
    
    for(let index = 0; index < response_split.length; index++){
        let value = response_split[index].split(" ");
  
let ret_data;
        switch(value[0].trim()){

          case "HD":
              seq = value[1].trim();
              response_data.saved = true;
              response_data.seq = seq;
              response_data.response_code = value[0].trim()
          break;
        case "VA":

            ret_data = value[0].split(" ");
                seq = value[4].trim();
                // response_data.response_code = 0


          if(value[4].includes("-mgs")){
                response_data.data.push({key: value[3].slice(1), data: response_split[( index + 1)]} )

          }else if(value[4].includes("-mg")){
                response_data.data = response_split[( index + 1)]


          }
            
          index++

          break;

        case "EN":

              ret_data = value
              seq = value[2].trim();
              if(value[2].includes("-mgs")){

                  // response_data.data.push({key: value[1].slice(1), data:  false} )
                response_data.missing_keys.push(value[1].slice(1))
            }else if(value[2].includes("-mg")){
                  response_data.data = false

            }
            
              // response_data.key =  value[1].slice(1).trim();

              // response_data.data.push( response_split[index++])
          // console.log(response_data)

          // throw new Error("WW")

            // response_data.data = []
            // response_data.data = undefined
            // response_data.key = data[index].split(" ")[1].trim()
            // response_data.code = data[index].split(" ")[0].trim()
            // // response_data.seq = data[0].split(" ")[4].trim()
            // // return_data.missing_some = true;
            // return_data.data.push(response_data)

            break;
        break
          default:
            console.log(value)
            throw new Error("Cannot parse value")

          break;  
        }
      // index++;
    }

//     for(const mem_string_value of response.trim().split("\r\n")){
//       // console.log(mem_string_value)
//       const value = mem_string_value.split(" ")

      // switch(value[0].trim()){

      //   case "HD":
      //       seq = response_split[1].trim();
      //       response_data.saved = true;
      //       response_data.seq = seq;
      //   break;

//         case "VA":

// //  console.log(response_data)
//  console.log(mem_string_value)

//   // let ret_data = data[0].split(" ");
//   //     response_data.data = data[1];
//   //     response_data.key = ret_data[3].slice(1);
//   //     // response_data.seq = seq
//   //     response_data.size = ret_data[1]
//   //     seq = data[0].split(" ")[4]

//   //       console.log(ret_data)
//         break;
        // default:
        //   console.log(value[0].trim())
        //   throw new Error("Cannot parse value")

        // break;  
//       }
//     }
   
// throw new Error("WOF")


    var callback = this.responseCallbacks[seq.trim()]
    // console.log(seq)
                    // console.log(callback)

    if (!callback.func) {
        // in case of authentication, no callback is registered
        return;
    }

    callback.func(response_data);
    if (!callback.quiet) {
        // console.log("oo")
        delete(this.responseCallbacks[seq.trim().toString()]);
        this.requestTimeouts.shift();
        delete(this.errorCallbacks[seq.trim().toString()]);
    }
};

Server.prototype.onError = function(seq, func) {
    this.errorCallbacks[seq] = func;
};

Server.prototype.error = function(err) {
    var errcalls = this.errorCallbacks;
    this.connectCallbacks = [];
    this.responseCallbacks = {};
    this.requestTimeouts = [];
    this.errorCallbacks = {};
    this.timeoutSet = false;
    if (this._socket) {
        this._socket.destroy();
        delete(this._socket);
    }
    var k;
    for (k in errcalls) {
        if (errcalls.hasOwnProperty(k)) {
            errcalls[k](err);
        }
    }
};

Server.prototype.listSasl = function() {
    var buf = makeRequestBuffer(0x20, '', '', '');
    this.writeSASL(buf);
};

Server.prototype.saslAuth = function() {
    var authStr = '\x00' + this.username + '\x00' + this.password;
    var buf = makeRequestBuffer(0x21, 'PLAIN', '', authStr);
    this.writeSASL(buf);
};

Server.prototype.appendToBuffer = function(dataBuf) {
    var old = this.responseBuffer;
    this.responseBuffer = Buffer.alloc(old.length + dataBuf.length);
    old.copy(this.responseBuffer, 0);
    dataBuf.copy(this.responseBuffer, old.length);
    return this.responseBuffer;
};

Server.prototype.responseHandler = function(dataBuf) {
    // console.log("woof")
      // console.log("dataBuf")
      //         console.log(dataBuf)
      //         console.log(woof)
    //  this.responseBuffer = parseMessage(dataBuf)
    // console.log(this.responseBuffer)
    this.respond(parseMessage(dataBuf));

    // parseMessage(dataBuf)
    // var response = parseMessage(this.appendToBuffer(dataBuf));
    // var respLength;
    // while (response) {
    //   if (response.header.opcode === 0x20) {
    //     this.saslAuth();
    //   } else if (response.header.status === 0x20) {
    //     this.error('Memcached server authentication failed!');
    //   } else if (response.header.opcode === 0x21) {
    //     this.emit('authenticated');
    //   } else {
    //     this.respond(response);
    //   }
    //   respLength = response.header.totalBodyLength + 24;
    //   this.responseBuffer = this.responseBuffer.slice(respLength);
    //   response = parseMessage(this.responseBuffer);
    // }

};

Server.prototype.sock = function(sasl, go) {
    var self = this;

    if (!self._socket) {
        // CASE 1: completely new socket
        self.connected = false;
        // self._socket = net.connect(this.port, this.host, function() {
        // const client = new net.Socket();

        self._socket = net.connect(this.port, this.host, function() {

            // SASL authentication handler
            self.once('authenticated', function() {
                if (self._socket) {
                    self.connected = true;
                    // cancel connection timeout
                    this._socket.setTimeout(0);
                    self.timeoutSet = false;
                    // console.log(this)
                    // run actual request(s)
                    go(this._socket);
                    self.connectCallbacks.forEach(function(cb) {
                        cb(this._socket);
                    });
                    self.connectCallbacks = [];
                }
            });

            // setup response handler
            this.on('data', function(dataBuf) {
            
                // console.log(dataBuf.toString('utf8'))
                self.responseHandler(dataBuf.toString('utf8'));
                // console.log(self.responseHandler.toString())
            }.bind(this));

            // kick of SASL if needed
            if (self.username && self.password) {
                self.listSasl();
            } else {
                self.emit('authenticated');
            }
        });

        // setup error handler
        self._socket.on('error', function(error) {
            self.error(error);
        });

        self._socket.on('close', function() {
            self.connected = false;
            if (self.timeoutSet) {
                self._socket.setTimeout(0);
                self.timeoutSet = false;
            }
            self._socket = undefined;
        });

        // setup connection timeout handler
        self.timeoutSet = true;

        self._socket.setTimeout(self.options.conntimeout * 1000, function() {
            self.timeoutSet = false;
            if (!self.connected) {
                this.end();
                self._socket = undefined;
                self.error(new Error('socket timed out connecting to server.'));
            }
        });

        // use TCP keep-alive
        self._socket.setKeepAlive(self.options.keepAlive, self.options.keepAliveDelay * 1000);

    } else if (!self.connected && !sasl) {
        // CASE 2: socket exists, but still connecting / authenticating
        self.onConnect(go);

    } else {
        // console.log("GO")
        // CASE 3: socket exists and connected / ready to use
        go(self._socket);
    }
};

// We handle tracking timeouts with an array of deadlines (requestTimeouts), as
// node doesn't like us setting up lots of timers, and using just one is more
// efficient anyway.
var timeoutHandler = function(server, sock) {
    if (server.requestTimeouts.length === 0) {
        // nothing active
        server.timeoutSet = false;
        return;
    }

    // some requests outstanding, check if any have timed-out
    var now = timestamp();
    var soonestTimeout = server.requestTimeouts[0];

    // if (soonestTimeout <= now) {
    //   // timeout occurred!
    //   sock.end();
    //   server.connected = false;
    //   server._socket = undefined;
    //   server.timeoutSet = false;
    //   server.error(new Error('socket timed out waiting on response.'));
    // } else {
    //   // no timeout! Setup next one.
    //   var deadline = soonestTimeout - now;
    //   sock.setTimeout(deadline, function() {
    //     timeoutHandler(server, sock);
    //   });
    // }
};

Server.prototype.write = function(blob) {
    var self = this;
    // throw new Error("FOOTBALL")
    var deadline = Math.round(self.options.timeout * 1000);
    this.sock(false, function(s) {
        // console.log(blob)
        // throw new Error("JUMP CUTS")

        s.write(blob);
        // s.write("get is_on\r\n");

        self.requestTimeouts.push(timestamp() + deadline);
        if (!self.timeoutSet) {
            self.timeoutSet = true;
            // console.log(deadline)
            s.setTimeout(deadline, function() {
                timeoutHandler(self, this);
            });
        }
    });
};

Server.prototype.writeSASL = function(blob) {
    this.sock(true, function(s) {
        s.write(blob);
    });
};

Server.prototype.close = function() {
    if (this._socket) {
        this._socket.end();
    }
};

Server.prototype.toString = function() {
    return '<Server ' + this.host + ':' + this.port + '>';
};

exports.Server = Server;