(function () {
    window.R ={
      url:"http://127.0.0.1:3000",
      user_name:'',
      is_dragging:'',
      index:'0',
      arr:[],
      gridWidth:90,
        connectorPaintStyle : {
            lineWidth: 2,
            strokeStyle: "rgb(0,0,0)",
            joinstyle: "round",
            outlineColor: "rgb(0,0,0)",
            outlineWidth: 0
        },
        connectorHoverStyle : {
            lineWidth: 2,
            strokeStyle: "#000000",
            outlineWidth: 0,
            outlineColor: "rgb(0,0,0)"
        }
    };
    var url = window.R.url;
    var socket = io.connect(url);
    socket.emit('message', 'try');
    var username;
    $("#loginButton").on("click",function (e) {
        var uname = $("#name").val();
        username = uname;
        console.log(uname);
        socket.emit('login',{username:uname});
    });

    socket.on('usernameErr',function (err) {
        console.log(err);
    });

    socket.on('loginSuccess',function () {
         sessionStorage.setItem('username',username);
        // window.R.user_name = username;
         window.location.href = '/index.html';
    });
})();

