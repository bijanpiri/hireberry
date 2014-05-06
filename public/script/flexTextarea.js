/**
 * Created by Bijan on 05/06/2014.
 */
$(document).delegate('textarea[flexible]','input keydown keyup change paste',
function(){
    var n=this.value.split(/\n/g).length;
    this.rows=n;
});
