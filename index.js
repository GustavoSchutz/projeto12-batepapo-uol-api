import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';

const app = express();

// const headersUserSchema = joi.string().required;

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
	const userValidation = userSchema.validate(user);

	if (userValidation.error) {
		console.log(userValidation.error.details);
		return res.sendStatus(422);
	}
	
	const findUser = await db.collection("participants").findOne({name: user.name});

	if (findUser) {
		return res.sendStatus(409);
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
	
	const user = req.headers.user;

	// const userValidation = headersUserSchema.validate(user);

	// if (userValidation.error) {
	// 	console.log(userValidation.error.details);
	// 	return res.sendStatus(422);
	// }


	const messageValidation = messageSchema.validate(message);

	if (messageValidation.error) {
		console.log(messageValidation.error.details);
		return res.sendStatus(422);
	}

	const findUser = await db.collection("participants").findOne({name: user});

	if (!findUser) {
		return res.sendStatus(422);
	}

	await db.collection("messages").insertOne({
		to: message.to,
		text: message.text,
		type: message.type,
		from: user,
		time: dayjs().format('HH:mm:ss')
	});


	res.sendStatus(201);

});

app.get("/messages", async (req, res) => {
	const limit = parseInt(req.query.limit);
	const user = req.headers.user;

	const findMessages = await db.collection('messages').find({}).toArray();

	// checar possibilidade de filtrar com o mongo!!!

	const messages = filterMessages(findMessages, user);

	if (!limit) {
		return res.send(messages);
	}

	res.send(messages.slice(-(limit))).status(201);

});

function filterMessages(arr, user) {
	const filteredArray = [];

	for (let index = 0; index < arr.length; index++) {
		const element = arr[index];

		if (element.to === user || element.to === "Todos" || element.type === 'message') {
			filteredArray.push(element);
		}
		
	}

	return filteredArray;
};

app.post("/status", async (req, res) => {
	const user = req.headers.user;

	const userTime = await db.collection("participants").findOne({name: user});

	try {
		console.log(userTime)
	} catch {
		return res.sendStatus(500);
	}

	console.log()


})


app.listen(5000, () => console.log('Listening on port 5000'));
