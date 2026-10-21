import Account from "../models/accountModel.js";
import Application from "../models/applicationModel.js";
import User from "../models/userModel.js";
import Transfer from "../models/transferModel.js";

function normalizeAccountNumber(value) {
  return String(value || "").trim();
}

export async function lookupTransferRecipient(req, res) {
  try {
    const senderUserId = String(req.body?.senderUserId || "").trim();
    const recipientAccountNumber = normalizeAccountNumber(req.body?.recipientAccountNumber);

    if (!senderUserId || !recipientAccountNumber) {
      return res.status(400).json({ message: "senderUserId and recipientAccountNumber are required" });
    }

    const senderUser = await User.findById(senderUserId);
    if (!senderUser) {
      return res.status(404).json({ message: "Sender user not found" });
    }

    const recipientAccount = await Account.findOne({ accountNumber: recipientAccountNumber });
    if (!recipientAccount) {
      return res.status(404).json({ message: "Account Number not Found" });
    }

    if (String(senderUser.account) === String(recipientAccount._id)) {
      return res.status(400).json({ message: "You cannot transfer to your own account" });
    }

    const senderAccount = await Account.findById(senderUser.account);
    if (!senderAccount) {
      return res.status(404).json({ message: "Sender account not found" });
    }

    const recipientApplication = await Application.findById(recipientAccount.application);
    if (!recipientApplication) {
      return res.status(404).json({ message: "Recipient profile not found" });
    }

    return res.status(200).json({
      recipient: {
        accountNumber: recipientAccount.accountNumber,
        fullName: recipientApplication.fullName,
        accountType: recipientApplication.accountType
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createTransfer(req, res) {
  try {
    const senderUserId = String(req.body?.senderUserId || "").trim();
    const recipientAccountNumber = normalizeAccountNumber(req.body?.recipientAccountNumber);
    const transferChannel = String(req.body?.transferChannel || "").trim().toLowerCase();
    const amount = Number(req.body?.amount);
    const note = String(req.body?.note || "").trim();

    if (!senderUserId || !recipientAccountNumber || !transferChannel || !Number.isFinite(amount)) {
      return res.status(400).json({ message: "senderUserId, recipientAccountNumber, transferChannel and amount are required" });
    }

    if (!["bank", "easypaisa", "jazzcash"].includes(transferChannel)) {
      return res.status(400).json({ message: "Invalid transfer channel" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Transfer amount must be greater than zero" });
    }

    const senderUser = await User.findById(senderUserId);
    if (!senderUser) {
      return res.status(404).json({ message: "Sender user not found" });
    }

    const senderAccount = await Account.findById(senderUser.account);
    if (!senderAccount) {
      return res.status(404).json({ message: "Sender account not found" });
    }

    const recipientAccount = await Account.findOne({ accountNumber: recipientAccountNumber });
    if (!recipientAccount) {
      return res.status(404).json({ message: "Account Number not Found" });
    }

    if (String(senderAccount._id) === String(recipientAccount._id)) {
      return res.status(400).json({ message: "You cannot transfer to your own account" });
    }

    if (Number(senderAccount.balance) < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const recipientApplication = await Application.findById(recipientAccount.application);
    if (!recipientApplication) {
      return res.status(404).json({ message: "Recipient profile not found" });
    }

    senderAccount.balance = Number(senderAccount.balance) - amount;
    recipientAccount.balance = Number(recipientAccount.balance) + amount;

    await senderAccount.save();
    await recipientAccount.save();

    await Transfer.create({
      senderUser: senderUser._id,
      senderAccount: senderAccount._id,
      recipientAccount: recipientAccount._id,
      transferChannel,
      amount,
      note
    });

    return res.status(201).json({
      message: "Transfer completed successfully",
      transfer: {
        transferChannel,
        amount,
        recipientName: recipientApplication?.fullName || "-",
        recipientAccountNumber: recipientAccount.accountNumber,
        remainingBalance: senderAccount.balance
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Transfer failed" });
  }
}
