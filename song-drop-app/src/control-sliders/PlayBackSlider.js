import React, { Component } from "react";
import { Slider } from '@material-ui/core';

class PlayBackSlider extends Component {
  
  componentDidUpdate() {
    this.handlePlayBackChange(this.props.playRate);
  }
  
  onPlayBackStateChange(val) {
      this.setState({ playBack: val }, () => { this.props.client.send(JSON.stringify(this.state)); });  
    }
  
    handlePlayRateChange(playBack) {
      this.props.source.playbackRate.value = this.smoothAlgorithm(playBack);
    }
  
  render() {
    const sliderStyle = {
      'marginLeft': '25%',
      'marginRight': '25%',
    };
    //this.props.gainNode.gain.value = this.smoothAlgorithm(volume);
    return (
    <div className="PlayBackSlider">
      <p>Play Rate</p>
      <div style={sliderStyle}>
        <Slider id="slider" 
          onChange={(e, val) => {
            this.onPlayBackStateChange(val);
          } }
          min={0}
          max={200}
          value={this.props.source.}
        />
      </div>
    </div>
    );
  }
}

export default PlayBackSlider;