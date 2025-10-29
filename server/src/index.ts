import express from 'express';
import cors from 'cors';
import { getAuth } from './services/firebase'; // Import the GETTER function
import articleRoutes from './routes/articleRoutes'; // Import article routes
import eventRoutes from './routes/eventRoutes'; // Import event routes
import userRoutes from './routes/userRoutes'; // Import user routes
import flipperRoutes from './routes/flipperRoutes'; // Import flipper routes
import interviewRoutes from './routes/interviewRoutes'; // Import interview routes

const app = express();
const port = process.env.PORT || 3000;

app.use(cors()); // In a real app, configure this with your frontend's origin
// Middleware для Stripe webhook, чтобы получить raw body
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api', (req, res) => {
  res.send('Hello from the MAAG API!');
});

// Use the article routes
app.use('/api/articles', articleRoutes);

// Use the event routes
app.use('/api/events', eventRoutes);

// Use the user routes
import stripeRoutes from './routes/stripeRoutes';

app.use('/api/users', userRoutes);
app.use('/stripe', stripeRoutes);

// Use the flipper routes
app.use('/api/flippers', flipperRoutes);

// Use the interview routes
app.use('/api/interviews', interviewRoutes);

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

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
