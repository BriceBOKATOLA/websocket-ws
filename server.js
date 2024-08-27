const { WebSocketServer } = require('ws');

// Crée un nouveau serveur WebSocket écoutant sur le port 8080
const sockserver = new WebSocketServer({ port: 8080 });

const clients = new Map(); // Stocke les noms d'utilisateur des clients et les WebSockets

// Fonction pour gérer les nouvelles connexions
function onConnection(ws) {
    console.log('New client connected!');
    // Envoi de message de connexion uniquement en log
    console.log('System: Connection established');

    // Envoyer une notification à tous les clients qu'un nouveau client s'est connecté
    notifyClients({ type: 'system', message: 'A new client has connected', username: 'System' });

    // Gestion des messages reçus
    ws.on('message', (data) => onMessage(data, ws));

    // Gestion de la déconnexion du client
    ws.on('close', () => {
        console.log('Client has disconnected!');
        // Supprimer le client de la liste
        let disconnectedUser = null;
        clients.forEach((value, key) => {
            if (value === ws) {
                disconnectedUser = key;
                clients.delete(key);
            }
        });

        if (disconnectedUser) {
            notifyClients({
                type: 'system',
                message: `${disconnectedUser} has disconnected.`,
                username: 'System'
            });
        }
    });

    // Gestion des erreurs WebSocket
    ws.on('error', () => {
        console.log('WebSocket error');
    });
}

// Fonction pour envoyer des notifications à tous les clients
function notifyClients(notification) {
    // Ne pas envoyer certains types de messages système
    if (notification.message === 'Connection established' || 
        notification.message.startsWith('A new client has connected')) {
        console.log('System:', notification.message); // Log le message sans l'envoyer aux clients
        return;
    }
    
    sockserver.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            console.log(`Sending notification: ${JSON.stringify(notification)}`);
            client.send(JSON.stringify(notification));
        }
    });
}

// Fonction pour gérer les messages reçus
function onMessage(data, ws) {
    try {
        const message = JSON.parse(data);

        if (message.type === 'username') {
            // Enregistrer le nom d'utilisateur
            const oldUsername = [...clients.entries()].find(([key, value]) => value === ws)?.[0];
            if (oldUsername) {
                clients.delete(oldUsername);
            }
            clients.set(message.username, ws);
            ws.send(JSON.stringify({ type: 'system', message: `Username set to ${message.username}` }));

            // Envoyer une notification à tous les clients qu'un nouvel utilisateur a rejoint
            notifyClients({
                type: 'system',
                message: `${message.username} has joined the chat.`
            });
        } else if (message.type === 'chat' && typeof message.text === 'string' && message.text.trim()) {
            console.log(`Message received from ${message.username}: ${message.text}`);

            if (message.to) {
                // Envoi d'un message ciblé
                const recipientWs = clients.get(message.to);
                if (recipientWs && recipientWs.readyState === recipientWs.OPEN) {
                    recipientWs.send(JSON.stringify({ username: message.from, text: message.text }));
                    console.log(`Message sent to ${message.to}: ${message.text}`);
                } else {
                    ws.send(JSON.stringify({ type: 'system', message: `User ${message.to} is not online` }));
                }
            } else {
                // Diffusion du message à tous les clients connectés
                sockserver.clients.forEach(client => {
                    if (client.readyState === client.OPEN && client !== ws) { // Exclure l'expéditeur de la diffusion
                        const senderUsername = [...clients.entries()].find(([key, value]) => value === ws)?.[0];
                        console.log(`Distributing message from ${senderUsername}: ${message.text}`);
                        client.send(JSON.stringify({ username: senderUsername, text: message.text }));
                    }
                });
            } 
            
        } else {
            console.log('Invalid message received');
        }
    } catch (error) {
        console.error('Error handling message:', error);
    }
}

// Enregistre la fonction de gestion des connexions
sockserver.on('connection', onConnection);

console.log('WebSocket server is running on ws://localhost:8080');
