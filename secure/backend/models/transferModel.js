import mongoose from "mongoose";

const transferSchema = new mongoose.Schema({
  senderUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  senderAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },
  recipientAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },
  transferChannel: {
    type: String,
    enum: ["bank", "easypaisa", "jazzcash"],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  note: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const transferModel = new mongoose.model("Transfer", transferSchema);

export default transferModel;