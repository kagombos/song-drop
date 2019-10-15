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

    this.audio = new Audio(require(".\\sounds\\aaaaa.mp3"));
    //this.track = audioContext.createMediaElementSource(this.audio);
    this.playing = false;
    
    this.handleChange = this.handleChange.bind(this);
    
    
  }
  
  togglePlay() {
	  this.playing = !this.playing;
	  this.playSoundLoop();
  }
  
  playSoundLoop() {
	if (this.playing) {
		this.audio.volume = this.state.value / 100;
		
		this.audio.addEventListener('ended', () => {
			this.audio.currentTime = 0;
			this.audio.play();
		}, false);
		var playPromise = this.audio.play();

	    if (playPromise !== undefined) {
	      playPromise
	        .then(_ => {
	        	console.log("!");
	        })
	        .catch(error => {
	          // Auto-play was prevented
	          // Show paused UI.
	          console.log(playPromise);
	          console.log("playback prevented");
	        });
	    }
	}
	else {
		this.audio.currentTime = 0;
		this.audio.pause();
	}
  }
  
  onEditorStateChange(val) {
	this.audio.volume = val / 100;
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
	  this.audio.volume = value / 100;
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