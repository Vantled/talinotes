require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Proxy endpoint for quiz generation
app.post('/api/generate-quiz', async (req, res) => {
  try {
    console.log('Received request to /api/generate-quiz');  // Debug log
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    console.log('Forwarding request to Python service...');  // Debug log
    
    // Forward request to Python service
    const response = await fetch('http://localhost:5001/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    console.log('Python service response status:', response.status);  // Debug log

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Python service error details:', errorData);  // Debug log
      return res.status(response.status).json({ 
        error: `Python service error: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();
    console.log('Successfully received response from Python service');  // Debug log
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);  // Debug log
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
}); 