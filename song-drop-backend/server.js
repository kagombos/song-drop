const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const mm = require('music-metadata');
const IncomingForm = require('formidable').IncomingForm
const Promise = require('bluebird');

const webSocketServer = require('websocket').server;

const http = require("http");
const async = require('async');

const server = http.createServer();
server.listen(5000);

var data = {
	volume: 100,
	playRate: 100,
	playedQueue: [],
	unplayedQueue: []
}

const wsServer = new webSocketServer({
	httpServer: server
});

const clients = {};
const bannedClients = {};

var volume = 100;
var playRate = 100;

var currentSong = null;
var firstPlay = false;
var startTime = new Date();
var currentPos = 0;
var play = false;

const getNextSong = () => {
	if (firstPlay) {
		fs.rename("public/unplayed/" + currentSong.name, "public/played/" + currentSong.name, (e) => {
			if (e) throw e;
		});
		firstPlay = false;
	}
	var url = "";
	if (data.unplayedQueue.length > 0) {
		firstPlay = true;
		currentSong = data.unplayedQueue.shift();
		url = "public/unplayed/" + currentSong.name;
		data.playedQueue.push(currentSong);
		if (data.playedQueue.length > 10) {
			fs.unlink("public/played/" + data.playedQueue.shift().name, (e) => {
				if (e) throw e;
			});
		}
	}
	else {
		currentSong = data.playedQueue[Math.floor(Math.random() * Math.floor(data.playedQueue.length))]
		url = "public/played/" + currentSong.name;
	}
    fs.readFile(url, (e, file) => {
    	if (e) throw e;
    	res.send(file);
    });
}

const playSong = () => {
	if (play && currentSong === null) {
		getNextSong();
		startTime = new Date();
	}
	else if (play && currentPos > currentSong.duration) {
		getNextSong();
		startTime = new Date();
		currentPos = 0;
	}
	else if (play) {
		currentPos = new Date() - startTime;
	}
	if (currentSong !== null) {
		console.log("pos:" + currentPos + " duration:" + currentSong.duration);
	}
	console.log("aaa");
	return Promise.delay(500).then(() => playSong());
} 

app.listen(5001, () => {
	fs.readdir("public/unplayed", (e, files) => {
		if (e) console.log(e);
		files.map((filename) => {
			mm.parseFile("public/unplayed/" + filename).then((metadata) => {
				var song = { name: filename, data: metadata.common, duration: metadata.format.duration };
				data.unplayedQueue.push(song);
			}); 
		});
	});
	fs.readdir("public/played", (e, files) => {
		if (e) console.log(e);
		files.map((filename) => {
			mm.parseFile("public/played/" + filename).then((metadata) => {
				var song = { name: filename, data: metadata.common, duration: metadata.format.duration };
				data.playedQueue.push(song);
			}); 
		});
	});
});

app.use(cors());
app.use(express.static('public'));

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
		currentSong = data.unplayedQueue.shift();
		url = "public/unplayed/" + currentSong.name;
		data.playedQueue.push(currentSong);
		if (data.playedQueue.length > 10) {
			fs.unlink("public/played/" + data.playedQueue.shift().name, (e) => {
				if (e) throw e;
			});
		}
	}
	else {
		url = "public/played/" + data.playedQueue[Math.floor(Math.random() * Math.floor(data.playedQueue.length))].name;
	}
    fs.readFile(url, (e, file) => {
    	if (e) throw e;
    	res.send(file);
    });
});

app.get('/togglepause', (req, res) => {
	play = !play;
});

app.post('/upload', (req, res) => {
	var form = new IncomingForm();
	form.on('file', (field, file) => {
		var ext = file.name.substring(file.name.length - 3);
		if (ext == mp3 || ext == wav || ext == aac || ext == ogg) {
			fs.rename(file.path, __dirname + '\\public\\' + file.name, (err) => {
				mm.parseFile(file.path).then((metadata) => {
					var song = { name: file.name, data: metadata.common, duration: metadata.format.duration };
					data.unplayedQueue.push(song);
					sendMessage(JSON.stringify(data));
				});
			});
		}
	});
	form.on('end', () => {
		res.json();
	});
	form.parse(req);
});

const isEmpty = (obj) => {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

wsServer.on('request', function(request) {
	  var userID = getUniqueID();
	  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
	  const connection = request.accept(null, request.origin);
	  console.log(clients);
	  if (isEmpty(clients)) {
		  console.log("haha");
		  playSong();
	  }
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
				 //console.log(dataFromClient);
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
