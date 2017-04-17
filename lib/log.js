const winston  = require('winston');
const token = process.env.LOGGLY_TOKEN;
require('winston-loggly-bulk');

if (token) {
  winston.add(winston.transports.Loggly, {
    inputToken: token,
    subdomain: "abcnews",
    tags: ["facebook-groupshare"],
    json:true,
    handleExceptions: true,
    humanReadableUnhandledException: true
  });
}

// Export only the API we want. This will make replacing the logger easier in future if required.
['error', 'warn', 'info', 'verbose', 'debug', 'silly', 'profile'].forEach(method => module.exports[method] = winston[method]);
