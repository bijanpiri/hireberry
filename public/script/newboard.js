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
var clickTimeout;
var clickDetected = true;
var map;
function locate(){
    if (!navigator.geolocation) {
        locationError('Finding Location is not supported by your browser.');
    } else {

        map.locate();

    }

}
var marker;
function main(){

    fillCategory();

    $('div.btn-group>button').click(privacyChanged);
    $('button#createBoard').click(createBoard);
    $('#locate').click( locate);
    map = L.mapbox.map('map', 'coybit.gj1c3kom',{
        doubleClickZoom: false
        })
        .setView([37.9, -77],4)
        .on('dblclick', function(e) {
            clickDetected = false;
            clearTimeout(clickTimeout);
            map.setView(e.latlng, map.getZoom() + 1);
            e.preventDefault();
            e.stopPropagation();
        })
        .on('click', function(e) {

            clickDetected = true;
            clickTimeout = setTimeout(function(){
                if(clickDetected)
                    marker.setLatLng(e.latlng);
            },400);
        });

    marker = L.marker(new L.LatLng(37.9, -77), {
        icon: L.mapbox.marker.icon({'marker-color': 'CC0033'}),
        draggable: true

    })
        .bindPopup('Locate your board in map')
        .on('drag',
        function(e){
            var latlng=marker.getLatLng();
            $('#lat')[0].value=(JSON.stringify( latlng.lat));
            $('#lng')[0].value=(JSON.stringify( latlng.lng));
        }
    ).addTo(map);

    locate();
    map.on('locationfound', locationFound);

    map.on('locationerror', locationError);
}
//function messageClass(klass){
//    var msg=$('#message');
//    msg.removeClass('alert-info');
//    msg.removeClass('alert-success');
//    msg.removeClass('alert-error');
//    msg.addClass(klass);
//}
function locationError(msg) {
//    if(msg==null)
//        msg='Failed to find location. Allow your browser to access your location.';
    $('#msgLocationError>.msg').text(msg.message).show();
}

function ErrorMsg(msg) {
    $('.message-error').show();
    $('.message-error>.msg-error').text(msg);
}

function locationFound(e) {
    map.fitBounds(e.bounds);
    marker.setLatLng(e.latlng);


}