
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , redis = require('redis')
  , tuiter = require('tuiter')(require('./keys.json'))
  , sio = require('socket.io');

var client = redis.createClient();
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.sendfile(__dirname + '/views/index.html');
});

app.get('/viz',function(res,res){
  res.sendfile(__dirname + 'views/viz.html');
});

app.get('/tweets_per_hour.json', function(req, res){
  var count = [];

  client.hgetall('8n:hours', function(err, data){
    if(err) res.send(500);
    else {
      for(var i in data) {
        count[parseInt(i)] = parseInt(data[i]);
      }

      res.json({data: count});
    }
  });
});

app.get('/relevant.json', function(req, res){
  client.get('8n:relevant', function(err, data){
    res.json({data: JSON.parse(data)});
  });
});

app.get('/photos.json', function(req, res){
  client.lrange('8n:photos', -12, -1, function(err, data){
    if(err) res.send(500);
    else {
      for(var i = 0; i < data.length; i++)
        data[i] = JSON.parse(data[i]);
      res.json({data: data});
    }
  });
});

app.get('/geo.json', function(req, res){
  client.smembers('8n:geo', function(err, data){
    for(var i = 0; i < data.length; i++)
      data[i] = JSON.parse(data[i]);
    res.json({data: data});
  });
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = sio.listen(server);
io.enable('browser client minification');  // send minified client
io.enable('browser client etag');          // apply etag caching logic based on version number
io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging
io.set('transports', [                     // enable all transports (optional if you want flashsocket)
    'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);


var relevant = null;
var last = Date.now();
var lasta = Date.now();

tuiter.filter({track: ['#ExplosionRosario', '#ExplosionEnRosario','#FuerzaRosario']}, function(res){

  res.on('error', function(err){console.log(err);})

  res.on('tweet', function(data){
    
    client.hincrby('8n:hours', (((new Date).getHours() + 2 )% 24 ) + "", 1);

    var tweet = {text: data.text, created_at: data.created_at, user: {id: data.user.id, screen_name: data.user.screen_name, profile_image_url: data.user.profile_image_url}, geo: data.geo, entities: data.entities, id: data.id};

    if(data.user.followers_count > 5000 || data.retweet_count > 5 && data.id_str != relevant && (Date.now() - last) > 3000) {
      relevant = data.id_str;
      last = Date.now();
      client.set('8n:relevant', JSON.stringify(tweet));
      io.sockets.emit('relevant', tweet);
    }

    if(tweet.geo) {
      io.sockets.emit('geo', tweet);
      client.sadd('8n:geo', JSON.stringify(tweet));
    }  

    if(tweet.entities.media && tweet.entities.media.length && (Date.now() - lasta) > 2000 ) {
	lasta = Date.now();
      io.sockets.emit('photo', tweet);
      client.rpush('8n:photos', JSON.stringify(tweet));  
    }
    
  });

});
