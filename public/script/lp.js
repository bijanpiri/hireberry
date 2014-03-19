/**
 * Created by coybit on 2/17/14.
 */

/*** Google Analytics ***/
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-46980855-1', 'boolt.in');
ga('send', 'pageview');


/*** Google Customized Event Tracking ***/
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-46980855-1']);
_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();


/**** Form Submitting ***/

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

_gaq.push(['_trackEvent', 'launchpage', 'enter']);

function showSlogan(){
    $('.lp-DescriptionSlogan')
        .css('opacity',0)
        .animate({opacity:"1"},1000,function(){
            showTagLine();
        });
}

function showTagLine(){
    $('.lp-DescriptionTagline')
        .css('opacity',0)
        .animate({opacity:"1"},1000,function(){
            showSignupButton();
        });
}

function showSignupButton(){
    $('.signupNowButton')
        .css('opacity',0)
        .animate({opacity:"1"},1000,function(){
        });
}

$(window).load( function() {
    locatingFrontPage(true);
});

// Showing and Locating Frontpage after that all the resources are loaded
function locatingFrontPage(animated) {
    $('body').css('visibility','visible');
    $('img').css('visibility','visible');
    $('.section1').height( Math.max( $(window).height(), $('#frontpage').height()) + 10 );
    $('#frontpage').css('margin-top',$('.section1').height()/2-$('#frontpage').height()/2);

    if(animated)
        showSlogan();
}

var signupNowPushedImage = new Image();
signupNowPushedImage.src = "/img/signup-btn-top-b.png";

var signupBPushedImage = new Image();
signupBPushedImage.src = "/img/signup-btn-bot-b.png";

$(function(){

    var cycle = function() {
        $('.scrollDown').animate({top:'-=5px'}, 1000)
            .animate({top:'+=5px'},1000,cycle);
    };

    cycle();

    _gaq.push(['_trackEvent', 'launchpage', 'loaded']);

    $(window).resize(function(){
        locatingFrontPage(false);
    });

    $('input[type=email]').blur(function(){

        if( validateEmail( $(this).val() )  )
            $(this).removeClass('hasError');
        else
            $(this).addClass('hasError');
    });

    $('a').smoothScroll({speed:2000});

    $.scrollDepth();

    $('.signupNowButton').click(function(){
        _gaq.push(['_trackEvent', 'launchpage', 'signupnow']);
        $('.section2').show()
        $('.section3').show()
        $('#moreLink').click();

    });

    $("#emailpr").keyup(function(event){
        if(event.keyCode == 13){
            $(".signupButton").click();
        }
    });

    $('.signupButton').click(function(){

        _gaq.push(['_trackEvent', 'launchpage', 'signup']);

        var personEmail = $('#emailpr').val();

        // Validate
        if( validateEmail(personEmail) == false ){
            $("#emailpr").addClass('hasError');
            return;
        }
        else
            $("#emailpr").removeClass('hasError');


// Send
        console.log('Sent');

        $.post('/signup', {
            "email":personEmail
        }, function(data){
            $('.signupButton').disable().button('Thanks You!');
        });

// Show Message
        $('#signupMessage').animate({opacity:'0'},500,function(){
            $('#signupMessage').remove();
        });

        $('#signupSubMessage').animate({opacity:'0'},500,function(){
            $('#signupSubMessage').remove();
        });

        $('#signupForm').animate({opacity:'0'},500,function(){
            $('#signupForm').remove();

            $('#signupContainer').prepend( $('#ShareUs').show().children() );

            // Retina.js set width and height of hidden image to 0.
            // So we have to set it to original image size inorder to they be visible.
            $('#signupContainer').find('img').width(120).height(40);
        });

    });
});

