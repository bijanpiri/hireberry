/**
 * Created by bijan on 12/18/13.
 */
$(document).ready(main);
function submit(){
    $("input#tag").tagsinput('items');
}
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
    $('#privacy').val($(this).text().toLowerCase());
}
var clickTimeout;
var clickDetected = true;
var map;
var x = document.getElementById("demo");
var markerlatlng;
var marker;
function initialize(){
    var map_property = {
        center: new google.maps.LatLng(51.508742,-0.120850),
        zoom: 5,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById('map-canvas'),map_property);
    marker = new MarkerManager(map);
    marker = new google.maps.Marker({
        position:new google.maps.LatLng(51.508742,-0.120850),
        map:map,
        draggable:true,
        title:"drag me!"
    });
    google.maps.event.addListener(marker,'dragend',function(e){
        var latlng = marker.getPosition();
        $('#lat').val(JSON.stringify( latlng.A));
        console.log($('#lat').val());
        $('#lng').val(JSON.stringify( latlng.k));
        console.log($('#lng').val());
    });
    google.maps.event.addListener(marker,'click',function(e){
        clickDetected = true;
        clickTimeout = window.setTimeout(function(){
           if(clickDetected)
                google.maps.LatLng(e.latLng);

        },400);
    });
    markerlatlng = marker.getPosition();
    try{
        $('#locate').click(function(){
            if (!navigator.geolocation) {
                locationError('Finding Location is not supported by your browser.');
            } else {
                navigator.geolocation.getCurrentPosition(showPosition);
            }
        });
        function showPosition(position){
                var mylocate= new google.maps.LatLng(position.coords.latitude,position.coords.longitude);

            marker.setPosition(mylocate);
            map.setCenter(mylocate);
            map.setZoom(14);
        }
        marker.setMap(map);
    }catch(e){
        console.log(e);
    }
}
$('button[type=submit]').click(function(){
    $('input.htags').val($('input.tags').val());
    var latlng = marker.getPosition();
    $('#lat').val(latlng.k);
    $('#lng').val(latlng.A);
});

function main(){

    fillCategory();

    $('div.btn-group>button').click(privacyChanged);
    $('button#createBoard').click(createBoard);
    //$('#locate').click( locate);
    google.maps.event.addDomListener(window, 'load', initialize);
    google.maps.event.addListener(map,'on',locationFound);
    google.maps.event.addListener(map,'on',locationError);
    //locate();
}

function locationError(msg) {
//    if(msg==null)
//        msg='Failed to find location. Allow your browser to access your location.';
    $('#msgLocationError>.msg').text(msg.message).parent().show();
}


function ErrorMsg(msg) {
    $('.message-error').show();
    $('.message-error>.msg-error').text(msg);
}

function locationFound(e) {
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(markerlatlng);
    map.fitBounds(bounds);
 //   marker.setLatLng(e.latlng);

    google.maps.LatLng(markerlatlng);

}