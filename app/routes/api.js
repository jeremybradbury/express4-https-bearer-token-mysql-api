var mysql = require("mysql");
function REST_ROUTER(router,connection,app) {
  var self = this;
  self.handleRoutes(router,connection,app);
}
// TODO: POST `/api/request-token` endpoint required: email/password
REST_ROUTER.prototype.handleRoutes = (router,connection,app) => {
  // API home routes
  router.route("/")
    .get((req, res) => {
      var msg = {
        description: "This is a list of available endpoints and documentation.",
        "API Endpoints":  {
          User: {
            create: { POST: app.baseUrl + "/api/users/" },
            read: { GET: app.baseUrl + "/api/user/:id" },
            update: [{ PUT: app.baseUrl + "/api/user/:id" }, { PUT: app.baseUrl + "/api/password-reset/:id" }],
            delete: { DELETE: app.baseUrl + "/api/user/:id" },
            index: { GET: app.baseUrl + "/api/users/" }
          }
        },
        "API Documentation": {
          User: {
            create: { POST: app.baseUrl + "/docs/users/" },
            read: { GET: app.baseUrl + "/docs/user/:id" },
            update: [{ PUT: app.baseUrl + "/docs/users/" }, { PUT: app.baseUrl + "/docs/password-reset/" }],
            delete: { DELETE: app.baseUrl + "/docs/user/:id" },
            index:{ GET: app.baseUrl + "/docs/users/" }
          }
        }
      };
      res.json({ Error: false, Message: msg });
    }); 
  // User routes
  var userRoutes = require("./api/users")(router,connection,app); // duplicate & modify this line and `app/routes/api/user.js` for more API tables/objects
  
  
  // Auto Model routes. Remove or comment to disable and/or Override auto routing with specific models like for Users above this
  var autoRoutes = require("./api/auto")(router,connection,app); // auto routes for tables prefixed with `api_`   
}
module.exports = REST_ROUTER;