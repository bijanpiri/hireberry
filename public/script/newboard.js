/**
 * Created by bijan on 12/18/13.
 */

var map = L.mapbox.map('map', 'coybit.gj1c3kom').setView([37.9, -77],4);

var marker = L.marker(new L.LatLng(37.9, -77), {
    icon: L.mapbox.marker.icon({'marker-color': 'CC0033'}),
    draggable: true
});

map.on('click',
    function(e) {
        //window[e.type].innerHTML = e.containerPoint.toString() + ', ' + e.latlng.toString();
        marker.setLatLng(e.latlng);
    });
marker.bindPopup('Locate your board in map');
marker.on('drag',
    function(e){
        var latlng=marker.getLatLng();
        $('#lat')[0].value=(JSON.stringify( latlng.lat));
        $('#lng')[0].value=(JSON.stringify( latlng.lng));
    }
);

marker.addTo(map);
