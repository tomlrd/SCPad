const socket = io();
socket.on("connect", () => {
    console.log(socket.id + " connected"); 
});

socket.on("disconnect", () => {
    console.log(socket.id + " disconnected"); 
});