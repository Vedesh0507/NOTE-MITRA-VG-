// Simple Node.js server that NEVER crashes - for development only
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for development (no database needed)
const users = [];
const notes = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'NoteMitra API is running' });
});

// Auth routes
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, email, password, role, branch, section } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = {
      id: users.length + 1,
      name,
      email,
      role: role || 'student',
      branch: branch || '',
      section: section || '',
      createdAt: new Date()
    };
    users.push(user);

    // Generate fake token
    const token = 'dev_token_' + user.id;

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate fake token
    const token = 'dev_token_' + user.id;

    res.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = parseInt(token.replace('dev_token_', ''));
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Notes routes
app.get('/api/notes', (req, res) => {
  try {
    res.json({ notes, total: notes.length });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/notes', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = parseInt(token.replace('dev_token_', ''));
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const note = {
      id: notes.length + 1,
      ...req.body,
      userId: user.id,
      userName: user.name,
      createdAt: new Date(),
      views: 0,
      downloads: 0,
      upvotes: 0,
      downvotes: 0
    };
    notes.push(note);

    res.status(201).json({ message: 'Note created successfully', note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single note by ID
app.get('/api/notes/:id', (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Increment view count
    note.views += 1;

    res.json({ note });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on a note
app.post('/api/notes/:id/vote', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const noteId = parseInt(req.params.id);
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const { voteType } = req.body;

    if (voteType === 'upvote') {
      note.upvotes += 1;
    } else if (voteType === 'downvote') {
      note.downvotes += 1;
    }

    res.json({ message: 'Vote recorded', note });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save/Bookmark a note
app.post('/api/notes/:id/save', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !token.startsWith('dev_token_')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json({ message: 'Note saved successfully' });
  } catch (error) {
    console.error('Save note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download note
app.get('/api/notes/:id/download', (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const note = notes.find(n => n.id === noteId);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Increment download count
    note.downloads += 1;

    res.json({ downloadUrl: note.fileUrl || '/sample.pdf' });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Global error handler - NEVER CRASH
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.log('Server continues running...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  console.log('Server continues running...');
});

// Start server with auto-retry
function startServer() {
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('✓ SIMPLE DEV SERVER RUNNING (No Database Required)');
    console.log(`✓ Port: ${PORT}`);
    console.log(`✓ API: http://localhost:${PORT}/api`);
    console.log(`✓ Health: http://localhost:${PORT}/api/health`);
    console.log(`✓ Users in memory: ${users.length}`);
    console.log(`✓ Notes in memory: ${notes.length}`);
    console.log('='.repeat(60));
    console.log('');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is busy, retrying in 2 seconds...`);
      setTimeout(startServer, 2000);
    } else {
      console.error('Server error:', err);
      console.log('Retrying in 5 seconds...');
      setTimeout(startServer, 5000);
    }
  });

  // Keep alive
  setInterval(() => {
    console.log(`[${new Date().toLocaleTimeString()}] Server alive - Users: ${users.length}, Notes: ${notes.length}`);
  }, 60000); // Log every minute
}

startServer();

console.log('Starting simple development server...');
