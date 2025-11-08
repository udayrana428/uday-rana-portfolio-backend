import { Router } from "express";
import {
  loginUserValidator,
  registerUserValidator,
} from "../validators/user.validators.js";
import { validate } from "../validators/validate.js";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Unsecured Routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUserValidator(), validate, loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);

export default router;
