import express from "express";
import mongoose from "mongoose";
import Posts from "./postModel.js";
import Cors from "cors";
import Pusher from "pusher";
import dotenv from "dotenv";

//App Config
dotenv.config();
const pusher = new Pusher({
  appId: process.env.PUSHER_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "ap2",
  useTLS: true,
});

const app = express();
const port = process.env.PORT || 9000;
const connection_url = process.env.DB_CONN;

//Middleware
app.use(express.json());
app.use(Cors());

//DB Config
mongoose.connect(connection_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once("open", () => {
  console.log("DB Connected");
  const changeStream = mongoose.connection.collection("posts").watch();
  changeStream.on("change", (change) => {
    console.log(change);
    if (change.operationType === "insert") {
      console.log("Trigerring Pusher");
      pusher.trigger("posts", "inserted", {
        change: change,
      });
    } else {
      console.log("Error trigerring Pusher");
    }
  });
});

//API Endpoints
app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"));

app.post("/upload", (req, res) => {
  const dbPost = req.body;
  Posts.create();
  Posts.create(dbPost)
    .then((data) => {
      res.status(201).send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});
app.get("/sync", (req, res) => {
  Posts.find()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send(err);
    });
});

//Listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`));
