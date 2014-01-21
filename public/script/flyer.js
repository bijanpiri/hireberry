/**
 * Created by Bijan on 1/16/14.
 */
//console.log('hello');
$(document).delegate('div.flyer','click',function(){
    $('div.flyer').append(
        '<div class="draggable widget ui-widget-content">' +
            '<div class="bar"></div>' +
            '<textarea class="text">hello</textarea></div>');
    $('.widget')
        .draggable({axis:'y',containment:'parent'})
        .resizable({
            minHeight:50,
            containment:'parent',
            handles:'n,s'});

});