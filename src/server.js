import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", { useNewUrlParser: true });
    const db = client.db("spennycreative");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error, something went wrong", error });
  }
};

app.get("/api/project/:name", async (req, res) => {
  withDB(async db => {
    const projectName = req.params.name;
    const projectsInfo = await db.collection("projects").findOne({ name: projectName });

    res.status(200).json(projectsInfo);
  }, res);
});

app.post("/api/project/:name/upvote", async (req, res) => {
  withDB(async db => {
    const projectName = req.params.name;
    const projectsInfo = await db.collection("projects").findOne({ name: projectName });
    await db.collection("projects").updateOne(
      { name: projectName },
      {
        $set: {
          upvotes: projectsInfo.upvotes + 1
        }
      }
    );
    const updatedProjectInfo = await db.collection("projects").findOne({ name: projectName });
    res.status(200).json(updatedProjectInfo);
  }, res);
});

app.post("/api/project/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const projectName = req.params.name;

  withDB(async db => {
    const projectsInfo = await db.collection("projects").findOne({ name: projectName });
    await db.collection("projects").updateOne(
      { name: projectName },
      {
        $set: {
          comments: projectsInfo.comments.concat({ username, text })
        }
      }
    );
    const updatedProjectInfo = await db.collection("projects").findOne({ name: projectName });
    res.status(200).json(updatedProjectInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => console.log("Listening on port 8000"));
