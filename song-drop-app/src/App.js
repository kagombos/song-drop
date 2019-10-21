// src/App.js

import React, { Component } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import './App.css';

import PlayRateSlider from './control-sliders/PlayRateSlider';
import VolumeSlider from './control-sliders/VolumeSlider';
import Upload from './Upload';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const client = new W3CWebSocket('ws://172.18.86.35:5000');

class App extends Component {
	
  constructor(props) {
    super(props);
    this.state = {
    	volume: 0,
    	playRate: 0,
    	pitch: 0,
    };
    
    this.source = audioContext.createBufferSource();
    this.buttonLabel = 'Begin';
    
    this.gainNode = audioContext.createGain();
    this.gainNode.connect(audioContext.destination);
    
    console.log(audioContext);
    
    this.getSound();
    
    this.playing = false;
    
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
			  a.source.playbackRate.value = a.smoothAlgorithm(a.state.playRate);
			  a.source.connect(a.gainNode);
			  a.source.start(0);
		  }, (e) => { console.log(e); });
  	  }
	  request.send();
  }
  
  togglePlay() {
	  this.playing = !this.playing;
	  this.playSoundLoop();
  }
  
  playSoundLoop() {
	var elem = document.getElementById("toggleButton");
	if (this.playing) {
		audioContext.resume();
		elem.innerHTML = 'Stop';
	}
	else {
		audioContext.suspend();
		elem.innerHTML = 'Start';
	}
  }
  
  componentDidMount() {
	  client.onopen = () => {
	   console.log('WebSocket Client Connected');
	  };
	  client.onmessage = (message) => {
	    const dataFromServer = JSON.parse(message.data);
	    this.setState({volume: dataFromServer.volume});
	    this.setState({ playRate: dataFromServer.playRate });
	  };
	}  
  
  render() {
    return (
      <div className="App">
        <center>
          <VolumeSlider gainNode={this.gainNode} volume={this.state.volume} client={client}/>
          <PlayRateSlider source={this.source} playRate={this.state.playRate} client={client}/>
          <button id="toggleButton" type="button" onClick={(e, val) => { this.togglePlay(); }}>Begin</button>
        </center>
        <div className="Upload">
          <Upload />
        </div>
      </div>
    );
  }
}

export default App;