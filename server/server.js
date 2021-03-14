const WebSocket = require('ws');

let response;

let clients = {};
let currentId = 1;
let usersJSON = [];
 
const wss = new WebSocket.Server({port: 5500});
wss.on('connection', function connection(ws) {
    const id = currentId++;
    clients[id] = ws;
    ws.on('message', function incoming(message) {
        const request = JSON.parse(message);
        switch (request.type){
            case 'login':
                response = {
                    type: 'login',
                    payload:{
                        status: 200,
                        name: request.payload.name
                    },
                }
                clients[id].username = request.payload.name;
                for(const key in clients) {
                    clients[key].send(JSON.stringify(response));
                }
                response = {
                    type: 'userIn',
                    payload:{
                            status: 200,
                            name: request.payload.name
                        },
                    }
                for(const key in clients) {
                    if (key < id) {
                        clients[key].send(JSON.stringify(response));
                    }
                }
                const user = {
                    name: request.payload.name,
                    avatar: ''
                }
                usersJSON.push(user);
                break;
            case 'message':
                response = {
                    type: 'message',
                    payload:{
                        status: 200,
                        message: request.payload.message,
                        name: request.payload.name,
                        avatar: request.payload.avatar
                    }
                }
                for(const key in clients) {
                    clients[key].send(JSON.stringify(response));
                }
                break;
            case 'changeAva':
                response = {
                    type: 'changeAva',
                    payload:{
                        status: 200,
                        avatar: request.payload.avatar,
                        name: request.payload.name
                    }
                }
                for(const key in clients) {
                    clients[key].send(JSON.stringify(response));
                }
                break;
            default:
                console.log('Unknown request');
                break;
        }
    });
    ws.on('close', function (){
        response = {
            type: 'clientLeft',
            payload:{
                status: 200,
                name: clients[id].username
            }
        };
        delete clients[id];
        for(const key in clients) {
            clients[key].send(JSON.stringify(response));
        }
    });
});


