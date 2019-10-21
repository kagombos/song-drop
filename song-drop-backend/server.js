const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const IncomingForm = require('formidable').IncomingForm

const webSocketServer = require('websocket').server;

const http = require("http");
const async = require('async');
const Pool = require('pg').Pool;

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	database: 'scream-together',
	port: 5432
})

const server = http.createServer();
server.listen(5000);

var data = {
	volume: 100,
	playRate: 100,
	playedQueue: [],
	unplayedQueue: []
}

app.listen(5001, () => {
	fs.readdir("public/unplayed", (e, files) => {
		if (e) console.log(e);
		data.unplayedQueue = files;
	});
	fs.readdir("public/played", (e, files) => {
		if (e) console.log(e);
		data.playedQueue = files;
	});
});

app.use(cors());
app.use(express.static('public'));

const wsServer = new webSocketServer({
	httpServer: server
});

const clients = {};
const bannedClients = {};

var volume = 100;
var playRate = 100;

var playPosition = 0;
var startTime = new Date();
var currentPos = 0;

const getUniqueID = () => {
	const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	return s4() + s4() + '-' + s4();
};

const sendMessage = (json) => {
	Object.keys(clients).map((client) => {
		clients[client].sendUTF(json);
	});
}

app.get('/sound', (req, res) => {
	var url = "";
	if (data.unplayedQueue.length > 0) {
		var songName = data.unplayedQueue.shift();
		url = "public/unplayed/" + songName;
		fs.rename(url, "public/played/" + songName, (e) => {
			if (e) throw e;
		});
		url = "public/played/" + songName;
		data.playedQueue.push(songName);
		if (data.playedQueue.length > 10) {
			fs.unlink("public/played/" + data.playedQueue.shift(), (e) => {
				if (e) throw e;
			});
		}
	}
	else {
		url = "public/played/" + data.playedQueue[Math.floor(Math.random() * Math.floor(data.playedQueue.length))];
	}
    fs.readFile(url, (e, file) => {
    	if (e) throw e;
    	res.send(file);
    });
});

app.post('/upload', (req, res) => {
	var form = new IncomingForm();
	form.on('file', (field, file) => {
		var ext = file.name.substring(file.name.length - 3);
		if (ext == mp3 || ext == wav || ext == aac || ext == ogg) {
			fs.rename(file.path, __dirname + '\\public\\' + file.name, (err) => {
				data.unplayedQueue.push(file.name);
				sendMessage(JSON.stringify(data));
			});
		}
	});
	form.on('end', () => {
		res.json();
	});
	form.parse(req);
});

wsServer.on('request', function(request) {
	  var userID = getUniqueID();
	  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
	  const connection = request.accept(null, request.origin);
	  clients[userID] = connection;
	  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients));
	  connection.sendUTF(JSON.stringify(data));
	  connection.on('message', function(message) {
		 if (message.type === 'utf8') {
			 const dataFromClient = JSON.parse(message.utf8Data);
			 if (bannedClients[userID] !== undefined) {
				 console.log("bad man");
			 }
//			 else if (typeof dataFromClient.volume !== 'number' || typeof dataFromClient.playRate !== 'number') {
//				 delete clients[userID];
//				 bannedClients[userID] = connection;
//				 console.log(new Date() + "Peer " + userID + " banned.");
//			 }
			 else {
				 if (dataFromClient.volume !== undefined) {
					 data.volume = dataFromClient.volume;					 
				 }
				 if (dataFromClient.playRate !== undefined) {
					 data.playRate = dataFromClient.playRate;
				 }
				 sendMessage(JSON.stringify(data));
			 }
		 } 
	  });
	  connection.on('close', function(connection) {
		    console.log((new Date()) + " Peer " + userID + " disconnected.");
		    delete clients[userID];
		  });
	});
