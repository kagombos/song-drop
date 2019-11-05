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
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
const ytSearch = require('./youtube-search');

var YD = new YoutubeMp3Downloader({
    "ffmpegPath": "public/ffmpeg",        // Where is the FFmpeg binary located?
    "outputPath": "public/unplayed",    // Where should the downloaded and encoded files be stored?
    "youtubeVideoQuality": "highest",       // What video quality should be used?
    "queueParallelism": 2,                  // How many parallel downloads/encodes should be started?
    "progressTimeout": 2000                 // How long should be the interval of the progress reports
});

const server = http.createServer();
server.listen(5000);

var data = {
	volume: 100,
	playRate: 100,
	playedQueue: [],
	unplayedQueue: []
}

var playData = {
	play: false,
	update: "",
	newSong: false,
	currentPos: 0,
	duration: 0,
	songName: "test"
}

const wsServer = new webSocketServer({
	httpServer: server
});

const clients = {};
const bannedClients = {};

var volume = 100;
var playRate = 100;

var songHistoryList = [];
var nextSong = null;
var currentSong = null;

var nextFile = null;
var currentFile = null;
var firstPlay = false;
var startTime = new Date();
var pauseTime = new Date();

const shiftQueues = () => {
	data.playedQueue.push(data.unplayedQueue.shift());
	if (data.playedQueue.length > 10) {
		fs.unlink("public/played/" + data.playedQueue.shift().name, (e) => {
			if (e) throw e;
		});
	}
}

const getNextSongFromList = () => {
	var nextSong = null;
	if (data.unplayedQueue.length > 0) {
		nextSong = data.unplayedQueue[0];
		if (nextSong === currentSong) {
			nextSong = data.unplayedQueue[1];
		}
	}
	else {
		nextSong = data.playedQueue[Math.floor(Math.random() * Math.floor(data.playedQueue.length))];
	}
	return nextSong;
}

const getNextSong = () => {
	if (currentSong !== null && !currentSong.played) {
		currentSong.played = true;
		shiftQueues();
		fs.rename("public/unplayed/" + currentSong.name, "public/played/" + currentSong.name, (e) => {
			if (e) throw e;
		});
	}
	
	if (currentSong !== null) {
		songHistoryList.push(currentSong.name);
	}
	
	currentSong = nextSong;
	currentFile = nextFile;
	nextSong = getNextSongFromList();
	
	if (currentSong !== null) {
		var url = "";
		if (currentSong.played) {
			url = "public/played/" + currentSong.name;
		}
		else {
			url = "public/unplayed/" + currentSong.name;
		}
		
		if (currentSong.data.title !== null && currentSong.data.title !== undefined) {
			playData.songName = currentSong.data.title;
		}
		else {
			playData.songName = currentSong.name;
		}
		playData.duration = currentSong.duration;
		
    	startTime = new Date().getTime();
		playData.currentPos = 0;
		playData.newSong = true;
		sendMessage(JSON.stringify(playData));
	    sendMessage(JSON.stringify(data));
	    playData.newSong = false;
	    //console.log(songHistoryList);
	}
	
	if (nextSong !== null) {
		var url = "";
		if (nextSong.played) {
			url = "public/played/" + nextSong.name;
		}
		else {
			url = "public/unplayed/" + nextSong.name;
		}
		fs.readFile(url, (e, file) => {
	    	if (e) throw e;
	    	nextFile = file;
	    	playData.update = "next";
			sendMessage(JSON.stringify(playData));
			playData.update = "";
	    });
	}
}

const playSong = () => {
	//console.log(playData.songName);
	//console.log(playData);
//	console.log(currentSong);
	if (isEmpty(clients)) {
		return;
	}
	if (currentSong === null || currentSong === undefined) {
		getNextSong();
		startTime = new Date().getTime();
	}
	else if (playData.play && (playData.currentPos > currentSong.duration || currentSong.duration === undefined)) {
		getNextSong();
	}
	else if (playData.play) {
		playData.currentPos = (new Date().getTime() - startTime) / 1000;
	}
	sendMessage(JSON.stringify(playData));
	return Promise.delay(40).then(() => playSong());
} 

