/**
 * Created by coybit on 3/8/14.
 */

var puserInfo = {};

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function fillProfiles() {

    puserInfo.name = this.find('[name=name]').val();
    puserInfo.email = this.find('[name=email]').val();
    puserInfo.pUsername = this.find('[name=email]').val().split('@')[0];
    puserInfo.datasourceCount = 6;
    puserInfo.filledDatasourceCount = 0;

    if( puserInfo.name.length > 0 || validateEmail(puserInfo.email) ) {
        this.find('.profileAddress input').val('').css('border-bottom','2px solid black');

        findGravatar(this, puserInfo.email );
        findGithubProfile(this, puserInfo.name, puserInfo.pUsername );
        findDribbbleProfile(this, puserInfo.pUsername, puserInfo.pUsername );
        findTwitterProfile(this, puserInfo.name, puserInfo.pUsername );
        findStackoverflowProfile(this, puserInfo.name, puserInfo.pUsername );
        findLinkedinProfile(this, puserInfo.name)
        findBehanceProfile(this, puserInfo.pUsername, puserInfo.pUsername );
    }
}

function dataIsReceived(datasourceName, data) {
    puserInfo.filledDatasourceCount++;
    puserInfo[datasourceName] = data;

    console.log( puserInfo.filledDatasourceCount );

    // All the data are received. Start processins
    if( puserInfo.filledDatasourceCount == puserInfo.datasourceCount ) {

    }
}

function fillProfileAddress( el, value, isFound ) {
    if(isFound)
        el.val(value).css('border-bottom','2px solid green');
    else
        el.val(value).css('border-bottom','2px solid orange');
}

function findGravatar(profile,q) {

    var md5 = CryptoJS.MD5(q.trim().toLowerCase() )
    var url = "http://www.gravatar.com/avatar/" + md5;

    var scaleElement = function( el, start, end, complete ) {

        // A trick to start scaling
        el.animate( {scale:start},0);

        el.animate( {scale:end}, {
            step: function(now,fx) {
                var scaleFunction = "scale(" + now + "," + now + ")";
                $(this).css('-webkit-transform', scaleFunction);
                $(this).css('-moz-transform', scaleFunction);
                $(this).css('-o-transform', scaleFunction);
                $(this).css('-ms-transform', scaleFunction);
                $(this).css('transform', scaleFunction);
            },
            duration:300,
            complete: complete
        },'linear');
    }

    var showImage = function(url) {
        profile.find('.bool-avatar-image')
            .attr('src',url)
            .css('display','block')
            .on('load', function(){
                var colorThief = new ColorThief();
                var colors = colorThief.getPalette( profile.find('.bool-avatar-image')[0] , 3, 5 )
                var rgb1 = 'rgb('+colors[0][0]+','+colors[0][1]+','+colors[0][2]+')';
                var rgb2 = 'rgb('+colors[1][0]+','+colors[1][1]+','+colors[1][2]+')';
                var rgb3 = 'rgb('+colors[2][0]+','+colors[2][1]+','+colors[2][2]+')';

                profile.find('.bool-avatar-container').css('border-color', rgb1)
            }).show();

        profile.find('.bool-avatar-image-url').val(url);
        profile.find('.bool-avatar-no-container').hide();

        scaleElement( profile.find('.profilePic'), 0, 1.2, function() {
            scaleElement( profile.find('.profilePic'), 1.2, 1);
        } );
    }

    $.get('/gravatar/' + q )
        .done( function(res) {
            showImage(res.url);
        })
}

function findGithubProfile(profile,q,p) {

    $.get('https://api.github.com/search/users?q=' + q )
        .done( function(res){

            if( res.items.length > 0 ){
                fillProfileAddress( profile.find('input[name=ghprofile]'), res.items[0].login, true);
            }
            else {
                fillProfileAddress( profile.find('input[name=ghprofile]'), p, false);
            }

            dataIsReceived('github',res);
        });
}

function findStackoverflowProfile(profile, q, p) {

    $.get('https://api.stackexchange.com/2.2/users?site=stackoverflow&inname=' + q )
        .done( function(res){

            if( res.items && res.items.length > 0 ) {
                var endOfURL = res.items[0].link.split('/').splice(3,4).join('/'); // Keep 3 last part of url /user/{uid}/{displayname}
                fillProfileAddress( profile.find('input[name=soprofile]'), endOfURL, true);

                var parts = res.items[0].link.split('/');
                var uid = parts[ parts.length-2 ];
                $('.soflair').attr('src','http://stackoverflow.com/users/flair/' + uid + '.png');
            }
            else {
                fillProfileAddress( profile.find('input[name=soprofile]'), p, false);
            }

            dataIsReceived('stackoverflow',res);
        });
}

