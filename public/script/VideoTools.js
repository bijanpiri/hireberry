/**
 * Created by HoPe on 3/17/14.
 */

//********************************************************************************
//Get information of url
//********************************************************************************
function parseUri (str) {
    var	o   = parseUri.options,
        m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
        uri = {},
        i   = 14;

    while (i--) uri[o.key[i]] = m[i] || "";

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
    });

    return uri;
};

parseUri.options = {
    strictMode: false,
    key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
    q:   {
        name:   "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};

//********************************************************************************
//This object include required information for
//********************************************************************************
var URLInfo=function(){};
URLInfo.prototype={};
URLInfo.host=undefined;
URLInfo.IsValid=undefined;
URLInfo.videoID=undefined;

//********************************************************************************
// This function checks whether input url is a 'www.vimeo.com' or 'www.youtube.com' url. If is extract video id.
//********************************************************************************
function GetVideoID (url)
{
    var urlInfo=new URLInfo();
    var pars=new parseUri(url);
    if( pars["host"].toLowerCase()=='vimeo.com' || pars["host"].toLowerCase()=='www.vimeo.com')
    {
        //http://vimeo.com/[videoID]
        urlInfo.videoID= url.split('/').pop();
        urlInfo.host= 'vimeo';
        urlInfo.IsValid=true;
        return urlInfo;
    }
    else if( pars["host"].toLowerCase()=='youtube.com' || pars["host"].toLowerCase()=='www.youtube.com')
    {
        //query :  v=[videoID]
        //https://www.youtube.com/watch?v=[query]

        urlInfo.videoID=pars["query"].slice(2);
        urlInfo.host= 'youtube';
        urlInfo.IsValid= true;
        return urlInfo;
    }
    else
    {
        urlInfo.host= '';
        urlInfo.videoID=-1;
        urlInfo.IsValid=false;
        return urlInfo;
    }


}
//********************************************************************************
//Show thumbnail of video of www.viemo.com
// container = The 'img' element that display thumbnail image
// videoId = The Id of video
// size = indicate size of video ( 0=small,1=medium,2=large).
// For incorrect inputs,the size of thumbnail set to 1;.
//********************************************************************************
function showVimeoThumbnail(container,videoId,size)
{
    //$('#urlid').text('Video URL :'+'http://vimeo.com/api/v2/video/' + videoId + '.json');
    $.ajax({
        type:'GET',
        url: 'http://vimeo.com/api/v2/video/' + videoId + '.json',
        jsonp: 'callback',
        dataType: 'jsonp',
        success: function(data){
            if(size==0)
                var thumbnail_src = data[0].thumbnail_small;
            else if(size==2)
                var thumbnail_src = data[0].thumbnail_large;
            else
                var thumbnail_src = data[0].thumbnail_medium;

            //$('#thumb_wrapper').append('<img src="' + thumbnail_src + '"/>');
            container.attr("src",thumbnail_src);
        }
    });
}

//********************************************************************************
//Show thumbnail of video of www.youtube.com
// container = The 'img' element that display thumbnail image
// videoId = The Id of video
// size = indicate size of video ( 0=large, 1,2,3=different small +thumbnail).
// For incorrect inputs,the size of thumbnail set to 0;.
//********************************************************************************
function showYoutubeThumbnail(container,videoId,size)
{
    if(!(size==0 || size==1 || size==2 || size==3))
        size=0;
    var  thumbnail_src='http://img.youtube.com/vi/' + videoId +'/' +size + '.jpg';

    container.attr("src",thumbnail_src);

}
//********************************************************************************
//
//********************************************************************************
function ShowThumbnail(container,url,size)
{

    var  urlInfo=GetVideoID (url);
    if(urlInfo.IsValid==true)
    {
        if( urlInfo.host=='vimeo')
        {
            showVimeoThumbnail(container,  urlInfo.videoID,2);
        }
        else if( urlInfo.host=='youtube')
        {
            showYoutubeThumbnail(container,  urlInfo.videoID,0);
        }
    }
    else
    {
        alert("The URL : '"+url+"' is not valid.");
    }
}