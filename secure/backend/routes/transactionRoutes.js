import express from "express";
import { createTransaction, getUserTransactions, getRecentTransactions, deleteTransaction } from "../controllers/transactionController.js";

const transactionRoutes = express.Router();

// Create a transaction
transactionRoutes.post("/create", createTransaction);

// Get all transactions for a user (with optional limit)
transactionRoutes.get("/user/:userId", getUserTransactions);

// Get recent transactions for a user
transactionRoutes.get("/user/:userId/recent", getRecentTransactions);

// Delete a transaction
transactionRoutes.delete("/:transactionId", deleteTransaction);

export default transactionRoutes;
