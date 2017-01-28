var request = require('request');
var cheerio = require('cheerio');
var $q = require('q');
var fs = require('fs');
var path = require('path');

/* TODO: move test methods to test suit */
function testImageDownloader(){
	var imgLink = 'http://s3-eu-central-1.amazonaws.com/land-book-production/websites/screenshots/000/001/800/large/a084c455-2baa-403a-b74d-38a0477aa6f8.jpg?1476078292'

	downloadImage(imgLink,1).then(function(result,reject){
		console.log('downloaded '+result);
	});
}

testImageDownloader();

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

function getExtName(url){
	return path.extname(url).split('?')[0];
}

// landbook images seem to lack 'http:' prefix
function fixUrlPrefix(url){
	console.log(url);
	if(!url.includes('http:')){
		url = 'http:'+url;
	}
	return url;
}

function downloadImage(url,fileId){
	var downloadDir = 'downloads';

	if(!fs.existsSync(downloadDir))
		fs.mkdirSync(downloadDir);

	return new Promise(function(resolve,reject){
		var filename = path.join(downloadDir,fileId.toString() + getExtName(url));
		
		request(fixUrlPrefix(url)).pipe(fs.createWriteStream(filename)).on('close',function(){
			resolve(fileId);
		});

	});

}

//for(var i=10; i < 15; i++){
	//promises.push(loadPage(i));
//}

//$q.all(promises).then(function(response){
	//console.log(response);
	//console.log("app pages downloaded");
//});


//loadPage(2080).then(function(body){
	//try{
		//parseBody(body);
	//}
	//catch(err){
		//console.log(err);
	//}
//});

