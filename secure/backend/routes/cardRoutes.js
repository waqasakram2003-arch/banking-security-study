import express from "express";
import { applyForCard, getCardOptions, getUserCards } from "../controllers/cardController.js";

const router = express.Router();

router.get("/options", getCardOptions);
router.get("/user/:userId", getUserCards);
router.post("/apply", applyForCard);

export default router;