// 视频流
let stream
// socket
let socket
// peerConnection连接
let connection
// 我方视频标签对象
let localVideo = document.getElementById('local-video')
// 对方视频标签对象
let remoteVideo = document.getElementById('remote-video')
// 拨通按钮
let callBtn = document.getElementById('call-btn')
// 挂断按钮
const hangupBtn = document.getElementById('hangup-btn')
// 房间号
let roomInput = document.getElementById('room-id')
// 拨通容器
const callContainer = document.getElementById('call-container')
// 挂断容器
const hangupContainer = document.getElementById('hangup-container')

// 点击拨通按钮
callBtn.onclick = function () {
    // 配置轨道类型
    let option = {
        video: {
            width: 551,
            height: 445,
        },
        // display: true,
        audio: true
    }
    // 获取媒体设备对象
    let devices = navigator.mediaDevices
    // 获取媒体轨道数据
    devices.getMediaTracks(option)
        .then(function (tracks) {
            // 将「轨道数据」合并为「流数据」
            stream = devices.mixTracks(tracks)
            // 设置视频源，展示我方视频
            localVideo.srcObject = stream
            // socket操作
            socket_conn()
        })
    // 调整页面显示
    callUI()
}

// 点击挂断按钮
hangupBtn.onclick = function () {
    socket.emit('离开', roomInput.value)
}

// socket操作
function socket_conn() {
    // 创建socket连接
    socket = io.connect('https://ybc-case-test.zhenguanyu.com/')
    // 发送信令：'加入'
    socket.emit('加入', roomInput.value)
    // 接收信令："已加入"
    socket.on('已加入', function () {
        console.log('已加入')
        // 创建连接对象
        connection = new YBCPeerConnection()
        // 发送媒体流
        connection.sendStream(stream)
        // 接收媒体流
        connection.receiveStream(function (stream) {
            // 设置媒体源
            remoteVideo.srcObject = stream
        })
    })
    // 接收信令："对方加入"
    socket.on('对方加入', function () {
        console.log('对方加入')
        // 获取offer
        connection.getOffer(function (offer) {
            // 发送信令：'提议'
            socket.emit('提议', roomInput.value, offer)
        })
    })
    socket.on('提议', function (offer) {
        // 保存offer
        connection.saveOffer(offer)
        // 获取answer
        connection.getAnswer(function (answer) {
            // 发送信令：'回应'
            socket.emit('回应', roomInput.value, answer)
        })

    })
    socket.on('回应', function (answer) {
        // 保存answer
        connection.saveAnswer(answer)
    })
    // 接收信令："双方就绪"
    socket.on('双方就绪', function () {
        console.log('双方就绪')
        // 获取地址
        connection.getAddress(function (address) {
            // 发送信令：'地址'
            socket.emit('地址', roomInput.value, address)
        })
    })
    // 接收信令："地址"
    socket.on('地址', function (address) {
        // 保存地址
        connection.saveAddress(address)
    })
    // 接收信令："已离开"
    socket.on('已离开', function () {
        console.log('已离开')
        // 断开socket连接
        socket.disconnect()
        // 断开peerConnection连接
        connection.close()
        // 获取轨道数据
        let tracks = stream.getTracks()
        // 停止轨道数据传输
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].stop()
        }
        // 调整页面显示
        hangupUI()
    })
    // 接收信令："对方离开"
    socket.on('对方离开', function () {
        console.log('对方离开')
        // 清空视频源
        remoteVideo.srcObject = null
    })
    // 接收信令："房间已满"
    socket.on('房间已满', function () {
        console.log('房间已满')
        // 断开socket连接
        socket.disconnect()
        let tracks = stream.getTracks()
        for (let i = 0;i < tracks.length;i++) {
            tracks[i].stop()
        }
        // 调整页面显示
        roomFullUI()
    })
}

// ****************调整页面显示*******************

function callUI() {
    callContainer.hidden = true
    hangupContainer.hidden = false
}
function hangupUI() {
    callContainer.hidden = false
    hangupContainer.hidden = true
    roomInput.value = ''
}
function roomFullUI() {
    hangupUI()
    alert('房间已满')
}


