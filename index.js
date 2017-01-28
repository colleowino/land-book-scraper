var request = require('request');
var cheerio = require('cheerio');
var $q = require('q');
var fs = require('fs');
var path = require('path');

/* TODO: move test methods to test suit */
var imgLink = 'http://s3-eu-central-1.amazonaws.com/land-book-production/websites/screenshots/000/001/800/large/a084c455-2baa-403a-b74d-38a0477aa6f8.jpg?1476078292';

function testImageDownloader(folderId, imgId, imgLink){
	downloadImage('1','50',imgLink).then(function(result,reject){
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

function downloadImage(folderId,fileId,url){
	var downloadDir = path.join('downloads',folderId.toString());

	if(!fs.existsSync(downloadDir))
		fs.mkdirSync(downloadDir);

	return new Promise(function(resolve,reject){
		try{
			var filename = path.join(downloadDir,fileId.toString() + getExtName(url));
			request(fixUrlPrefix(url)).pipe(fs.createWriteStream(filename)).on('close',function(){
				resolve(fileId);
			});
		}
		catch(error){
			console.log(error);
		}
		

	});

}

function parseBody(id,body){
	var $ = cheerio.load(body);
	var title = $('h2').text();
	var homepage = $('.icon-world + a').text();
	var img = $('#website-screenshot').attr('src');

	return {'id':id,'title':title,'imgurl':fixUrlPrefix(img),'url':homepage};
}

// should start at 179 -> 2639 , divide to get per page
function loadPage(id){
	return new Promise(function(resolve, reject){
		var url = 'https://land-book.com/websites/'+id;
		request(url,function(err,resp,body){
			//if(!err){
				//console.log("loaded page: "+id);
				resolve(parseBody(id,body));
			//}
			//else{
				//console.log("unable to load page: "+id);
				//reject(-1);
			//}
		});

	});
}

var todownload = [];

function getPgPromises(pg,groupsize){
	var maxitems = (pg * groupsize);
	var firstitem = maxitems - (groupsize - 1);
	console.log("woking on: ",firstitem, maxitems);

	for(var i = firstitem; i <= maxitems; i++){
		todownload.push(loadPage(i));
	}
}

function getPage(startPage){
	return new Promise( function(resolve,reject){
		// starting page
		getPgPromises(startPage, itemCount);

		$q.all(todownload).then(function(imgLinks){
			return imgLinks;
		}).then( function(data){

			var imgPromises = [];

			data.forEach(function(site){

				if(site.imgurl){
					imgPromises.push(downloadImage(startPage,site.id,site.imgurl));
				}
			});

			$q.all(imgPromises).then(function(res){
				//console.log(res);
				resolve(startPage + 1);
			});

		});
	});
}

/// check if the highest page reached.

function cyclone(startPage){
	console.log("\n -- getting a page -- ");
	getPage(startPage).then(function(next){
		console.log("next should be: "+next);
		if (next <= lastPage)
			cyclone(next);
	});
}

var itemCount = 10;
var lastPage = 20;
// cylone 19, 20
cyclone(19);
	


