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

	await db.collection("messages").insertOne({
		to: 'Todos',
		text: 'entra na sala...',
		type: 'status',
		from: user.name,
		time: dayjs().format('HH:mm:ss')
	});

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

	const lastStatus = Date.now();

	// console.log("user: ", user);

	try {
		const isUser = await db.collection('participants').findOne({name: user});
	
		if (!isUser) {
		  return res.sendStatus(404);
		}
		
		await db.collection('participants').updateOne({name: user}, {$set: { lastStatus }})
	
		return res.sendStatus(200);
	
	  } catch (error) {
		console.log(error)
		return res.sendStatus(500);
	  }

});


setInterval( async () => {
    // buscar intervalos com mais de 10 * 1000 segundos de diferen??a

	const time = Date.now();
	const timeOut = time - (10 * 1000);

	try {
		
		const expiredUsers = await db.collection('participants').find({lastStatus: {$lte: timeOut }}).toArray();

		for (let i = 0; i < expiredUsers.length; i++) {
			const element = expiredUsers[i];
			
			await db.collection("messages").insertOne({
				to: 'Todos',
				text: 'sai da sala...',
				type: 'status',
				from: element.name,
				time: dayjs().format('HH:mm:ss')
			});
			
			await db.collection("participants").deleteOne({name: element.name});
		}

		console.log(expiredUsers);
	} catch (error) {
		console.log(error)
	}

	

}, 3 * 1000); // 60 * 1000 milsec

app.listen(5000, () => console.log('Listening on port 5000'));
