;(function(global, document, $, undefined){

  "use strict";

  var mapOptions = {
    center: new google.maps.LatLng(0, 0),
    zoom: 3,
    scrollwheel: false,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
  var infowindow = new google.maps.InfoWindow();


  $.getJSON('geo.json', function(tweets){
    tweets = tweets.data;

    $.each(tweets, function(index, tweet){
      var myLatlng = new google.maps.LatLng(tweet.geo.coordinates[0], tweet.geo.coordinates[1]);

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: tweet.text
      });

      google.maps.event.addListener(marker, 'click', function() {

        infowindow.close();
        infowindow.setContent("<img src='"+tweet.user.profile_image_url+"' style='width: 50px; height: 50px; min-width: 0;float:left; padding: 5px;' /><br><strong>"+tweet.user.screen_name+"</strong>: "+tweet.text);

        infowindow.open(map,marker);
      });

    });
  });

  hhba.socket.on('geo', function(tweet){
      var myLatlng = new google.maps.LatLng(tweet.geo.coordinates[0], tweet.geo.coordinates[1]);

      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: tweet.text
      });

      google.maps.event.addListener(marker, 'click', function() {

        infowindow.close();
        infowindow.setContent("<img src='"+tweet.user.profile_image_url+"' style='width: 50px; height: 50px; min-width: 0;float:left; padding: 5px;' /><br><strong>"+tweet.user.screen_name+"</strong>: "+tweet.text);

        infowindow.open(map,marker);
      });
  });

})(window, document, jQuery);
