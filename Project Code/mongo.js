// mongo.js
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://fahim367:Qer8K4ngUkmbLSh2@blockchainproject.83rvv.mongodb.net/?retryWrites=true&w=majority&appName=BlockchainProject";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToMongoDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
    console.log("Connected to MongoDB");
  }
  return client.db("BlockchainProject");
}

module.exports = connectToMongoDB;

