const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

module.exports = {
	getTopResult (searchString) {
		searchYoutube(searchString);
	}
}

function searchYoutube (searchString) {
//	var args = {
//		headers: { "Content-Type": "application/json",  'Authorization': '' },
//		data:{},
//		rejectUnauthorized: false
//	};
//	client.get("https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyCrvHmoC73Y6IhhSZSEJmmaYFHBE_-NzVM&max_results=3&q=" + searchString, args, (data, response) => {
//		console.log(data);
//		console.log(response);
//	});
	var req = https.request({
        method: 'GET',
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
	});
	https.get("https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyCrvHmoC73Y6IhhSZSEJmmaYFHBE_-NzVM&max_results=3&q=" + searchString, (res) => {
		console.log(res);
	}).on('error', (e) => {
		console.log(e);
	});
}