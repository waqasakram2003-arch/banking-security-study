import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },
  type: {
    type: String,
    enum: ["initial", "loan", "transfer_sent", "transfer_received"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  referenceNumber: {
    type: String,
    default: ""
  },
  fromTo: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["completed", "pending", "failed"],
    default: "completed"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const transactionModel = new mongoose.model("Transaction", transactionSchema);

export default transactionModel;
