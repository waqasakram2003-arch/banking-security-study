import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

feedbackSchema.index({ normalizedName: 1 }, { unique: true });

const feedbackModel = mongoose.model("Feedback", feedbackSchema);

export default feedbackModel;
