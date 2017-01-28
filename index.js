var request = require('request');
var cheerio = require('cheerio');
var $q = require('q');

// should start at 179
function loadPage(id){
	return new Promise(function(resolve, reject){
		var url = 'https://land-book.com/websites/'+id;
		request(url,function(err,resp,body){
			if(!err)
				console.log("loaded: "+id);
				resolve(body);
		});

	});
}

function parseBody(body){
	var $ = cheerio.load(body);
	//var title = $('h2').text();
	//var homepage = $('.icon-world + a').text();
	var img = $('#website-screenshot').attr('src');
	console.log(img);
}

var promises = [];

//for(var i=10; i < 15; i++){
	//promises.push(loadPage(i));
//}

//$q.all(promises).then(function(response){
	//console.log(response);
	//console.log("app pages downloaded");
//});


loadPage(2080).then(function(body){
	try{
		parseBody(body);
	}
	catch(err){
		console.log(err);
	}
});

