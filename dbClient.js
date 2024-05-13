// dbClient.js
const { MongoClient } = require("mongodb");
const { MONGODB_URL, DATABASE_NAME } = require("./constants");
const uri = MONGODB_URL;

let client;

async function connectToDatabase() {
  if (!client) {
    console.log(`Connecting to MongoDB at ${uri}`);
    client = new MongoClient(MONGODB_URL, {
      family: 4, // Force IPv4
      connectTimeoutMS: 10000, // Optional: Set a timeout limit for connections
      serverSelectionTimeoutMS: 10000, // Optional: Set a timeout for server selection
    });
    await client.connect();
    console.log("Connected to MongoDB");
  }
  return client;
}

function getDatabase() {
  return client.db(DATABASE_NAME);
}

async function closeConnection() {
  if (client) {
    await client.close();
    console.log("Disconnected from MongoDB");
    client = null;
  }
}

module.exports = { connectToDatabase, getDatabase, closeConnection };
