;(function(global, document, $, undefined){

    "use strict";

    var App = global.hhba = global.hhba || {},
        $win = $(global),
        $doc = $(document),
        $body = $('body');

    App.socket = io.connect('http://hhba.info:3003');
    

    App.widgets = {
        _container: null,
        _list: {},
        _count: 0,
        /**
         * Object containing
         * key => widget type
         * value => function to render the widget, returns jQuery or DOM elements
         */
        parsers: {},
        
        /** Create the widget, append it to container and store its reference */
        add: function(obj) {
            var key = 'widget-' + (this._count++);
            this._list[key] = this.parse(obj);
            this._container.append(this._list[key]);
            return key;
        },

        /* TODO */
        remove: function() {

        },

        /**
         * @param key Unique ID for the widget
         */
        get: function(key) {
            return this._list[key] || false;
        },

        /**
         * @param obj Contains information (array/object) and type (string) keys.
         * @return jQuery div.widget
         */
        parse: function(obj) {
            var widget = $('<div class="widget"></div>');
            if (typeof this.parsers[obj.type] === 'function') {
                widget.append(this.parsers[obj.type](obj.information));
            } else {
            }
            return widget;
        },
        /**
         * Callback after Google Viz API loaded
         */ 
        run: function() {
            // run the magic!
            $doc.trigger('GOOGLE_API_LOADED');
        }
    };

    App.init = function () {
        // something
        App.widgets._container = $('.widgets-container');

        var $feat = $('.relevant');

        $.getJSON('relevant.json', function(data){
          var tweet = data.data;
          $feat.append('<div class="tweet"><img src="'+tweet.user.profile_image_url+'"><h4> @'+tweet.user.screen_name+': </strong> <span>'+tweet.text+'</span> </div>');
        }); 

        hhba.socket.on('relevant', function(tweet){
          $feat.find('.tweet').remove();
          $feat.append('<div class="tweet"><img src="'+tweet.user.profile_image_url+'"><h4> @'+tweet.user.screen_name+': </strong> <span>'+tweet.text+'</span> </div>');
        });
    };

    // before document ready
    google.load('visualization', '1', {packages: ['corechart']});
    google.setOnLoadCallback(App.widgets.run);

    // onDocumentReady
    $(App.init);

})(window, document, jQuery);
