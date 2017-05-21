var mysql = require("mysql");
function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
}

REST_ROUTER.prototype.handleRoutes= function(router,connection,md5) {
    // api routes
    router.route('/')
        .get(function(req, res) {
            var msg = {
                description: 'This is a list of available endpoints and documentation.',
                endpoints:  {
                    User: {
                        create: { POST:   app.baseUrl + '/api/users/' },
                        read:   { GET:    app.baseUrl + '/api/user/:id' },
                        update: { PUT:    app.baseUrl + '/api/user/:id' },
                        delete: { DELETE: app.baseUrl + '/api/user/:id' },
                        index:  { GET:    app.baseUrl + '/api/users/' }
                    },
                    CurrentUser: {
                        read:    { GET:   app.baseUrl + '/api/user/' }
                    }
                },
                documentation:  {
                    User: {
                        create: { POST:   app.baseUrl + '/docs/users/' },
                        read:   { GET:    app.baseUrl + '/docs/user/:id' },
                        update: { PUT:    app.baseUrl + '/docs/user/:id' },
                        delete: { DELETE: app.baseUrl + '/docs/user/:id' },
                        index:  { GET:    app.baseUrl + '/docs/users/' }
                    },
                    CurrentUser: {
                        read:    { GET:   app.baseUrl + '/docs/user/' }
                    }
                }
            };
            res.json({ Error: false, Message: msg });
    });
    router.route('/users')
        .get(function(req, res, next) { // Index
            var query = "SELECT * FROM ??";
            var table = ["user_login"];
            query = mysql.format(query,table);
            connection.query(query,function(err,rows){
                if(err) {
                    meJSON = {"Error" : true, "Message" : "Error executing MySQL query"};
                    res.json(meJSON);
                    app.errorLogger.error(meJSON.Message);
                } else {
                    meJSON = {"Error" : false, "Message" : "Success", "Users" : rows};
                    res.json(meJSON);
                    app.errorLogger.info(meJSON.Message);
                }
            });
        })
        .post(function(req, res, next) { // Create
            var query = "INSERT INTO ??(??,??) VALUES (?,?)";
            var table = ["user_login","user_email","user_password",req.body.email,md5(req.body.password)];
            query = mysql.format(query,table);
            connection.query(query,function(err,rows){
                if(err) {
                    meJSON = {"Error" : true, "Message" : "Error executing MySQL query"};
                    res.json(meJSON);
                    app.errorLogger.error(meJSON.Message);
                } else {
                    meJSON = {"Error" : false, "Message" : "User Added !"};
                    res.json(meJSON);
                    app.errorLogger.info(meJSON.Message);
                }
            });
    });
    router.route('/user/:id')
        .get(function(req, res, next) { // Read
            var query = "SELECT * FROM ?? WHERE ??=?";
            var table = ["user_login","user_id",req.params.id];
            query = mysql.format(query,table);
            connection.query(query,function(err,rows){
                if(err) {
                    meJSON = {"Error" : true, "Message" : "Error executing MySQL query"};
                    app.errorLogger.err(meJSON.Message);
                    res.json(meJSON);
                } else {
                    meJSON = {"Error" : false, "Message" : "Success", "Users" : rows};
                    app.errorLogger.info(meJSON);
                    res.json(meJSON);
                }
            });
        })
        .put(function(req, res, next) { // Update
            var query = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
            var table = ["user_login","user_password",md5(req.body.password),"user_email",req.body.email];
            query = mysql.format(query,table);
            connection.query(query,function(err,rows){
                if(err) {
                    meJSON = {"Error" : true, "Message" : "Error executing MySQL query"};
                    res.json(meJSON);
                    app.errorLogger.error(meJSON.Message);
                } else {
                    meJSON = {"Error" : false, "Message" : "Updated the password for email "+req.body.email};
                    res.json(meJSON);
                    app.errorLogger.info(meJSON.Message);
                }
            });
        })
        .delete(function(req, res, next) { // Delete
            var query = "DELETE from ?? WHERE ??=?";
            var table = ["user_login","id",req.params.id];
            query = mysql.format(query,table);
            connection.query(query,function(err,rows){
                if(err) {
                    meJSON = {"Error" : true, "Message" : "Error executing MySQL query"};
                    res.json(meJSON);
                    app.errorLogger.error(meJSON.Message);
                } else {
                    meJSON = {"Error" : false, "Message" : "Deleted the user "+req.params.id};
                    res.json(meJSON);
                    app.errorLogger.info(meJSON.Message);
                }
            });
    });
}

module.exports = REST_ROUTER;