import express from "express";
import {
  deleteUser,
  getSingleUser,
  getUserByApplication,
  loginUser,
  sendOtpForSignup,
  signupUser,
  verifyOtpAndSignup,
  updatePassword,
  updateUsername
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/send-otp", sendOtpForSignup);
router.post("/verify-otp-signup", verifyOtpAndSignup);
router.post("/login", loginUser);
router.patch("/:id/password", updatePassword);
router.patch("/:id/username", updateUsername);
router.get("/application/:applicationId", getUserByApplication);
router.get("/:id", getSingleUser);
router.delete("/:id", deleteUser);

export default router;
