function MapWidget(){
    Widget.call(this);

    var layout = 'MapWidget layout 1';
    var geocoder;
    var map;
    var mapID;
    var marker;
    var updateMapTimer;
    var editMode;
    var visitorMarker;

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
            draggable: editMode,
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
                var pos = new google.maps.LatLng(45,35);
                callback( pos );
            });
        } else {
            // Error: Your browser doesn\'t support geolocation.
            var pos = new google.maps.LatLng(45,35);
            callback( pos );
        }
    }

    function findPath() {
        if(navigator.geolocation) {

            navigator.geolocation.getCurrentPosition(function(position) {
                var visitorLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);

                visitorMarker = new google.maps.Marker({
                    position: visitorLocation,
                    //map: map,
                    title: 'You\'re Here!'
                });

                var request = {
                    origin: visitorMarker.position,
                    destination: marker.position,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                };

                var directionsService = new google.maps.DirectionsService();
                directionsDisplay = new google.maps.DirectionsRenderer()
                directionsDisplay.setMap(map);

                directionsService.route(request, function(response, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        directionsDisplay.setDirections(response);
                        var route = response.routes[0];

                        // For routes that contain no waypoints, the route will consist of a single "leg".
                        var distance = route.legs[0].distance.text;
                        var duration = route.legs[0].duration.text;

                        var moreInfo =
                            'Now you are ' + distance + ' far away.<br/>' +
                                'It takes about ' + duration + ' to get here.';

                        layout.find('.moreInfoAboutAddress').html( moreInfo );

                        marker.setMap(null)
                    }
                });

            }, function() {
                // Geolocation service failed.
            });
        }
        else {
            // Your browser doesn't support geolocation.
        }
    }

    function changeLayout() {
        var mapContainer = this.portlet.find('.map-right').parent();
        var adderessContainer = this.portlet.find('.address-left').parent();

        // Save
        var addressValue = this.portlet.find('.address-left').val();
        var center = map.getCenter();
        var zoom = map.getZoom();

        var m = mapContainer.html();
        var a = adderessContainer.html();

        // Load
        mapContainer.html(a);
        adderessContainer.html(m);
        map = new google.maps.Map( document.getElementById(mapID), {disableDefaultUI: true});
        this.portlet.find('.address-left').val(addressValue);
        map.setCenter( center );
        map.setZoom( zoom );
       if(marker)
           marker.setMap(map);
    }

    function initLayout() {
        layout = $('.widgets .mapWidget').clone();
        this.setToolbar('.toolbar-mapWidget')

        mapID = 'map-canvas' + Math.floor(100*Math.random());
        layout.find('#map-canvas').attr('id',mapID);
    }

    this.widgetDidAdd = function(isNew) {

        var widget = this;
        this.toolbar.find('#mapLayout-right').change( function() {
            changeLayout.call(widget)
        });
        this.toolbar.find('#mapLayout-left').change( function() {
            changeLayout.call(widget)
        });

        geocoder = new google.maps.Geocoder();

        var mapOptions = {
            zoom: 15,
            center: new google.maps.LatLng(-34.397, 150.644),
            disableDefaultUI: true
        }

        // Load Map
        map = new google.maps.Map( document.getElementById(mapID), mapOptions);
        editMode = this.editMode;

        // Set Events
        if( editMode ) {
            // Fill with default values; current user location
            if( isNew ) {
                getCurrentPosition(function(pos) {
                    getAddress(pos, function(address) {
                        map.setCenter(pos);
                        layout.find('#address').val(address);
                        setMarker(pos);
                    });
                });
            }

            layout.find('#Getcode').click(codeAddress);
            layout.find('#address').keydown(
                function(){
                    clearTimeout(updateMapTimer);
                    updateMapTimer = setTimeout(codeAddress,2000);
                })

        }
        else {
            layout.find('#address').attr('readonly',true);
        }

        findPath();
    }

    initLayout.call(this);
    this.setLayout(layout);

    this.serialize = function(){
        return {
            leftLayout: (this.toolbar.find('#mapLayout-left:checked').length==1),
            mapCenter : [map.getCenter().k,map.getCenter().A],
            mapZoom : map.getZoom(),
            markerPos : [marker.position.k,marker.position.A],
            address : layout.find('#address').val()
        };
    }

    this.deserialize = function(content){
        if( content ){

            if( content.leftLayout === 'false' ) {
                this.toolbar.find('#mapLayout-right').attr('checked','checked');
                changeLayout.call(this);
            }

            map.setCenter( new google.maps.LatLng( parseFloat(content.mapCenter[0]), parseFloat(content.mapCenter[1]) ) );

            map.setZoom( parseInt(content.mapZoom) );

            setMarker( new google.maps.LatLng( parseFloat(content.markerPos[0]), parseFloat(content.markerPos[1]) ) );

            layout.find('#address').val( content.address );
        }
    }
}
MapWidget.prototype=new Widget();
MapWidget.prototype.constructor=MapWidget;
