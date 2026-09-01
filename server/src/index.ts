import express from 'express';
import cors from 'cors';
import articleRoutes from './routes/articleRoutes'; // Import article routes
import eventRoutes from './routes/eventRoutes'; // Import event routes
import userRoutes from './routes/userRoutes'; // Import user routes
import flipperRoutes from './routes/flipperRoutes'; // Import flipper routes
import interviewRoutes from './routes/interviewRoutes'; // Import interview routes
import authorRoutes from './routes/authorRoutes';
import addressRoutes from './routes/addressRoutes';
import guideRoutes from './routes/guideRoutes';
import visualStoryRoutes from './routes/visualStoryRoutes';
import newsRoutes from './routes/newsRoutes';
import editorialPlacementsRoutes from './routes/editorialPlacementsRoutes';
import contentCollectionsRoutes from './routes/contentCollectionsRoutes';
import photoOfTheDayRoutes from './routes/photoOfTheDayRoutes';
import publicRoutes from './routes/publicRoutes';
import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

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

// Use the news routes
app.use('/api/news', newsRoutes);

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

// Use the authors routes
app.use('/api/authors', authorRoutes);

// Use the addresses routes
app.use('/api/addresses', addressRoutes);

// Use the guide routes
app.use('/api/guides', guideRoutes);

// Use the visual story routes
app.use('/api/visual-stories', visualStoryRoutes);

// Use the editorial placements routes
app.use('/api/editorial-placements', editorialPlacementsRoutes);

// Use the content collections routes
app.use('/api/content-collections', contentCollectionsRoutes);

// Use the photo of the day routes
app.use('/api/photos-of-the-day', photoOfTheDayRoutes);

// Use public read-model routes
app.use('/api/public', publicRoutes);

// Session-cookie auth bridge, used by the Astro server to gate pages
app.use('/api/auth', authRoutes);

// Aggregated read model for the dashboard home
app.use('/api/dashboard', dashboardRoutes);

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
