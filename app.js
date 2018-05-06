const express = require('express');
const app = express();
const path = require('path');
const server = require('http').Server(app);
const socket = require('./socket/index');
const io = require('socket.io')(server);
const _sockets = [];


// 静态资源
app.use(express.static(path.join(__dirname, 'public')));
app.set('views',path.join(__dirname,'./views'));
app.set('view engine','ejs');

server.listen(3000,'127.0.0.1',function () {
    console.log("server running at 127.0.0.1:3000");
});

// app.get('/',function (req,res) {
//     res.redirect('/index.html');
// });

app.get('/index.html', function (req, res) {
    res.render('index', function (err, html) {
        if (err) {
            console.error("读取index.ejs错误", err);
            res.render('error', function (err, html) {
                if (err) {
                    console.error("读取error.ejs文件错误", err);
                    res.send('<h1 style="font-size: 2em; text-align: center;">4 0 4</h1>')
                } else {
                    res.send(html, {message: 404, error: {status: err.status, stack: err.stack}});
                }
            })
        } else {
            res.send(html);
        }
    })
});

app.get('/', function(req, res){
    res.render('login', function (err, html) {
        if (err) {
            console.error("读取login.ejs错误", err);
            res.render('error', function (err, html) {
                if (err) {
                    console.error("读取error.ejs文件错误", err);
                    res.send('<h1 style="font-size: 2em; text-align: center;">4 0 4</h1>')
                } else {
                    res.send(html, {message: 404, error: {status: err.status, stack: err.stack}});
                }
            })
        } else {
            res.send(html);
        }
    })
});

var user = {
  number: 0,
  aliveNum:0,
  userArr: [],
  checkName: function (name,type,status) {
      var flag = 0;
      var index;
      for(var i=0;i<this.number;i++){
          if(this.userArr[i].username === name){
              console.log("flag=1");
              flag = 1;
              index = i;
              break;
          }
      }
      if(flag){
          switch(type){
              case 0:
                  return true;
              case 1:
                  this.userArr[index].status = status;
                  return true;
              case 2:
                  return index;
          }
      }else{
          return false;
      }
  },
  add: function (nameObj,status) {
      var name = nameObj.username;
      var original_status = status || 1;
      var flag = this.checkName(name,0);
      // 不存在
      if(!flag){
          var user = {
              username:name,
              status: original_status
          };
          this.userArr.push(user);
          this.number++;
          this.aliveNum =  this.number;
          return true;
      }else{
          console.log("已经存在了");
          return false;
      }
  },
  delete:function (name) {
      var index = this.checkName(name,2);
      if(index){
          if(this.userArr[index].status){
              this.aliveNum--;
          }
          index--;
          this.userArr.splice(index,1);
          this.number--;
      }else{
          console.log("不存在");
          return false;
      }
  },
  come: function (name) {
      var flag = this.checkName(name,1,1);
      if(flag){
          this.aliveNum++;
      }
      return this.aliveNum;
  },
  leave:function (name) {
      var flag = this.checkName(name,1,0);
      if(flag){
          this.aliveNum--;
      }
      return this.aliveNum;
  },
  getNum: function () {
      return this.number;
  },
  getList: function () {
      return this.userArr;
  }
};

//为即将来到的套接字监听connection事件
io.on('connection',function (socket) {
    console.log("已经连接上了");
    // 用户登陆，同名则认为是同一人
    socket.on('login',function (data) {
       if(user.add(data,1)) {
           socket.emit('loginSuccess');
       }else{
           console.log("广播通知");
           socket.broadcast.emit('usernameErr',{err: '用户名存在'});
       }
    });
    socket.on('getInfo',function () {
        console.log("广播通知");
        var number = user.getNum();
        socket.emit('userInfo',{number:number,userList:user.getList()})
        socket.broadcast.emit('userInfo',{number:number,userList:user.getList()})
    });
    //关闭窗口，表示下线
    socket.on('disconnect',function () {
        //user.aliveNum--;
        console.log("下线");
    });
    //拖动div
    socket.on('dragDiv',function (data) {
        socket.emit('is_dragging',{id:data.div_id,name:data.user_name});
        socket.broadcast.emit('is_dragging',{id:data.div_id,name:data.user_name});
    })
});

module.exports = app;