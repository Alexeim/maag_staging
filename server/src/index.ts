import express from 'express';
import cors from 'cors';
import { getAuth } from './services/firebase'; // Import the GETTER function
import articleRoutes from './routes/articleRoutes'; // Import article routes

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // In a real app, configure this with your frontend's origin
app.use(express.json());

app.get('/api', (req, res) => {
  res.send('Hello from the MAAG API!');
});

// Use the article routes
app.use('/api/articles', articleRoutes);

// Test route to verify Firebase connection
app.get('/api/test-firebase', async (req, res) => {
  try {
    // Get a fresh instance of the auth service right before using it
    const auth = getAuth();
    
    const userRecords = await auth.listUsers(5);
    const users = userRecords.users.map(user => user.toJSON());
    res.status(200).json({
      status: 'Success',
      message: 'Successfully connected to Firebase and fetched users.',
      users: users,
    });
  } catch (error: any)
  {
    res.status(500).json({
      status: 'Error',
      message: 'Failed to connect to Firebase.',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
