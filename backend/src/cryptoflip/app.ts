import express, { type Express } from "express";
import cors from "cors";
import routes from "./routes.js";
import { eventListener } from "./service.js";

const app: Express = express();
const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

app.use("/api/cryptoflip", routes);

app.listen(PORT, async () => {
	console.log(`Running: http://localhost:${PORT}/api/cryptoflip`);

	try {
		await eventListener.startListening();
	} catch (error) {
		console.error("❌ Error starting event listener:", error);
	}
});

export default app;
