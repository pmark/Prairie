Package.describe({
  summary: "Node wrapper for Trello's HTTP API."
});

Npm.depends({"node-trello": "0.1.3"});

Package.on_use(function (api) {
  api.add_files("trello.js", "server");
})
