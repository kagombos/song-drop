// src/App.js

import React, { Component } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { Slider } from '@material-ui/core';

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const client = new W3CWebSocket('ws://172.18.86.35:5000');

class App extends Component {
	
  constructor(props) {
    super(props);
    this.state = {
    	volume: 0,
    	playRate: 0,
    	pitch: 0
    };
    
    this.source = audioContext.createBufferSource();
    
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = this.smoothAlgorithm(this.state.volume);
    this.gainNode.connect(audioContext.destination);
    
    this.source.playbackRate.value = this.smoothAlgorithm(this.state.playRate);
    
    var url = "http://localhost:5001/aaaaa.mp3"
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var a = this;
    
    request.onload = () => {
      console.log(request.response);

      var promise = audioContext.decodeAudioData(request.response).then(function (data) {
    	console.log(data);
    	a.source.buffer = data;
    	a.source.loop = true;
    	a.source.connect(a.gainNode);
    	a.source.start(0);
      }, (e) => { console.log(e); });
      console.log(promise);
    }
    
    request.send();
    
    this.playing = false;
    
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.handlePlayRateChange = this.handlePlayRateChange.bind(this);
  }
  
  smoothAlgorithm(val) {
	  return Math.pow((val / 100), (Math.log(10) / Math.log(2)));
  }
  
  togglePlay() {
	  this.playing = !this.playing;
	  this.playSoundLoop();
  }
  
  playSoundLoop() {
	if (this.playing) {
		this.gainNode.gain.value = this.smoothAlgorithm(this.state.volume);
		audioContext.resume();		
	}
	else {
		audioContext.suspend();
	}
  }
  
  onPlayRateStateChange(val) {
    if (this.source !== undefined) {
    	var smoothed = this.smoothAlgorithm(val);
    	this.source.playbackRate.value = smoothed;
    }
    this.setState({ playRate: val }, () => { client.send(JSON.stringify(this.state)); });  
  }
  
  onVolumeStateChange(val) {
	if (this.source !== undefined) {
	  this.gainNode.gain.value = this.smoothAlgorithm(val);
	}
	this.setState({ volume: val }, () => { client.send(JSON.stringify(this.state)); });    
  }
  
  componentDidMount() {
	  client.onopen = () => {
	   console.log('WebSocket Client Connected');
	  };
	  client.onmessage = (message) => {
	    const dataFromServer = JSON.parse(message.data);
	    this.handleVolumeChange(dataFromServer.volume);
	    this.handlePlayRateChange(dataFromServer.playRate);
	  };
	}  
  
  handleVolumeChange(volume) {
	  this.gainNode.gain.value = this.smoothAlgorithm(volume);
	  this.setState({ volume: volume });
  }
  
  handlePlayRateChange(playRate) {
	  this.source.playbackRate.value = this.smoothAlgorithm(playRate);
	  this.setState({ playRate: playRate });
  }
  
  render() {
	const sliderStyle = {
	  'marginLeft': '25%',
	  'marginRight': '25%',
	};
    return (
      <div className="App">
        <center>
          <h1 id="value">
          	{this.state.volume}
          </h1>
          <div style={sliderStyle}>
          	<Slider id="volSlider" 
          	  onChange={(e, val) => {
          		  this.onVolumeStateChange(val);
          	  } }
          	  min={0}
              max={200}
          	  value={this.state.volume}
          	/>
          </div>
          <div style={sliderStyle}>
          	<Slider id="playSlider" 
          	  onChange={(e, val) => {
          		  this.onPlayRateStateChange(val);
          	  } }
          	  min={0}
              max={200}
          	  value={this.state.playRate}
          	/>
          </div>
          <button type="button" onClick={(e, val) => { this.togglePlay(); }}>Begin</button>
        </center>
      </div>
    );
  }
}

export default App;