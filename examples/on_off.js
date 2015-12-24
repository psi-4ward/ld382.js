'use strict';
if(!process.env.DEBUG) process.env.DEBUG = 'LD382:*';

let LD382 = require('../index');

let wifiled = new LD382('192.168.12.69');

wifiled.on('error', function() {
  // not needed, we use debug
});

wifiled.on('connected', function() {
  wifiled.poweron();

  let i = 0;
  setInterval(function() {
    ( i % 2 ) ? wifiled.poweron() : wifiled.poweroff();
    i++;
  },2500);
});

