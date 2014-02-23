/**
 * Created by Dodo on 2/10/14.
 */

$.fn.googleMaps = function(){

    var map;
    var mycenter;
    var boards = [];
    var markers;
    function initialize(){


        var map_property = {
            center: new google.maps.LatLng(51.508742,-0.120850),
            zoom: 5,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
    map = new google.maps.Map(document.getElementById('map-canvas'),map_property);
    //addMarker();

    }

    function addMarker(){
        mycenter = new google.maps.LatLng(51.508742,-0.120850);
        var marker = new google.maps.Marker({
            position: mycenter
        });
   // marker.setMap(map);
    }
    function getLocation(){
        markers = new MarkerManager(map);
        $.getJSON('/board/get/public',function(publicBoards){
            $.each(publicBoards,function(index,board){
              if(board.locationlat && board.locationlng){
                  boards.push(board);
                  markers = new google.maps.Marker({
                      type:'Feature',
                      position: new google.maps.LatLng(board.locationlng,board.locationlat),
                      map: map,
                      'result':[{"address_components":[{
                          'title':board.name,
                          'boardIndex':index,
                          'description':board.category,
                          'icon':{
                              'size':new google.maps.Size(32,32),
                              'color':'522'
                          }

                          }]
                      }]

                  });
                  markers.addMarker(marker,0);
              }
            });
            markers.refresh();
           // $('#map-canvas').gmap('addBounds',marker.position)
            // continu json
            try{
                markers.setMap(map);
            }catch (e){}

        });

    }


    google.maps.event.addDomListener(window, 'load', initialize);
    getLocation();
    this.attr('id','map-canvas');
    return this;


}
