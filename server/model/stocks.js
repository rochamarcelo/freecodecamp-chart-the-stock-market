'use strict';

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var Stock = new Schema({
   code: String,
   name: String
});
Stock.statics.createNew = function(code, name, callback){
  this.findOne({code}).exec((err, data) => {
    if (err) {
        return callback(err);
    }
    console.log(data);
    if (!data || !data._id) {
        console.log('create new', code, name);
        let doc = new this({code, name});
        return doc.save(callback);
    }
    callback(null, data);
  });
}

module.exports = mongoose.model('Stock', Stock);