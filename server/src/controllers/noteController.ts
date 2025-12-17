import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Note, SavedNote, Vote, User } from '../models';
import {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  deleteFileFromS3,
  extractFileKeyFromUrl
} from '../utils/s3';
import { generateNoteSummary } from '../utils/claude';
import { indexNote, updateIndexedNote, deleteIndexedNote } from '../utils/elasticsearch';

/**
 * Get presigned URL for upload
 * POST /api/notes/upload-url
 */
export const getUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType || !fileSize) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await generatePresignedUploadUrl(fileName, fileType, fileSize);

    res.json(result);
  } catch (error: any) {
    console.error('Upload URL generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate upload URL' });
  }
};

/**
 * Create note (after file uploaded to S3)
 * POST /api/notes
 */
export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const {
      title,
      description,
      subject,
      semester,
      module,
      branch,
      section,
      fileUrl,
      fileSize,
      pages
    } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Generate AI summary and tags
    const aiResult = await generateNoteSummary(title, description || '', subject, module);

    // Create note
    const note = await Note.create({
      title,
      description,
      subject,
      semester,
      module,
      branch,
      section,
      uploaderId: req.user._id,
      uploaderName: req.user.name,
      uploaderRole: req.user.role === 'teacher' ? 'teacher' : 'student',
      fileUrl,
      fileSize,
      pages,
      aiSummary: aiResult.summary,
      aiTags: aiResult.tags,
      tags: []
    });

    // Update user upload count
    await User.findByIdAndUpdate(req.user._id, { $inc: { uploadsCount: 1 } });

    // Index in ElasticSearch
    await indexNote(note);

    res.status(201).json({
      message: 'Note created successfully',
      note: {
        id: note._id,
        title: note.title,
        description: note.description,
        subject: note.subject,
        semester: note.semester,
        module: note.module,
        branch: note.branch,
        uploaderName: note.uploaderName,
        uploaderRole: note.uploaderRole,
        aiSummary: note.aiSummary,
        aiTags: note.aiTags,
        uploadDate: note.uploadDate
      }
    });
  } catch (error: any) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
};

/**
 * Get all notes with filters
 * GET /api/notes
 */
export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      subject,
      semester,
      module,
      branch,
      uploaderRole,
      sortBy = 'uploadDate',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      search
    } = req.query;

    const filter: any = { isApproved: true };

    if (subject) filter.subject = subject;
    if (semester) filter.semester = semester;
    if (module) filter.module = module;
    if (branch) filter.branch = branch;
    if (uploaderRole) filter.uploaderRole = uploaderRole;

    // Text search
    if (search && typeof search === 'string') {
      filter.$text = { $search: search };
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      Note.countDocuments(filter)
    ]);

    res.json({
      notes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
};

/**
 * Get single note by ID
 * GET /api/notes/:id
 */
export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id);

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Increment view count
    note.views += 1;
    await note.save();

    res.json({ note });
  } catch (error: any) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
};

/**
 * Get download URL for note
 * GET /api/notes/:id/download
 */
export const getDownloadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id);

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Extract file key from URL
    const fileKey = extractFileKeyFromUrl(note.fileUrl);

    // Generate presigned download URL
    const downloadUrl = await generatePresignedDownloadUrl(fileKey);

    // Increment download count
    note.downloads += 1;
    await note.save();

    // Update uploader reputation
    await User.findByIdAndUpdate(note.uploaderId, { $inc: { reputation: 1 } });

    res.json({ downloadUrl });
  } catch (error: any) {
    console.error('Download URL error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
};

/**
 * Vote on note (upvote/downvote)
 * POST /api/notes/:id/vote
 */
export const voteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!['upvote', 'downvote'].includes(voteType)) {
      res.status(400).json({ error: 'Invalid vote type' });
      return;
    }

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Check existing vote
    const existingVote = await Vote.findOne({
      userId: req.user._id,
      noteId: id
    });

    if (existingVote) {
      // Update vote
      if (existingVote.voteType === voteType) {
        // Remove vote
        await Vote.deleteOne({ _id: existingVote._id });
        if (voteType === 'upvote') {
          note.upvotes -= 1;
        } else {
          note.downvotes -= 1;
        }
      } else {
        // Change vote
        existingVote.voteType = voteType as 'upvote' | 'downvote';
        await existingVote.save();
        if (voteType === 'upvote') {
          note.upvotes += 1;
          note.downvotes -= 1;
        } else {
          note.downvotes += 1;
          note.upvotes -= 1;
        }
      }
    } else {
      // New vote
      await Vote.create({
        userId: req.user._id,
        noteId: id,
        voteType
      });
      if (voteType === 'upvote') {
        note.upvotes += 1;
        // Increase uploader reputation
        await User.findByIdAndUpdate(note.uploaderId, { $inc: { reputation: 2 } });
      } else {
        note.downvotes += 1;
      }
    }

    await note.save();

    res.json({
      message: 'Vote recorded',
      upvotes: note.upvotes,
      downvotes: note.downvotes
    });
  } catch (error: any) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
};

/**
 * Save note for later
 * POST /api/notes/:id/save
 */
export const saveNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Check if already saved
    const existing = await SavedNote.findOne({
      userId: req.user._id,
      noteId: id
    });

    if (existing) {
      // Unsave
      await SavedNote.deleteOne({ _id: existing._id });
      res.json({ message: 'Note removed from saved', saved: false });
    } else {
      // Save
      await SavedNote.create({
        userId: req.user._id,
        noteId: id
      });
      res.json({ message: 'Note saved', saved: true });
    }
  } catch (error: any) {
    console.error('Save note error:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
};

/**
 * Delete note
 * DELETE /api/notes/:id
 */
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Check permission
    const isOwner = note.uploaderId.toString() === (req.user._id as any).toString();
    const isModerator = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModerator) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Delete from S3
    const fileKey = extractFileKeyFromUrl(note.fileUrl);
    await deleteFileFromS3(fileKey);

    // Delete from ElasticSearch
    await deleteIndexedNote(id);

    // Delete note
    await Note.deleteOne({ _id: id });

    // Update user upload count
    await User.findByIdAndUpdate(note.uploaderId, { $inc: { uploadsCount: -1 } });

    res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};
