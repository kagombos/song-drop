// src/App.js

import React, { Component } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import './App.css';

import PlayRateSlider from './control-sliders/PlayRateSlider';
import VolumeSlider from './control-sliders/VolumeSlider';
import PlayBackSlider from './control-sliders/PlayBackSlider';
import Upload from './Upload';
import TrackList from './track-list/TrackList';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const client = new W3CWebSocket('ws://172.18.86.35:5000');

class App extends Component {
	
  constructor(props) {
    super(props);
    this.state = {
    	volume: 0,
    	playedQueue: null,
    	unplayedQueue: null,
    	requestCompleted: false,
    	currentPos: 0,
    	duration: 0,
    	play: false,
    	songName: "test"
    };
    
    this.source = audioContext.createBufferSource();
    this.sourceStarted = false;
    
    this.gainNode = audioContext.createGain();
    this.gainNode.connect(audioContext.destination);
    
    this.togglePlay = this.togglePlay.bind(this);
  }
  
  smoothAlgorithm(val) {
	return Math.pow((val / 100), (Math.log(10) / Math.log(2)));
  }
  
  getSound() {
	  this.source = audioContext.createBufferSource();
	  
	  var url = "http://172.18.86.35:5001/sound"
      var request = new XMLHttpRequest();
	  request.open("GET", url, true);
	  request.responseType = "arraybuffer";
	  var a = this;
	  request.onloadend = () => {
		  audioContext.decodeAudioData(request.response).then(function (data) {
			  a.source.buffer = data;
			  a.source.connect(a.gainNode);
			  if (a.state.play && !a.sourceStarted) {
				  a.source.start(0, a.state.currentPos);
				  a.sourceStarted = true;
			  }
		  }, (e) => { console.log(e); });
  	  }
	  request.send();
  }
  
  setNewSource() {
	  console.log("setting new source...")
	  if (this.sourceStarted) {
		  this.source.stop();
		  this.sourceStarted = false;
	  }
	  var oldSource = this.source;
	  this.source = audioContext.createBufferSource();
	  this.source.buffer = oldSource.buffer;
	  this.source.connect(this.gainNode);
  }
  
  startPlay() {
	  this.getSound();
  }
  
  togglePlay() {
	  var url = "http://172.18.86.35:5001/togglepause";
	  this.setState({
		  play: !this.state.play
	  }, () => {
		  this.playSoundLoop();
		  client.send(JSON.stringify({ play: this.state.play }));
	  })
  }
  skip() {
	  client.send(JSON.stringify({ currentPos: this.state.duration }));
  }
  
  playSoundLoop() {
	var elem = document.getElementById("toggleButton");
	if (this.state.play) {
		this.setNewSource();
		this.source.start(0, this.state.currentPos); 
		this.sourceStarted = true;
		elem.innerHTML = 'Stop';
	}
	else {
		if (this.sourceStarted) {
			this.source.stop();
			this.sourceStarted = false;
		}
		elem.innerHTML = 'Start';
	}
  }
  
  componentDidMount() {
	  client.onopen = () => {
	   console.log('WebSocket Client Connected');
	  };
	  client.onmessage = (message) => {
	    const dataFromServer = JSON.parse(message.data);
	    if (dataFromServer.volume !== undefined) {
	    	this.setState({ volume: dataFromServer.volume });	    	
	    }
	    if (dataFromServer.playedQueue !== undefined) {
	    	this.setState({ playedQueue: dataFromServer.playedQueue });    	
	    }
	    if (dataFromServer.unplayedQueue !== undefined) {
	    	this.setState({ unplayedQueue: dataFromServer.unplayedQueue });    	
	    }
	    
	    if (dataFromServer.songName !== undefined) {
	    	this.setState({ songName: dataFromServer.songName });
	    }
	    if (dataFromServer.currentPos !== undefined) {
	    	this.setState({ currentPos: dataFromServer.currentPos });
	    }
	    if (dataFromServer.duration !== undefined) {
	    	this.setState({ duration: dataFromServer.duration });
	    }
	    if (dataFromServer.play !== undefined) {
	    	this.setState({ play: dataFromServer.play });
	    }
	    if (dataFromServer.update !== undefined) {
	    	if (dataFromServer.update === "pos") {
	    		this.playSoundLoop();
	    	}
	    	if (dataFromServer.update === "pause") {
	    		this.setState({ play: dataFromServer.play }, () => {
	    			this.playSoundLoop();
	    		});
	    	}
	    }
	    if (dataFromServer.newSong !== undefined) {
	    	if (dataFromServer.newSong) {
	    		this.source.stop();
	    		this.sourceStarted = false;
	    		this.getSound();
	    	}
	    }
	    this.setState({ requestCompleted: true });
	  };
	}  
  
  render() {
	if (this.state.requestCompleted) {
		return (
	      <div className="App">
	        <center>
	          <VolumeSlider gainNode={this.gainNode} volume={this.state.volume} client={client}/>
	          <div style={{position: "absolute", top: "50%", width: "100%"}}>
	          	<button id="startButton" type="button" onClick={(e, val) => {this.startPlay();}}>Begin</button>
	          </div>
	          <center className="player">
	          	<p>{this.state.songName}</p>
	          	<PlayBackSlider play={this.state.play} currentPos={this.state.currentPos} duration={this.state.duration} client={client}/>
	          	<button id="toggleButton" type="button" onClick={(e, val) => { this.togglePlay(); }}>Stop</button>
	          	<button id="skip" type="button" onClick={(e, val) => { this.skip(); }}>Skip</button>
	          </center>
	        </center>
	        <div className="Upload">
	          <Upload />
	        </div>
	        <TrackList playedQueue={this.state.playedQueue} unplayedQueue={this.state.unplayedQueue}/>
	      </div>
	    );
	}
	else {
		return (
			<div>Loading...</div>
		)
	}
  }
}

export default App;