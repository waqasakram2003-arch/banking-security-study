import express from "express";
import { createTransfer, lookupTransferRecipient, verifyTransactionPin } from "../controllers/transferController.js";

const router = express.Router();

router.post("/lookup-recipient", lookupTransferRecipient);
router.post("/verify-pin", verifyTransactionPin);
router.post("/send", createTransfer);

export default router;