import React, { Component } from "react";
import Track from './Track';
import './Track.css';

class TrackList extends Component {
	
	constructor(props) {
		super();
	}
	
	render () {
		return (
			<div className="trackList">
				<div className="trackListScroll">
					<div className="trackListContent">
						<Track playState="current" key="0" item={this.props.currentSong} />
						{this.props.unplayedQueue ? this.props.unplayedQueue.map((item, index) => (
							<Track playState="unplayed" key={index} item={item} />
						)):"test"}
						{this.props.playedQueue ? this.props.playedQueue.map((item, index) => (
							<Track playState="played" key={index} item={item} />
						)):"test"}
					</div>
				</div>
			</div>
		);
	}
	
}

export default TrackList;