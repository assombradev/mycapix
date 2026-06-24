"use strict";
/* Conexão MongoDB com cache para serverless (reusa o client entre invocações). */
var MongoClient = require("mongodb").MongoClient;

var uri = process.env.MONGODB_URI;
var dbName = process.env.MONGODB_DB || "cashnopix";

var cached = global.__cnpMongo;
if (!cached) cached = global.__cnpMongo = { client: null, promise: null };

async function getDb() {
  if (cached.client) return cached.client.db(dbName);
  if (!cached.promise) {
    cached.promise = MongoClient.connect(uri, { serverSelectionTimeoutMS: 8000 });
  }
  cached.client = await cached.promise;
  return cached.client.db(dbName);
}

async function getOrders() {
  var db = await getDb();
  var col = db.collection("orders");
  return col;
}

module.exports = { getDb: getDb, getOrders: getOrders };
