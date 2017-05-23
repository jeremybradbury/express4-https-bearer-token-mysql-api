var express = require('express');
var mysql = require("mysql"), md5 = require('MD5');
var fs = require('fs'), path = require('path'), bodyParser = require('body-parser');
var passport = require('passport'), Strategy = require('passport-http-bearer').Strategy, https = require('https');
var rfs = require('rotating-file-stream'), accessLogger = require('morgan'), winston = require('winston');
// create the venue
var app = express();
function REST(){
    var self = this;
    self.connectMysql();
};
// log access
var logDirectory = path.join(__dirname, 'app/log');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory); // ensure log directory exists
var accessLogStream = rfs('access.log', { // create a rotating write stream
  size:     '10M', // rotate every 10 MB written
  compress: 'gzip', // compress rotated files
  path: logDirectory
});
accessLogger.token('remote-user', (req) => {
    if(req.user){
        return req.user.email; // ignore basic HTTP auth user replace with token owner 
    } else {
        return "aNonUser"; // anonymous login no auth endpoints (like docs)
    }
});
app.accessLogger = accessLogger;
app.use(accessLogger('combined', {stream: accessLogStream})); // morgan likes to log to a rotating file
// log errors
var errorLogger = new winston.Logger({
    transports: [
        new winston.transports.File({ // winston likes to log to a rotating file too
            level: 'info', //  error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
            filename: './app/log/error.log',
            handleExceptions: true,
            json: false,
            maxsize: 10485760, //10MB
            zippedArchive: true,
            colorize: false
        }),
        new winston.transports.Console({ // winston also likes to log to stdout
            level: 'info', //  error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});
module.exports = errorLogger;
module.exports.stream = {
    write: (message, encoding) => {
        errorLogger.info(message);
    }
};
app.errorLogger = errorLogger;
// check token in database, return user
function findByToken(connection, md5, app, token, cb) {
    var query = "SELECT ??, ??, ?? FROM ?? LEFT JOIN ?? ON (??) WHERE ?? = ?;";
    var table = ["token","email","id","user_tokens","users","user_id_fk","token",token];
    query = mysql.format(query,table);
    connection.query(query,function(err,rows){
        if(rows) {
             process.nextTick(function() {
                   for (var i = 0, len = rows.length; i < len; i++) {
                     var row = rows[i];
                     if (row.token === token) {
                       return cb(null, row);
                     }
                   }
                   return cb(null, null);
            });
        }
    });
}
// single connection pool for app
REST.prototype.connectMysql = function() {
    var self = this;
    var pool = mysql.createPool(require('./app/config/database.json'));
    pool.getConnection(function(err,connection){
        if(err) {
          self.stop(err);
        } else {
          self.configureExpress(connection);
        }
    });
}
// setup for the party, mostly give dircetions
REST.prototype.configureExpress = function(connection) {
    var self = this;
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json()); // bodyParser() will let us get the data from a POST
    Auth = passport.authenticate('bearer', { session: false }); // define Auth as Passport Berer module
    app.baseUrl = 'https://localhost:3443'; // global mostly for documentation
    var router = express.Router();
    // ## begin routes ## //
    
    // /api routes for the secure API 
    var api = require("./app/routes/api"); // api routes are defined here
    app.use('/api', Auth, router); // use Auth bearer middleware for these routes
    var api_router = new api(router,connection,md5,app); // create api.js route module
    
    // /docs routes for the Documentation (no Auth currently required)
/*
    var docs = require("./app/routes/docs"); // docs routes are defined here
    app.use('/docs', router); // no Auth added for these routes
    var docs_router = new docs(router,connection,md5,app); // create docs.js route module
*/
    
    // Add more route subfolders here using instructions below //
        // FIRST: copy and rename /app/routes/docs.js to /app/routes/mypath.js
        // SECOND: find and replace "docs" with "mypath" in mypath.js like we did below
        // THIRD: copy & uncomment the example routes below 
        // FOURTH: IK you won't actualy use "mypath" so replace that with in the uncommented copy of the example routes you just made 
        // FIFTH(FIRST): this is forked/versioned right? delete these comments (you may only wish to add/edit routes in api.js & docs.js)
        //* begin example routes *//
           // var mypath = require("./app/routes/mypath"); // mypath routes are defined here
           // app.use('/mypath', Auth, router); // use Auth bearer middleware for these routes (optional)
           // var mypath_router = new docs(router,connection,md5,app);// create mypath.js route module
        //* end example routes *//
        
    // ## end routes ## //
    // guard the doors
    passport.use(new Strategy(
      (token, cb) => {
         findByToken(connection, md5, app, token, (err, user) => {
           if (err) { return cb(err); }
           if (!user) { return cb(null, false); }
           return cb(null, user);
         });
    }));
    self.startServer();
}
// secure with https
REST.prototype.startServer = function() {
    // ideally use a real cert OR generate a new self signed cert quikly (on linux/mac) like this:
      // `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`
    // this is cert is publicly published, and made available to save time/hassle during initial testing
    https.createServer({ key: fs.readFileSync('./app/https/key.pem'), cert: fs.readFileSync('./app/https/cert.pem') }, app)
    .listen(3443, function () {
        app.errorLogger.info('Secure Server listening on port 3443');
    });
}
// handle connection errors
REST.prototype.stop = function(err) {
    app.errorLogger.error("ISSUE WITH MYSQL \n" + err);
    process.exit(1);
}
// time to get the party started
new REST();