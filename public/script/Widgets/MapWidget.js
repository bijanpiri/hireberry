function MapWidget(){
    Widget.call(this);

    var layout = 'MapWidget layout 1';
    var geocoder;
    var map;
    var mapID;
    var marker;
    var updateMapTimer;

    function codeAddress() {
        var address = document.getElementById('address').value;
        geocoder.geocode( { 'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {

                map.setCenter(results[0].geometry.location);

                setMarker(results[0].geometry.location);

            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    function setMarker(pos) {
        var image = {
            url: '/images/flyer-icons.png',
            size: new google.maps.Size(52, 53),
            origin: new google.maps.Point(0,700),//(0,-564),
            anchor: new google.maps.Point(52/2, 32)
        };

        if(marker)
            marker.setMap(null);

        marker = new google.maps.Marker({
            map: map,
            //icon: image,
            position: pos,
            draggable: this.editMode,
            title: "Drag me!"
        });
    }

    // Convert Lat/Lng to address
    function getAddress(position, callback) {

        geocoder.geocode({'latLng': position}, function(results, status) {

            if(status == google.maps.GeocoderStatus.OK)
                callback(results[0]['formatted_address']);

        });
    }

    function getCurrentPosition(callback) {
        if(navigator.geolocation) {

            navigator.geolocation.getCurrentPosition(function(position) {

                // Get Current Position
                var pos = new google.maps.LatLng(position.coords.latitude,
                    position.coords.longitude);

                callback(pos);

            }, function() {
                // Error: The Geolocation service failed.
            });
        } else {
            // Error: Your browser doesn\'t support geolocation.
        }
    }

    function initLayout() {
        layout = $('.widgets .mapWidget').clone();

        mapID = 'map-canvas' + Math.floor(100*Math.random());
        layout.find('#map-canvas').attr('id',mapID);
    }

    this.widgetDidAdd = function(isNew) {
        geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(-34.397, 150.644);
        var mapOptions = {
            zoom: 15,
            center: latlng
        }

        // Load Map
        map = new google.maps.Map( document.getElementById(mapID), mapOptions);

        // Set Events
        if( this.editMode ) {
            // Fill with default values; current user location
            if( isNew ) {
                getCurrentPosition( function(pos) {
                    getAddress(pos, function(address) {
                        map.setCenter(pos);
                        layout.find('#address').val(address);
                        setMarker(pos);
                    });
                });
            }

            layout.find('#Getcode').click(codeAddress);
            layout.find('#address').keydown(
                function(){clearTimeout(updateMapTimer);
                    updateMapTimer = setTimeout(codeAddress,2000);
                })

        }
        else {
            layout.find('#address').attr('readonly',true);
        }
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.serialize = function(){
        return {
            mapCenter : [map.getCenter().k,map.getCenter().A],
            mapZoom : map.getZoom(),
            markerPos : [marker.position.k,marker.position.A],
            address : layout.find('#address').val()
        };
    }

    this.deserialize = function(content){
        if( content ){

            map.setCenter( new google.maps.LatLng(content.mapCenter[0], content.mapCenter[1]) );

            map.setZoom( parseInt(content.mapZoom) );

            setMarker( new google.maps.LatLng(content.markerPos[0], content.markerPos[1]) );

            layout.find('#address').val( content.address );
        }
    }

    this.enterToShotMode = function(completedCallback) {

        var img = this.portlet.find('#map-image');

        var staticImgURL = 'http://maps.googleapis.com/maps/api/staticmap?'+
            'center='+ map.getCenter().d + ',' + map.getCenter().e +
            '&zoom='+ map.getZoom() +
            '&markers=color:red%7C' + marker.position.d + ',' + marker.position.e +
            '&size=320x170&maptype=roadmap&sensor=false'

        //img.show().attr('src','');

        img.load( completedCallback || function(){} );

        img.show().attr('src', staticImgURL)

        // ToDo: Wait to image load completely

        //if( completedCallback )
        //   completedCallback()
    }

    this.exitFromShotMode = function() {
        var img = this.portlet.find('#map-image');
        img.hide();
    }
}
MapWidget.prototype=new Widget();
MapWidget.prototype.constructor=MapWidget;
