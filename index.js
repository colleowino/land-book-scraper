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

function extractPages(pgNum){
	if(startPage <= lastPage){
		console.log("\n -- getting a page -- ");

		getPage(startPage).then(function(next){
			console.log("next should be: "+next);
			cyclone(next);
		}, function(reject){
			console.log('rejected: '+reject);
		}).catch(function(err){
			console.log("something went wrong");
			console.log(err);
		});
	} 
	else{
		console.log("that's all folks");
		return 'done';
	}

}

function loadScreenshot(filename,url){
	return new Promise(function(resolve, reject){
		var pipe = request(url).pipe(fs.createWriteStream(filename));

		pipe.on("finish",function(){
			console.log("downloaded: "+filename);
			resolve("success");
		});

		pipe.on("error",function(err){
			reject(err);
		});

	});
}


function downloadFolder(pg,groupsize){

var pgPromises = getPgPromises(pg,groupsize);
var downloadDir = path.join('downloads',pg.toString());

$q.all(pgPromises).then(function(scrapedPages){
	return scrapedPages;
}).then(function(scrapedPages){
		console.log("fulfilled");

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
					imgRequests.push(loadScreenshot(filename,imgUrl));
				}

			}
		}

		$q.all(imgRequests).then(function(downloaded){
			return downloaded;
		}).then(function(){
				console.log("folder downloaded: "+pg);
				return "yellow";
		}).catch(function(error){
			console.log("->boom! "+error);
		});

}, function(reason){
		console.log("rejected");
}).catch(function(error){
		console.log("boom! "+error);
});

}

// getPage
// getPagePromises
// scrapePages, getImageUrls
var pg = 2;
var groupsize = 100;
var color = downloadFolder(pg,groupsize);

