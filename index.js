var request = require('request');
var cheerio = require('cheerio');
var $q = require('q');
var fs = require('fs');
var path = require('path');

/* TODO: move test methods to test suit */
var imgLink = 'http://s3-eu-central-1.amazonaws.com/land-book-production/websites/screenshots/000/001/800/large/a084c455-2baa-403a-b74d-38a0477aa6f8.jpg?1476078292'

function testImageDownloader(imgLink){
	downloadImage(imgLink,1).then(function(result,reject){
		console.log('downloaded '+result);
	});
}

function getExtName(url){
	return path.extname(url).split('?')[0];
}

// landbook images seem to lack 'http:' prefix
function fixUrlPrefix(url){
	if(url && !url.includes('http:')){
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

function parseBody(body){
	var $ = cheerio.load(body);
	//var title = $('h2').text();
	//var homepage = $('.icon-world + a').text();
	var img = $('#website-screenshot').attr('src');
	return fixUrlPrefix(img);
}

// should start at 179 -> 2639 , divide to get per page
function loadPage(id){
	return new Promise(function(resolve, reject){
		var url = 'https://land-book.com/websites/'+id;
		request(url,function(err,resp,body){
			//if(!err){
				//console.log("loaded page: "+id);
				resolve(parseBody(body));
			//}
			//else{
				//console.log("unable to load page: "+id);
				//reject(-1);
			//}
		});

	});
}


// load the pages
function readPageDownloadImage(pgNum){
	return new Promise(function (resolve, reject){
		loadPage(pgNum).then(function(imgLink){

			if(imgLink){
				downloadImage(imgLink,pgNum);
				resolve(pgNum+1);
			}else{
				console.log("couldn't read image link");
				reject(-1);
			}

		});
	});
}

var pgNum = 11;

//readPageDownloadImage(pgNum).then(function(imgId){
	//console.log(imgId);
//});

var todownload = [];

function getpromises(pg,groupsize){
	var maxitems = (pg * groupsize);
	var firstitem = maxitems - (groupsize - 1);
	console.log(firstitem, maxitems);

	for(var i = firstitem; i <= maxitems; i++){
		todownload.push(loadPage(i));
		//console.log(i);
	}
}

// starting page
getpromises(19, 10);

//console.log(todownload);

//for(var i=10; i < 15; i++){
	//promises.push(loadPage(i));
//}

$q.all(todownload).then(function(imgLinks){
	return imgLinks;
}).then( function(data){
	console.log(data);
	console.log("about to download images");
});


//loadPage(2080).then(function(body){
	//try{
		//parseBody(body);
	//}
	//catch(err){
		//console.log(err);
	//}
//});

