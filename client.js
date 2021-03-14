const ws = new WebSocket('ws://localhost:5500');
ws.onopen = (ws) => {
    console.log('client connected');
};

const loginBtn = document.getElementById('loginButton');
const sendBtn = document.getElementById('sendButton');
const innerPage = document.querySelector('.innerpage');
const chatPage = document.querySelector('.chatpage');
const userName = document.querySelector('#user-name');
const userList = document.querySelector('.user-list');
const messageList = document.querySelector('#message-list');
const messageInput = document.querySelector('#message-input');
const formMessage = document.querySelector('#frame').innerHTML;
const avatar = document.querySelector('#avatar');
let storage = localStorage;
let avatarData;

// Событие входа в чат
loginBtn.addEventListener('click', function(event) {
    const login = document.getElementById('name').value;
    if (login === '') {
        alert('Введите имя!!');
    } else {
        event.preventDefault();
        const request = {
            type: 'login',
            payload:{
                name: login
            }
        }
        avatarData = setAvatar(login);
        innerPage.style.display = 'none';
        chatPage.style.display = 'flex';
        userName.textContent = login;
        ws.send(JSON.stringify(request));
    }
});

// Событие отправки сообщений на сервер по клику на кнопку
sendBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const message = messageInput.value;
    const request = {
        type: 'message',
        payload:{
            message: message,
            name: userName.textContent,
            avatar: avatarData
        }
    }
    ws.send(JSON.stringify(request));
    messageInput.value = '';
});
// Событие отправки сообщений на сервер по нажатию Enter
messageInput.addEventListener('change', function(event) {
    event.preventDefault();
    const message = messageInput.value;
    const request = {
        type: 'message',
        payload:{
            message: message,
            name: userName.textContent,
            avatar: avatarData
        }
    }
    ws.send(JSON.stringify(request));
    messageInput.value = '';
});

// ОБработка ответов от сервера
ws.onmessage = function (message) {
    const response = JSON.parse(message.data);
    switch (response.type){
        case 'login':
            if (response.payload.status === 200) {
                addToUserList(response);
            }else{
                console.error('Error');
            }
            break;
        case 'userIn':
            if (response.payload.status === 200) {
                userToMessageList(response);
            }else{
                console.error('Error');
            }
            break;
        case 'message':
            if (response.payload.status === 200) {
                addToMessageList(response);
            }else{
                console.error('Error');
            }
            break;
        case 'changeAva':
            if (response.payload.status === 200) {
                changeAva(response);
            }else{
                console.error('Error');
            }
            break;
        case 'clientLeft':
            if (response.payload.status === 200) {
                removeFromUserList(response);
                if (response.payload.name !== undefined) {
                    userFromMessageList(response);
                }
            }else{
                console.error('Error');
            }
            break;
    }
};

// Добавление клиента в список пользователей боковой панели 
function addToUserList(response) {
    const userItem = document.createElement('li');
    userItem.classList.add('user-item');
    userItem.textContent = `${response.payload.name}`;
    userList.appendChild(userItem);
}

// Удаление клиента из списка боковой панели при выходе из чата
function removeFromUserList(response) {
    const userArr = document.querySelectorAll('.user-item');
    for (const userItem of userArr) {
        if (userItem.textContent === `${response.payload.name}`) {
            userList.removeChild(userItem);
        }
    }
}

// Добавление сообщения в чат
function addToMessageList(response) {
    const messageItem = document.createElement('li');
    messageItem.innerHTML = formMessage;
    messageItem.classList.add('message-item');
    const ava = messageItem.querySelector('.messageFrame__img');
    const nickname =  messageItem.querySelector('.messageFrame__name');
    const text =  messageItem.querySelector('.messageFrame__text');
    ava.src = response.payload.avatar;
    nickname.textContent = `${response.payload.name}`;
    text.textContent = `${response.payload.message}`;
    messageList.appendChild(messageItem);
}

// Функция добавления сообщения 'Клиент вошел в чат'
function userToMessageList(response) {
    const messageItem = document.createElement('li');
    messageItem.innerHTML = formMessage;
    messageItem.classList.add('message-item');
    messageItem.textContent = `${response.payload.name} вошел в чат`;
    messageList.appendChild(messageItem);
}

// Функция добавления сообщения 'Клинет вышел из чата'
function userFromMessageList(response) {
    const messageItem = document.createElement('li');
    messageItem.innerHTML = formMessage;
    messageItem.classList.add('message-item');
    messageItem.textContent = `${response.payload.name} вышел из чата`;
    messageList.appendChild(messageItem);
}

// Смена аватара перетаскиванием

document.addEventListener('drop', (e) => {
    e.preventDefault();
})

avatar.addEventListener('dragover', (e) => {
    if (e.dataTransfer.items.length && e.dataTransfer.items[0].kind === 'file') {
        e.preventDefault();
    }
});

avatar.addEventListener('drop', (e) => {
    const file = e.dataTransfer.items[0].getAsFile();
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('load', () => {
        avatar.src = `${reader.result}`;
        avatarData = `${reader.result}`;
        const request = {
            type: 'changeAva',
            payload: {
                avatar: avatarData,
                name: userName.textContent
            }
        }
        avaToStorage(request.payload);
        ws.send(JSON.stringify(request));
    });
});

// Замена аватарки у всех сообщений

function changeAva(response) {
    const messageArr = document.querySelectorAll('.messageFrame');
    for (const item of messageArr) {
        const img = item.querySelector('.messageFrame__img');
        const name = item.querySelector('.messageFrame__name');
        if (name.textContent === response.payload.name) {
            img.src = response.payload.avatar;
        }
    }
}

//Запись объекта с данными клиента в storage

function avaToStorage(user) {
    let dataFromStorage;
    let avatarData;
    debugger;
    if (!storage.users) {
        dataFromStorage = [];
    } else {
        dataFromStorage = JSON.parse(storage.users);
    };
    let haveUserInStorage = false;
    for (const item of dataFromStorage) {
        if (item.name === user.name) {
            avatarData = item.avatar;
            haveUserInStorage = true;
        };
    }; 
    if (!haveUserInStorage) {
        dataFromStorage.push(user);
    };
    storage.users = JSON.stringify(dataFromStorage);
}

// Установка аватара из storage, либо стандартной картинкой

function setAvatar(login) {
    debugger;
    let dataFromStorage;
    let avatarData;
    if (!storage.users) {
      dataFromStorage = [];
    } else {
      dataFromStorage = JSON.parse(storage.users);
    };
    let haveAvaInStorage = false;
    for (const item of dataFromStorage) {
        if (item.name === login) {
            avatarData = item.avatar;
            haveAvaInStorage = true;
        }
    };
    if (!haveAvaInStorage) {
        avatarData = `./img/no-photo.png`;
    }
    avatar.src = avatarData;
    return avatarData;
};