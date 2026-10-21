import express from "express";
import {
  deleteAccount,
  deleteAccountProfile,
  getAccountProfile,
  getAccountByApplication,
  getSingleAccount,
  updateAccountProfile,
} from "../controllers/accountController.js";

const router = express.Router();

router.get("/profile/:userId", getAccountProfile);
router.patch("/profile/:userId", updateAccountProfile);
router.delete("/profile/:userId", deleteAccountProfile);
router.get("/application/:applicationId", getAccountByApplication);
router.get("/:id", getSingleAccount);
router.delete("/:id", deleteAccount);

export default router;
