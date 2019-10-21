import React, { Component } from "react";
import Dropzone from './dropzone/Dropzone';

class Upload extends Component {

  constructor(props) {
    super(props);
    this.state = {
      files: []
    };
    
    this.uploadFiles = this.uploadFiles.bind(this);
    this.sendRequest = this.sendRequest.bind(this);
    this.onFilesAdded = this.onFilesAdded.bind(this);
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
      
      req.open("POST", "http://172.18.86.35:5001/upload");
      req.send(formData);
    });
  }

  render() {
    return (
      <Dropzone onFilesAdded={this.onFilesAdded} disabled={false} />
    );
  }

}

export default Upload;