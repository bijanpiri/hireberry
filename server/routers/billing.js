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
    pay( req.user.teamID, req.query.amount, function(err, approval_url) {
        if( !err )
            res.redirect(approval_url);
    } );
})

app.get('/api/billing', function(req,res) {
    BTransactions.find( {teamID: req.user.teamID, $or:[
        {$and:[{method:'paypal'},{state:'sold'}]},
        {method:'invoice'},
        {method:'promo'}
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
    var success = req.query.success;
    var prayerID = req.query.PayerID;

    BTransactions.findOne({_id:transactionID}, function(err,transaction) {

        if( success==='true' ) {
            BTransactions.update({_id:transactionID},{state:'approved',ECToken:ECToken}, function(err){

                // Execute payment
                var execute_payment_details = { "payer_id": prayerID };
                paypal_api.payment.execute( transaction.PAYToken, execute_payment_details, function(error, payment){
                    if(error){
                        console.error(error);
                        res.redirect('/dashboard#billing');
                    } else {

                        BTransactions.update({_id:transactionID},{
                            state: 'sold',
                            payer: payment.payer,
                            paymentTime: payment.update_time
                        }, function(err){
                            console.log(payment);
                            res.redirect('/dashboard#billing');
                        });
                    }
                });
            })
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