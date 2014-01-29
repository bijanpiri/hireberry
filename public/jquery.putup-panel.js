/**
 * Created by coybit on 1/28/14.
 */

$.fn.putupPanel = function() {
    var map;
    var host = this;
    var tagManager;
    var markers = [];
    var boards = [];
    var selectedBoards = [];
    var tag_board = {};
    var defaultSelectedBoard = [];

    var selectionSources = { Tag:0, Map:1 };

    function indexInSelectedBoard(boardIndex){
        for(var i=0; i<selectedBoards.length;i++)
            if( boardIndex == selectedBoards[i] )
                return i;
        return -1;
    }

    function SelectByMap(boardIndex){

        // Find its index in selectedBoards
        var idxInSelectedBoard = indexInSelectedBoard(boardIndex);

        if( idxInSelectedBoard==-1 ){ // Select

            // Add to selected boards list
            selectedBoards.push(boardIndex);

            // Add to tags list
            tag_board[ boards[boardIndex].name.hashCode() ] = boards[boardIndex]._id;
            tagManager.tagsManager("pushTag", boards[boardIndex].name,true);

            // Select map marker
            var marker = markers[ boardIndex ];
            marker.properties['marker-color'] = '#000';
            map.markerLayer.setGeoJSON(markers);
        }
        else {
            // Remove from selected boards list
            selectedBoards.splice(idxInSelectedBoard,1);

            // Remove tag from tags list
            var tags = tagManager.tagsManager('tags').slice(0);
            tagManager.tagsManager('empty');
            tags.splice(idxInSelectedBoard,1)
            tags.forEach(function(tag){
                tagManager.tagsManager('pushTag',tag,true);
            });

            // Deselect map marker
            var marker = markers[ boardIndex ];
            marker.properties['marker-color'] = '#522';
            map.markerLayer.setGeoJSON(markers);
        }
    }

    function RemovedFromTagsList(boardIndex){

        // Find its index in selectedBoards
        var idxInSelectedBoard = indexInSelectedBoard(boardIndex);

        if( idxInSelectedBoard!=-1 ){ // Select

            // Remove from selected boards list
            selectedBoards.splice(idxInSelectedBoard,1);

            // Deselect map marker
            var marker = markers[ boardIndex ];
            marker.properties['marker-color'] = '#522';
            map.markerLayer.setGeoJSON(markers);
        }
    }

    function AddedToTagsList(boardIndex){

        // Find its index in selectedBoards
        var idxInSelectedBoard = indexInSelectedBoard(boardIndex);

        if( idxInSelectedBoard==-1 ){ // Select

            // Add to selected boards list
            selectedBoards.push(boardIndex);

            // Select map marker
            var marker = markers[ boardIndex ];
            marker.properties['marker-color'] = '#000';
            map.markerLayer.setGeoJSON(markers);
        }
    }

    function loadData() {
        $.getJSON('/board/get/public',function(publicBoards){

            $.each(publicBoards, function(index,board){

                if( board.locationlng && board.locationlat){
                    boards.push(board);

                    markers.push({
                        type: 'Feature',
                        geometry:{
                            type:'Point',
                            coordinates:[board.locationlng,board.locationlat]
                        },
                        properties: {
                            title: board.name,
                            description: board.category,
                            'marker-size': 'large',
                            'marker-color': '522',
                            'boardIndex': index
                        }
                    })
                }
            });

            try{
                map.markerLayer.setGeoJSON(markers);
            }catch (e) {}

            // Add preset selected board to panel
            for( var i=0; i<defaultSelectedBoard.length; i++ ){

                var boardid = defaultSelectedBoard[i]._id;
                var boardName = defaultSelectedBoard[i].name;
                var boardIndex = boardid2boardIndex( boardid );

                // Select On Map
                selectedBoards.push(boardIndex);

                // Select map marker
                var marker = markers[ boardIndex ];
                marker.properties['marker-color'] = '#000';
                map.markerLayer.setGeoJSON(markers);

                tag_board[boardName.hashCode()] = boardid;
                tagManager.tagsManager('pushTag',boardName);
            }
        });
    }

    function initMap() {

        $('<div>').attr('id','putupMap')
            .width( host.width() )
            .height( host.height() - 30 )
            .appendTo(host);

        map = L.mapbox.map('putupMap', 'coybit.gj1c3kom')
            .setView([37.9, -77], 6);

        map.markerLayer.on('click',function(e) {
            var boardIndex = e.layer.feature.properties.boardIndex;
            SelectByMap(boardIndex,selectionSources.Map);
        });


    }

    function boardid2boardIndex(boardid){

        for(var i=0; i<boards.length;i++)
            if( boardid==boards[i]._id )
                return i;
        return -1;
    }

    function initTagsInput() {

        $('<input>').attr('type','text').attr('id','boardNamesList').addClass('tm-input').appendTo(host);
        tagManager = jQuery("#boardNamesList").tagsManager({
            deleteTagsOnBackspace: true,
            backspace:[]
        })
            .on('tm:pushed',function(e,t){
                // Clear input
                jQuery("#boardNamesList").val('');

                var boardid = tag_board[t.hashCode()];
                AddedToTagsList( boardid2boardIndex(boardid) );
            })
            .on('tm:spliced',function(e,t){
                var boardid = tag_board[t.hashCode()];
                RemovedFromTagsList( boardid2boardIndex(boardid) );
            });

        jQuery("#boardNamesList").typeahead({
            name: 'boards',
            limit: 15,
            valueKey: 'display',
            remote: '/search/boards/name?q=%QUERY'
        }).on('typeahead:selected', function (e, d) {
                var boardID = d.link.substr(d.link.lastIndexOf('/')+1);
                tag_board[d.display.hashCode()] = boardID;
                tagManager.push(d.display);
            });

        // A CSS confilict between Typeahead and TagsManager is solved by this code
        jQuery("#boardNamesList").parent().find('.tt-hint')
            .css('background','none')
            .css('display','none');
    }

    function init(){

        String.prototype.hashCode = function(){
            var hash = 0, i, char;
            if (this.length == 0) return hash;
            for (var i = 0, l = this.length; i < l; i++) {
                char  = this.charCodeAt(i);
                hash  = ((hash<<5)-hash)+char;
                hash |= 0; // Convert to 32bit integer
            }
            return hash.toString();
        };

        initTagsInput();
        initMap();
        loadData();
    }

    init();

    this.getSelectedBoards = function() {
        return selectedBoards.map(function(selectedBoard){
            return boards[selectedBoard]
        });
    }

    this.setSelectedBoards = function(boards) {
        defaultSelectedBoard = boards.splice(0)
    }

    this.getDefaultSelectedBoards = function() { return defaultSelectedBoard; }

    return this;
};