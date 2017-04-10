Camo = require('camo-url');
module.exports = Camo({
  host: 'https://imgs.abcnewsdigital.com',
  key: process.env.CAMO_KEY || '0x24FEEDFACEDEADBEEFCAFE',
  type: 'path'
});
