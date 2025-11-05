import fs from "fs";
import logger from "../logger/winston.logger.js";
import slugify from "slugify";

export const getStaticFilePath = (req, fileName) => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

export const getLocalPath = (fileName) => {
  return `public/images/${fileName}`;
};

export const removeLocalFile = (localPath) => {
  fs.unlink(localPath, (err) => {
    if (err) {
      logger.error("Error while removing local files: ", err);
    } else {
      logger.info("Removed local: ", localPath);
    }
  });
};

export const generateSlug = (id, title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  return `${baseSlug}-${id.toString().slice(-6)}`;
};

export const getMongoosePaginationOptions = ({
  page = 1,
  limit = 10,
  customLabels,
}) => {
  return {
    page: Math.max(page, 1),
    limit: Math.max(limit, 1),
    pagination: true,
    customLabels: {
      pagingCounter: "serialNumberStartFrom",
      ...customLabels,
    },
  };
};
