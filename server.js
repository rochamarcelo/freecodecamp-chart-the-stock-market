'use strict';
//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var mongoose = require('mongoose');


var quandl = require('./server/api/quandl.js');
var Stock = require('./server/model/stocks.js');
console.log(quandl);
// quandl.metadata('AAPL', (err, data, body) => {
//   if (err) {
//     return console.log('metadata AAPL got error: ', err);
//   }
  
//   return console.log('metadata AAPL got body: ', JSON.parse(body));
// });

// quandl.daily('ABPL', (err, data, body) => {
//   if (err) {
//     return console.log('metadata AAPL got error: ', err);
//   }
  
//   return console.log('metadata AAPL got body: ', JSON.parse(body));
// });
//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();

require('dotenv').load();
mongoose.connect(process.env.MONGODB_URI);
mongoose.Promise = global.Promise;

var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];
const datasets = {};
const pushDatasetResult =  (code, callback) => {
  quandl.daily(code, (err, data, body) => {
    if (err) {
      return console.log('metadata AAPL got error: ', err, data, body);
    }

    datasets[code] = data;
    if (callback) callback(datasets);
  });
}
Stock.find({}, function(err, data) {
  if(err) return;
  
  if (data) {
    data.forEach(item => pushDatasetResult(item.code));
  }

});

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });
    console.log('datasets', datasets, messages);
    socket.emit('datasets', datasets);

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });
    
    socket.on('add code', function(code) {
      if (datasets[code] !== null && typeof datasets[code] === 'object') {
        socket.emit('add code 200', "Code '" + code + "' already present");
        return;
      }

      quandl.metadata(code, (err, data) => {
        if (err) {
          socket.emit('add code 404', "Code '" + code + "' not found");
          return;
        }
        Stock.createNew(data.dataset_code, data.name, err => {
          socket.emit('add code 200', "Code '" + code + "' added");
          if (err) {
            console.log('add code error creating stock', err);
          }
          pushDatasetResult(data.dataset_code, () => broadcast('datasets', datasets));
        });
        
      });
    });
    socket.on('remove code', function(code) {
      if (datasets[code] !== 'undefined') {
        Stock.remove({code});
        delete datasets[code];
        broadcast('datasets', datasets);
      }
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      callback(null, socket.name);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
