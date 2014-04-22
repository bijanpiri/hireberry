/**
 * Created by Bijan on 4/8/14.
 */
var recentColors=[];
$.fn.ColorPicker=function(){
    var colors=[
        "#05283a","#04104b","#0d022d","#22002f","#300214","#4b0002","#461401","#462703","#432f03","#525004",
        "#3e4706","#1f330c","#0b597b","#062c9a","#200463","#4b0167","#640e30","#a50606","#9a2c05","#965405",
        "#946a06","#b7b108","#87990e","#3f681d","#1291cf","#0743fe","#3900a4","#8101ab","#a8184b","#fc2711",
        "#fb5308","#fd9a09","#fabd09","#ffff32","#d1ea2a","#65b233","#47ccfc","#6294fe","#712afd","#c532fe",
        "#e7578e","#fd746f","#fc9368","#feba62","#fdd162","#fdfb83","#e5f27d","#a2d87a","#ffffff","#ffffff",
        "#ffffff","#efefef","#d0d0d0","#b0b0b0","#959595","#6c6c6c","#464646","#313131","#1d1d1d","#000000"
    ];
    var cp=this;
    colors.forEach(function(c){
        $(cp).addClass('bool-color-picker')
            .append(
                $('<li>')
                    .append(
                        $('<span>')
                            .addClass('bool-color-item')
                            .attr('command','color '+c)
                            .css('background',c))
                    .click(function(){

                        var c=$(this).children('.bool-color-item').css('background-color').replace(/\s/g,'');
                        $(this).closest('.dropdown').find('.bool-current-color').css('background-color',c);
                        if(recentColors.indexOf(c)<0)
                            $(document)
                                .find('.bool-color-picker-recent')
                                .prepend(
                                    $('<li>')
                                        .append(
                                            $('<span>')
                                                .addClass('bool-color-item')
                                                .css('background-color',c)
                                                .attr('command','color '+c)
                                        )
                                );
                        recentColors.push(c);

                    })
            )
    })
}
