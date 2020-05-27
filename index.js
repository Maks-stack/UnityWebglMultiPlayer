const express = require('express');
const path = require('path');
const { createServer } = require('http');
const WebSocket = require('ws');

const app = express();

const server = createServer(app);
const wss = new WebSocket.Server({ server });

const port = 5555;

//custom classes
var Player = require('./Classes/Player.js')

var players = []
var sockets = []

app.get('/', function(req, res){
    res.sendFile(__dirname + '/Game/index.html');
});

app.use('/', express.static(__dirname));
app.use(express.static('Game'))

wss.on('connection', function(ws) {
    console.log("client joined.");

    var player = new Player()
    var thisPlayerId = player.id

    players[thisPlayerId] = player
    sockets[thisPlayerId] = sockets

    ws.send(JSON.stringify(
        {
            message: "register",
            data: {
                id: thisPlayerId
            }
        })
    )
    ws.send(
        JSON.stringify({
            message: 'spawn',
            data: {
                player:player
            }
        })
    )

    wss.clients.forEach(function each(client) {
        if (client !== ws) {
            client.send(
                JSON.stringify({
                    message: 'spawn',
                    data: {
                        player:player
                    }
                }));
        }
    })

    for(var playerID in players){
        if(playerID != thisPlayerId){
            ws.send(JSON.stringify(
                {
                    message: "spawn",
                    data: {
                        player : players[playerID]
                    }
                })
            )
        }
    }

    ws.on('message', function(data) {
        var jsonData = JSON.parse(data)

        if(jsonData.message === "updateposition"){
            player.position.x = jsonData.player.position.x
            player.position.y = jsonData.player.position.y
            
            wss.clients.forEach(function each(client) {
                if (client !== ws) {
                    client.send(
                        JSON.stringify({
                            message: 'updateposition',
                            data: {
                                player:player
                            }
                        }));
                }
            })
        }

    });

    ws.on('close', function() {
        console.log("client left.");

        delete players[thisPlayerId]
        delete sockets[thisPlayerId]

        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(
                    JSON.stringify({
                        message: 'disconnected',
                        data: {
                            player:player
                        }
                    }));
            }
        })
    });

    for(var playerID in players){
        console.log(playerID)
    }
});

server.listen(port, function() {
  console.log('Listening on http://localhost:' + port);
});
