import React, { Component } from "react";
import Track from './Track';
import './Track.css';

class TrackList extends Component {
	
	constructor(props) {
		super();
		console.log(props);
		this.unplayedQueue = props.unplayedQueue;
		this.playedQueue = props.playedQueue;
	}
	
	render () {
		return (
			<div className="trackList">
				<div className="trackListScroll">
					<div className="trackListContent">
						{this.unplayedQueue ? this.unplayedQueue.map((item, index) => (
							<Track unplayed={true} key={index} item={item} />
						)):"test"}
						{this.playedQueue ? this.playedQueue.map((item, index) => (
							<Track unplayed={false} key={index} item={item} />
						)):"test"}
					</div>
				</div>
			</div>
		);
	}
	
}

export default TrackList;