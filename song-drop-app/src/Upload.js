import React, { Component } from "react";
import Dropzone from './dropzone/Dropzone';
import properties from './properties.js';

class Upload extends Component {

  constructor(props) {
    super(props);
    this.state = {
      files: [],
      youtubeLink: ""
    };
    
    this.uploadFiles = this.uploadFiles.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.onFilesAdded = this.onFilesAdded.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  
  onFilesAdded(files) {
    this.setState(prevState => ({
      files: prevState.files.concat(files)
    }));
    setTimeout(() => { console.log(this.state.files); this.uploadFiles(); }, 0);
  }

  async uploadFiles() {
    const promises = [];
    this.state.files.forEach(file => {
      promises.push(this.sendRequest(file));
      console.log(promises);
    });
    try {
      await Promise.all(promises);
      this.setState({ files: undefined });
    } catch (e) {
      console.log(e);
    }
  }
  
  sendRequest(file) {
    return new Promise((res, rej) => {
      const req = new XMLHttpRequest();
      
      const formData = new FormData();
      formData.append("file", file, file.name);
      
      req.open("POST", properties.serverAddress + "/upload");
      req.send(formData);
    });
  }
  
  getParameterByName(name, url) {
	    name = name.replace(/[\[\]]/g, '\\$&');
	    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
	        results = regex.exec(url);
	    if (!results) return null;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, ' '));
	}
  
  sendYoutubeRequest() {
	  var link = this.getParameterByName("v", this.state.youtubeLink);
	  const req = new XMLHttpRequest();	  
	  if (link === "" || link === null) {
		  req.open("POST", properties.serverAddress + "/upload?link=" + this.state.youtubeLink);
	  }
	  else {
		  req.open("POST", properties.serverAddress + "/upload?link=" + link);
	  }
	  req.send();
  }
  
  handleChange(event) {
	  this.setState({youtubeLink: event.target.value});
  }

  render() {
    return (
      <center style={{border: "solid 1px black", backgroundColor: "#67779e", padding: "20px"}}>
      	<Dropzone onFilesAdded={this.onFilesAdded} disabled={false} />
      	<div style={{alignItems: "center", justifyContent: "center"}}>
      	  <input style={{display: "block", margin: "5px"}} value={this.state.youtubeLink} onChange={this.handleChange}/>
      	  <button style={{display: "block", margin: "5px"}} type="button" onClick={(e, val) => { this.sendYoutubeRequest(); }}>Download Youtube video</button>
      	</div>
      </center>
    );
  }

}

export default Upload;