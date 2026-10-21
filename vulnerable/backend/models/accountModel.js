import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application"
  },

  accountNumber: {
    type: String,
    unique: true
  },

  iban: {
    type: String,
    unique: true
  },

  balance: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const accountModel = new mongoose.model("Account", accountSchema);

export default accountModel;