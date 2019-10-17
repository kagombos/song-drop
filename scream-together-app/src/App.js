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
    	value: 0
    };
    
    this.source = audioContext.createBufferSource();
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = this.state.value / 100;
    this.gainNode.connect(audioContext.destination);
    
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
    
    this.handleChange = this.handleChange.bind(this);
  }
  
  
  
  togglePlay() {
	  this.playing = !this.playing;
	  this.playSoundLoop();
  }
  
  playSoundLoop() {
	
	if (this.playing) {
		this.gainNode.gain.value = this.state.value / 100;
		audioContext.resume();		
	}
	else {
		audioContext.suspend();
	}
  }
  
  onEditorStateChange(val) {
	if (this.source !== undefined) {
	  this.gainNode.gain.value = val / 100;
	}
	this.setState({ value: val }, () => { client.send(JSON.stringify(this.state)); });    
  }
  
  componentDidMount() {
	  client.onopen = () => {
	   console.log('WebSocket Client Connected');
	  };
	  client.onmessage = (message) => {
	    const dataFromServer = JSON.parse(message.data);
	    this.handleChange(dataFromServer.value);
	  };
	}  
  
  handleChange(value) {
	  //this.audio.volume = value / 100;
	  this.setState({ value: value });
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
          	{this.state.value}
          </h1>
          <div style={sliderStyle}>
          	<Slider id="slider" 
          	  onChange={(e, val) => {
          		  this.onEditorStateChange(val);
          	  } }
          	  min={0}
              max={100}
          	  value={this.state.value}
          	/>
          </div>
          <button type="button" onClick={(e, val) => { this.togglePlay(); }}>Begin</button>
        </center>
      </div>
    );
  }
}

export default App;