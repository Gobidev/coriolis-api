
api_constant_imports = """
const Dist = require('./coriolis-data/dist/index');
const LZString = require('lz-string');
const Lodash = require('lodash');
const zlib = require('zlib');
const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const app = express();
const winston = require('winston');
const expressWinston = require('express-winston');"""

main_api_js = """
var router = express.Router()

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: true,
  ignoreRoute: function (req, res) { return false; }
}))

app.use(router);

app.post("/convert", jsonParser, (req, res) => {

  var ship = shipFromLoadoutJSON(req.body)
  ship.updateStats()
  var response = toDetailedBuild("MyShip", ship, ship.toString())

  res.type("json")
  res.send(response)
})

app.listen(7777, () => {
    console.log("API started successfully")
})"""