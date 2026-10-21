import express from "express";
import { applyForLoan, approveLoan, getLoanApplications, getSingleLoan } from "../controllers/loanController.js";

const loanRoutes = express.Router();

// Apply for a loan
loanRoutes.post("/apply", applyForLoan);

// Approve and disburse a loan
loanRoutes.post("/approve", approveLoan);

// Get all loans for a user
loanRoutes.get("/user/:userId", getLoanApplications);

// Get a single loan
loanRoutes.get("/:id", getSingleLoan);

export default loanRoutes;
