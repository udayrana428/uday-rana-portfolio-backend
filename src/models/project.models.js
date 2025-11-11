import mongoose from "mongoose";
import { type } from "os";
import { AvailableCategories } from "../constants.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    techStack: {
      type: [String],
    },
    mainImage: {
      required: true,
      type: {
        url: String,
        publicId: String,
        localPath: String,
      },
    },
    subImages: {
      type: [
        {
          url: String,
          publicId: String,
          localPath: String,
        },
      ],
    },
    category: {
      required: true,
      type: String,
      enum: AvailableCategories,
    },
    githubUrl: {
      type: String,
    },
    liveUrl: {
      type: String,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

projectSchema.plugin(mongooseAggregatePaginate);

export const Project = new mongoose.model("Project", projectSchema);
