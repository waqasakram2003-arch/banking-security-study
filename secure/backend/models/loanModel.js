import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
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
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  cnic: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    default: "Personal Finance"
  },
  alternateNumber: {
    type: String,
    default: ""
  },
  city: {
    type: String,
    required: true
  },
  netIncome: {
    type: Number,
    required: true
  },
  requestedAmount: {
    type: Number,
    required: true
  },
  approvedAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "disbursed"],
    default: "pending"
  },
  approvalNote: {
    type: String,
    default: ""
  },
  referenceNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  }
});

const loanModel = new mongoose.model("Loan", loanSchema);

export default loanModel;
