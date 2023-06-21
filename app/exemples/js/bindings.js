const req = new XMLHttpRequest();
req.open('GET', document.location, false);
req.send(null);
const bindings = JSON.parse(req.getResponseHeader('binding'))
const options = JSON.parse(req.getResponseHeader('options'))
