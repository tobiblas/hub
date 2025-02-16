# hub
Home automation

This is my first ever node project. Structure might not be optimal but it seems to work. 

Structure:

FRONTEND:

public/ here are all html and javascript for the home automation frontend. Should be served by web server. WEb root should point to this folder.

BACKEND:

server.js this is the main backend file. 

views/ here are templates (EJS) that are used to provide html to frontend.

OTHER APPS:

poolpump/ this is its own application that runs in its own node process. Saves data in poolpump/data.json and this is used to fill the templates in views/
the purpose of this app is the evaluate electricity prices and determine when is the best time to run the poolpump. It will also control the pump via API.


