import React, { Component } from "react";
import Track from './Track';

class TrackList extends Component {
	
	constructor(props) {
		super();
		console.log(props);
		this.unplayedQueue = props.unplayedQueue;
		this.playedQueue = props.playedQueue;
	}
	
	render () {
		return (
			<div>
				{this.playedQueue ? this.playedQueue.map((item, index) => (
					<Track key={index} item={item} />
				)):"test"}
			</div>
		);
	}
	
}

export default TrackList;