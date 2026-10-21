import express from "express";
import { createTransfer, lookupTransferRecipient } from "../controllers/transferController.js";

const router = express.Router();

router.post("/lookup-recipient", lookupTransferRecipient);
router.post("/send", createTransfer);

export default router;
