/**
 * Created by coybit on 3/8/14.
 */

var puserInfo = {};

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function fillProfiles() {

    puserInfo.name = $('#name').val();
    puserInfo.email = $('#email').val();
    puserInfo.pUsername = $('#email').val().split('@')[0];
    puserInfo.datasourceCount = 6;
    puserInfo.filledDatasourceCount = 0;

    if( puserInfo.name.length > 0 && validateEmail(puserInfo.email) ) {
        $('.profileAddress input').val('').css('border-bottom','2px solid black');

        findGravatar( puserInfo.email );
        findGithubProfile( puserInfo.name, puserInfo.pUsername );
        findDribbbleProfile( puserInfo.pUsername, puserInfo.pUsername );
        findTwitterProfile( puserInfo.name, puserInfo.pUsername );
        findStackoverflowProfile( puserInfo.name, puserInfo.pUsername );
        findLinkedinProfile( puserInfo.name)
        findBehanceProfile( puserInfo.pUsername, puserInfo.pUsername );
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
        el.val(value).css('border-bottom','2px solid red');
}

function findGravatar(q) {

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
        $('.profilePic')
            .attr('src',url)
            .css('display','block')
            .on('load', function(){
                var colorThief = new ColorThief();
                //var color = colorThief.getColor( document.getElementById('profileImage'), 1 )
                var colors = colorThief.getPalette( document.getElementById('profileImage'), 3, 5 )
                var rgb1 = 'rgb('+colors[0][0]+','+colors[0][1]+','+colors[0][2]+')';
                var rgb2 = 'rgb('+colors[1][0]+','+colors[1][1]+','+colors[1][2]+')';
                var rgb3 = 'rgb('+colors[2][0]+','+colors[2][1]+','+colors[2][2]+')';

                $('.cardHead')
                   // .height(80)
                    .css('background-color', rgb1 )
                $('.cardFoot')
                    //.height(40)
                    .css('background-color', rgb1 )
                $('.profilePic').css('border-color', rgb2)
                //$('.card').css('border-color', rgb3)
            });


        scaleElement( $('.profilePic'), 0, 1.2, function() {
            scaleElement( $('.profilePic'), 1.2, 1);
        } );
    }

    $.get('/gravatar/' + q )
        .done( function(res) {
            showImage(res.url);
        })
}

function findGithubProfile(q,p) {

    $.get('https://api.github.com/search/users?q=' + q )
        .done( function(res){

            if( res.items.length > 0 ){
                fillProfileAddress( $('#ghprofile'), res.items[0].login, true);
            }
            else {
                fillProfileAddress( $('#ghprofile'), res.items[0].login, false);
            }

            dataIsReceived('github',res);
        });
}

function findStackoverflowProfile( q, p) {

    $.get('https://api.stackexchange.com/2.2/users?site=stackoverflow&inname=' + q )
        .done( function(res){

            if( res.items && res.items.length > 0 ) {
                var endOfURL = res.items[0].link.split('/').splice(3,4).join('/'); // Keep 3 last part of url /user/{uid}/{displayname}
                fillProfileAddress( $('#soprofile'), endOfURL, true);

                var parts = res.items[0].link.split('/');
                var uid = parts[ parts.length-2 ];
                $('.soflair').attr('src','http://stackoverflow.com/users/flair/' + uid + '.png');
            }
            else {
                fillProfileAddress( $('#soprofile'), p, false);
            }

            dataIsReceived('stackoverflow',res);
        });
}

function findDribbbleProfile(q,p) {
    $.ajax({
        dataType: "jsonp",
        timeout: 10000,
        url: 'http://api.dribbble.com/players/' + q,
        complete: function(res) {}
    })
        .success(function(data) {
            fillProfileAddress( $('#drprofile'), data.username, true);
            dataIsReceived('dribbble',data);
        })
        .error(function() {
            fillProfileAddress( $('#drprofile'), p, false);
            dataIsReceived('dribbble',{});
        });
}

function findBehanceProfile(q,p) {
    $.getJSON('https://www.behance.net/v2/users?api_key=FnneyRH4STbpcKoqK8M2aQwdHkdAfXzb&q=' + q + "&callback=?" ,
        function(res){
            if( res.users.length > 0)
                fillProfileAddress( $('#beprofile'), res.users[0].username, true);
            else
                fillProfileAddress( $('#beprofile'), p, false);

            dataIsReceived('behance',res);
        });
}

function findTwitterProfile(q,p) {
    $.get('/twprofile/' + q )
        .done( function(res){
            if( res.statuses )
                fillProfileAddress( $('#twprofile'), res.statuses[0].user.screen_name, true);
            else
                fillProfileAddress( $('#twprofile'), p, false);

            dataIsReceived('twitter',res);
        });
}

function findLinkedinProfile(fullname) {

    var baseURL = 'http://linkedin.com/in/';
    /*
     $.get('/liprofile/' + q )
     .done( function(res){
     $('#liprofile').val(res);
     dataIsReceived('linkedin',res);
     });
     */
    var case1 = fullname.replace(' ','.');
    var case2 = fullname.split(' ').pop(-1);
    var results = {};

    check404( baseURL + case1, function() {
            console.log('Error');
        },
        function(){
            console.log('OK');
        })
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
