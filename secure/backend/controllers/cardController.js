import User from "../models/userModel.js";
import CardApplication from "../models/cardApplicationModel.js";

const cardOptions = {
  debit: ["Visa Debit Card", "PayPak Debit Card"],
  credit: ["MasterCard Credit Card", "World MasterCard Credit Card"]
};

function generateCardNumber() {
  const parts = Array.from({ length: 4 }, () => String(Math.floor(1000 + Math.random() * 9000)));
  return parts.join("-");
}

async function createUniqueCardNumber() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const cardNumber = generateCardNumber();
    const exists = await CardApplication.exists({ cardNumber });
    if (!exists) {
      return cardNumber;
    }
  }

  throw new Error("Unable to generate card number. Please try again.");
}

function isValidCategory(cardType, cardCategory) {
  return Array.isArray(cardOptions[cardType]) && cardOptions[cardType].includes(cardCategory);
}

export function getCardOptions(req, res) {
  return res.status(200).json(cardOptions);
}

export async function applyForCard(req, res) {
  try {
    const userId = String(req.body?.userId || "").trim();
    const cardType = String(req.body?.cardType || "").trim().toLowerCase();
    const cardCategory = String(req.body?.cardCategory || "").trim();

    if (!userId) {
      return res.status(401).json({ message: "Please login first to apply for cards" });
    }

    if (!cardType || !cardCategory) {
      return res.status(400).json({ message: "cardType and cardCategory are required" });
    }

    if (!isValidCategory(cardType, cardCategory)) {
      return res.status(400).json({ message: "Invalid card category for selected card type" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingRequest = await CardApplication.findOne({
      user: user._id,
      cardType,
      cardCategory,
      status: { $in: ["pending", "approved"] }
    });

    if (existingRequest) {
      return res.status(409).json({ message: "Card already issued or in process for this category" });
    }

    const cardNumber = await createUniqueCardNumber();

    const created = await CardApplication.create({
      user: user._id,
      application: user.application,
      account: user.account,
      cardType,
      cardCategory,
      cardNumber,
      status: "approved"
    });

    return res.status(201).json({
      message: "Card approved successfully",
      cardApplicationId: created._id,
      status: created.status,
      cardNumber: created.cardNumber
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getUserCards(req, res) {
  try {
    const userId = String(req.params?.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cards = await CardApplication.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select("cardType cardCategory cardNumber status createdAt");

    return res.status(200).json({ cards });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}