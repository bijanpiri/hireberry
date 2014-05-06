/**
 * Created by Bijan on 05/06/2014.
 */
$(document).delegate('textarea[flexible]','input propertyChange keydown keyup change paste ',
function(){
    var div=$('<pre>').html(this.value).width($(this).width()).addClass(this.className).hide();
    $(this).parent().append(div);
    $(this).height(div.height()+10);
    div.remove();
//    var n=this.value.split(/\n/g).length;
//    this.rows=n;
});
