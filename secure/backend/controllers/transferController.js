import Account from "../models/accountModel.js";
import Application from "../models/applicationModel.js";
import User from "../models/userModel.js";
import Transfer from "../models/transferModel.js";
import Transaction from "../models/transactionModel.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BANK_LOGO_PATH = path.resolve(__dirname, "../../frontend-secure/public/images/public-bank-logo-vector.svg");

function getMailTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
    throw new Error("Mail credentials are missing in environment variables");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_APP_PASSWORD
    }
  });
}

async function sendTransferEmails(transporter, senderUser, senderApp, senderAccount, recipientApp, recipientAccount, transferChannel, amount, referenceNumber, dateTime) {
  try {
    const formattedAmount = `PKR ${Number(amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (senderApp?.email) {
      const senderSubject = `Debit Alert: ${formattedAmount} sent to ${recipientAccount.accountNumber}`;
      const senderHtml = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0f2f4b;">
          <div style="text-align:center;margin-bottom:12px;"><img src="cid:bank-logo@publicbank" alt="Public Bank" style="height:56px;"/></div>
          <h2 style="margin:0 0 8px;">Debit Alert - Transfer Sent</h2>
          <p>Dear ${senderApp.fullName || senderUser.username},</p>
          <p>This is to confirm that an amount of <strong>${formattedAmount}</strong> was sent from your account <strong>${senderAccount.accountNumber}</strong> to <strong>${recipientApp?.fullName || "Recipient"}</strong> (Account: <strong>${recipientAccount.accountNumber}</strong>).</p>
          <p><strong>Amount:</strong> ${formattedAmount}<br/>
          <strong>Reference:</strong> ${referenceNumber}<br/>
          <strong>Transfer Type:</strong> ${String(transferChannel || "-").toUpperCase()}<br/>
          <strong>Date & Time:</strong> ${dateTime}</p>
          <p>If you did not authorize this transaction, please contact Public Bank support immediately.</p>
          <p>Regards,<br/>Public Bank</p>
        </div>
      `;
      try {
        await transporter.sendMail({
          from: `Public Bank <${process.env.MAIL_USER}>`,
          to: senderApp.email,
          subject: senderSubject,
          text: `You have sent ${formattedAmount} to ${recipientAccount.accountNumber} on ${dateTime}. Reference: ${referenceNumber}`,
          html: senderHtml,
          attachments: [
            { filename: path.basename(BANK_LOGO_PATH), path: BANK_LOGO_PATH, cid: 'bank-logo@publicbank' }
          ]
        });
      } catch (mailErr) {
        console.error("Failed to send sender email:", mailErr.message);
      }
    }

    if (recipientApp?.email) {
      const recipientSubject = `Credit Alert: ${formattedAmount} received into ${recipientAccount.accountNumber}`;
      const recipientHtml = `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0f2f4b;">
          <div style="text-align:center;margin-bottom:12px;"><img src="cid:bank-logo@publicbank" alt="Public Bank" style="height:56px;"/></div>
          <h2 style="margin:0 0 8px;">Credit Alert - Transfer Received</h2>
          <p>Dear ${recipientApp.fullName || "Customer"},</p>
          <p>An amount of <strong>${formattedAmount}</strong> has been credited to your account <strong>${recipientAccount.accountNumber}</strong> from <strong>${senderAccount.accountNumber}</strong>.</p>
          <p><strong>Amount:</strong> ${formattedAmount}<br/>
          <strong>Reference:</strong> ${referenceNumber}<br/>
          <strong>Transfer Type:</strong> ${String(transferChannel || "-").toUpperCase()}<br/>
          <strong>Date & Time:</strong> ${dateTime}</p>
          <p>If you have any questions, please contact Public Bank support.</p>
          <p>Regards,<br/>Public Bank</p>
        </div>
      `;
      try {
        await transporter.sendMail({
          from: `Public Bank <${process.env.MAIL_USER}>`,
          to: recipientApp.email,
          subject: recipientSubject,
          text: `You have received ${formattedAmount} from ${senderAccount.accountNumber} on ${dateTime}. Reference: ${referenceNumber}`,
          html: recipientHtml,
          attachments: [
            { filename: path.basename(BANK_LOGO_PATH), path: BANK_LOGO_PATH, cid: 'bank-logo@publicbank' }
          ]
        });
      } catch (mailErr) {
        console.error("Failed to send recipient email:", mailErr.message);
      }
    }
  } catch (err) {
    console.error("Transfer email notification failed:", err.message);
  }
}

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

    const referenceNumber = `TRF-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

    try {
      await Transaction.create({
        user: senderUser._id,
        account: senderAccount._id,
        type: "transfer_sent",
        amount,
        description: `Transfer to ${recipientAccount.accountNumber}`,
        referenceNumber,
        fromTo: recipientAccount.accountNumber
      });
    } catch (err) {
      console.error("Failed to create sender transaction record:", err.message);
    }

    try {
      const recipientUser = await User.findOne({ account: recipientAccount._id });
      await Transaction.create({
        user: recipientUser?._id || recipientAccount._id,
        account: recipientAccount._id,
        type: "transfer_received",
        amount,
        description: `Transfer from ${senderAccount.accountNumber}`,
        referenceNumber,
        fromTo: senderAccount.accountNumber
      });
    } catch (err) {
      console.error("Failed to create recipient transaction record:", err.message);
    }

    // Send emails asynchronously in the background (don't wait)
    const senderApp = await Application.findById(senderUser.application);
    const dateTime = new Date().toLocaleString();
    try {
      const transporter = getMailTransporter();
      // Fire and forget - don't await this, so response returns immediately
      sendTransferEmails(transporter, senderUser, senderApp, senderAccount, recipientApplication, recipientAccount, transferChannel, amount, referenceNumber, dateTime).catch(err => {
        console.error("Background email send error:", err.message);
      });
    } catch (err) {
      console.error("Failed to initialize transporter for background emails:", err.message);
    }

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

export async function verifyTransactionPin(req, res) {
  try {
    const senderUserId = String(req.body?.senderUserId || "").trim();
    const transactionPin = String(req.body?.transactionPin || "").trim();

    if (!senderUserId || !transactionPin) {
      return res.status(400).json({ message: "senderUserId and transactionPin are required" });
    }

    const senderUser = await User.findById(senderUserId).select("+transactionPin");
    if (!senderUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPinValid = await bcrypt.compare(transactionPin, senderUser.transactionPin);
    if (!isPinValid) {
      return res.status(401).json({ message: "Invalid Transaction PIN" });
    }

    return res.status(200).json({ message: "Transaction PIN verified successfully", isValid: true });
  } catch (error) {
    return res.status(500).json({ message: error.message || "PIN verification failed" });
  }
}