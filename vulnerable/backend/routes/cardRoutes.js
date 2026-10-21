import express from "express";
import { applyForCard, getCardOptions, getUserCardStats } from "../controllers/cardController.js";

const router = express.Router();

router.get("/options", getCardOptions);
router.get("/user/:userId", getUserCardStats);
router.post("/apply", applyForCard);

export default router;