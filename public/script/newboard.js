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
    $('div.btn-group>button').click(privacyChanged);
    $('button#createBoard').click(createBoard);
    var map = L.mapbox.map('map', 'coybit.gj1c3kom').setView([37.9, -77],4);

    var marker = L.marker(new L.LatLng(37.9, -77), {
        icon: L.mapbox.marker.icon({'marker-color': 'CC0033'}),
        draggable: true
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
    marker.on('drag',
        function(e){
            var latlng=marker.getLatLng();
            $('#lat')[0].value=(JSON.stringify( latlng.lat));
            $('#lng')[0].value=(JSON.stringify( latlng.lng));
        }
    );

    marker.addTo(map);
}