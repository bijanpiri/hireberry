/**
 * Created by Bijan on 4/8/14.
 */
var recentColors=[];

$.fn.ColorPicker=function(callback){
    var colors=[
        "#05283a","#04104b","#0d022d","#22002f","#300214","#4b0002","#461401","#462703","#432f03","#525004",
        "#3e4706","#1f330c","#0b597b","#062c9a","#200463","#4b0167","#640e30","#a50606","#9a2c05","#965405",
        "#946a06","#b7b108","#87990e","#3f681d","#1291cf","#0743fe","#3900a4","#8101ab","#a8184b","#fc2711",
        "#fb5308","#fd9a09","#fabd09","#ffff32","#d1ea2a","#65b233","#47ccfc","#6294fe","#712afd","#c532fe",
        "#e7578e","#fd746f","#fc9368","#feba62","#fdd162","#fdfb83","#e5f27d","#a2d87a","#ffffff","#ffffff",
        "#ffffff","#efefef","#d0d0d0","#b0b0b0","#959595","#6c6c6c","#464646","#313131","#1d1d1d","#000000"
    ];

    $(this).each(function(){
        var part=$('<ul>')
            .addClass('nav nav-pills no-margin')
            .append(
                '<li class="dropdown btn-group ">'+
                    '<a class="bool-btn dropdown-toggle bool-color-dropdown"'+
                        'data-toggle="dropdown" title="">'+
                        '<span class="bool-current-color"></span>'+
                    '</a>'+
                    '<ul class="dropdown-menu bool-color-list" >'+
                        '<li>' +
                            '<ul class="bool-color-recent" hidden="hidden">'+
                            '</ul>'+
                        '</li>'+
                    '</ul>'+
                '</li>');

        var cp=part.find('.bool-color-list');
        $(this).empty().append(part);
        part.find('.bool-btn').click(function(){
            var $parent=$(this).parent();

            // Calculate real offset (Top of Color Button minus Top of Sidebar menu)
            var a = $('.portletCreator').offset().top;
            var b = $parent.offset().top;
            var roffset = b - a;

            //var offset = $parent.css('position')==='static' ? $parent.offset().top :  0;
            var offset = $parent.css('position')==='static' ? roffset :  0;

            part.find('.bool-color-list').css('top',offset);

        });

        colors.forEach(function(c){
            $(cp).addClass('bool-color-picker')
                .append(
                    $('<li>')
                        .append(
                            $('<span>')
                                .addClass('bool-color-item')
                                .attr('command','color '+c)
                                .css('background',c))
                        .click(colorSelected)

                );

        });
        function colorSelected(){
            var c=$(this)
                .children('.bool-color-item')
                .css('background-color')
                .replace  (/\s/g,'');
            $(this)
                .closest('.dropdown')
                .find('.bool-current-color')
                .css('background-color',c);

            GAEvent('Editor','ColorPicker',c);

            $('.bool-color-recent>li>span[command="color '+c+'"]').parent().remove();
            $('.bool-color-recent')
                .show()
                .prepend(
                    $('<li>')
                        .append(
                            $('<span>')
                                .addClass('bool-color-item')
                                .css('background-color',c)
                                .attr('command','color '+c)
                        ).click(function(){
                            var c=$(this)
                                .children('.bool-color-item')
                                .css('background-color')
                                .replace  (/\s/g,'');
                            $(this)
                                .closest('.dropdown')
                                .find('.bool-current-color')
                                .css('background-color',c);
                            if(callback)
                                callback(c);
                        })
                );


            $('.bool-color-recent>li:nth-child(n+13)').remove();

            recentColors.push(c);

            if(recentColors.length>12)
                recentColors.splice(0,recentColors.length-12);

            if(callback)
                callback(c);
        }
    })
};
