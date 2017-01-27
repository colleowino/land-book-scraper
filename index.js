var request = require('request');
var cheerio = require('cheerio');

var url = 'https://land-book.com/websites/179';
//parse body
var body = '';

request(url, function(err,resp,body){	
	console.log(body);
});

var loadPage = new Promise(function(resolve,reject){
	request(url, function(err,resp,body){	
		if(!err)
			resolve(body);
	});
});

loadPage.then(function(response){
	 console.log("Success!", response);
});
