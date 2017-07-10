const fs = require('fs');
const path = require('path');
const cs = require('checksum');

let cache = [];

module.exports = function(asset) {

  if (cache[asset]) {
    return cache[asset];
  }

  let file = path.join(__dirname, '..', 'public', asset);

  if ( ! fs.existsSync(file)) {
    return asset;
  }

  cache[asset] = asset + '?' + cs(fs.readFileSync(file));
  return cache[asset];
};
