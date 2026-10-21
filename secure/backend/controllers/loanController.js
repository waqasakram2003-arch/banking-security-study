import mongoose from "mongoose";
import Loan from "../models/loanModel.js";
import Account from "../models/accountModel.js";
import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";

export async function applyForLoan(req, res) {
  try {
    const { userId, accountId, firstName, lastName, email, phone, cnic, dateOfBirth, alternateNumber, city, netIncome, requestedAmount } = req.body;

    // Validate required fields
    if (!userId || !accountId || !firstName || !lastName || !email || !phone || !cnic || !city || !netIncome || !requestedAmount) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Verify user and account exist
    const user = await User.findById(userId);
    const account = await Account.findById(accountId);

    if (!user || !account) {
      return res.status(404).json({ message: "User or account not found" });
    }

    // Generate reference number
    const referenceNumber = `LON-${Date.now().toString().slice(-8)}`;

    // Create loan application
    const loan = new Loan({
      user: userId,
      account: accountId,
      firstName,
      lastName,
      email,
      phone,
      cnic,
      dateOfBirth,
      productName: "Personal Finance",
      alternateNumber,
      city,
      netIncome,
      requestedAmount,
      referenceNumber,
      status: "pending"
    });

    await loan.save();

    return res.status(201).json({
      message: "Loan application submitted successfully",
      loan
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function approveLoan(req, res) {
  try {
    const { loanId, approvedAmount } = req.body;

    if (!loanId || !approvedAmount) {
      return res.status(400).json({ message: "Loan ID and approved amount are required" });
    }

    const loan = await Loan.findById(loanId).populate("account");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.status !== "pending") {
      return res.status(400).json({ message: "Only pending loans can be approved" });
    }

    // Update loan status
    loan.status = "approved";
    loan.approvedAmount = approvedAmount;
    loan.approvedAt = new Date();
    await loan.save();

    // Update account balance
    const account = await Account.findById(loan.account._id);
    if (account) {
      account.balance += approvedAmount;
      await account.save();
    }

    // Create transaction record
    try {
      const transaction = new Transaction({
        user: loan.user,
        account: loan.account._id,
        type: "loan",
        amount: approvedAmount,
        description: `Personal Finance Loan - ${loan.productName}`,
        referenceNumber: loan.referenceNumber,
        fromTo: "Bank",
        status: "completed"
      });
      await transaction.save();
    } catch (txError) {
      console.error("Error creating transaction record:", txError);
      // Don't fail the loan approval if transaction creation fails
    }

    return res.status(200).json({
      message: "Loan approved and disbursed successfully",
      loan,
      newBalance: account.balance
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getLoanApplications(req, res) {
  try {
    const { userId } = req.params;

    const loans = await Loan.find({ user: userId }).populate("account");

    return res.status(200).json(loans);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getSingleLoan(req, res) {
  try {
    const loan = await Loan.findById(req.params.id).populate("account");

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    return res.status(200).json(loan);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
