
api_constant_imports = """
const Dist = require('./coriolis-data/dist/index');
const LZString = require('lz-string');
const Lodash = require('lodash');
const zlib = require('zlib');
const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const app = express();"""

main_api_js = """
app.post("/convert", jsonParser, (req, res) => {

  var shipName = req.body.ShipName
  
  let ship = shipFromLoadoutJSON(req.body)
  ship.updateStats()
  
  let response = toDetailedBuild(shipName, ship, ship.toString())

  // Get client information for log
  let clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  let logInformation = {"clientIP": clientIP, "headers:": req.headers, "shipName": shipName}
  console.log(JSON.stringify(logInformation))

  res.type("json")
  res.send(response)
})

app.listen(7777, () => {
    console.log("API started successfully")
})
"""