module.exports = function(url) {
	var matches;
	matches = url.match(/\/([0-9]+)(\/|([\?\#].*)?$|-[0-9]+x[0-9]+-)/);
	return (matches) ? matches[1] || false : false;
}
