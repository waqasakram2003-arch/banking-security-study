import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});
const userModel = new mongoose.model("User", userSchema);

export default userModel;       