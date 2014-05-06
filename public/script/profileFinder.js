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

        findBehanceProfile(this, puserInfo.pUsername, puserInfo.name);
        //findDribbbleProfile(this, puserInfo.pUsername, puserInfo.pUsername );
        //findTwitterProfile(this, puserInfo.name, puserInfo.pUsername );

        findGithubProfile(this, puserInfo.name, puserInfo.pUsername,puserInfo.email );
        //findStackoverflowProfile(this, puserInfo.name, puserInfo.pUsername );

        findLinkedinProfile(this, puserInfo.name)
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

function findGithubProfile(profile,fullname,username,email) {

    /*********************************************** search algorithm for github profile *****************************************************
    // 1- First search github profile by fullname
    // 2- If number of results more than one, then go to step 3 else if gravatar (email) exist go to step 5 else go to step 8 (null result).
    // 3- If gravatar (email) exist, then find github profile from result of step 2 by gravatar md5 code and go to step 4 else select first item of search result as final result and go to step 8
    // 4- If github profile is found then show result else go to step 5
    // 5- Search github profile by email
    // 6- If number of results more than one, find github profile from result of step 5 by gravatar md5 code and go to step 7 else go to step 8 (null result).
    // 7- if github profile found go to step 8 else select first item of search result as final result and go to step 8
    // 8- Show result and start searching stackoverflow profile by github profile result.
    *****************************************************************************************************************************************/

    var Result=undefined;
    var md5=undefined;
    if(validateEmail(email))
        md5 = CryptoJS.MD5(email.trim().toLowerCase())

    //**** Step [1] ****
    $.get('https://api.github.com/search/users?q=' + (fullname.replace(' ','%20')).toLocaleLowerCase() )
        .done( function(res){

            //**** Step [2] ****
            if( res.items.length > 0 )
            {
                //**** Step [3] ****
                if(md5)
                {
                    for(var i=0;i<res.items.length;i++)
                    {
                        if(res.items[i].gravatar_id==md5)
                        {
                            Result=res.items[i];
                            break;
                        }
                    }
                    //**** Step [4] ****
                    if(!Result)
                    {
                        //**** Step [5] ****
                        $.get('https://api.github.com/search/users?q=' + email.trim().toLowerCase() )
                            .done( function(res1){

                                //**** Step [6] ****
                                if( res1.items.length > 0 )
                                {
                                    for(var j=0;j<res1.items.length;j++)
                                    {
                                        if(res1.items[j].gravatar_id==md5)
                                        {
                                            Result=res1.items[j];
                                            break;
                                        }
                                    }
                                    if(!Result)
                                        Result=res1.items[0];
                                }
                                //**** Step [8] ****
                                showResultGithubProfile(profile,fullname,Result,md5);
                            });
                    }
                }
                else
                    Result=res.items[0];

                //**** Step [8] ****
                showResultGithubProfile(profile,fullname,Result,md5);
            }
            else
            {
                if(md5)
                {
                    //**** Step [5] ****
                    $.get('https://api.github.com/search/users?q=' + email.trim().toLowerCase() )
                        .done( function(res1){

                            //**** Step [6] ****
                            if( res1.items.length > 0 )
                            {
                                for(var i=0;i<res1.items.length;i++)
                                {
                                    if(res1.items[i].gravatar_id==md5)
                                    {
                                        Result=res1.items[i];
                                        break;
                                    }
                                }
                                //**** Step [7] ****
                                if(!Result)
                                Result=res1.items[0];
                            }
                            //**** Step [8] ****
                            showResultGithubProfile(profile,fullname,Result,md5);
                        });
                }
                else
                    //**** Step [8] ****
                    showResultGithubProfile(profile,fullname,Result,md5);
            }
        });
}
function showResultGithubProfile(profile,fullname,Result,md5_gravatar)
{
    if(Result)
        fillProfileAddress( profile.find('input[name=ghprofile]'), Result.login, true);
    else
        fillProfileAddress( profile.find('input[name=ghprofile]'),'', false);

    dataIsReceived('github',Result);
    findStackoverflowProfile(profile,fullname,Result,md5_gravatar);
}

