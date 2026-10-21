import Feedback from "../models/feedbackModel.js";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNameKey(value) {
  return normalizeText(value).toLowerCase();
}

export async function listFeedback(req, res) {
  try {
    const feedback = await Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .select("name comment createdAt");

    return res.status(200).json({ feedback });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to load feedback" });
  }
}

export async function createFeedback(req, res) {
  try {
    const name = normalizeText(req.body?.name);
    const normalizedName = normalizeNameKey(req.body?.name);
    const comment = normalizeText(req.body?.comment);

    if (!name || !comment) {
      return res.status(400).json({ message: "name and comment are required" });
    }

    if (name.length > 80) {
      return res.status(400).json({ message: "Name should be 80 characters or less" });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ message: "Comment should be 1000 characters or less" });
    }

    const existingFeedback = await Feedback.findOne({ normalizedName }).select("_id");
    if (existingFeedback) {
      return res.status(409).json({ message: "This name has already submitted feedback" });
    }

    const savedFeedback = await Feedback.create({ name, normalizedName, comment });

    return res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: {
        _id: savedFeedback._id,
        name: savedFeedback.name,
        comment: savedFeedback.comment,
        createdAt: savedFeedback.createdAt
      }
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This name has already submitted feedback" });
    }
    return res.status(500).json({ message: error.message || "Unable to submit feedback" });
  }
}