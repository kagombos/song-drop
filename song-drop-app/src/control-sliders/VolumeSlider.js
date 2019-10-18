import React, { Component } from "react";
import { Slider } from '@material-ui/core';

class VolumeSlider extends Component {
	
	componentDidUpdate() {
		this.handleVolumeChange(this.props.volume);
	}
	
	smoothAlgorithm(val) {
	  return Math.pow((val / 100), (Math.log(10) / Math.log(2)));
	}
	
	onVolumeStateChange(val) {
		this.setState({ volume: val }, () => { this.props.client.send(JSON.stringify(this.state)); });    
	}
	
    handleVolumeChange(volume) {
    	this.props.gainNode.gain.value = this.smoothAlgorithm(volume);
    }
	
	render() {
		const sliderStyle = {
		  'marginLeft': '25%',
		  'marginRight': '25%',
		};
		//this.props.gainNode.gain.value = this.smoothAlgorithm(volume);
		return (
		<div className="VolumeSlider">
		  <p>Volume</p>
		  <div style={sliderStyle}>
		  	<Slider id="slider" 
		  	  onChange={(e, val) => {
		  		  this.onVolumeStateChange(val);
		  	  } }
		  	  min={0}
		      max={200}
		  	  value={this.props.volume}
		  	/>
		  </div>
		</div>
		);
	}
}

export default VolumeSlider;