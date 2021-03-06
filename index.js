var request = require('request');
var cheerio = require('cheerio');
var $q = require('q');
var fs = require('fs');
var path = require('path');
var env = require('node-env-file');
var Sequelize = require('sequelize');

env(__dirname + '/.env');

var sequelize = new Sequelize('main', null, null, {
	logging: false,
  host: 'localhost',
  dialect: 'sqlite',
  storage: process.env.DB
});

var Site = sequelize.define('site',{
	title: Sequelize.STRING,
	img_url: Sequelize.TEXT,
	homepage: Sequelize.TEXT,
	site_id: Sequelize.INTEGER
});
Site.sync({force:true});

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

function parseBody(id,body){
	var $ = cheerio.load(body);
	var title = $('h2').text();
	var homepage = $('.icon-world + a').text();
	var img = $('#website-screenshot').attr('src');

	if(img){
		return {'id':id.toString(),'imgurl':fixUrlPrefix(img),'url':homepage};
	}
}

// should start at 179 -> 2639 , divide to get per page
function loadPage(id){
	return new Promise(function(resolve, reject){
		var url = 'https://land-book.com/websites/'+id;
		request(url,function(err,resp,body){
				var pageObject = parseBody(id,body);
				resolve(pageObject);
		});

	});
}

/* returns pending promises for each screenshot 
 * based on groupsize per folder 
 */
function getPgPromises(pg,groupsize){
	var todownload = [];

	var maxitems = (pg * groupsize);
	var firstitem = maxitems - (groupsize - 1);
	console.log("woking on: ",firstitem, maxitems);

	for(var i = firstitem; i <= maxitems; i++){
		var downloadedPage = loadPage(i);
		todownload.push(downloadedPage);
	}
	
	return todownload;
}

function batchDownload(imgPromises,limit){
	return new Promise(function(resolve,reject){
		if(imgPromises.length == 0){
			resolve("success");
		}

		var lastElement = limit < imgPromises.length ? limit : imgPromises.length;

		var completed_download = 0;
		var run = 0;

		for(var i = 0; i < lastElement; i++){
			var current = imgPromises.shift();
			var pipe = request(current.url).pipe(fs.createWriteStream(current.filename));

			pipe.on("finish",function(){
				run++;
				if(run == limit){
					completed_download += run;
					batchDownload(imgPromises,limit);
				}
				
			});

			pipe.on("error",function(err){
				console.log("problem occured");
			});

		}

	});
}


function downloadFolder(pg,lastPage,groupsize,limit){

	if(pg <= lastPage){

		var downloadDir = path.join('downloads',pg.toString());
		var pgPromises = getPgPromises(pg,groupsize);

		$q.all(pgPromises).then(function(scrapedPages){
			return scrapedPages;
		}).then(function(scrapedPages){
				//console.log("fulfilled");

				if(!fs.existsSync(downloadDir))
					fs.mkdirSync(downloadDir);

				var imgRequests = [];

				for(var i = 0; i < scrapedPages.length; i++){
					var screenshot = scrapedPages[i];

					if(screenshot != undefined){
						var imgUrl = screenshot.imgurl;
						var ext = getExtName(imgUrl);
						var filename = path.join(downloadDir,screenshot.id + ext);

						if(fs.existsSync(filename)){
							console.log("Already downloaded "+screenshot.id);
						} else{
							imgRequests.push({"filename":filename,"url": imgUrl });
						}

					}
				}
				
				var limit = 3;
				batchDownload(imgRequests,limit).then(function(){
						console.log("folder downloaded: "+pg+"\n");
						pg++;
						downloadFolder(pg,lastPage,groupsize);
				}).catch(function(error){
					console.log("->boom! "+error);
					reject(error);
				});

		}, function(reason){
				console.log("rejected");
		}).catch(function(error){
				console.log("boom! "+error);
				reject(error);
		});

	} else{
		console.log("Downloading complete");
	}
}

// getPage
// getPagePromises
// scrapePages, getImageUrls
var pg = 2;
var groupsize = 100;
var lastPage = 2;
downloadFolder(pg,lastPage,groupsize);

