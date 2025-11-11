// middleware/parseFormData.js
export const parseFormData = (req, res, next) => {
  try {
    if (req.body.techStack && typeof req.body.techStack === "string") {
      req.body.techStack = JSON.parse(req.body.techStack);
    }
    if (req.body.tags && typeof req.body.tags === "string") {
      req.body.tags = JSON.parse(req.body.tags);
    }
    if (
      req.body.removedSubImages &&
      typeof req.body.removedSubImages === "string"
    ) {
      req.body.removedSubImages = JSON.parse(req.body.removedSubImages);
    }
    if (req.body.isFeatured && typeof req.body.isFeatured === "string") {
      req.body.isFeatured = req.body.isFeatured === "true";
    }
    if (req.body.isPublished && typeof req.body.isPublished === "string") {
      req.body.isPublished = req.body.isPublished === "true";
    }
  } catch (err) {
    console.error("Failed to parse form fields:", err);
  }
  next();
};
