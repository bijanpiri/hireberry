/**
 * Created by bijan on 12/18/13.
 */
$(document).ready(main);

function fillCategory(){
    $.get('/board/categories',
        function(cats){
            var options=$('select.categories');
            $.each(cats,
                function(i,cat){
                    options.append(
                        $('<option>').append(
                            cat.name
                        )
                    );

                });
        });
}
function main(){

    fillCategory();
    var clickTimeout;
    var clickDetected = true;

    var map = L.mapbox.map('map', 'coybit.gj1c3kom',{
        doubleClickZoom: false
        })
        .setView([37.9, -77],4)
        .on('dblclick', function(e) {
            clickDetected = false;
            clearTimeout(clickTimeout);
            map.setView(e.latlng, map.getZoom() + 1);
        })
        .on('click', function(e) {
            clickDetected = true;
            clickTimeout = setTimeout(function(){
                if(clickDetected)
                    marker.setLatLng(e.latlng);
            },250);
        });

    var marker = L.marker(new L.LatLng(37.9, -77), {
        icon: L.mapbox.marker.icon({'marker-color': 'CC0033'}),
        draggable: true
    }).addTo(map);

    /*
    marker.bindPopup('Locate your board in map');
    marker.on('drag',
        function(e){
            var latlng=marker.getLatLng();
            $('#lat')[0].value=(JSON.stringify( latlng.lat));
            $('#lng')[0].value=(JSON.stringify( latlng.lng));
        }
    );
    */

}