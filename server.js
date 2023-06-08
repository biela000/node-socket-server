const WebSocket = require('ws');

let lobbies = [];

const server = new WebSocket.Server(
	{ port: 4444 }, () => {
		console.log("Websocket working on port 4444");
	});

server.on('connection', (clientSocket, req) => {
	const clientIPAddress = req.connection.remoteAddress;

	clientSocket.on('message', (message) => {
		const parsedMessage = JSON.parse(message);
		switch (parsedMessage.type) {
			case 'CREATE_LOBBY':
				lobbies.push({
					admin: clientSocket,
					players: [],
					playerCount: 0,
					lobbyId: parsedMessage.payload.lobbyName,//Math.random().toString(36).substring(7),
					lobbyName: parsedMessage.payload.lobbyName,
				});
				console.log(lobbies);
				break;
			case 'JOIN_LOBBY':
				const lobbyToJoin = lobbies.find(lobby => lobby.lobbyId === parsedMessage.payload.lobbyId);
				if (lobbyToJoin) {
					lobbyToJoin.players.push(clientSocket);
					clientSocket.id = `${lobbyToJoin.lobbyId}_${lobbyToJoin.playerCount++}`;
				}
				// Send message to the admin of the lobby that a new player has joined
				lobbyToJoin.admin.send(JSON.stringify({
					type: 'PLAYER_JOINED',
					payload: {
						playerId: clientSocket.id,
						playerName: parsedMessage.payload.playerName,
					}
				}));
				console.log(clientSocket.id);
				break;
			case 'PLAYER_MOVE':
				const lobby = lobbies.find(lobby => lobby.lobbyId === parsedMessage.payload.lobbyId);
				if (lobby) {
					lobby.admin.send(JSON.stringify({
						type: 'PLAYER_MOVE',
						payload: {
							playerId: clientSocket.id,
							acceleratorParams: {
								x: parsedMessage.payload.x,
								y: parsedMessage.payload.y,
								z: parsedMessage.payload.z,
							}
						}
					}));
				}
			default:
				break;
		}
	});
});