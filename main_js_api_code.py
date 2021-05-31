
api_constant_imports = """
const Dist = require('./coriolis-data/dist/index');
const LZString = require('lz-string');
const Lodash = require('lodash');
const zlib = require('zlib');
const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const app = express();
const fs = require('fs')"""

main_api_js = """
app.post("/convert", jsonParser, (req, res) => {

  var shipName = req.body.ShipName
  
  let ship = shipFromLoadoutJSON(req.body)
  ship.updateStats()
  
  let response = toDetailedBuild(shipName, ship, ship.toString())

  // Get client information for log
  let logInformation = {"headers:": req.headers, "shipName": shipName}
  console.log(JSON.stringify(logInformation))

  // Save converted build
  buildToBeAdded = response.references[0].url
  console.log(buildToBeAdded)

  // Test if file exists
  if (!fs.existsSync("conversions.json")) {
    fs.writeFile("conversions.json", "[]", err => {
      if (err) {
        console.error(err)
        return
      }
    })
  }
  
  fs.readFile("conversions.json", function (err, data) {
    var json = JSON.parse(data)
    json.push([+new Date(), buildToBeAdded])

    fs.writeFile("conversions.json", JSON.stringify(json, null, 4), err => {
      if (err) {
        console.error(err)
        return
      }
    })
  })

  res.type("json")
  res.send(response)
})

app.listen(7777, () => {
    console.log("API started successfully")
})
"""