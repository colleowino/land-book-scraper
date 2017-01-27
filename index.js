var request = require('request');
var cheerio = require('cheerio');
var $q = require('q');

var url = 'https://land-book.com/websites/179';

function loadPage(id){

	return new Promise(function(resolve, reject){
		var url = 'https://land-book.com/websites/'+id;
		request(url,function(err,resp,body){
			if(!err)
				console.log("loaded: "+id);
				resolve(50);
		});

	});
}

var promises = [];

for(var i=10; i < 15; i++){
	promises.push(loadPage(i));
}

//$q.all(promises).then(function(response){
	//console.log(response);
	//console.log("app pages downloaded");
//});



