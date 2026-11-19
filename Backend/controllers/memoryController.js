
const Memory = require("../models/memory");
const fs = require("fs");
const path = require("path");

const uploadDir = path.resolve(__dirname, "../uploads");

// Convert uploaded files into database paths
const getFilePaths = (files) => {
  if (!Array.isArray(files)) return [];

  return files.map((file) => `/uploads/${file.filename}`);
};

// Get existing attachments, including older records
const getExistingFiles = (memory) => {
  if (Array.isArray(memory.files) && memory.files.length > 0) {
    return [...memory.files];
  }

  return memory.file ? [memory.file] : [];
};

// Safely remove physical uploaded files
const removePhysicalFiles = async (filePaths) => {
  for (const filePath of filePaths) {
    try {
      const normalizedPath = String(filePath).replace(/\\/g, "/");
      const filename = path.basename(normalizedPath);

      if (!filename || filename === "." || filename === "..") {
        continue;
      }

      const fullPath = path.resolve(uploadDir, filename);

      // Ensure the file is inside the uploads directory
      if (path.dirname(fullPath) !== uploadDir) {
        continue;
      }

      await fs.promises.unlink(fullPath).catch((error) => {
        if (error.code !== "ENOENT") {
          console.error("File deletion error:", error.message);
        }
      });
    } catch (error) {
      console.error("File cleanup error:", error.message);
    }
  }
};

// ADD MEMORY
const addMemory = async (req, res) => {
  const uploadedFiles = getFilePaths(req.files);

  try {
    const {
      title,
      description,
      category,
      date,
      notes,
    } = req.body;

    if (!title || !title.trim()) {
      await removePhysicalFiles(uploadedFiles);
      return res.status(400).json({
        message: "Memory title is required",
      });
    }

    const memory = await Memory.create({
      user: req.user.id,
      title: title.trim(),
      description: description || "",
      category: category || "Photo",
      date: date || Date.now(),
      notes: notes || "",
      files: uploadedFiles,
      file: uploadedFiles[0] || "",
    });

    res.status(201).json({
      message: "Memory added successfully",
      memory,
    });
  } catch (error) {
    await removePhysicalFiles(uploadedFiles);

    console.error("ADD MEMORY ERROR:", error);

    res.status(500).json({
      message: "Unable to add memory",
      error: error.message,
    });
  }
};

// GET ALL MEMORIES
const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(memories);
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch memories",
      error: error.message,
    });
  }
};

// GET SINGLE MEMORY
const getMemoryById = async (req, res) => {
  try {
    const memory = await Memory.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!memory) {
      return res.status(404).json({
        message: "Memory not found",
      });
    }

    res.status(200).json(memory);
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch memory",
      error: error.message,
    });
  }
};

// UPDATE MEMORY AND APPEND NEW FILES
const updateMemory = async (req, res) => {
  const newFilePaths = getFilePaths(req.files);

  try {
    const memory = await Memory.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!memory) {
      await removePhysicalFiles(newFilePaths);

      return res.status(404).json({
        message: "Memory not found",
      });
    }

    const {
      title,
      description,
      category,
      date,
      notes,
    } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        await removePhysicalFiles(newFilePaths);

        return res.status(400).json({
          message: "Memory title cannot be empty",
        });
      }

      memory.title = title.trim();
    }

    if (description !== undefined) {
      memory.description = description;
    }

    if (category !== undefined) {
      memory.category = category;
    }

    if (date !== undefined && date !== "") {
      memory.date = date;
    }

    if (notes !== undefined) {
      memory.notes = notes;
    }

    // Preserve all existing attachments
    const existingFiles = getExistingFiles(memory);

    // Append only newly uploaded attachments
    const combinedFiles = [
      ...existingFiles,
      ...newFilePaths,
    ];

    memory.files = [...new Set(combinedFiles)];
    memory.file = memory.files[0] || "";

    await memory.save();

    res.status(200).json({
      message: "Memory updated successfully",
      memory,
    });
  } catch (error) {
    await removePhysicalFiles(newFilePaths);

    console.error("UPDATE MEMORY ERROR:", error);

    res.status(500).json({
      message: "Unable to update memory",
      error: error.message,
    });
  }
};

// DELETE ONE SELECTED ATTACHMENT
const deleteMemoryFile = async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({
        message: "Please select a valid attachment",
      });
    }

    const memory = await Memory.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!memory) {
      return res.status(404).json({
        message: "Memory not found",
      });
    }

    const existingFiles = getExistingFiles(memory);

    // Check that the selected file belongs to this memory
    if (!existingFiles.includes(filePath)) {
      return res.status(404).json({
        message: "Attachment not found in this memory",
      });
    }

    // Remove only the selected attachment
    memory.files = existingFiles.filter(
      (file) => file !== filePath
    );

    // Keep the first remaining attachment as the main file
    memory.file = memory.files[0] || "";

    await memory.save();

    // Remove only the selected physical file
    await removePhysicalFiles([filePath]);

    res.status(200).json({
      message: "Attachment deleted successfully",
      memory,
    });
  } catch (error) {
    console.error("DELETE ATTACHMENT ERROR:", error);

    res.status(500).json({
      message: "Unable to delete attachment",
      error: error.message,
    });
  }
};

// DELETE ENTIRE MEMORY
const deleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!memory) {
      return res.status(404).json({
        message: "Memory not found",
      });
    }

    const filesToDelete = getExistingFiles(memory);

    await Memory.deleteOne({
      _id: memory._id,
      user: req.user.id,
    });

    // Remove all physical attachments belonging to this memory
    await removePhysicalFiles(filesToDelete);

    res.status(200).json({
      message: "Memory deleted successfully",
    });
  } catch (error) {
    console.error("DELETE MEMORY ERROR:", error);

    res.status(500).json({
      message: "Unable to delete memory",
      error: error.message,
    });
  }
};

module.exports = {
  addMemory,
  getMemories,
  getMemoryById,
  updateMemory,
  deleteMemory,
  deleteMemoryFile,
};
