var socket = io(); 
socket.on('client-login-failed', function () {
    alert('Dang nhap sai. Tai khoan da ton tai');
})
socket.on('client-login-success', function (data) {
    $('#loginForm').slideUp();
    $('#onlineList').show(2000);
    $('#roomList').show(2000);
    $('#chatBox').show(2000);
    // $('.user_info').children('span').html(`Chat all server`);
})
socket.on('load-online-list', function (data) {
    $('#viewOnlineList').html('');
    data.forEach(function (d) {
        let txt = `<li class="active"><div div class="d-flex bd-highlight"><div class="img_cont"><img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg" class="rounded-circle user_img"><span class="online_icon"></span></div><div class="user_info"><span>${d}</span><p>${d} is online</p></div></div></li >`
        $('#viewOnlineList').append(txt)
    })
})

socket.on('client-receive-msg', function(content){
    let txt = `<div class="d-flex justify-content-start mb-4">
                <div class="img_cont_msg">
                    <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                        class="rounded-circle user_img_msg">
                </div>
                <div class="msg_cotainer">
                    ${content}
                </div>
            </div>`
    $('#msg_container').append(txt);
    scrollToBottom()
})
socket.on('client-typing', function () {
    $('#typing').show(500);
    play();
})
socket.on('client-typing-out', function() {
    $('#typing').hide(500);
    pause();
})
socket.on('client-typing-zoom', function () {
    $('#typing_zoom').show(500);
    play();
})
socket.on('client-typing-out-zoom', function () {
    $('#typing_zoom').hide(500);
    pause();
})

socket.on('load-current-rooms', function(roomList) {
    $('#viewRoomList').html('')
    roomList.forEach((room) => {
        let txt = `<div class="bg-dark text-light p-2 my-2">
                    <button type="button" class="btn btn-outline-light joinRoom">Join</button>
                    <span class="ml-2">${room}</span>
                </div>`
                
        $('#viewRoomList').append(txt)
    })
})
socket.on('server-send-msg-zoom', function(msg){
    let txt = `<div class="d-flex justify-content-start mb-4">
                <div class="img_cont_msg">
                    <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                        class="rounded-circle user_img_msg">
                </div>
                <div class="msg_cotainer">
                    ${msg}
                </div>
            </div>`
    $('#msg_container_zoom').append(txt);
    scrollToBottomZoom()
})

var audio = new Audio('typing.wav');
function play() {
    audio.play();
}
function pause() {
    audio.pause();
}

function scrollToBottom(){
    let frame = document.getElementById('msg_container');
    frame.scrollTop = frame.scrollHeight;
}
function scrollToBottomZoom() {
    let frame = document.getElementById('msg_container_zoom');
    frame.scrollTop = frame.scrollHeight;
}
//Video Streaming
function openStream(){
    const config = {
        audio: false,
        video: true
    }
    return navigator.mediaDevices.getUserMedia(config)
}

function playStream(vidId, stream){
    const video = document.getElementById(vidId);
    video.srcObject = stream;
    video.play()
}

$((function () {
    const peer = new Peer();
    peer.on('open', id => {
        $('#peerID').append(id);
        
    })
    $('#btnCall').on('click', function () {
        const id = $('#remoteID').val();
        openStream()
            .then(stream => {
                playStream('localStream', stream);
                const call = peer.call(id, stream);
                call.on('stream', remoteStream => {
                    playStream('remoteStream', remoteStream);
                })
            })
    })
    
    peer.on('call', call => {
        openStream()
            .then(stream => {
                call.answer(stream);
                playStream('localStream', stream);
                call.on('stream', remoteStream => {
                    playStream('remoteStream', remoteStream);
                });

            })
    })




















    $('#action_menu_btn').on('click', function () {
        $('.action_menu').toggle();
    });
    let chatbox = $('#chatBoxZoom');
    const height = chatbox.height();
    const width = chatbox.width();
    $('#action_menu_btn_zoom').on('click', function (e) {

        if (chatbox.height() == 50){
            chatbox.animate({ width: `${width}px` }).animate({ height : `${height}px`})
        } else {
            chatbox.animate({ height: '50px' }).animate({ width: `${width/1.3}px` })
        }
    })
    //An zoom chat
    $('#onlineList').hide();
    $('#chatBox').hide();
    $('#chatBoxZoom').hide();
    $('#typing').hide();
    $('#typing_zoom').hide()
    $('#roomList').hide();

    $('#loginBtn').on('click', function () {
        socket.emit('client-login', $('#username').val());
    })
    $('#logout').on('click', function () {
        socket.emit('client-logout')
        $('.action_menu').toggle();
        $('#loginForm').show(1000);
        $('#onlineList').hide();
        $('#roomList').hide();
        $('#chatBox').hide();
        $('#chatBoxZoom').hide()
    })
    $('#send_btn').on('click', function(){
        let content = $('#type_msg').val();
        let txt = `<div class="d-flex justify-content-end mb-4">
                <div class="msg_cotainer_send">
                   ${content}
                </div>
                <div class="img_cont_msg">
                    <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                        class="rounded-circle user_img_msg">
                </div>
            </div>`
        $('#msg_container').append(txt);
        socket.emit('client-send-msg', content);
        $('#type_msg').val('');
        scrollToBottom();
    })

    $('#type_msg').on('keydown', function (e){
        if (e.keyCode === 13) {
            $('#send_btn').click();
            return false;
        } else {
            return true;
        }
    })

    $('#type_msg').on('focusin', function(){
        socket.emit('client-typing')
    })
    $('#type_msg').on('focusout', function () {
        socket.emit('client-typing-out')
    })

    $('#type_msg_zoom').on('focusin', function () {
        socket.emit('client-typing-zoom')
    })
    $('#type_msg_zoom').on('focusout', function () {
        socket.emit('client-typing-out-zoom')
    })


    $('#btnCreateRoom').on('click', function(){
        socket.emit('client-create-room', $('#txtCreateRoom').val())
        $('#txtCreateRoom').val('')
    })
    $('#viewRoomList').on('click', function(e){
        if (e.target.classList.contains('joinRoom')){
            let roomname = e.target.nextElementSibling.innerHTML
            $('#status').html('Chat in room');
            $('#currentPosition').html(`${roomname}`)
            $('#msg_container_zoom').html('')
            $('#chatBoxZoom').show()
            socket.emit('client-join-room', roomname)
        }
    })
    $('#type_msg_zoom').on('keydown', function (e) {
        if (e.keyCode === 13) {
            $('#send_btn_zoom').click();
            return false;
        } else {
            return true;
        }
    })
    $('#send_btn_zoom').on('click', function () {
        let content = $('#type_msg_zoom').val();
        let txt = `<div class="d-flex justify-content-end mb-4">
                <div class="msg_cotainer_send">
                   ${content}
                </div>
                <div class="img_cont_msg">
                    <img src="https://static.turbosquid.com/Preview/001292/481/WV/_D.jpg"
                        class="rounded-circle user_img_msg">
                </div>
            </div>`
        $('#msg_container_zoom').append(txt);
        socket.emit('client-send-msg-zoom', content);
        $('#type_msg_zoom').val('');
        scrollToBottomZoom();
    })
    }
))

    