const express = require('express');
const http = require("http");
const app = express();
const server = http.createServer(app);

//SocketIO
const { Server } = require("socket.io");
const io = new Server(server);

//Static path
app.use(express.static('public'))

const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const exHandlebars = require('express-handlebars').create({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
    handlebars: allowInsecurePrototypeAccess(require('handlebars')) //FIXED ERROR */
});
app.engine('hbs', exHandlebars.engine);
app.set('view engine', 'hbs');

//Routing
app.get('/', function(req, res) {
    res.render('index');
})

const userConnected = [];

const roomList = [];

io.on('connection', (socket) => {
    console.log('Co nguoi ket noi: ' + socket.id);
    console.log(socket.adapter.rooms)
    
    socket.on('client-login', (data) => {
        if (userConnected.indexOf(data) > -1)
        {
            socket.emit('client-login-failed')
        } else {
            console.log(data);
            socket.username = data;
            userConnected.push(data);
            socket.emit('client-login-success', data)
            io.sockets.emit('load-online-list', userConnected);
            io.sockets.emit('load-current-rooms', roomList);
        }        
    })
    socket.on('client-logout', function(){
        userConnected.splice(userConnected.indexOf(socket.username),1);
        socket.broadcast.emit('load-online-list', userConnected);
    })
    
    socket.on('client-send-msg', function(msg){
        socket.broadcast.emit('client-receive-msg', msg)
    })

    socket.on('client-typing', function(){
        socket.broadcast.emit('client-typing')
    })

    socket.on('client-typing-out', function() {
        socket.broadcast.emit('client-typing-out')
    })
    socket.on('client-typing-zoom', function () {
        socket.broadcast.in(socket.currentRoom).emit('client-typing-zoom')
    })

    socket.on('client-typing-out-zoom', function () {
        socket.broadcast.in(socket.currentRoom).emit('client-typing-out-zoom')
    })

    socket.on('client-create-room', function(data) {
        if (data !== '' && roomList.indexOf(data) == -1) {
            roomList.push(data)
        }
        // console.log(roomList)
        io.sockets.emit('load-current-rooms', roomList)
    })
    socket.on('client-join-room', function(data){
        socket.join(data);
        socket.currentRoom = data;
        for (const x of socket.adapter.rooms.keys()){
            console.log(x)
        }
    })
    socket.on('client-send-msg-zoom', function(data){
        socket.broadcast.in(socket.currentRoom).emit('server-send-msg-zoom', data)
    })
    socket.on('disconnect', () => {
        console.log(socket.id + ' da ngat ket noi');
        if (userConnected.indexOf(socket.username) > -1){
            userConnected.splice(userConnected.indexOf(socket.username), 1);
        }
        socket.broadcast.emit('load-online-list', userConnected);
    })
});

//Port configuration
app.set('port', (process.env.PORT || 3010));
server.listen(app.get('port'), function () {
    console.log('listening on port ' + app.get('port'));
});
