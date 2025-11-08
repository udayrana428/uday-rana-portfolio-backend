import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { projectImageMaxCount, UserRolesEnum } from "../constants.js";
import {
  createProjectValidator,
  updateProjectValidator,
} from "../validators/project.validators.js";
import { validate } from "../validators/validate.js";
import {
  createProject,
  deleteProject,
  getAllProjects,
  getFeaturedProjects,
  getProjectById,
  updateProject,
} from "../controllers/project.controllers.js";
import { mongoIdPathVariableValidator } from "../validators/mongodb.validators.js";
import { verifyJWT, verifyRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// unsecured routes
router.route("/getAllProjects").get(getAllProjects);

router
  .route("/getProject/:projectId")
  .get(mongoIdPathVariableValidator("projectId"), validate, getProjectById);

router.route("/getFeaturedProjects").get(getFeaturedProjects);

// secured routes
router.route("/createProject").post(
  verifyJWT,
  verifyRoles(UserRolesEnum.ADMIN),
  upload.fields([
    {
      name: "mainImage",
      maxCount: 1,
    },
    {
      name: "subImages",
      maxCount: projectImageMaxCount,
    },
  ]),
  createProjectValidator(),
  validate,
  createProject
);

router.route("/updateProject/:projectId").patch(
  verifyJWT,
  verifyRoles(UserRolesEnum.ADMIN),
  upload.fields([
    {
      name: "mainImage",
      maxCount: 1,
    },
    {
      name: "subImages",
      maxCount: projectImageMaxCount,
    },
  ]),
  updateProjectValidator(),
  validate,
  updateProject
);

router
  .route("/deleteProject/:projectId")
  .delete(
    verifyJWT,
    verifyRoles(UserRolesEnum.ADMIN),
    mongoIdPathVariableValidator("projectId"),
    validate,
    deleteProject
  );

export default router;
