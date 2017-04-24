module.exports = function requestSerializer(req) {
    return {
        method: req.method,
        url: req.url,
        headers: req.headers
    };
}
