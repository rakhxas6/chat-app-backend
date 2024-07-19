import express from "express";
import dotenv from "dotenv";
// import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";

import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import adminRoute from "./routes/admin.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/events.js";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
// import { corsOptions } from "./constants/config.js";

dotenv.config({
  path: "./.env",
});

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "6pProgram";
const userSocketIDs = new Map();

connectDB(mongoURI);

const app = express();
const server = createServer(app);
const io = new Server(server, {});

//using middlwares here
app.use(express.json());
app.use(cookieParser());
// app.use(cors(corsOptions));

app.use((req, res, next) => {
  console.log("All Cookies: ", req.cookies);
  next();
});

app.use("/user", userRoute);
app.use("/chat", chatRoute);
app.use("/admin", adminRoute);

app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

io.use((socket, next) => {});

io.on("connection", (socket) => {
  const user = {
    _id: "adafsds",
    name: "afsafsad",
  };

  userSocketIDs.set(user._id.toString(), socket.id);

  console.log("a user connected", socket.id);
  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      chat: chatId,
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      chat: chatId,
      content: message,
      sender: user._id,
    };

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT, {
      chatId,
    });

    try {
      await Message.create(messageForDB);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    userSocketIDs.delete(user._id.toString());
  });
});

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`Server is running on port ${port} in ${envMode} Mode`);
});

export { envMode, adminSecretKey, userSocketIDs };
