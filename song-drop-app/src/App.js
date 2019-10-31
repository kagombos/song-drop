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
    	playRate: 0,
    	playedQueue: null,
    	unplayedQueue: null,
    	requestCompleted: false,
    	currentPos: 0,
    	duration: 0,
    	play: false
    };
    
    this.source = audioContext.createBufferSource();
    
    this.gainNode = audioContext.createGain();
    this.gainNode.connect(audioContext.destination);
    
    this.getSound();
    
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
	  
	  this.source.onended = function() {
    	a.getSound();
      }
	  request.onload = () => {
		  audioContext.decodeAudioData(request.response).then(function (data) {
			  a.source.buffer = data;
			  a.source.connect(a.gainNode);
			  if (a.state.play) {
				  a.source.start(0, a.state.currentPos);
			  }
		  }, (e) => { console.log(e); });
  	  }
	  request.send();
  }
  
  setNewSource(stopOld) {
	  if (stopOld) {
		  this.source.stop();
	  }
	  var newSource = audioContext.createBufferSource();
	  newSource.buffer = this.source.buffer;
	  newSource.connect(this.gainNode);
	  this.source = newSource;
  }
  
  startPlay() {
	  if (this.state.play) {
		  audioContext.resume();
	  }
	  else {
		  this.setNewSource();
	  }
  }
  
  togglePlay() {
	  var url = "http://172.18.86.35:5001/togglepause";
	  this.state.play = !this.state.play;
	  this.playSoundLoop();
	  var request = new XMLHttpRequest();
	  request.open("GET", url, true);
	  request.send();
  }
  
  playSoundLoop() {
	var elem = document.getElementById("toggleButton");
	if (this.state.play) {
		this.setNewSource();
		this.source.start(0, this.state.currentPos); 
		elem.innerHTML = 'Stop';
	}
	else {
		try {
			this.source.stop();
		}
		catch (e) {};
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
	    if (dataFromServer.playRate !== undefined) {
	    	this.setState({ playRate: dataFromServer.playRate });	    	
	    }
	    if (dataFromServer.playedQueue !== undefined) {
	    	this.setState({ playedQueue: dataFromServer.playedQueue });    	
	    }
	    if (dataFromServer.unplayedQueue !== undefined) {
	    	this.setState({ unplayedQueue: dataFromServer.unplayedQueue });    	
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
	    	if (dataFromServer.update) {
	    		this.setNewSource(true);
		    	if (this.state.play) {
		    		this.source.start(0, this.state.currentPos); 
		    	}
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
	          <div style={{position: "absolute", top: "90%", width: "100%"}}>
	          	<PlayBackSlider play={this.state.play} currentPos={this.state.currentPos} duration={this.state.duration} client={client}/>
	          	<button id="toggleButton" type="button" onClick={(e, val) => { this.togglePlay(); }}>Stop</button>
	          </div>
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