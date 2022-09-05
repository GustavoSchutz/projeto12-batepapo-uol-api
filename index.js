import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import joi from 'joi';

const app = express();

const userSchema = joi.object({
	name: joi.string()
		.required()
});
const messageSchema = joi.object({
	to: joi.string().required(),
	text: joi.string().required(),
	type: joi.string().valid('message', 'private_message').required()
})

app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("test"); //Alterar para projeto12-batepapo-uol-api
}).catch(() => console.log(error));

app.post("/participants", async (req, res) => {
	const user = req.body;
	const validation = userSchema.validate(user);

	if (validation.error) {
		console.log(validation.error.details);
		return res.sendStatus(422);
	}


	try {

		const findUser = await db.collection("participants").findOne({name: user.name});

		if (findUser) {
			return res.sendStatus(409);
		}

	} catch (error) {
		res.sendStatus(500);
	}

	await db.collection("participants").insertOne({
		name: user.name,
		lastStatus: Date.now()
	})
	res.sendStatus(201);
});

app.get("/participants", async (req, res) => {

	try {
		const participants = await db.collection("participants").find({}).toArray();

		res.send(participants);

	} catch (error) {
		console.log(error);
		res.sendStatus(500);
	}
	
});

app.post("/messages", async (req, res) => {
	const message = req.body;



})



app.listen(5000, () => console.log('Listening on port 5000'));
