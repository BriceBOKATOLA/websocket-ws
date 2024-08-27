/*
  @Brice BOKATOLA
 */

const webSocket = new WebSocket('ws://localhost:8080/');

let username = '';

// Fonction appelée lors de l'ouverture de la connexion WebSocket
webSocket.onopen = function(event) {
    console.log('Connected: ', event);
};

// Fonction appelée lors de la réception d'un message
webSocket.onmessage = function(event) {
    try {
        const data = JSON.parse(event.data);

        if (data.type === 'system') {
            addMessage('System', data.message, 'system');
        } else {
            addMessage(data.username, data.text, 'received');
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
};

// Fonction appelée lors d'une erreur WebSocket
webSocket.onerror = function(error) {
    console.error('WebSocket error:', error);
};

// Fonction appelée lors de la fermeture de la connexion WebSocket
webSocket.onclose = function(event) {
    console.log('WebSocket connection closed:', event);
};

// Fonction pour envoyer un message
document.getElementById('chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    if (message) {
        try {
            webSocket.send(JSON.stringify({ type: 'chat', text: message }));
            addMessage(username, message, 'sent');
            messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
            // Afficher une erreur à l'utilisateur
        }
    }
});

// Fonction pour définir le nom d'utilisateur
document.getElementById('set-username').addEventListener('click', function() {
    const usernameInput = document.getElementById('username-input');
    const newUsername = usernameInput.value.trim();
    if (newUsername) {
        username = newUsername;
        try {
            webSocket.send(JSON.stringify({ type: 'username', username: username }));
            document.getElementById('username-container').style.display = 'none';
            document.getElementById('chat-container').style.display = 'block';
            document.getElementById('chat-form').style.display = 'flex';
        } catch (error) {
            console.error('Error setting username:', error);
            // Afficher une erreur à l'utilisateur
        }
    }
});

// Fonction pour ajouter un message à l'affichage
function addMessage(username, message, type) {
    const messageElement = document.createElement('div');
    messageElement.className = `bubble ${type}`;
    messageElement.innerHTML = `<strong>${username}:</strong> ${message}`;
    document.getElementById('messages').appendChild(messageElement);
    document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight;
}
