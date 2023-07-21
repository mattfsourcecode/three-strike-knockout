const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");
const clientJsPath = path.join(distDir, "client.js");

fs.unlink(clientJsPath, (err) => {
  if (err) {
    console.error("Error deleting client.js from dist:", err);
  } else {
    console.log("client.js deleted from dist directory.");
  }
});
