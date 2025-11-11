import slugify from "slugify";
import { Project } from "../models/project.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import {
  generateSlug,
  getLocalPath,
  getMongoosePaginationOptions,
  getStaticFilePath,
  removeLocalFile,
} from "../utils/helpers.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import logger from "../logger/winston.logger.js";
import mongoose from "mongoose";
import { projectImageMaxCount } from "../constants.js";
import { title } from "process";
import cloudinary, { uploadToCloudinary } from "../utils/cloudinary.js";

const createProject = asyncHandler(async (req, res) => {
  const { title, description, ...rest } = req.body;

  if (!req.files?.mainImage || !req.files.mainImage.length) {
    throw new ApiError(400, "Main image is required");
  }

  // Image url generation and local path generation using multer local storage

  // const mainImageUrl = getStaticFilePath(
  //   req,
  //   req.files?.mainImage[0]?.filename
  // );
  // const mainImageLocalPath = getLocalPath(req.files?.mainImage[0]?.filename);

  // const subImages =
  //   req.files?.subImages && req.files?.subImages?.length
  //     ? req.files?.subImages.map((image) => {
  //         const url = getStaticFilePath(req, image.filename);
  //         const localPath = getLocalPath(image.filename);
  //         return { url: url, localPath: localPath };
  //       })
  //     : [];

  // Image url generation using cloudinary
  const mainImageUpload = await uploadToCloudinary(
    req.files.mainImage[0].buffer,
    "Portfolio/Images",
    {
      format: "webp", // converts PNG/JPG to WebP
      quality: "auto", // automatic compression
      width: 1200, // resize large images
      crop: "limit", // preserve aspect ratio
    }
  );

  let subImagesUpload = [];

  if (req.files?.subImages?.length) {
    subImagesUpload = await Promise.all(
      req.files.subImages.map((img) =>
        uploadToCloudinary(img.buffer, "Portfolio/Images", {
          format: "webp", // converts PNG/JPG to WebP
          quality: "auto", // automatic compression
          width: 1200, // resize large images
          crop: "limit", // preserve aspect ratio
        }).then((res) => ({
          url: res.secure_url,
          publicId: res.public_id,
        }))
      )
    );
  }

  const project = await Project.create({
    title,
    description,
    mainImage: {
      url: mainImageUpload.secure_url,
      publicId: mainImageUpload.public_id,
      // localPath: "",
    },
    subImages: subImagesUpload,
    ...rest,
  });

  project.slug = generateSlug(project._id, title);

  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project created successfully"));
});

// Using Cloudinary
const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const { title, removedSubImages, ...rest } = req.body;

  const project = await Project.findById(projectId);

  if (!project) throw new ApiError(404, "Project does not exist");

  // ---- Validate Sub Images BEFORE Removing and Uploading files ----
  const existingSubImages = project.subImages;
  // Calculate which images user wants to remove
  const toRemove = removedSubImages || [];
  // Calculate new total without touching Cloudinary
  const totalSubImages =
    existingSubImages.length -
    toRemove.length +
    (req.files?.subImages?.length || 0);

  if (totalSubImages > projectImageMaxCount) {
    throw new ApiError(
      400,
      `Maximum ${projectImageMaxCount} sub images allowed. You are trying to have ${totalSubImages}.`
    );
  }
  // If valid, proceed to delete from Cloudinary
  await Promise.all(
    toRemove.map(async (publicId) => {
      if (publicId) await cloudinary.uploader.destroy(publicId);
    })
  );

  // ---- Handle Main Image ----
  let mainImage = project.mainImage;

  if (req.files?.mainImage && req.files.mainImage.length) {
    // delete old main image from Cloudinary
    if (project.mainImage?.publicId) {
      await cloudinary.uploader.destroy(project.mainImage.publicId);
    }

    // upload new main image buffer
    const mainImageResult = await uploadToCloudinary(
      req.files.mainImage[0].buffer,
      "Portfolio/Images",
      {
        format: "webp", // converts PNG/JPG to WebP
        quality: "auto", // automatic compression
        width: 1200, // resize large images
        crop: "limit", // preserve aspect ratio
      }
    );

    mainImage = {
      url: mainImageResult.secure_url,
      publicId: mainImageResult.public_id,
    };
  }

  // ---- Handle Sub Images ----
  // Filter out removed images from DB
  let subImages = existingSubImages.filter(
    (img) => !toRemove.includes(img.publicId)
  );

  if (req.files?.subImages && req.files.subImages.length) {
    const newSubImages = await Promise.all(
      req.files.subImages.map((img) =>
        uploadToCloudinary(img.buffer, "Portfolio/Images", {
          format: "webp", // converts PNG/JPG to WebP
          quality: "auto", // automatic compression
          width: 1200, // resize large images
          crop: "limit", // preserve aspect ratio
        }).then((res) => ({
          url: res.secure_url,
          publicId: res.public_id,
        }))
      )
    );

    subImages = [...subImages, ...newSubImages];
  }

  const newSlug =
    title && project.title !== title
      ? generateSlug(projectId, title)
      : project.slug;

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    {
      $set: { title, slug: newSlug, mainImage, subImages, ...rest },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
});

