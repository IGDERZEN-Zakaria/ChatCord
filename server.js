const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

// io.on('connection', (socket) => {
//   console.log('a user connected');
//   socket.on('disconnect', () => {
//     console.log('user disconnected');
//   });
// });

//Run when a client connects
io.on("connection", (socket) => {
  //console.log(`New WS Connection ...`);
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome Current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord !!!"));

    //(Runs) Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit("message", formatMessage(botName, `${user.username} has joined the chat`));

    //Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // To all the clients in general
  //io.emit();

  //To the single connected client

  //Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    //console.log(msg);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // to all clients excpet the single connected client
  //Runs when a user disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );
      //Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server Running on http://localhost:${PORT}...`));
