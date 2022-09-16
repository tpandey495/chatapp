var express= require('express');
var path= require('path');
var app= express();
var server=require('http').Server(app);
var io=require('socket.io')(server);
var bodyParser=require('body-parser');
var session= require('express-session');
var con=require('./database/db');

users = [];
connections = [];
var username;


//middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ extended: true}));
app.use(session({secret: 'tom-riddle'}));


app.get('/' , function (req , res) {
    authenticate(req , res);
});

app.get('/chat_start' , function (req , res) {
    authenticate(req , res);
});


app.get('/login' , function (req , res) {
    authenticate(req , res);
});

app.post('/login' , function (req , res) {
    login(req , res);
});
app.get('/logout', function (req, res) {
    delete req.session.user;
    res.redirect('/login');
});

function chat_start() {
    io.sockets.on('connection', function (socket) {
        connections.push(socket);
        socket.on('disconnect', function (data) {
            connections.splice(connections.indexOf(data), 1);
            });

        socket.on('initial-messages', function (data) {
            var sql = "SELECT * FROM message ";
            con.query(sql, function (err, result, fields) {
                var jsonMessages = JSON.stringify(result);
                 io.sockets.emit('initial-message', {msg: jsonMessages});
            });
        });
        socket.on('username', function (data) {
			socket.emit('username', {username: username});

        });



        socket.on('send-message', function (data, user) {
			
            var sql = "INSERT INTO message (message , user) VALUES ('" + data+ "' , '"+user+"')";
            con.query(sql, function (err, result) {
                if (err) throw err;
                });
            io.sockets.emit('new-message', {msg: data , username : user});
        })
    })
}
chat_start();


function login(req,res){
    var post = req.body;
     username  = post.user;
    var password = post.password;
    var sql = "SELECT * FROM login WHERE username='" + username+"'";
    con.query(sql, function (err, result, fields) {
		if (result.length === 1) {
			var jsonString = JSON.stringify(result);
			var jsonData = JSON.parse(jsonString);
			if(jsonData[0].password === password) {
			    req.session.user = post.user;
				username = post.user;
				res.redirect("/chat_start");
			}else  {
				
				res.redirect("/login");
			}
		} else {
			res.redirect("/login");
		}
    });
}

function checkuser() {
	if (!req.session.user) {
        return 0;
    }
    else {
        return req.session.user;
    }
}

function authenticate(req,res){
    
    if (!req.session.user) {
        res.sendFile(__dirname + '/public/login.html');
    }
    else {
        username = req.session.user;
        res.sendFile(__dirname + '/public/chat.html');
    }
}

server.listen(3000, function(){
    console.log('listening on *:3000');
});



