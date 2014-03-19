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
// This function return host video. if host video be invalid return empty string
//********************************************************************************
function GetHostVideo (url)
{
    var urlInfo=new URLInfo();
    var pars=new parseUri(url);
    if( pars["host"].toLowerCase()=='vimeo.com' || pars["host"].toLowerCase()=='www.vimeo.com')
    {
        return 'vimeo';
    }
    else if( pars["host"].toLowerCase()=='youtube.com' || pars["host"].toLowerCase()=='www.youtube.com')
    {
        return 'youtube';
    }
    else if( pars["host"].toLowerCase()=='youtu.be' || pars["host"].toLowerCase()=='youtu.be')
    {
        return 'youtube';
    }
    else
    {
        return '';
    }
}

//********************************************************************************
// This function checks whether input url is a 'www.vimeo.com/[VideoId]' or 'www.youtube.com' url. If is extract video id.
// Note : This Function don't suppot vimeo urls with 'www.vimeo.com/..../...' format.
//********************************************************************************
function GetYoutubeVideoID (url)
{
    var urlInfo=new URLInfo();
    var pars=new parseUri(url);
    if( pars["host"].toLowerCase()=='vimeo.com' || pars["host"].toLowerCase()=='www.vimeo.com')
    {
        //http://vimeo.com/[videoID]
        //urlInfo.videoID= url.split('/').pop();
        $.get('http://vimeo.com/api/oembed.json?url=http%3A//'+url).done(function(response)
        {
            var parse_response= eval(response);
            urlInfo.videoID= parse_response['video_id'];
        });
        urlInfo.host= 'vimeo';
        urlInfo.IsValid=true;
        return urlInfo;

    }
    else if( pars["host"].toLowerCase()=='youtube.com' || pars["host"].toLowerCase()=='www.youtube.com')
    {
        //query :  ....&v=[videoID]&.....
        //https://www.youtube.com/watch?[query]
        var queries=pars["query"].split('&');
        for(var i=0;i< queries.length;i++)
        {
            var q= queries[i].split('=');
            if(q[0].toLocaleLowerCase()=="v")
            {
                urlInfo.videoID=q[1];
                break;
            }
        }
        urlInfo.host= 'youtube';
        urlInfo.IsValid= true;
        return urlInfo;
    }
    else if(  pars["host"].toLowerCase()=='youtu.be' || pars["host"].toLowerCase()=='www.youtu.be' )
    {
        // http://youtu.be/[videoID]

        urlInfo.videoID= url.split('/').pop();
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
            //container.height(480);
            //container.width(640);
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
    //container.height(360);
    //container.width(480);
    container.attr("src",thumbnail_src);
}
//********************************************************************************
//
//********************************************************************************
function ShowThumbnail(container,url,size)
{
    var urlInfo=new URLInfo();
    var pars=new parseUri(url);
    if( pars["host"].toLowerCase()=='vimeo.com' || pars["host"].toLowerCase()=='www.vimeo.com')
    {
        //http://vimeo.com/[videoID]
        //urlInfo.videoID= url.split('/').pop();
        $.get('http://vimeo.com/api/oembed.json?url=http%3A//'+url).done(function(response)
        {
            var parse_response= eval(response);
            urlInfo.videoID= parse_response['video_id'];

            urlInfo.host= 'vimeo';
            urlInfo.IsValid=true;
            showVimeoThumbnail(container,  urlInfo.videoID,2);
            return urlInfo;
        });

    }
    else if( pars["host"].toLowerCase()=='youtube.com' || pars["host"].toLowerCase()=='www.youtube.com')
    {
        //query :  ....&v=[videoID]&.....
        //https://www.youtube.com/watch?[query]
        var queries=pars["query"].split('&');
        for(var i=0;i< queries.length;i++)
        {
            var q= queries[i].split('=');
            if(q[0].toLocaleLowerCase()=="v")
            {
                urlInfo.videoID=q[1];
                break;
            }
        }
        urlInfo.host= 'youtube';
        urlInfo.IsValid= true;
        showYoutubeThumbnail(container,  urlInfo.videoID,0);
        return urlInfo;
    }
    else if(  pars["host"].toLowerCase()=='youtu.be' || pars["host"].toLowerCase()=='www.youtu.be' )
    {
        // http://youtu.be/[videoID]
        urlInfo.videoID= url.split('/').pop();
        urlInfo.host= 'youtube';
        urlInfo.IsValid= true;
        showYoutubeThumbnail(container,  urlInfo.videoID,0);
        return urlInfo;
    }
    else
    {
        urlInfo.host= '';
        urlInfo.videoID=-1;
        urlInfo.IsValid=false;
        alert("The URL : '"+url+"' is not valid.");
        return urlInfo;
    }
}
/*
 function ShowThumbnail1(container,url,size)
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
 return urlInfo;
 }*/