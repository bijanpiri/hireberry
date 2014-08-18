/**
 * Created by coybit on 5/14/14.
 */

paypal_api = require('paypal-rest-sdk');
paypal_config_opts = {
    //'host': 'api.sandbox.paypal.com',
    'host': 'api.paypal.com',
    'port': '',
    'client_id': 'AQ1m3BD1QilgWxOstMw3GuSSsit3W8uoN36NMQxlzDs_iF1m70-XI5cyeQWn',
    'client_secret': 'EKPO6BB35T7v-u1pS_OGTJZepROWqc1m_gYBhps8dIrrY9979iKFjw8tM0_o'
};

paypal_api.configure(paypal_config_opts);


app.get('/pay', function(req,res) {

    if( !checkUser(req,res) )
        return;

    if(req.query.jbp=='1')
    {
        var PaymentType='promotepay';
        var invoiceDescription ="Promoting job board payment";
        BPromoteInfo
            .findOne({_id:req.query.promoteId}).lean()
            .exec(function(err,data){
                if(err)
                    res.send(401,'Error fetching data');
                else
                {
                    if(data)
                    {
                        pay ( req.headers.host, req.user.teamID,data.totalPrice,invoiceDescription,PaymentType,req.query.promoteId, function(err, approval_url) {
                            if( !err )
                                res.redirect(approval_url);
                        } );
                    }
                    else
                        res.send(401,'Error fetching data');
                }
            });
    }
    else{
        var teamID = req.user.teamID;

        BTeams.findOne({_id:teamID}, function(err,team) {

            if( err || !team )
                return res.send(503);

            var invoiceDescription ="Increasing credit for " + team.name + " on Hireberry";
            var PaymentType='accountpay'
            pay( req.headers.host , req.user.teamID,  req.query.amount,invoiceDescription,PaymentType,null, function(err, approval_url) {
                if( !err )
                    res.redirect(approval_url);
            });
        });
    }
});

app.get('/api/billing', function(req,res) {
    BTransactions.find( {teamID: req.user.teamID, $or:[
        {$and:[{method:'paypal'},{state:'sold'}]},
        {method:'invoice'},
        {method:'promo'},
        {method:'jbpromote'}
    ]}, function(err,transactions) {
        var balance = 0;
        var billings = [];

        for( var i=0; i<transactions.length; i++ ) {
            if(transactions[i].paymentType!="promotepay")
                balance += parseFloat(transactions[i].amount);

            if( Math.abs(transactions[i].amount) > 0 ) // Don't show zero invoices
                billings.push( { method: transactions[i].method, state:transactions[i].state, time: transactions[i].paymentTime, amount:transactions[i].amount,paymentType:transactions[i].paymentType} );
        }

        BTeams.findOne({_id:req.user.teamID}, function(err,team){
            res.send(200,{
                billing: {
                    plan: team.plan,
                    lastRenew: team.planLastRenewDate,
                    autoDowngraded: team.autoDowngraded,
                    balance: balance,
                    billings: billings
                }
            });
        })

    });
});

