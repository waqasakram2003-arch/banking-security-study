import mongoose from "mongoose";
import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";

export async function createTransaction(req, res) {
  try {
    const { userId, accountId, type, amount, description, referenceNumber, fromTo, status } = req.body;

    if (!userId || !accountId || !type || !amount || !description) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const transaction = new Transaction({
      user: userId,
      account: accountId,
      type,
      amount,
      description,
      referenceNumber: referenceNumber || "",
      fromTo: fromTo || "",
      status: status || "completed"
    });

    await transaction.save();

    return res.status(201).json({
      message: "Transaction created successfully",
      transaction
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getUserTransactions(req, res) {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const user = await User.findById(userId).select("account");
    const orConditions = [{ user: userId }];
    if (user && user.account) orConditions.push({ account: user.account });

    const query = Transaction.find({ $or: orConditions }).sort({ createdAt: -1 });
    if (limit) query.limit(parseInt(limit));

    const transactions = await query;

    return res.status(200).json({
      transactions,
      count: transactions.length
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getRecentTransactions(req, res) {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 3;

    const user = await User.findById(userId).select("account");
    const orConditions = [{ user: userId }];
    if (user && user.account) orConditions.push({ account: user.account });

    const transactions = await Transaction.find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      transactions,
      count: transactions.length
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findByIdAndDelete(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    return res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
