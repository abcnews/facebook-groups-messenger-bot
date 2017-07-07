module.exports = (done) => {
  var app = require('../../app');
  process.env.NODE_ENV = 'development';
  app.set('port', process.env.PORT || 8000);
  var server = app.listen(app.get('port'), () => done(null, app));
}
