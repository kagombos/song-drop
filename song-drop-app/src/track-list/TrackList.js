import React, { Component } from "react";
import Track from './Track';
import './Track.css';

class TrackList extends Component {
	
	constructor(props) {
		super();
		console.log(props);
	}
	
	render () {
		return (
			<div className="trackList">
				<div className="trackListScroll">
					<div className="trackListContent">
						{this.props.unplayedQueue ? this.props.unplayedQueue.map((item, index) => (
							<Track unplayed={true} key={index} item={item} />
						)):"test"}
						{this.props.playedQueue ? this.props.playedQueue.map((item, index) => (
							<Track unplayed={false} key={index} item={item} />
						)):"test"}
					</div>
				</div>
			</div>
		);
	}
	
}

export default TrackList;