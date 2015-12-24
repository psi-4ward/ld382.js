'use strict';

const net = require('net');
const EventEmitter = require('events');
const dgram = require('dgram');
const os = require('os');
const Netmask = require('netmask').Netmask;
const debugNet = require('debug')('LD382:net');
const debugCmd = require('debug')('LD382:cmd');
const BROADCAST_PORT = 48899;


class LD382 extends EventEmitter {

  constructor(host, port, opts) {
    super();
    if(!port) port = 5577;
    if(!opts) opts = {};
    if(typeof opts.retry === 'undefined') opts.retry = 2000;

    this.options = opts;
    this.host = host;
    this.port = port;
    this.connected = false;
    this.retrying = false;
    this.closed = false;
    this.connect(host, port);

    //this.white = new White(this);
    //this.rgb = new RGB(this);
  }


  connect() {
    this.closed = false;
    debugNet(`Connecting to ${this.host}:${this.port}`);
    this.con = net.connect({
      host: this.host,
      port: this.port
    });

    this.con.on('error', (err) => {
      debugNet(`Connection error ${this.host}:${this.port}`, err);
      this.emit('error', err);
    });
    this.con.on('connect', () => {
      this.connected = true;
      this.retrying = false;
      debugNet(`Connection to ${this.host}:${this.port} established`);
      this.emit('connected');
    });
    this.con.on('close', (had_error) => {
      this.connected = false;
      if(had_error) {
        debugNet(`Connection to ${this.host}:${this.port} closed due errors`);
      } else {
        debugNet(`Connection to ${this.host}:${this.port} closed`);
      }
      this.emit('close', had_error);

      if(this.options.retry && !this.closed) {
        if(!this.retrying) debugNet(`Retrying connection every ${this.options.retry}ms`);
        this.retrying = true;
        setTimeout(() => {
          this.connect(this.host, this.port);
        }, this.options.retry);
      }
    });
    this.con.on('end', () => {
      debugNet(`Connection to ${this.host}:${this.port} ended`);
    });
    this.con.on('lookup', (err) => {
      if(err) {
        this.emit('error', err);
      }
    });
  }


  disconnect() {
    this.closed = true;
    this.con.end();
  }


  send() {
    if(!this.connected) {
      debugNet('Socket not connected, aborting send');
      return;
    }

    let cb = false;
    let codes = [].slice.call(arguments);
    if(typeof codes[codes.length-1] === 'function') cb = codes.pop();
    if(typeof codes[codes.length-1] === 'undefined') codes.pop();

    // add checksum
    codes.push(codes.reduce((sum, val) => sum + val, 0) & 0xFF);

    let cmd = new Buffer(codes, 'hex');
    this.con.write(cmd, () => {
      debugNet('Wrote:', codes.map(code => '0x'+code.toString(16)).join(' '));
      if(cb) cb();
    });
  }


  static scan(cb) {
    // Get all boradcast addresses
    let boradcasts = [];
    let ifaces = os.networkInterfaces();
    Object.keys(ifaces).forEach(function (ifname) {
      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) return;
        let netmask = new Netmask(iface.address, iface.netmask);
        boradcasts.push(netmask.broadcast);
      });
    });
    debugNet("Boradcast Addresses:", boradcasts);

    // open socket
    let result = [];
    let client = dgram.createSocket("udp4");
    client.bind(BROADCAST_PORT);

    // enable broadcasting
    client.on('listening', function () {
      client.setBroadcast(true);
      debugNet("Listening on Port", BROADCAST_PORT);
    });

    // listen for messages
    client.on('message', function (message, rinfo) {
      message = message.toString();
      if(rinfo.port !== BROADCAST_PORT || message === msg.toString()) return;
      debugNet(`Boradcast msg from ${rinfo.address}:`, message);
      if(result.indexOf(message) > -1) return;
      result.push(message);
    });

    // send discover msg a few times
    const msg = new Buffer("HF-A11ASSISTHREAD");
    let interval = setInterval(() => {
      boradcasts.forEach((ip) => {
        debugNet(`Broadcasting ${msg} to ${ip}`);
        client.send(msg, 0, msg.length, BROADCAST_PORT, ip);
      });
    }, 300);

    // end after 3s
    setTimeout(() => {
      debugNet("End scanning");
      clearInterval(interval);
      client.close();
      if(cb) cb(null, result);
    }, 3000);
  }

  
  poweron(cb) {
    debugCmd('Power on');
    this.send(0x71, 0x23, 0x0F, cb);
  }


  poweroff(cb) {
    debugCmd('Power off');
    this.send(0x71, 0x24, 0x0F, cb);
  }


  white(bright, cb) {
    debugCmd('Set white to ' + bright);
    this.send(0x31, 0xff, 0xff, 0xff, bright, 0x00, 0x0f, cb);
  }


  rgb(r,g,b,cb) {
    debugCmd(`Set Red:${r}, Green:${g}, Blue:${b}`);
    this.send(0x31, r, g, b, 0x00, 0x00, 0x00, 0x30, cb);
  }

}

module.exports = LD382;
