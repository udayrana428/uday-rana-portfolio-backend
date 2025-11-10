import { body } from "express-validator";
import { AvailableCategories } from "../constants.js";

const createProjectValidator = () => {
  return [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("category")
      .trim()
      .notEmpty()
      .withMessage("Category is required")
      .isIn(AvailableCategories)
      .withMessage("Invalid category type"),
    body("techStack")
      .optional()
      .isArray({ type: "string" })
      .withMessage("Techstack must be an array of string"),
    body("githubUrl")
      .optional()
      .isString()
      .withMessage("githubUrl must be string")
      .isURL()
      .withMessage("githubUrl must be valid"),
    body("liveUrl")
      .optional()
      .isString()
      .withMessage("liveUrl must be string")
      .isURL()
      .withMessage("liveUrl must be valid"),
    body("isPublished")
      .optional()
      .isBoolean()
      .withMessage("isPublished must be boolean"),
    body("isFeatured")
      .optional()
      .isBoolean()
      .withMessage("isFeatured must be boolean"),
    body("tags")
      .optional()
      .isArray({ type: "string" })
      .withMessage("Tags must be an array of string"),
  ];
};

const updateProjectValidator = () => {
  return [
    body("title").optional().trim().notEmpty().withMessage("Title is required"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("category")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Category is required")
      .isIn(AvailableCategories)
      .withMessage("Invalid category type"),
    body("techStack")
      .optional()
      .isArray()
      .withMessage("Techstack must be an array of string"),
    body("githubUrl")
      .optional()
      .isString()
      .withMessage("githubUrl must be string")
      .isURL()
      .withMessage("githubUrl must be valid"),
    body("liveUrl")
      .optional()
      .isString()
      .withMessage("liveUrl must be string")
      .isURL()
      .withMessage("liveUrl must be valid"),
    body("isPublished")
      .optional()
      .isBoolean()
      .withMessage("isPublished must be boolean"),
    body("isFeatured")
      .optional()
      .isBoolean()
      .withMessage("isFeatured must be boolean"),
  ];
};

export { createProjectValidator, updateProjectValidator };
