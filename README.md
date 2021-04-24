# coriolis-api
An API that converts [Elite: Dangerous](https://www.elitedangerous.com/) Loadout event entries to the ship json format
used by [Coriolis](https://coriolis.io/).

## Scope of this project
The original purpose of this project is its implementation in my project [EDNeutronAssistant](https://github.com/Gobidev/EDNeutronAssistant).
As I have planned to integrate the [exact spansh plotter](https://www.spansh.co.uk/exact-plotter) API into this program,
I searched for a way to convert the loadout event entries of the Elite: Dangerous
log to the ship json format used by coriolis, as this is required for the spansh route calculation and has use in other parts of the
program. Because all the conversion operations of Coriolis are done client-side, there was no easy way for me to interface
with the conversion functions of Coriolis with my python program. Therefore, I decided to create a NodeJS based API that
utilizes the existing JavaScript functions of Coriolis to allow for an easy implementation in python. To avoid having to
constantly update the API when new ships or modules are added to the game, I made a python script (generate_api.py) that
automatically generates the NodeJS API file from the [Coriolis GitHub](https://github.com/EDCD/coriolis) repository.

## Using the API
My own instance of this API is running at ``https://coriolis-api.gobidev.de``.
To convert a loadout event to a Coriolis JSON, send a POST request to ``https://coriolis-api.gobidev.de/convert`` with
the loadout event as a JSON in the request body. The converted Coriolis build will be sent back as a JSON.

## Building the API
If you are on Linux, or have the option to run bash on Windows (i.e. by using git bash), building the API is as easy as
cloning this repository, installing the required node modules with ``npm i`` and then executing build.sh. Note that NodeJS
as well as python3.9 or higher (might also work with earlier versions) have to be installed for this to work.

## Running the API
After building the API it can be run by executing index.js with ``node index.js``. Per default, it listens on port 7777/tcp
and requests are processed on http://localhost:7777/convert. Requests must be POST requests with a JSON body that matches
an Elite: Dangerous loadout event. 