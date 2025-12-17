import { Router } from 'express';
import {
  getUploadUrl,
  createNote,
  getNotes,
  getNoteById,
  getDownloadUrl,
  voteNote,
  saveNote,
  deleteNote
} from '../controllers/noteController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { validateNoteUpload, validateNoteQuery, validateMongoId } from '../middleware/validators';

const router = Router();

// Get presigned upload URL (authenticated)
router.post('/upload-url', authenticate, getUploadUrl);

// Create note (authenticated)
router.post('/', authenticate, validateNoteUpload, createNote);

// Get all notes (with filters)
router.get('/', optionalAuthenticate, validateNoteQuery, getNotes);

// Get single note
router.get('/:id', validateMongoId, getNoteById);

// Get download URL
router.get('/:id/download', validateMongoId, getDownloadUrl);

// Vote on note
router.post('/:id/vote', authenticate, validateMongoId, voteNote);

// Save/unsave note
router.post('/:id/save', authenticate, validateMongoId, saveNote);

// Delete note
router.delete('/:id', authenticate, validateMongoId, deleteNote);

export default router;
