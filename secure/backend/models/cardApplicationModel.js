import mongoose from "mongoose";

const cardApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },
  cardType: {
    type: String,
    enum: ["debit", "credit"],
    required: true
  },
  cardCategory: {
    type: String,
    enum: [
      "Visa Debit Card",
      "PayPak Debit Card",
      "MasterCard Credit Card",
      "World MasterCard Credit Card"
    ],
    required: true
  },
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const cardApplicationModel = new mongoose.model("CardApplication", cardApplicationSchema);

export default cardApplicationModel;