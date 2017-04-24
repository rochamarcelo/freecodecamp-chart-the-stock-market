'use strict';

var request = require('request');
const isValidCode = (code) => code !== null && typeof code !== 'undefined' && code.length >= 2;
const parseData = (err, response, body, callback) => {
    var data = null;
    if (err) {
        return callback("Response got error", data, body, response);
    }
    try {
        data = JSON.parse(body);
    } catch(aError) {
        return callback('Error parsing data', data, body, response);
    }
    if (data && data.dataset && data.dataset.id) {
        return callback(null, data.dataset, body, response);
    }

    return callback("404", data, body, response);
};

const getData = (url, callback) => {
    request(url, (err, response, body) => {
        parseData(err, response, body, callback);
    });
}
const metadata = (code, callback) => {
    if (!isValidCode(code)) {
        return callback("404", null, null, null);
    }
    let url = "https://www.quandl.com/api/v3/datasets/WIKI/" + code.toUpperCase() + "/metadata.json?api_key=" + process.env.QUANDL_KEY;
    getData(url, callback);
}
const daily = (code, callback) => {
    if (!isValidCode(code)) {
        return callback("404", null, null, null);
    }
    let now = new Date();
    let startDate = (now.getFullYear() - 1) + "-" + now.getMonth() + '-' + now.getDate();
    let url = "https://www.quandl.com/api/v3/datasets/WIKI/" + code.toUpperCase() 
        + ".json?api_key=" + process.env.QUANDL_KEY
        + "&start_date=" + startDate + "&order=asc";
    getData(url, callback);
}
module.exports = {metadata, daily};