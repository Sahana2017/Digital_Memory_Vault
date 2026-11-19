
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  addMemory,
  getMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  deleteMemoryFile,
} = require("../controllers/memoryController");

// Add a new memory with multiple attachments
router.post(
  "/",
  protect,
  upload.array("files", 10),
  addMemory
);

// Get all memories belonging to logged-in user
router.get(
  "/",
  protect,
  getMemories
);

// Delete one attachment from a memory
router.delete(
  "/:id/files",
  protect,
  deleteMemoryFile
);

// Get one memory
router.get(
  "/:id",
  protect,
  getMemoryById
);

// Update memory and append new attachments
router.put(
  "/:id",
  protect,
  upload.array("files", 10),
  updateMemory
);

// Delete the entire memory
router.delete(
  "/:id",
  protect,
  deleteMemory
);

module.exports = router;