function findDribbbleProfile(profile,q,p) {
    $.ajax({
        dataType: "jsonp",
        timeout: 10000,
        url: 'http://api.dribbble.com/players/' + q,
        complete: function(res) {}
    })
        .success(function(data) {
            fillProfileAddress( profile.find('input[name=drprofile]'), data.username, true);
            dataIsReceived('dribbble',data);
        })
        .error(function() {
            fillProfileAddress( profile.find('input[name=drprofile]'), p, false);
            dataIsReceived('dribbble',{});
        });
}

function findBehanceProfile(profile,q,p) {
    $.getJSON('https://www.behance.net/v2/users?api_key=FnneyRH4STbpcKoqK8M2aQwdHkdAfXzb&q=' + q + "&callback=?" ,
        function(res){
            if( res.users.length > 0)
                fillProfileAddress( profile.find('input[name=beprofile]'), res.users[0].username, true);
            else
                fillProfileAddress( profile.find('input[name=beprofile]'), p, false);

            dataIsReceived('behance',res);
        });
}

function findTwitterProfile(profile,q,p) {
    $.get('/twprofile/' + q )
        .done( function(res){
            if( res.statuses )
                fillProfileAddress( profile.find('input[name=twprofile]'), res.statuses[0].user.screen_name, true);
            else
                fillProfileAddress( profile.find('input[name=twprofile]'), p, false);

            dataIsReceived('twitter',res);
        });
}

//CoyBit code
//function findLinkedinProfile(profile,fullname) {
//
//    var baseURL = 'http://linkedin.com/in/';
//    /*
//     $.get('/liprofile/' + q )
//     .done( function(res){
//     $('#liprofile').val(res);
//     dataIsReceived('linkedin',res);
//     });
//     */
//    var case1 = fullname.replace(' ','.');
//    var case2 = fullname.split(' ').pop(-1);
//    var results = {};
//
//    check404( baseURL + case1, function() {
//            console.log('Error');
//        },
//        function(){
//            console.log('OK');
//        })
//}


//Call Bing search API client Side
/*function findLinkedinProfile(profile,fullname) {

    var searchTerm = fullname.trim().replace(" ","%20")+"%20linkedin";

    var Bing_accountKey='XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    $.ajax({
        type: "GET",
        url:'https://api.datamarket.azure.com/Bing/Search/v1/Web?Query=%27'+searchTerm+'%27',
        dataType: "json",
        // crossDomain:"true",
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', 'Basic '+btoa(':'+Bing_accountKey));
        },
        success: function(result,status,xhr) {
            LinkedinSearchCompleted(result,fullname.trim(),profile);
        },
        error: function(jqXHR, textStatus,errorThrown) {
            console.log("Something hasn't worked :" + textStatus)
        }
    });
}*/

//Call Bing search API server Side
function findLinkedinProfile(profile,fullname) {

   $.ajax({
        type: "GET",
        url:'/liprofile/'+fullname.trim(),
        //data:{q:fullname},
        dataType:'json',
        success: function(result,status,xhr) {
            LinkedinSearchCompleted(result,fullname.trim(),profile);
        },
        error: function(jqXHR, textStatus,errorThrown) {
            console.log("Something hasn't worked :" + textStatus)
            }
        });
}

function LinkedinSearchCompleted(response,search_term,profile)
{
    var pattern=/^(http:\/\/)*([w]{3}|[a-zA-Z]{2})(.linkedin.com\/)(in|pub)((\/)[\w.+\/-]+)*$/;
    var split_st=search_term.trim().split(" ");
    var keyWords=new Array();
    for(var i=0;i<split_st.length;i++)
    {
        if(split_st[i]!="")
            keyWords.push(split_st[i].toLowerCase());
    }
    var results = response.d.results;
    var matchResults=new Array();
    if(results.length>0)
    {
        for(i=0;i<results.length;i++)
        {
            if(pattern.test(results[i].Url))
            {
                var valid=true;
                for(var k=0;k<keyWords.length;k++)
                {
                    if(results[i].Title.toLowerCase().search(keyWords[k])<0)
                    {
                        valid=false;
                        break;
                    }
                }
                if(valid)
                    matchResults.push( results[i].Url);
            }
        }
        if( matchResults.length>0 )
            fillProfileAddress( profile.find('input[name=liprofile]'), matchResults[0], true);
        else
            fillProfileAddress( profile.find('input[name=liprofile]'), "", false);

        dataIsReceived('linkedin',matchResults);
    }
}


function check404(url, callback) {
    var request = false;
    if (window.XMLHttpRequest) {
        request = new XMLHttpRequest;
    } else if (window.ActiveXObject) {
        request = new ActiveXObject("Microsoft.XMLHttp");
    }

    if (request) {
        request.open("GET", url);
        if (request.status == 200) { return true; }
    }

    return false;
}

function pageExist(url) {
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}
