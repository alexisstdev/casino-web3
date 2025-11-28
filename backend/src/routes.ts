import { Router } from "express";
import { Controller } from "./controller.js";

const router = Router();

router.get("/game-state/:address", Controller.getGameState);

router.post("/sign-flip", Controller.signFlip);

export default router;