// Without Cloudinary using Localstorage
// const updateProject = asyncHandler(async (req, res) => {
//   const { projectId } = req.params;

//   const { title, ...rest } = req.body;

//   const project = await Project.findById(projectId);

//   if (!project) throw new ApiError(404, "Project does not exist");

//   const mainImage =
//     req.files?.mainImage && req.files?.mainImage.length
//       ? {
//           url: getStaticFilePath(req, req.files?.mainImage[0].filename),
//           localPath: getLocalPath(req.files?.mainImage[0].filename),
//         }
//       : project.mainImage;

//   let subImages =
//     req.files?.subImages && req.files?.subImages.length
//       ? req.files?.subImages.map((image) => {
//           const url = getStaticFilePath(req, image.filename);
//           const localPath = getLocalPath(image.filename);
//           return { url: url, localPath: localPath };
//         })
//       : [];

//   const existedSubImages = project.subImages.length;

//   const totalSubImages = existedSubImages + subImages.length;

//   if (totalSubImages > projectImageMaxCount) {
//     subImages.forEach((image) => removeLocalFile(image.localPath));
//     if (mainImage) {
//       removeLocalFile(mainImage.localPath);
//     }
//     throw new ApiError(
//       400,
//       "Maximum " +
//         projectImageMaxCount +
//         " sub images are allowed for a product. There are already " +
//         existedSubImages +
//         " sub images attached to the product."
//     );
//   }

//   const newSlug =
//     title && project.title !== title
//       ? generateSlug(projectId, title)
//       : project.slug;

//   subImages = [...project.subImages, ...subImages];

//   const updatedProject = await Project.findByIdAndUpdate(
//     projectId,
//     {
//       $set: { title, slug: newSlug, mainImage, subImages, ...rest },
//     },
//     { new: true }
//   );

//   return res
//     .status(200)
//     .json(new ApiResponse(200, updatedProject, "Project updated successfully"));
// });

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findByIdAndDelete(projectId);

  if (!project) throw new ApiError(404, "Project does not exist");

  // With Cloudinary
  if (project.mainImage?.publicId) {
    await cloudinary.uploader.destroy(project.mainImage.publicId);
  }
  for (const img of project.subImages) {
    if (img.publicId) {
      await cloudinary.uploader.destroy(img.publicId);
    }
  }

  // Without Cloudinary
  // const projectImages = [project.mainImage, ...project.subImages];

  // projectImages.map((img) => {
  //   removeLocalFile(img.localPath);
  // });

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project deleted succussfully"));
});

const getAllProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;

  const filters = { isPublished: true };

  if (category) {
    filters.category = category;
  }

  const projectAggregate = Project.aggregate([
    { $match: filters },
    { $sort: { createdAt: -1 } },
  ]);

  const projects = await Project.aggregatePaginate(
    projectAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalProjects",
        docs: "projects",
        limit: "pageSize",
        page: "currentPage",
      },
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getAllProjectsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category } = req.query;

  const filters = {};

  if (category) {
    filters.category = category;
  }

  const projectAggregate = Project.aggregate([
    { $match: filters },
    { $sort: { createdAt: -1 } },
  ]);

  const projects = await Project.aggregatePaginate(
    projectAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalProjects",
        docs: "projects",
        limit: "pageSize",
        page: "currentPage",
      },
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) throw new ApiError(404, "Project does not exist");

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const getProjectsByCategory = asyncHandler(async (req, res) => {});

const getFeaturedProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 4 } = req.query;

  const projectAggregate = Project.aggregate([
    { $match: { isFeatured: true } },
    { $sort: { updatedAt: -1 } },
  ]);

  const projects = await Project.aggregatePaginate(
    projectAggregate,
    getMongoosePaginationOptions({
      page,
      limit,
      customLabels: {
        totalDocs: "totalProjects",
        docs: "projects",
        page: "currentPage",
        limit: "pageSize",
      },
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, projects, "Featured projects fetched successfully")
    );
});

export {
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
  getProjectById,
  getFeaturedProjects,
  getAllProjectsAdmin,
};
