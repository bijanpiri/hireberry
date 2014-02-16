/**
 * Created by Dodo on 2/10/14.
 */

$.fn.googleMaps = function(){

    var map;

    /*function loadScript(){
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'http://maps.googleapis.com/maps/api/js?key=AIzaSyB9JJKEbOztuSVauWEU58UeQJWtuzip2eU&sensor=false'
            +'&callback=initialize'
        ;
        document.body.appendChild(script);
//
//        document.getElementsByTagName('head')[0].appendChild(script);
    }*/

    function initialize(){

        var map_property = {
            center: new google.maps.LatLng(51.508742,-0.120850),
            zoom: 5,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map-canvas'),map_property);

    }
    google.maps.event.addDomListener(window, 'load', initialize);
//    window.onload=loadScript;

    this.attr('id','map-canvas');
    return this;


}
