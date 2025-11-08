import { body } from "express-validator";

const registerUserValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLowercase()
      .withMessage("Username must be lowercase")
      .isLength({ min: 3 })
      .withMessage("Username must be atleast 3 character long"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isStrongPassword({ minUppercase: 1, minNumbers: 1, minSymbols: 1 })
      .withMessage(
        "Password must contain at least one uppercase letter, one number, and one special character"
      ),
  ];
};

const loginUserValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid Credentials"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

export { registerUserValidator, loginUserValidator };
