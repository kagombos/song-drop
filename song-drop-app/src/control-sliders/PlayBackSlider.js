import React, { Component } from "react";
import { Slider } from '@material-ui/core';

class PlayBackSlider extends Component {

    constructor(props) {
      super();
      this.state = {
        currentPos: 0
      }
      
      this.state.currentPos = props.currentPos;
      this.locked = true;
    }
  
    onPlayBackStateChange(val) {
      this.locked = false;
      this.setState({ currentPos: val });
    }
    
    onPlayBackStateChangeCommitted(val) {
      this.setState({ currentPos: val }, () => { this.props.client.send(JSON.stringify(this.state)); console.log(this.state.currentPos); this.locked = true;});
    }
  
  render() {
    const sliderStyle = {
      'marginLeft': '10%',
      'marginRight': '10%',
    };
    var value = this.locked ? this.props.currentPos : this.state.currentPos;
    return (
    <div className="PlayBackSlider">
      <div style={sliderStyle}>
        <Slider id="slider" 
          aria-labelledby="continuous-slider"
          onChange={(e, val) => {
            this.onPlayBackStateChange(val);
          } }
          onChangeCommitted={(e, val) => {
            this.onPlayBackStateChangeCommitted(val);
          } }
          min={0}
          max={this.props.duration}
          value={value}
        />
      </div>
    </div>
    );
  }
}

export default PlayBackSlider;