function findStackoverflowProfile(profile, fullname, githubResult,md5_gravatar) {


    /*********************************************** search algorithm for stackoverflow profile ***********************************************
     // 1- First search stackoverflow profile by fullname
     // 2- If number of results more than one, then go to step 3 else if github result exist go to step 5 else go to step 8 (null result).
     // 3- If gravatar (email) exist, then find stackoverflow profile from result of step 2 by gravatar md5 code and go to step 4 else select first item of search result  as final result and go to step 8
     // 4- If stackoverflow profile is found then go to step 8 else if github result exist go to step 5 else go to step 8 (null result).
     // 5- Search stackoverflow profile by github result.
     // 6- If number of results more than one go to step 7 else go to step 8 (null result).
     // 7- If gravatar (email) exist find stackoverflow profile from result of step 5 by gravatar md5 code and go to step 8 else select first item of search result as final result and go to step 8
     // 8- Show result.
     *****************************************************************************************************************************************/


    var Result=undefined;

    //**** Step [1] ****
    //$.get('https:/vav/api.stackexchange.com/2.2/users?site=stackoverflow&inname=' + (fullname.replace(' ','%20')).toLocaleLowerCase() )
    $.get('http://api.stackexchange.com/2.2/users?page=1&pagesize=100&sort=name&site=stackoverflow&inname=' + (fullname.replace(' ','%20')).toLocaleLowerCase() )
        .done( function(res){

            //**** Step [2] ****
            if( res.items && res.items.length > 0 )
            {
                //**** Step [3] ****
                if(md5_gravatar)
                {
                    for(var i=0;i<res.items.length;i++)
                    {
                        if(res.items[i].profile_image.search(md5_gravatar)>=0)
                        {
                            Result=res.items[i];
                            break;
                        }
                    }
                }
                else
                    Result=res.items[0];
                //=====================================================
                //**** Step [4] ****
                if(Result)
                     //**** Step [8] ****
                    showResultStackoverflow(profile,Result);
                else if(githubResult)
                {
                    //**** Step [5] ****
                    $.get('http://api.stackexchange.com/2.2/users?page=1&pagesize=100&sort=name&site=stackoverflow&inname=' + githubResult.login )
                        .done( function(res1){

                            //**** Step [6] ****
                            if( res1.items && res1.items.length > 0 )
                            {
                                //**** Step [7] ****
                                if(md5_gravatar)
                                {
                                    for(var i=0;i<res1.items.length;i++)
                                    {
                                        if(res1.items[i].profile_image.search(md5_gravatar)>=0)
                                        {
                                            Result=res1.items[i];
                                            break;
                                        }
                                    }
                                }
                                else
                                    Result=res1.items[0];
                            }
                            //**** Step [8] ****
                            showResultStackoverflow(profile,Result);
                        });
                }
                else
                    //**** Step [8] ****
                    showResultStackoverflow(profile,Result);

            }
            else if( githubResult)
            {
                //**** Step [5] ****
                $.get('http://api.stackexchange.com/2.2/users?page=1&pagesize=100&sort=name&site=stackoverflow&inname=' + githubResult.login )
                    .done( function(res1){

                        //**** Step [6] ****
                        if( res1.items && res1.items.length > 0 )
                        {
                            //**** Step [7] ****
                            if(md5_gravatar)
                            {
                                for(var i=0;i<res1.items.length;i++)
                                {
                                    if(res1.items[i].profile_image.search(md5_gravatar)>=0)
                                    {
                                        Result=res1.items[i];
                                        break;
                                    }
                                }
                            }
                            else
                                Result=res1.items[0];
                        }
                        showResultStackoverflow(profile,Result);
                    });
            }
            else
                showResultStackoverflow(profile,Result);
        });
}
function showResultStackoverflow(profile,Result)
{
    if(Result)
    {
        var endOfURL = Result.link.split('/').splice(3,4).join('/'); // Keep 3 last part of url /user/{uid}/{displayname}
        fillProfileAddress( profile.find('input[name=soprofile]'), endOfURL, true);
        var parts = Result.link.split('/');
        var uid = parts[ parts.length-2 ];
        $('.soflair').attr('src','http://stackoverflow.com/users/flair/' + uid + '.png');
    }
    else
        fillProfileAddress( profile.find('input[name=soprofile]'), '', false);

    dataIsReceived('stackoverflow',Result);
}

