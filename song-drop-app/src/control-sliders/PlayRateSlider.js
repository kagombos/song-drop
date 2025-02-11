import React, { Component } from "react";
import { Slider } from '@material-ui/core';

class PlayRateSlider extends Component {
	
	constructor() {
		super();
		this.lastTime = new Date();
	}
	
	componentDidUpdate() {
		this.handlePlayRateChange(this.props.playRate);
	}
	
	smoothAlgorithm(val) {
	  return Math.pow((val / 100), (Math.log(10) / Math.log(2)));
	}
	
	onPlayRateStateChange(val) {
	    this.setState({ playRate: val }, () => { this.props.client.send(JSON.stringify({playRate: this.state.playRate})); });  
	  }
	
    handlePlayRateChange(playRate) {
  	  this.props.source.playbackRate.value = this.smoothAlgorithm(playRate);
    }
	
	render() {
		const sliderStyle = {
		  'marginLeft': '25%',
		  'marginRight': '25%',
		};
		//this.props.gainNode.gain.value = this.smoothAlgorithm(volume);
		return (
		<div className="PlayRateSlider">
		  <p>Play Rate</p>
		  <div style={sliderStyle}>
		  	<Slider id="slider" 
		  	  onChange={(e, val) => {
		  		  if (new Date() - this.lastTime > 10) {
		  			  this.onPlayRateStateChange(val);
		  			  this.lastTime = new Date();
		  		  }
		  	  }}
		  	  onChangeCommitted={(e, val) => {
		  		  this.onPlayRateStateChange(val);
		  	  }}
		  	  min={0}
		      max={200}
		  	  value={this.props.playRate}
		  	/>
		  </div>
		</div>
		);
	}
}

export default PlayRateSlider;