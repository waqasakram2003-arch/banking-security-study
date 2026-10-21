import mongoose from "mongoose";
import validator from "validator";

const applicationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  cnic: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    validate: {
      validator: (value) => /^\d{13}$/.test(String(value).replace(/-/g, "")),
      message: "cnic must be 13 digits"
    }
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    validate: {
      validator: (value) => validator.isEmail(String(value)),
      message: "email must be in valid email format"
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },

  userImage: {
    type: String,
    default: ""
  },

  accountType: {
    type: String,
    enum: ["saving", "current"]
  },

  status: {
    type: String,
    enum: ["pending", "approved"],
    default: "pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const applicationModel = new mongoose.model("Application", applicationSchema);

export default applicationModel;