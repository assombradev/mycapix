"use strict";
/* Conexão MongoDB com cache para serverless (reusa o client entre invocações). */
var MongoClient = require("mongodb").MongoClient;

var dbName = process.env.MONGODB_DB || "cashnopix";

/* Usa só a base da URI (sem query string) e define as opções pelo driver.
   Robusto a truncamento da env var no painel (ex.: "?retryWrites" sem "=true&w=majority"). */
function cleanUri() {
  var uri = process.env.MONGODB_URI || "";
  var q = uri.indexOf("?");
  return q > -1 ? uri.slice(0, q) : uri;
}

var cached = global.__cnpMongo;
if (!cached) cached = global.__cnpMongo = { client: null, promise: null };

async function getDb() {
  if (cached.client) return cached.client.db(dbName);
  if (!cached.promise) {
    cached.promise = MongoClient.connect(cleanUri(), {
      serverSelectionTimeoutMS: 8000,
      retryWrites: true,
      w: "majority"
    });
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