function findDribbbleProfile(profile,username,resBehance,useBehance) {


    var searchTerm=undefined;
    if(useBehance==true)
        searchTerm=resBehance.username;
    else
        searchTerm=username;

    $.ajax({
        dataType: "jsonp",
        timeout: 10000,
        url: 'http://api.dribbble.com/players/' + searchTerm,
        complete: function(res) {}
    })
        .success(function(data) {

            if(resBehance!=null)
            {
                var dribbleLocation=data.location.split(',');
                var resBehanceLocation=resBehance.location.split(',');
                var fullname=(resBehance.first_name+' '+resBehance.last_name).toLowerCase();
                if(data.name.toLowerCase()==fullname &&
                    dribbleLocation[0].trim()==resBehanceLocation[0].trim() && dribbleLocation[1].trim()==resBehanceLocation[1].trim())
                {

                    fillProfileAddress( profile.find('input[name=drprofile]'), data.username, true);
                    dataIsReceived('dribbble',data);
                }
                else
                {
                    fillProfileAddress( profile.find('input[name=drprofile]'), '', false);
                    dataIsReceived('dribbble',{});
                }
                findTwitterProfile(profile,puserInfo.name,data);
            }
            else
            {
                fillProfileAddress( profile.find('input[name=drprofile]'), data.username, true);
                dataIsReceived('dribbble',data);
                findTwitterProfile(profile,puserInfo.name,data);
            }
        })
        .error(function() {
            fillProfileAddress( profile.find('input[name=drprofile]'), '', false);
            dataIsReceived('dribbble',{});
            findTwitterProfile(profile,puserInfo.name,null);
        });
}

function findBehanceProfile(profile,username,fullname) {

    /*********************************************** search algorithm for Behance profile *****************************************************
     // 1- First search Behance profile by fullname
     // 2- If number of results more than one, then go to step 5 else  go to step 3.
     // 3- Search Behance profile by username (email).
     // 4- If number of results more than one go to step 5 else go to step 6
     // 5- Select first item of search result and show it, then start searching Dribbble profile
     // 6- show null result and start searching Dribbble profile.
     *****************************************************************************************************************************************/

    var fn = fullname.trim().replace(" ","%20");

    //**** Step [1] ****
    $.getJSON('https://www.behance.net/v2/users?api_key=FnneyRH4STbpcKoqK8M2aQwdHkdAfXzb&q=' + fn + "&callback=?" ,
        function(res){

            //**** Step [2] ****
            if( res.users.length > 0)
            {
                //**** Step [5] ****
                fillProfileAddress( profile.find('input[name=beprofile]'), res.users[0].username, true);
                findDribbbleProfile(profile, username, res.users[0],true );

            }
            else
            {
                //**** Step [3] ****
                $.getJSON('https://www.behance.net/v2/users?api_key=FnneyRH4STbpcKoqK8M2aQwdHkdAfXzb&q=' + username + "&callback=?" ,
                function(res1){
                    //**** Step [4] ****
                    if( res1.users.length > 0)
                    {
                        //**** Step [5] ****
                        fillProfileAddress( profile.find('input[name=beprofile]'), res1.users[0].username, true);
                        findDribbbleProfile(profile, username, res.users[0],false );
                    }
                    else
                    {
                        //**** Step [6] ****
                        fillProfileAddress( profile.find('input[name=beprofile]'), '', false);
                        findDribbbleProfile(profile, username, null,false );
                    }
                });

            }
            dataIsReceived('behance',res);
        });
}

 function findTwitterProfile(profile,fullname,dribbleResult) {
     var searchTerm=undefined;
     if(dribbleResult!=null )
     {

         if( dribbleResult.name.toLowerCase()==fullname.toLowerCase())
         {
             searchTerm=dribbleResult.twitter_screen_name;
         }
         else
             searchTerm=fullname;
     }
     else
         searchTerm =fullname;

     $.get('/twprofile/' +searchTerm )
         .done( function(res){
             if( res.statuses )
                 fillProfileAddress( profile.find('input[name=twprofile]'), res.statuses[0].user.screen_name, true);
             else
                 fillProfileAddress( profile.find('input[name=twprofile]'), '', false);

             dataIsReceived('twitter',res);
         });
 }



/*
function findTwitterProfile(profile,q,p) {
    $.get('/twprofile/' + q )
        .done( function(res){
            if( res.statuses )
                fillProfileAddress( profile.find('input[name=twprofile]'), res.statuses[0].user.screen_name, true);
            else
                fillProfileAddress( profile.find('input[name=twprofile]'), p, false);

            dataIsReceived('twitter',res);
        });
}*/

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
    var pattern=/^(http:\/\/)*([w]{3}|[a-zA-Z]{2})(.linkedin.com\/)(in|pub)((\/)[\w.%&+\/-]+)*$/;
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
        {
            var substrIdx=matchResults[0].search("linkedin.com/");
            var substr="";
            if(substrIdx>=0)
            var substr=matchResults[0].substr(substrIdx+13);
            fillProfileAddress( profile.find('input[name=liprofile]'), substr , true);
        }

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
