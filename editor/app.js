const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);
app.use(cors());
app.options("*", cors());
const serverPort = 3330;

app.get("/data", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const data = JSON.parse(fs.readFileSync("data/data.json", "utf-8"));
  res.json(data);
});

app.post("/save", (req, res) => {
  fs.writeFileSync("data/data.json", req.body.data, "utf-8");
  res.end("Success");
});

app.listen(serverPort, () => {
  console.log(`Campus Map listening at http://localhost:${serverPort}`);
});
