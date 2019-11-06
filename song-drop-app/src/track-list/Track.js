import React, { Component } from "react";
import './Track.css';
import moment from 'moment';
import properties from './../properties.js';


class Track extends Component {
	
	constructor(props) {
		super();
		this.state = {
			isHidden: true
		}
	}
	
	expand(item) {
		this.setState({
			isHidden: false
		});
	}
	
	hide(item) {
		this.setState({
			isHidden: true
		});
	}
	
	play() {
		const req = new XMLHttpRequest();	  
		req.open("GET", properties.serverAddress + "/play?fileName=" + this.state.fileName);
		req.send();
	}
	
	render () {
		return (
				<div className={(this.state.isHidden ? "shortened" : "expanded") + " " + this.props.playState}
			        style={{position: "relative", border: "solid 1px #212633" }} 
				    onMouseLeave={(e, val) => { this.hide(this); }} 
			        onMouseEnter={(e, val) => { this.expand(this); }}
			        onClick={(e, val) => { this.play(); }}>
				  {this.state.isHidden && this.props.item && <Hidden data={this.props.item.data} name={this.props.item.data.title ? this.props.item.data.title : this.props.item.name } duration={this.props.item.duration}/>}
				  {!this.state.isHidden && this.props.item && <Expanded data={this.props.item.data} name={this.props.item.data.title ? this.props.item.data.title : this.props.item.name } duration={this.props.item.duration}/>}
				</div>
		)
	}
}

const Hidden = (props) => (
	<div className="overflow" >{ props.name }</div>
)

const Expanded = (props) => (
	<div>
		<strong>Title: { props.name }</strong>
		{props.duration ? <div>Duration: { moment().startOf('day').seconds(props.duration).format('mm:ss') }</div> : ''}
		{props.data.album ? <div>Album: { props.data.album }</div> : ''}
		{props.data.artist ? <div>Artist: { props.data.artist }</div> : ''}
		{props.data.year ? <div>Year: { props.data.year }</div> : ''}
	</div>
)

export default Track;