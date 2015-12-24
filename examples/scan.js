'use strict';

if (!process.env.DEBUG) process.env.DEBUG = 'LD382:*';
let LD382 = require('../index');

LD382.scan(function(err, result) {
  console.log(result.join("\n"));
});


