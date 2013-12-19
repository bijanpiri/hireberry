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
                        $('<option>').attr('name',cat.id).append(
                            cat.name
                        )
                    );

                });
        });
}
function createBoard(){
    $(this).button('loading');
}
function privacyChanged(){
    $('#privacy').val($(this).text());
}
function main(){

    fillCategory();
<<<<<<< HEAD
    $('div.btn-group>button').click(privacyChanged);
    $('button#createBoard').click(createBoard);
    var map = L.mapbox.map('map', 'coybit.gj1c3kom').setView([37.9, -77],4);
=======
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
>>>>>>> 7de29c72c4c227497fa5969ac4078d7aa2629c87

    var marker = L.marker(new L.LatLng(37.9, -77), {
        icon: L.mapbox.marker.icon({'marker-color': 'CC0033'}),
        draggable: true
<<<<<<< HEAD
    });
    map.doubleClickZoom.disable();

    map.on('click dblclick',
        function(e) {
            if(e.type=='click')
                marker.setLatLng(e.latlng);
            else
                map.setView(e.latlng, map.getZoom() + 1);

        });

//    marker.bindPopup('Locate your board in map');
=======
    }).addTo(map);

    /*
    marker.bindPopup('Locate your board in map');
>>>>>>> 7de29c72c4c227497fa5969ac4078d7aa2629c87
    marker.on('drag',
        function(e){
            var latlng=marker.getLatLng();
            $('#lat')[0].value=(JSON.stringify( latlng.lat));
            $('#lng')[0].value=(JSON.stringify( latlng.lng));
        }
    );
    */

}