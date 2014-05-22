/**
 * Created by Bijan on 05/22/2014.
 */
function checkFlyerEmpty() {
    if ($('.portletStack>.portlet-container').length > 0)
        $('.bool-flyer-empty').hide();
    else
        $('.bool-flyer-empty').show();
}
