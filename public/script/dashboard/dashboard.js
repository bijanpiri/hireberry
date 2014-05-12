/**
 * Created by Bijan on 05/10/2014.
 */

$(function(){
    teamSettings();
    fillTeamSetting();
    teamInvitation();
    $('button[data-loading-text]').click(function(){
        var btn=$(this);
        btn.button('loading');
        setTimeout(function(){
            btn.button('reset');
        },3000);
    });
    _.templateSettings = {
        interpolate: /\{\{(.+?)\}\}/g,
        escape: /\{\{\-(.+?)\}\}/g,
        evaluate: /\{\%(.+?)\%\}/g
    };

    refresh(false);

    // Initializing modals
    $('#applicationPreview').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Application Preview",
        width: 400,
        height: 400
    });

    $('#activitiesModal').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Activities",
        width: 800,
        height: 450
    });

    $('#positionComments').dialog({
        resizable: false,
        autoOpen: false,
        modal: true,
        title: "Activities",
        width: 400,
        height: 400
    });

    $('.menu .item').click( function(e) {
        return;

        var sectionContainerClass = '.' + $(e.target).attr('forContainer');
        $('.sectionContainer').hide();
        $(sectionContainerClass).show();
        $('.menu .item').removeClass('item-selected');
        $(e.target).addClass('item-selected');
    })

    $('#notificationCenter .tongue').click( function() {
        var isOpen = ($(this).attr('isOpen') == 'true');
        var ncObj = $('#notificationCenter');

        if(isOpen){
            ncObj.animate({'width': 40},300);
        }
        else {
            ncObj.animate({'width': 300},300);
        }

        $(this).attr('isOpen', !isOpen);
    }).click();

    $(document).delegate('.bool-toggle-application','click',function() {
        var candidateSection=$(this).closest('.candidate');
        var candidate=candidateSection.data('candidate')
        var isExpanded = candidateSection.hasClass('candidate-expanded');


        if(!isExpanded ){
//                if(!candidateSection.commentFetched){
            $.get('/api/application/comments',{appID:candidate._id},function(data){
                var comments=data.comments;

                candidateSection.find('.candidate-comments').empty();

                comments.forEach(function(comment){
                    var form=$('.reply-for-comment-form:first').clone().show();

                    candidateSection.find('.candidate-comments').append(form);
                    form.find('[name=commentID]').val(comment._id);
                    form.find('.user-note-avatar')
                        .replaceWith(generateMemberElement(comment.user,true,false));
                    form.find('.commenter-note-avatar')
                        .replaceWith(generateMemberElement(comment.commenter,true,false,true))
                    form.find('.bool-application-comments-note').html(comment.note);
                    var commentBox = form.find('.bool-application-comments-comment');
                    var replyBtn=form.find('[type=submit]');
                    commentBox.html(comment.comment);
                    var editBtn = form.find('.bool-edit-comment-btn').hide();
                    var cancleBtn = form.find('.bool-cancel-comment-btn').hide();
                    if(comment.comment || data.user!==comment.commenter._id) {
                        commentBox
                            .attr('readonly', 'readonly')
                            .attr('placeholder', 'No comment left');
                        replyBtn.hide();
                        if(data.user===comment.commenter._id)
                            editBtn.show();

                    }

                    editBtn.click(function(){
                        replyBtn.show();
                        cancleBtn.show();
                        commentBox.removeAttr('readonly')
                        editBtn.hide();
                    });
                    cancleBtn.click(function(){
                        replyBtn.hide();
                        cancleBtn.hide();
                        editBtn.show();
                        commentBox.attr('readonly','readonly');
                        commentBox.val(comment.comment);
                    });

                    form.submit(function(){
                        form.find('.alert-info').show();
                        $.post('/api/application/comments',
                            form.serialize())
                            .always(function(data){
                                $('.alert').hide();
                            })
                            .fail(function(data){
                                form.find('.alert-danger').show();
                            })
                            .done(function(data){
                                form.find('.alert-success').show().delay(3000).fadeOut();
                                replyBtn.hide();
                                cancleBtn.hide();
                                editBtn.show();
                                commentBox.attr('readonly','readonly');
                            });
                        return false;
                    })

                })

//                        candidateSection.commentFetched=true;
            });
//                }
            // Deselect Current Selection
            $('#candidatesCollection .candidate-expanded')
                .css('clear','none')
                .removeClass('candidate-expanded')
                .next()
                .css('clear','none');

            candidateSection.css('clear','both')
                .addClass('candidate-expanded')
                .next()
                .css('clear','both');

            $('#candidatesCollection .candidate')
                .filter( function(i,obj) { return !$(obj).hasClass('candidate-expanded') })
                .css('opacity',0.3);
            $('#candidatesCollection .candidate-expanded').css('opacity',1);


        }
        else {
            candidateSection.css('clear','none')
                .removeClass('candidate-expanded')
                .next()
                .css('clear','none');

            $('#candidatesCollection .candidate').css('opacity',1);

        }

    });

});