app.get('/paypal', function(req,res) {
    var transactionID = req.query.tid;
    var ECToken = req.query.token;
    var success = req.query.success;//todo success remove from query
    var prayerID = req.query.PayerID;
    var PromoteID=req.query.pid;
    BTransactions.findOne({_id:transactionID}, function(err,transaction) {

        if( success==='true' ) {
            BTransactions.update({_id:transactionID},{state:'approved',ECToken:ECToken}, function(err){

                // Execute payment
                var execute_payment_details = { "payer_id": prayerID };
                paypal_api.payment.execute( transaction.PAYToken, execute_payment_details, function(error, payment){
                    BTransactions.findOne({_id:transactionID}, function(er,rst){
                        if(rst.paymentType=="promotepay")
                        {
                            //redirect promote info
                            if(error){          //Level 1 error
                                console.error(error);
                                res.redirect('/paypromote?result=0');

                            }  else if(er)    //Level 2 error
                            {
                                console.error(er);
                                res.redirect('/paypromote?result=0');
                            }
                            else {
                                BTransactions.update({_id:transactionID},{state: 'sold',payer: payment.payer,paymentTime: payment.update_time},
                                    function(err){
                                        if(err)
                                            console.error(err); //toDo transaction (rollback)
                                        else
                                        {
                                            BPromoteInfo
                                                .findOne({_id:PromoteID}).lean()
                                                .exec(function(err,data){
                                                    if(err)
                                                        res.send(401,'Error fetching data');
                                                    else
                                                    {
                                                        //--------------------- Sending email ---------------------
                                                        var content="========== Job Boards Payment Report ==========";
                                                        if(data.jobBoardsPreview.length>0)
                                                        content+='<br>'+"Position title : " +data.jobBoardsPreview[0].positionTitle;
                                                        content+='<br>'+"Position link : "+"http://localhost:5000/flyer/edit/0?flyerid="+data.flyerID;
                                                        content+='<br>'+"Date : "+data.time;
                                                        content+='<br>'+"Selected job boards :"
                                                        for(var j=0;j<data.jobBoards.length;j++)
                                                        {
                                                            content+='<br>'+"   Name : "+data.jobBoards[j].Name+" [Price : $"+data.jobBoards[j].Price+"]";
                                                            if(data.jobBoards[j].Name.toLowerCase()=="linkedin")
                                                            {
                                                                content+="  ( Country : "+data.jobBoards[j].CountryName;
                                                                if(data.jobBoards[j].PostalCode!='-1')
                                                                    content+="  ## PostalCode : "+data.jobBoards[j].PostalCode+" )";
                                                                else
                                                                    content+= " )";
                                                            }
                                                        }
                                                        content+='<br>'+"Total payment : $"+data.totalPrice;

                                                        var emailConfig = {
                                                            from: "Hireberry",
                                                            fromAddress: "job@hireberry.com",
                                                            replyAddress: "reply@hireberry.com"
                                                        };
                                                        var message = {
                                                            "html": content,
                                                            "text": content,
                                                            "subject": "Promoting Job",
                                                            "from_email": emailConfig.fromAddress,
                                                            "from_name": emailConfig.from,
                                                            "to": [{
                                                                "email": req.user._doc.email,
                                                                "name": '',
                                                                "type": "to"
                                                            }],
                                                            "headers": {
                                                                "Reply-To": emailConfig.replyAddress
                                                            }
                                                        };

                                                        mandrill_client.messages.send({"message": message, "async": false},
                                                            function(result) {/*Sucess*/},
                                                            function(e) { /*Error*/});
                                                        //---------------------------------------------------------
                                                        console.log(payment);
                                                        res.redirect('/paypromote?result=1');
                                                    }
                                                });

                                        }
                                });
                            }  //end if(rst.paymentType=="promotepay")
                        }
                        else
                        {
                            if(error){
                                console.error(error);
                                res.redirect('/dashboard#billing');
                            } else {

                                BTransactions.update({_id:transactionID},{
                                    state: 'sold',
                                    payer: payment.payer,
                                    paymentTime: payment.update_time
                                }, function(err){
                                    if(err)
                                        console.error(err);
                                    else
                                    {
                                        console.log(payment);
                                        res.redirect('/dashboard#billing');
                                    }
                                });
                            }
                    }
                    });  //end BTransactions.findOne({_id:transactionID}, function(er,rst)
                });  //end Paypal execute
            }); // BTransactions.update({_id:transactionID},{state:'approved',ECToken:ECToken}
        }
        else {
            BTransactions.update({_id:transaction._id},{state:'canceled',ECToken:ECToken}, function(err){
                res.redirect('/dashboard#billing');
            })
        }
    });
})

app.get('/api/plan/change', function(req,res) {
    changePlan( req.query.new_plan, req.user.teamID, function() {
        res.send(200);
    })
})

app.post('/api/billing/turnoff-alert', function(req,res) {

    var teamID = req.user.teamID;

    BTeams.update({_id:teamID},{autoDowngraded:false}, function(err){
       res.send( err ? 503 : 200 );
    });

});