const express = require('express');
const path = require('path');
const logger = require('morgan');
const exphbs  = require('express-handlebars');
const apicache = require('apicache');
const log = require('./lib/log');
const serializeReq = require('./lib/requestSerializer');

const app = express();

const env = process.env.NODE_ENV || 'development';

app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// view engine setup

app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  partialsDir: ['views/partials/'],
  helpers: {
    checksum: require('./lib/checksumify')
  }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// Cache responses
app.use(apicache.middleware('5 minutes', (req, res) => (res.statusCode === 200 || res.statusCode === 304) && env === 'production'));

// Log some stuff
app.use(logger('dev'));

// Static assets
app.use(express.static(path.join(__dirname, 'public'),{
  maxAge: 2628000000 // one week
}));

// Routes
app.use('/', require('./routes/index'));
app.use('/groupshare', require('./routes/groupshare'));
app.use('/fallback', require('./routes/fallback'));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  err.req = serializeReq(req);
  next(err);
});

// error handlers
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: (app.get('env') === 'development') ? err : {}, // Don't leak stack traces to user
    title: 'Error'
  });
  log.error(err.message, {error: err});
});

module.exports = app;
