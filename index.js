'use strict';

const fs = require('fs'),
      path = require('path'),
      http = require('http'),
      mongoUtils = require('./utils/mongoUtils'),
      swaggerUtils = require('./utils/swaggerUtils');

const {TError, TErrorEnum, sendError} = require('./utils/errorUtils');

const app = require('connect')();
const swaggerTools = require('swagger-tools');

const serverPort = 8080;

// Correct the url in swagger-ui-dist that points to some demo (like the petstore)
// And add additional useful options
try {
  fs.copyFileSync(path.join(__dirname, './index.html_replacement'),
          path.join(__dirname, './node_modules/swagger-ui-dist/index.html'));
} catch(err) {
  console.log('Unable to replace swagger-ui-dist/index.html file - something wrong with the installation ??');
  console.error(err);
  process.exit(1);
}

// swaggerRouter configuration
const options = {
  swaggerUi: path.join(__dirname, '/swagger.json'),
  controllers: path.join(__dirname, './controllers'),
  useStubs: process.env.NODE_ENV === 'development' // Conditionally turn on stubs (mock mode)
};

const swaggerDoc = swaggerUtils.getSwaggerDoc();

// Get Component instance name from Environment variable and put it at start of API path
let componentName = process.env.COMPONENT_NAME;
if (!componentName) {
  componentName = 'geographicaddress'; // for local testing, if not set
}
console.log('ComponentName: ' + componentName);

// Update component name in swagger-ui-dist index.html
fs.readFile(path.join(__dirname, './node_modules/swagger-ui-dist/index.html'), 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  let result = data.replace(/url: \"/g, 'url: \"/' + componentName);
  console.log('Updating Swagger UI URLs with component name: ' + componentName);
  fs.writeFile(path.join(__dirname, './node_modules/swagger-ui-dist/index.html'), result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

// Update basePath to include component name
swaggerDoc.basePath = '/' + componentName + swaggerDoc.basePath;
console.log('Updated Swagger basePath to: ' + swaggerDoc.basePath);

// Health check endpoints for Kubernetes probes
app.use('/health', function(req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({status: 'healthy'}));
});

app.use('/ready', function(req, res) {
  // Check if MongoDB is connected
  if (mongoUtils.isConnected && mongoUtils.isConnected()) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: 'ready'}));
  } else {
    res.writeHead(503, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: 'not ready', message: 'MongoDB not connected'}));
  }
});

// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {

  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

 // app.use(function (req, res, next) {
 //     res.header("Access-Control-Allow-Origin", "*"); // CORS should be parametrized by configuration
 //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 //     next();
 // });

  // Validate Swagger requests
  app.use(middleware.swaggerValidator({
        validateResponse: false
  }));

  // Error handling for validation
  app.use(errorHandler);

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  // using the more up-to-date swagger-ui-dist - not the default app.use(middleware.swaggerUi())
  app.use(middleware.swaggerUi({
    apiDocs: swaggerDoc.basePath + 'api-docs',
    swaggerUi: swaggerDoc.basePath + 'docs',
    swaggerUiDir: path.join(__dirname, 'node_modules', 'swagger-ui-dist')
  }));

  mongoUtils.addAddressCollections()
  // Start the server
  http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:' + serverPort + swaggerDoc.basePath + 'docs', serverPort);
  });


});

// handles timed out requests
function haltOnTimedout(req, res, next) {
    if (!req.timedout) {
        next();
    } else {
        debug("\nrequest timed out!\n");
        next("the request timed out", null, null, null, 504);
    }
}

function errorHandler (err, req, res, next) {
  if(err) {
    if(err.failedValidation) {

      // err is something like 
      // {"code":"SCHEMA_VALIDATION_FAILED",
      //       "failedValidation":true,
      //       "results":{
      //         "errors":[
      //               {"code":"INVALID_TYPE",
      //                "message":"Expected type array but found type object",
      //                "path":["serviceQualificationItem"]}
      //               ],
      //         "warnings":[]},
      //       "path":["paths","/serviceQualificationManagement/v3/serviceQualification",
      //               "post","parameters","0"],
      //       "paramName":"ServiceQualification"}

      // rewrite to the TMForum error code format

      const message = err.results.errors.map(item => item.message).join(", ");
      
      const error = new TError(TErrorEnum.INVALID_BODY, message);
      sendError(res,error);

    } else {
      // err.status and err.body in case of syntax error in incoming request
      // not sending the body back

      const error = new TError(TErrorEnum.INVALID_BODY, "Invalid request");
      sendError(res,error);

    }

  } else {
    next(err,req,res);
  }
};
