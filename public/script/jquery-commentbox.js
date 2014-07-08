/**
 * Created by coybit on 6/18/14.
 */

$.fn.commentBox = function(options){

    var postURL = options.postURL;
    var getURL =  options.getURL;
    var togglable = options.togglable;

    var commentboxObj = $(this);
    commentboxObj.empty();

    var commentFormObj = $('<div>').addClass('bool-comment-form')
        .append(' <p>Leave your comment here:</p>')
        .append(' <textarea class="bool-textarea askForComment-note" rows="4" style="width: 100%"></textarea>')
        .append(' <a op="send" class="bool-toolbar-btn bool-comment-button pull-right">Send</a>')
        .append(' <a op="clear" class="bool-toolbar-btn bool-comment-button pull-right">Clear</a>');

    var commentViewObj = $('<div>').addClass('portlet-commentsView');
    if( togglable ) {
        commentboxObj.hide();
        commentViewObj.append('<a id="buttonComment" isOpen="1"><i class="fa fa-comments"></i></a>');
    }
    commentViewObj.append('<div class="bool-comments-header">Comments</div>');
    commentViewObj.append( commentFormObj )
    commentViewObj.append(' <ul class="bool-comments"></ul>');
    commentboxObj.append(commentViewObj);
    commentboxObj.css('z-index','1000').addClass('portlet-commentsView-container');


    // Clear button
    $(this).find('.bool-comment-form .bool-comment-button[op="clear"]').click( function() {
        commentboxObj.find('.bool-comment-form textarea').val('');
    });

    // Send button
    $(this).find('.bool-comment-form .bool-comment-button[op="send"]').click( function() {

        $.post(postURL,{
            text: commentboxObj.find('.bool-comment-form textarea').val()
        }).done( function(comment) {
                addCommentToView(
                    commentboxObj,
                    comment.user.email,
                    comment.user.displayName,
                    comment.date,
                    commentboxObj.find('.bool-comment-form textarea').val());
            });


    });

    // Get comments from server and show them
    $.get(getURL).done( function(res) {
        res.comments.forEach( function(comment){
            addCommentToView(
                commentboxObj,
                comment.user.email,
                comment.user.displayName,
                comment.date,
                comment.text);
        })

    });

    // Putting comment view in initialization mode
    if( togglable ) {
        toggleCommentView.call( $('#buttonComment'), function() {
            $('.portlet-commentsView-container').show();
        });

        $('#buttonComment').click(toggleCommentView);
    }
}

function addCommentToView( commentboxObj, commenterEmail, commenterName, commentDate, commentText ) {
    var hash = CryptoJS.MD5( commenterEmail.trim().toLowerCase() );
    var avatarURL = 'http://www.gravatar.com/avatar/' + hash;

    var avatarObj = $('<img>').attr('src',avatarURL);
    var nameObj = $('<span>').text(commenterName);

    var dt = dateTimeToJSON(commentDate);
    var dateObj = $('<i>').addClass('fa fa-clock-o pull-right').attr('title',dt.fullStyle);

    var commentObj_header = $('<div>').addClass('bool-comment-header').append(avatarObj).append(nameObj).append(dateObj);
    var commentObj_body = $('<div>').addClass('bool-comment-body').text(commentText);
    var commentObj = $('<li>').append(commentObj_header).append(commentObj_body);

    commentboxObj.find('.bool-comments').prepend(commentObj);
}

function toggleCommentView(callback) {
    var isOpen = $(this).attr('isOpen')==='1';
    var callback = typeof(callback)==='function' ? callback : function(){};

    if( isOpen ) {
        $('.portlet-commentsView-container').animate( {width:0}, 500, callback );
        $(this).attr('isOpen','0');
    }
    else {
        var width = $('.portlet-commentsView').width();
        $('.portlet-commentsView-container').animate( {width:width}, 500 , callback );
        $(this).attr('isOpen','1');
    }
}
