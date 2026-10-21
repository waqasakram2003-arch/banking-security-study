import express from "express";
import {
  deleteUser,
  getSingleUser,
  getUserByApplication,
  loginUser,
  signupUser,
  updateUsername
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.patch("/:id/username", updateUsername);
router.get("/application/:applicationId", getUserByApplication);
router.get("/:id", getSingleUser);
router.delete("/:id", deleteUser);

export default router;