app.listen(5001, () => {
	fs.readdir("public/unplayed", (e, files) => {
		if (e) console.log(e);
		files.map((filename) => {
			mm.parseFile("public/unplayed/" + filename).then((metadata) => {
				if (metadata.format.duration !== null && metadata.format.duration !== undefined) {
					var song = { name: filename, data: metadata.common, duration: metadata.format.duration, played: false };
					data.unplayedQueue.push(song);
				}
			}); 
		});
	});
	fs.readdir("public/played", (e, files) => {
		if (e) console.log(e);
		files.map((filename) => {
			mm.parseFile("public/played/" + filename).then((metadata) => {
				if (metadata.format.duration !== null && metadata.format.duration !== undefined) {
					var song = { name: filename, data: metadata.common, duration: metadata.format.duration, played: true };
					data.playedQueue.push(song);
				}
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

app.get('/play', (req, res) => {
	if (req.query.fileName !== undefined && req.query.fileName !== null) {
		playData.currentPos = currentSong.duration + 1;
		res.send();
	}
});

app.get('/sound', (req, res) => {
	if (req.query.next !== null && req.query.next) {
		res.send(nextFile);
	}
	else {
		if (currentFile === null) {
			getNextSong(() => {
				res.send(currentFile);
			});
		}
		else {
			res.send(currentFile);
		}
	}
});

app.get('/togglepause', (req, res) => {
	if (playData.play) {
		pauseTime = new Date().getTime();
	}
	else {
		startTime = new Date().getTime() - playData.currentPos * 1000;
	}
	playData.play = !playData.play;
	sendMessage(JSON.stringify(playData));
	res.send();
});

app.post('/upload', (req, res) => {
	console.log(req.query.link);
	var link = req.query.link;
	ytSearch.getTopResult(link);
	if (link !== undefined && link !== "") {
//		YD.download(link);
//		YD.on("finished", (err, data) => {
//			res.json();
//		});
		res.json();
	}
	else {
		var form = new IncomingForm();
		form.on('file', (field, file) => {
			var ext = file.name.substring(file.name.length - 3);
			if (ext === 'mp3' || ext === 'wav' || ext === 'aac' || ext === 'ogg') {
				var newPath = __dirname + '\\public\\unplayed\\' + file.name;
				fs.rename(file.path, newPath, (err) => {
					mm.parseFile(newPath).then((metadata) => {
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
	}
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
	  if (isEmpty(clients)) {
		  clients[userID] = connection;
		  playSong();
	  }
	  else {
		  clients[userID] = connection;
	  }
	  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients));
	  connection.sendUTF(JSON.stringify(data));
	  connection.sendUTF(JSON.stringify(playData));
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
					 sendMessage(JSON.stringify(data));
				 }
				 if (dataFromClient.currentPos !== undefined) {
					 startTime = (new Date().getTime() / 1000 - dataFromClient.currentPos) * 1000;
					 playData.currentPos = dataFromClient.currentPos;
					 playData.update = "pos";
					 sendMessage(JSON.stringify(playData));
					 playData.update = "";
				 }
				 if (dataFromClient.play !== undefined) {
					 if (dataFromClient.play !== playData.play) {
						 if (playData.play) {
							 pauseTime = new Date().getTime();
						 }
						 else {
							 startTime = new Date().getTime() - playData.currentPos * 1000;
						 }
						 
						 playData.play = dataFromClient.play;
						 playData.update = "pause";
						 sendMessage(JSON.stringify(playData));
						 playData.update = "";
					 }
				 }
			 }
		 } 
	  });
	  connection.on('close', function(connection) {
		    console.log((new Date()) + " Peer " + userID + " disconnected.");
		    delete clients[userID];
		  });
	});
