/**
 * Created by coybit on 5/14/14.
 */

paypal_api = require('paypal-rest-sdk');
paypal_config_opts = {
    'host': 'api.sandbox.paypal.com',
    'port': '',
    'client_id': 'AQ1m3BD1QilgWxOstMw3GuSSsit3W8uoN36NMQxlzDs_iF1m70-XI5cyeQWn',
    'client_secret': 'EKPO6BB35T7v-u1pS_OGTJZepROWqc1m_gYBhps8dIrrY9979iKFjw8tM0_o'
};

paypal_api.configure(paypal_config_opts);


app.get('/pay', function(req,res) {


    var invoiceDescription ="Increasing credit for {Team} in Booltin";

  var   PaymentType='accountpay';
if(req.query.jbp=='1')
{
    PaymentType='promotepay';
    invoiceDescription ="Promoting job board payment";
}



    pay( req.user.teamID, req.query.amount,invoiceDescription,PaymentType, function(err, approval_url) {
        if( !err )
            res.redirect(approval_url);
    } );

})

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
            balance += parseFloat(transactions[i].amount);

            if( Math.abs(transactions[i].amount) > 0 )
                billings.push( { method: transactions[i].method, state:transactions[i].state, time: transactions[i].paymentTime, amount:transactions[i].amount} );
        }

        BTeams.findOne({_id:req.user.teamID}, function(err,team){
            res.send(200,{
                billing: {
                    plan: team.plan,
                    lastRenew: team.planLastRenewDate,
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
                                            //--------------------- Sending email ---------------------
                                            var emailConfig = {
                                                from: "Hireberry",
                                                fromAddress: "job@hireberry.com",
                                                replyAddress: "reply@hireberry.com"
                                            };
                                            var message = {
                                                "html": "New flyer added for promoting :"+'<br>'+"  Flyer ID ="+req.body.flyerID+ '<br>'+"  Team ID ="+req.body.teamID,
                                                "text": "New flyer added for promoting :"+'<br>'+"  Flyer ID ="+req.body.flyerID+ '<br>'+"  Team ID ="+req.body.teamID,
                                                "subject": "Promoting Job",
                                                "from_email": emailConfig.fromAddress,
                                                "from_name": emailConfig.from,
                                                "to": [{
                                                    "email": "hossein.pejman@yahoo.com",
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