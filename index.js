import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";

const app = express();

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

app.use(cors());
app.use(express.json());

mongoClient.connect().then(() => {
	db = mongoClient.db("test"); //Alterar para projeto12-batepapo-uol-api
});

app.listen(5000, () => console.log('Listening on port 5000'));
