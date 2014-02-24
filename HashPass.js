///**
// * Created by Bijan on 2/23/14.
// */
//
//console.log('eh');
//var passwordHash = require('password-hash');
//
//var hashedPassword = passwordHash.generate('password123');
//
//console.log(hashedPassword);
//
//var hash = require('./lib/password-hash');
//
// hashedPassword = 'sha1$3I7HRwy7$cbfdac6008f9cab4083784cbd1874f76618d2a97';
//
//console.log(hash .verify('password123', hashedPassword)); // true
//console.log(hash .verify('Password0', hashedPassword)); // false
var crypto = require('crypto'),
    salt = crypto.randomBytes(128).toString('base64'),
    key;

crypto.pbkdf2( 'password', salt, 1, 512,
    function(err, dk) {
        key = dk;
        isPassword('password',salt,key);
        console.log(dk);
    }
);

function isPassword(password,salt,key){
    crypto.pbkdf2( password, salt, 1, 512,
        function(err, dk) {
            console.log(dk);
            console.log(key);
            if(key===dk){
                console.log('true');
            }else console.log('false');
//            console.log(err);
//            console.log(dk);
        }
    );

}