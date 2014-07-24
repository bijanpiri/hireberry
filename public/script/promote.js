$(document).ready( function() {


    var updateLinkedinPrice=function()
    {
        var cn=$("#field-country").find(":selected").val();
        if(LinkedinPrice[cn])
        {
            if( LinkedinPrice[cn]['-1'])
            {
                $("#div-postalcode").hide();
                $("#ld-price").text(LinkedinPrice[cn]['-1'].slice(2))
                $("#ld-area").text("").hide();

            }
            else
            {
                $("#div-postalcode").show();
                $("#ld-price").text("Please, select a postal code")
                $("#ld-area").text("").hide();

            }
        }
        else
        {
            $("#div-postalcode").show();
            $("#ld-price").text("Please, select a country")
            $("#ld-area").text("").hide();
        }
    }




    $("#field-country").change(function()
    {
        updateLinkedinPrice();
        calculateTotalPayment();
    });



    $("#field-postal-code").blur(function()
    {
        var cn=$("#field-country").find(":selected").val();
        var postal=$("#field-postal-code").val();

        if(LinkedinPrice[cn][postal])
        {
            $("#ld-price").text(LinkedinPrice[cn][postal]['Price'].slice(2));
            $("#ld-area").text('[ ' +LinkedinPrice[cn][postal]['Area']+' ]').show();
        }
        else
        {
            $("#ld-price").text( "The postal code is wrong");
            $("#ld-area").text('').hide();
        }
        calculateTotalPayment();
    });



    $.ajax({
        url:'/jbprice',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            JobBoardPrice=data;
        }
    })
        .fail(function(data) {
            alert(data);
        });

    $.ajax({
        url:'/linkedinprice',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            LinkedinPrice=data;
            updateLinkedinPrice();
        }
    })
        .fail(function(data) {
            alert(data);
        });


    $.ajax({
        url:'/api/team/settings',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            companyName=data.name;
            teamID=data._id;
        }
    })
        .fail(function(data) {
            alert(data);
        });

    $("#inputtext-indeed-payment").change(function(e)
        {
            var value= parseInt ($("#inputtext-indeed-payment").val());

            if(value<50 || value>1000)
                $("#inputtext-indeed-payment").css("color",'red');
            else
                $("#inputtext-indeed-payment").css("color",'black');

            calculateTotalPayment();
            e.stopPropagation();
        }
    );

    $("#ln-promote").attr("href","http://www.linkedin.com/shareArticle?mini=true&url="
        +jobLink.replace(' ','%20')+
        "&title="+positionTitle.replace(' ','%20')+
        "&summary="+description.replace(' ','%20')+"&source=");

    //$("#tw-promote").attr("data-url",jobLink);
    $("#tw-promote").attr("href", "https://twitter.com/intent/tweet?text=&url="+jobLink.replace(' ','%20')+"&related=episod");


    //$("#gp-promote").attr("data-href",jobLink);
    $("#gp-promote").attr("href","https://plus.google.com/share?url="+jobLink.replace(' ','%20'));


    $("#fb-promote").attr("href",jobLink.replace(' ','%20'));


    $(".job-boards").find(":input[type=button]").click(function() {

        var boardName=$(this).attr("title");

        var ml = $('#job-borad-preview-dialog');
        ml.find("#invitationSetLabel").text(boardName);
        ml.find("#job-address").text(address);
        ml.find("#job-title").text(positionTitle);
        ml.find("#company-name").text(companyName);
        ml.find("#job-description").text(description);
        //ml.find("#job-workPlaceTime").text(workCondition);
        //ml.find("#job-skills").text(skills);
        //ml.find("#company-logo").attr('src',logo);
        ml.modal();


        // ------------ Show-Hide job link ----------------
        if( boardName=="Indeed" || boardName=="Stack Overflow" )
        {
            ml.find("#job-link").text("");
            ml.find("#div-joblink").hide();
            ml.find("#job-description").append('<br>'+"Job Url : "+'<br>'+jobLink);
        }
        else
        {
            ml.find("#job-link").text(jobLink);
            ml.find("#div-joblink").show();
        }

        // ------------ Show-Hide work condition ----------------
        if(!workCondition && workCondition=='')
        {
            ml.find("#job-workPlaceTime").text("");
            ml.find("#div-workPlaceTime").hide();
        }
        else if( boardName=="Indeed" || boardName=="Stack Overflow" || boardName=="Dribbble" || boardName=="Behance")
        {
            ml.find("#job-workPlaceTime").text("");
            ml.find("#div-workPlaceTime").hide();
            var place=  workCondition.split('&')[0].split('=')[1];
            var time=  workCondition.split('&')[1].split('=')[1];
            ml.find("#job-description").append('<br>'+"Work Place/Time : "+'<br>'+place+'/'+time);
        }
        else
        {
            var place=  workCondition.split('&')[0].split('=')[1];
            var time=  workCondition.split('&')[1].split('=')[1];
            ml.find("#job-workPlaceTime").text(place+'/'+time);
            ml.find("#div-workPlaceTime").show();
        }
        // ------------ Show-Hide skills ----------------
        if(!skills || skills=='')
        {
            ml.find("#job-skills").text("");
            ml.find("#div-skills").hide();
        }
        else if( boardName=="Indeed" || boardName=="GitHub" || boardName=="Dribbble")
        {
            ml.find("#job-skills").text("");
            ml.find("#div-skills").hide();
            ml.find("#job-description").append('<br>'+"Requirements : "+'<br>'+skills);
        }
        else
        {
            ml.find("#job-skills").text(skills);
            ml.find("#div-skills").show();
        }


        // ------------ Show-Hide company logo ----------------
        if(logo=='http://placebox.es/231/40/9c9c9c/ffffff/Drop%20Your%20Logo%20Here/' ||
            boardName=="Behance" || boardName=="Dribbble"  || boardName=="Indeed"   )
        {
            ml.find("#company-logo").attr('src','');
            ml.find("#div-logo").hide();
        }
        else
        {
            ml.find("#company-logo").attr('src',logo);
            ml.find("#div-logo").show();
        }

        // ------------ Show-Hide description ----------------
        if( boardName=="Dribbble")
        {
            ml.find("#job-description").text("");
            ml.find("#div-description").hide();
        }
        else
        {
            ml.find("#div-description").show();
        }

    });

    $(".job-boards").find(":input[type=checkbox]").click(function() {

        /*title="LinkedIn"

         if(this.prop('checked'))
         {
         if(this.attr("title").toLowerCase()=="indeed" || this.attr("title").toLowerCase()=="linkedin")
         {

         }
         else if (this.attr("title").toLowerCase()=="linkedin")
         {

         }
         }
         else
         {

         }*/
        calculateTotalPayment();
    });

    $("#btn-promote-payment").click(function() {


        getSelectedJobBoardInfo(function(info)
        {
            var rst=info.PaymentInfo;
            var ml = $('#payment-action-dialog');
            ml.find("#error-msg").text("");

            if(rst.SelectedJobBoards.length>0)
            {
                $.ajax({
                    url:'/flyer/submitpromote',
                    type: 'POST',
                    dataType: 'json',
                    data :
                    {
                        flyerID:flyerID,
                        teamID:teamID,
                        jobBoardInfo:rst
                    },
                    success: function(data) {


                        var ml = $('#payment-action-dialog');
                        ml.find('.container-fluid').empty();
                        for(var i=0;i<data.SelectedJobBoards.length;i++)
                        {
                            ml.find('.container-fluid').append($('<span>').text(data.SelectedJobBoards[i].Name));
                            ml.find('.container-fluid').append($('<p>').text("$ "+data.SelectedJobBoards[i].Price  ));
                            ml.find('.container-fluid').append( $('<hr>'));
                        }
                        ml.find('.container-fluid').append($('<span>').text("Total"));
                        ml.find('.container-fluid').append($('<p>').text("$ "+data.TotalPayment ));

                        ml.modal();
                        ml.find('.modal-footer').empty();
                        ml.find('.modal-footer').append($('<button>')
                            .addClass("btn btn-primary")
                            .attr('data-dismiss','modal')
                            .attr('aria-hidden','true').text("Cancel"));
                        ml.find('.modal-footer').append($('<button>')
                            .addClass("btn btn-primary")
                            .attr('data-dismiss','modal')
                            .attr('aria-hidden','true').text("Confirm").click(function()
                            {
                                // $(this).attr("disabled","disabled");
                                $("#btn-promote-payment").attr("disabled", "disabled");
                                $.ajax({
                                    url:'/flyer/confirmpromote',
                                    type: 'POST',

                                    dataType: 'json',
                                    data :
                                    {
                                        flyerID:flyerID,
                                        teamID:teamID,
                                        jobBoardInfo:info
                                    },
                                    success: function(result) {
                                        window.location='/pay?promoteId='+result.PromoteId+"&jbp=1";
                                    }
                                })

                            }));
                    }
                })
                    .fail(function(data) {

                        var ml = $('#payment-action-dialog');
                        ml.find('.container-fluid').empty();
                        ml.find('.container-fluid').append($('<span>').text("Message"));
                        ml.find('.container-fluid').append($('<p>').text(data.responseText));
                        ml.find('.modal-footer').empty();
                        ml.find('.modal-footer').append($('<button>')
                            .addClass("btn btn-primary")
                            .attr('data-dismiss','modal')
                            .attr('aria-hidden','true').text("Close"));
                        ml.modal();
                    });
            }
            else
            {
                var ml = $('#alert-payment-dialog');
                ml.modal();
            }
        }); //end getSelectedJobBoardInfo

    });

    var getPaymentInfo=function(callback)
    {
        var chbxs=$(".job-boards").find(":input[type=checkbox]");
        var selectedInfo=new Object();
        //selectedInfo.TotalPayment=0.0;
        selectedInfo.SelectedJobBoards=new Array();

        $.each(chbxs, function(i)
        {
            if($(chbxs[i]).prop('checked'))
            {
                var jbInfo=new Object();
                jbInfo.Price=JobBoardPrice[$(chbxs[i]).attr("title").toLowerCase()];
                jbInfo.Name=$(chbxs[i]).attr("title");
                //selectedInfo.SelectedJobBoards.push(jbInfo);
                //selectedInfo.TotalPayment+=  JobBoardPrice[$(chbxs[i]).attr("title").toLowerCase()];
                if(jbInfo.Name.toLowerCase()=="linkedin")
                {
                    var cn=$("#field-country").find(":selected").val();
                    jbInfo.Country=cn
                    jbInfo.CountryName=$("#field-country").find(":selected").text();
                    jbInfo.Location="";
                    if(LinkedinPrice[cn])
                    {
                        if( LinkedinPrice[cn]['-1'])
                        {
                            jbInfo.PostalCode="-1";
                        }
                        else
                        {
                            var postal=$("#field-postal-code").val();
                            jbInfo.PostalCode=postal;
                            jbInfo.Location=LinkedinPrice[cn][postal]['Area'];
                        }
                    }

                }
                selectedInfo.SelectedJobBoards.push(jbInfo);
            }
        });
        callback(selectedInfo);
    }



    var calculateTotalPayment=function()
    {
        var chbxs=$(".job-boards").find(":input[type=checkbox]");

        $.each(chbxs, function(i)
        {

            if($(chbxs[i]).attr("title").toLowerCase()=="indeed")
            {
                var value= parseInt ($("#inputtext-indeed-payment").val());
                if(value<50 )
                    value=50;
                else if(value>1000 )
                    value=1000;
                else if(isNaN(value) )
                    value=50;
                JobBoardPrice[$(chbxs[i]).attr("title").toLowerCase()]=parseFloat(value);
            }
            else if($(chbxs[i]).attr("title").toLowerCase()=="linkedin")
            {
                var value= parseFloat($("#ld-price").text().slice(1));
                if(isNaN(value) )
                    value=195.0;
                JobBoardPrice[$(chbxs[i]).attr("title").toLowerCase()]=value;
            }
            else
                $(chbxs[i]).val( JobBoardPrice[$(chbxs[i]).attr("title").toLowerCase()]);
        });
        var sumPayment=0.0;
        $.each(chbxs, function(i)
        {
            if($(chbxs[i]).prop('checked'))
            {
                sumPayment+=  JobBoardPrice[$(chbxs[i]).attr("title").toLowerCase()];
            }
        });
        $("#div-total-payment").text("$ " +sumPayment.toFixed(2));
    }

    var getSelectedJobBoardInfo =function(callback)
    {
        getPaymentInfo(function(rst)
        {
            var info=new Object();
            info.PaymentInfo=rst
            info.JobBoardListPreiview=new Array();
            for(var i=0;i<rst.SelectedJobBoards.length;i++)
            {
                var item=new Object();
                var boardName=rst.SelectedJobBoards[i].Name;

                item.boardName=boardName;
                item.address=address;
                item.positionTitle=positionTitle;
                item.companyName=companyName;
                item.description=description;

                // ------------ Saving job link ----------------
                item.jobLink="[NA]";
                if( !(jobLink=="undefined" || !jobLink || jobLink==''))
                {
                    if( boardName=="Indeed" || boardName=="Stack Overflow" )
                    {
                        item.description+="&Job Url : "+jobLink;
                    }
                    else
                    {
                        item.jobLink=jobLink;
                    }
                }

                // ------------ Saving work condition ----------------
                item.workCondition="[NA]";
                if( !(workCondition=="undefined" ||  !workCondition || workCondition==''))
                {
                    var place=  workCondition.split('&')[0].split('=')[1];
                    var time=  workCondition.split('&')[1].split('=')[1];
                    if( boardName=="Indeed" || boardName=="Stack Overflow" || boardName=="Dribbble" || boardName=="Behance")
                    {
                        item.description+="&Work Place/Time : "+place+'/'+time;
                    }
                    else
                    {
                        item.workCondition=place+'/'+time;
                    }
                }
                // ------------ Saving skills ----------------
                item.skills="[NA]";
                if( !(skills=="undefined" || !skills || skills==''))
                {
                    if( boardName=="Indeed" || boardName=="GitHub" || boardName=="Dribbble")
                    {
                        item.description+="&Requirements : "+skills;
                    }
                    else
                    {
                        item.skills=skills;
                    }
                }
                // ------------ Saving company logo ----------------
                item.logo="[NA]";
                if(    !( logo=='http://placebox.es/231/40/9c9c9c/ffffff/Drop%20Your%20Logo%20Here/'
                    ||  boardName=="Behance" || boardName=="Dribbble"  || boardName=="Indeed"   ))
                {
                    item.logo=logo
                }

                // ------------ Saving description ----------------

                if( boardName=="Dribbble")
                {
                    item.description="[NA]";
                }
                info.JobBoardListPreiview.push(item);
            }
            callback(info)
        });
    };

});