const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const path = require('path');
const users = [];      //存储所有用户
var usersNum = 0;
const _sockets = [];
var socket;

// io.on('connection',function (socket) {
//
// });

module.exports = socket;