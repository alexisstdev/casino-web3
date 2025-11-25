import { Router } from "express";
import { CryptoFlipController } from "./controller.js";

const router = Router();

router.get("/game-state/:address", CryptoFlipController.getGameState);

router.post("/sign-flip", CryptoFlipController.signFlip);

export default router;
