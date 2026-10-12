require('dotenv').config();

const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.FRONTEND_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean)
]);
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  }
}));
app.use(express.json({ limit: '20kb' }));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  favorites: { type: [String], default: [] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  placeId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true, trim: true, maxlength: 400 },
  likedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] }
}, { timestamps: true });
reviewSchema.index({ placeId: 1, userId: 1 }, { unique: true });

const placeSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, enum: ['Restaurant', 'Heritage', 'Adventure', 'Entertainment'] },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  popularity: { type: Number, default: 50, min: 0, max: 100 },
  recommendedRank: { type: Number, default: 20, min: 1, max: 1000 },
  image: { type: String, required: true, maxlength: 1000 },
  price: { type: String, default: '', maxlength: 100 },
  location: { type: String, required: true, maxlength: 160 },
  hours: { type: String, default: '', maxlength: 180 },
  address: { type: String, default: '', maxlength: 240 },
  phone: { type: String, default: '', maxlength: 40 },
  website: { type: String, default: '', maxlength: 300 },
  lastVerified: { type: String, default: '', maxlength: 40 },
  bestTime: { type: String, default: '', maxlength: 140 },
  tips: { type: String, default: '', maxlength: 280 },
  description: { type: String, required: true, minlength: 10, maxlength: 1000 }
}, { timestamps: true });

const suggestionSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 60, default: '' },
  email: { type: String, lowercase: true, trim: true, maxlength: 254, default: '' },
  topic: { type: String, required: true, enum: ['Suggest a place', 'Correct a detail', 'Share an idea', 'Something else'] },
  message: { type: String, required: true, trim: true, minlength: 10, maxlength: 1500 },
  status: { type: String, enum: ['Pending', 'Reviewed', 'Resolved'], default: 'Pending' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Review = mongoose.model('Review', reviewSchema);
const Place = mongoose.model('Place', placeSchema);
const Suggestion = mongoose.model('Suggestion', suggestionSchema);

const initialPlaces = [
  {
    id: '1',
    name: "Aling Lucing's Sisig",
    category: 'Restaurant',
    rating: 4.8,
    popularity: 98,
    recommendedRank: 1,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Aling_Lucing_The_Sisig_Queen_Restaurant,_Angeles,_Pampanga,_Aug_2026_(1).jpg?width=1000',
    price: '₱₱',
    location: 'Angeles City',
    address: 'Glaciano Valdez Street, Angeles City, Pampanga',
    phone: '',
    website: '',
    lastVerified: '',
    hours: 'Verify hours before visiting',
    description: 'A much-loved stop for the sizzling Kapampangan dish that put sisig on the map. Come hungry and bring your appetite for local flavor.'
  },
  {
    id: '2',
    name: 'Museo Ning Angeles',
    category: 'Heritage',
    rating: 4.5,
    popularity: 78,
    recommendedRank: 5,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Museo_Ning_Angeles.jpg?width=1000',
    price: 'Check with the venue',
    location: 'Heritage District',
    address: 'Santo Rosario Street, Angeles City, Pampanga',
    lastVerified: '',
    hours: 'Verify museum hours before visiting',
    description: "Get to know the city's story inside this heritage museum, set in a restored historic building near the town plaza."
  },
  {
    id: '3',
    name: 'Aqua Planet',
    category: 'Entertainment',
    rating: 4.7,
    popularity: 96,
    recommendedRank: 3,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Aqua_Planet.jpg?width=1000',
    price: 'Check current ticket prices',
    location: 'Clark Freeport Zone',
    address: 'Clark Freeport Zone, Mabalacat, Pampanga',
    lastVerified: '',
    hours: 'Check operating schedule before visiting',
    description: "A full day of splashes and slides awaits at one of the region's best-known water parks in Clark."
  },
  {
    id: '4',
    name: 'Pamintuan Mansion',
    category: 'Heritage',
    rating: 4.6,
    popularity: 74,
    recommendedRank: 6,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pamintuan_Mansion_in_Angeles_City,_Pampanga.jpg?width=1000',
    price: 'Check with the venue',
    location: 'Heritage District',
    address: 'Santo Rosario Street, Angeles City, Pampanga',
    lastVerified: '',
    hours: 'Verify museum hours before visiting',
    description: 'Step into a piece of Philippine history at this beautifully preserved mansion, an essential stop on an old-town wander.'
  },
  {
    id: '5',
    name: 'Café Fleur',
    category: 'Restaurant',
    rating: 4.7,
    popularity: 92,
    recommendedRank: 2,
    image: 'https://capitaltownpampanga.com.ph/wp-content/uploads/2018/07/cafe-fleur-2.jpg',
    price: '₱₱₱',
    location: 'Angeles City',
    address: 'The Garden, Dycaico Ancestral House, Santo Rosario Street, Angeles City, Pampanga',
    phone: '+63 995 313 8413',
    website: '',
    lastVerified: '',
    hours: 'Verify hours with the venue before visiting',
    description: 'A thoughtful take on Kapampangan cuisine, where familiar regional flavors meet a contemporary dining experience.'
  },
  {
    id: '6',
    name: 'Holy Rosary Parish Church',
    category: 'Heritage',
    rating: 4.8,
    popularity: 87,
    recommendedRank: 4,
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Holy_Rosary_Parish_Church_(Angeles_City,_Pampanga).jpg?width=1000',
    price: 'Free entry',
    location: 'Heritage District',
    address: 'Santo Rosario Street, Angeles City, Pampanga',
    lastVerified: '',
    hours: 'Please be mindful of services and visiting hours',
    description: "A landmark of the Heritage District and a striking place to pause and admire the city's architecture and history."
  },
  {
    id: '7',
    name: 'Sandbox at Alviera',
    category: 'Adventure',
    rating: 4.6,
    popularity: 81,
    recommendedRank: 7,
    image: 'https://3.bp.blogspot.com/-l7G4TrRipdU/V0sC05YSnUI/AAAAAAAABE4/WhBsXv6mbcUcrlO86jwFDgWN9VsFeOVDQCLcB/s1600/10245278_1277025235644923_3524498971041076126_n.jpg',
    price: 'Varies by activity',
    location: 'Porac, Pampanga',
    hours: 'Check activity schedules before visiting',
    description: 'Make room for a little adventure at this outdoor playground, with activities and open spaces for a fun day out with friends or family.'
  },
  {
    id: '8',
    name: 'Walking Street',
    category: 'Entertainment',
    rating: 4.3,
    popularity: 90,
    recommendedRank: 8,
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Angeles_City_Malaba%C3%B1as%2C_Fields_Avenue_night_view_%28Angeles%2C_Pampanga%3B_05-27-2023%29.jpg',
    price: 'Free to explore',
    location: 'Balibago, Angeles City',
    hours: 'Best explored in the evening',
    description: 'A lively stretch of restaurants, music, and nightlife. Explore with your group, stay aware of your surroundings, and choose the spots that suit you.'
  }
];

function findPlace(placeId) {
  return Place.findOne({ id: String(placeId) }).lean();
}

function createToken(userId) {
  return jwt.sign({}, JWT_SECRET, { subject: String(userId), expiresIn: '7d' });
}

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

function sendSession(res, user) {
  res.json({
    token: createToken(user._id),
    user: publicUser(user),
    favoriteIds: user.favorites.map(String)
  });
}

async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
}

function optionalAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.sub;
    } catch {
      // Public review browsing should still work when a stored session expires.
    }
  }
  return next();
}

async function requireAdmin(req, res, next) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'Account no longer exists. Please sign in again.' });
  if (user.role !== 'admin') return res.status(403).json({ message: 'Administrator access is required.' });
  req.user = user;
  return next();
}

app.get('/api/places', async (req, res) => {
  const ratings = await Review.aggregate([
    { $group: { _id: '$placeId', average: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const ratingByPlace = new Map(ratings.map((rating) => [rating._id, rating]));
  const directory = await Place.find().sort({ recommendedRank: 1, name: 1 }).lean();
  res.json(directory.map((place) => {
    const community = ratingByPlace.get(place.id);
    return {
      id: place.id,
      name: place.name,
      category: place.category,
      popularity: place.popularity,
      recommendedRank: place.recommendedRank,
      image: place.image,
      price: place.price,
      location: place.location,
      hours: place.hours,
      address: place.address || '',
      phone: place.phone || '',
      website: place.website || '',
      lastVerified: place.lastVerified || '',
      bestTime: place.bestTime || '',
      tips: place.tips || '',
      description: place.description,
      rating: community ? Number(community.average.toFixed(1)) : place.rating,
      reviewCount: community ? community.count : 0,
      ratingSource: community ? 'community' : 'curated'
    };
  }));
});

app.post('/api/auth/signup', async (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ message: 'Name must be between 2 and 60 characters.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'Password must be at least 8 characters and no more than 72 bytes.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({ name, email, passwordHash });
    return sendSession(res, user);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with that email already exists.' });
    throw error;
  }
});

app.post('/api/auth/login', async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  return sendSession(res, user);
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'Account no longer exists. Please sign in again.' });
  return res.json({ user: publicUser(user), favoriteIds: user.favorites.map(String) });
});

app.put('/api/account/favorites/:placeId', requireAuth, async (req, res) => {
  const place = await findPlace(req.params.placeId);
  if (!place) return res.status(404).json({ message: 'That place could not be found.' });
  const user = await User.findByIdAndUpdate(req.userId, { $addToSet: { favorites: place.id } }, { new: true });
  if (!user) return res.status(401).json({ message: 'Account no longer exists. Please sign in again.' });
  return res.json({ favoriteIds: user.favorites.map(String) });
});

app.delete('/api/account/favorites/:placeId', requireAuth, async (req, res) => {
  const place = await findPlace(req.params.placeId);
  if (!place) return res.status(404).json({ message: 'That place could not be found.' });
  const user = await User.findByIdAndUpdate(req.userId, { $pull: { favorites: place.id } }, { new: true });
  if (!user) return res.status(401).json({ message: 'Account no longer exists. Please sign in again.' });
  return res.json({ favoriteIds: user.favorites.map(String) });
});

app.get('/api/places/:placeId/reviews', optionalAuth, async (req, res) => {
  const place = await findPlace(req.params.placeId);
  if (!place) return res.status(404).json({ message: 'That place could not be found.' });
  const reviews = await Review.find({ placeId: place.id }).sort({ createdAt: -1 }).lean();
  return res.json({
    reviews: reviews.map((review) => ({
      id: String(review._id),
      name: review.name,
      rating: review.rating,
      text: review.text,
      likes: review.likedBy.length,
      likedByMe: req.get('authorization') ? review.likedBy.some((id) => String(id) === req.userId) : false,
      isMine: Boolean(req.userId && String(review.userId) === String(req.userId)),
      createdAt: review.createdAt
    }))
  });
});

app.post('/api/places/:placeId/reviews', requireAuth, async (req, res) => {
  const place = await findPlace(req.params.placeId);
  if (!place) return res.status(404).json({ message: 'That place could not be found.' });
  const body = req.body || {};
  const rating = Number(body.rating);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Choose a rating from 1 to 5.' });
  }
  if (text.length < 3 || text.length > 400) {
    return res.status(400).json({ message: 'Review must be between 3 and 400 characters.' });
  }
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'Account no longer exists. Please sign in again.' });
  const review = await Review.findOneAndUpdate(
    { placeId: place.id, userId: user._id },
    { $set: { name: user.name, rating, text }, $setOnInsert: { likedBy: [] } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  const [average] = await Review.aggregate([
    { $match: { placeId: place.id } },
    { $group: { _id: null, rating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  return res.json({
    review: {
      id: String(review._id),
      name: review.name,
      rating: review.rating,
      text: review.text,
      likes: review.likedBy.length,
      likedByMe: review.likedBy.some((id) => String(id) === String(user._id)),
      isMine: String(review.userId) === String(user._id),
      createdAt: review.createdAt
    },
    rating: Number(average.rating.toFixed(1)),
    reviewCount: average.count
  });
});

app.delete('/api/reviews/:reviewId', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.reviewId)) return res.status(404).json({ message: 'That review could not be found.' });
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: 'That review could not be found.' });
  if (String(review.userId) !== String(req.userId)) return res.status(403).json({ message: 'You can only remove your own review.' });
  const placeId = review.placeId;
  await review.deleteOne();
  const [average] = await Review.aggregate([
    { $match: { placeId } },
    { $group: { _id: null, rating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const place = await findPlace(placeId);
  return res.json({
    message: 'Your review was removed.',
    placeId,
    rating: average ? Number(average.rating.toFixed(1)) : (place?.rating || 0),
    reviewCount: average?.count || 0,
    ratingSource: average ? 'community' : 'curated'
  });
});

app.put('/api/reviews/:reviewId/like', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.reviewId)) return res.status(404).json({ message: 'That review could not be found.' });
  const review = await Review.findById(req.params.reviewId);
  if (!review) return res.status(404).json({ message: 'That review could not be found.' });
  const liked = review.likedBy.some((userId) => String(userId) === req.userId);
  if (liked) review.likedBy.pull(req.userId);
  else review.likedBy.addToSet(req.userId);
  await review.save();
  return res.json({ likedByMe: !liked, likes: review.likedBy.length });
});

app.get('/api/account/profile', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'Account no longer exists. Please sign in again.' });
  const [savedPlaces, ownReviews, likedReviews] = await Promise.all([
    Place.find({ id: { $in: user.favorites } }).lean(),
    Review.find({ userId: user._id }).sort({ updatedAt: -1 }).lean(),
    Review.find({ likedBy: user._id, userId: { $ne: user._id } }).sort({ updatedAt: -1 }).lean()
  ]);
  const reviewPlaceIds = [...new Set([...ownReviews, ...likedReviews].map((review) => review.placeId))];
  const reviewPlaces = await Place.find({ id: { $in: reviewPlaceIds } }, { id: 1, name: 1 }).lean();
  const placeNames = new Map(reviewPlaces.map((place) => [place.id, place.name]));
  const toPublicReview = (review) => ({
    id: String(review._id),
    placeId: review.placeId,
    placeName: placeNames.get(review.placeId) || 'Removed place',
    name: review.name,
    rating: review.rating,
    text: review.text,
    likes: review.likedBy.length,
    likedByMe: review.likedBy.some((userId) => String(userId) === String(user._id)),
    isMine: String(review.userId) === String(user._id),
    createdAt: review.updatedAt
  });
  const ratings = await Review.aggregate([
    { $match: { placeId: { $in: user.favorites } } },
    { $group: { _id: '$placeId', rating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
  ]);
  const ratingById = new Map(ratings.map((item) => [item._id, item]));
  return res.json({
    savedPlaces: savedPlaces.map((place) => {
      const rating = ratingById.get(place.id);
      return { ...place, rating: rating ? Number(rating.rating.toFixed(1)) : place.rating, reviewCount: rating?.reviewCount || 0 };
    }),
    reviews: ownReviews.map(toPublicReview),
    likedReviews: likedReviews.map(toPublicReview)
  });
});

app.post('/api/suggestions', async (req, res) => {
  const body = req.body || {};
  if (typeof body.website === 'string' && body.website.trim()) return res.status(400).json({ message: 'Unable to submit this suggestion.' });
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const topic = typeof body.topic === 'string' ? body.topic : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (name.length > 60) return res.status(400).json({ message: 'Name must be no more than 60 characters.' });
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }
  if (!['Suggest a place', 'Correct a detail', 'Share an idea', 'Something else'].includes(topic)) {
    return res.status(400).json({ message: 'Choose a suggestion topic.' });
  }
  if (message.length < 10 || message.length > 1500) {
    return res.status(400).json({ message: 'Suggestion must be between 10 and 1500 characters.' });
  }
  await Suggestion.create({ name, email, topic, message });
  return res.status(201).json({ message: 'Thanks for helping us make the guide better.' });
});

function validatedPlace(body = {}) {
  const fields = {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    category: typeof body.category === 'string' ? body.category : '',
    image: typeof body.image === 'string' ? body.image.trim() : '',
    location: typeof body.location === 'string' ? body.location.trim() : '',
    price: typeof body.price === 'string' ? body.price.trim() : '',
    hours: typeof body.hours === 'string' ? body.hours.trim() : '',
    address: typeof body.address === 'string' ? body.address.trim() : '',
    phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    website: typeof body.website === 'string' ? body.website.trim() : '',
    lastVerified: typeof body.lastVerified === 'string' ? body.lastVerified.trim() : '',
    bestTime: typeof body.bestTime === 'string' ? body.bestTime.trim() : '',
    tips: typeof body.tips === 'string' ? body.tips.trim() : '',
    description: typeof body.description === 'string' ? body.description.trim() : '',
    popularity: Number(body.popularity),
    recommendedRank: Number(body.recommendedRank)
  };
  const categories = ['Restaurant', 'Heritage', 'Adventure', 'Entertainment'];
  if (fields.name.length < 2 || fields.name.length > 100) throw Object.assign(new Error('Name must be between 2 and 100 characters.'), { status: 400 });
  if (!categories.includes(fields.category)) throw Object.assign(new Error('Choose a valid place category.'), { status: 400 });
  if (!/^https?:\/\/.+/i.test(fields.image) || fields.image.length > 1000) throw Object.assign(new Error('Enter a valid http or https image URL.'), { status: 400 });
  if (!fields.location || fields.location.length > 160) throw Object.assign(new Error('Location is required and must be no more than 160 characters.'), { status: 400 });
  if (fields.price.length > 100 || fields.hours.length > 180 || fields.address.length > 240 || fields.phone.length > 40 || fields.website.length > 300 || fields.lastVerified.length > 40 || fields.bestTime.length > 140 || fields.tips.length > 280) throw Object.assign(new Error('One or more place details are too long.'), { status: 400 });
  if (fields.website && !/^https?:\/\/.+/i.test(fields.website)) throw Object.assign(new Error('Website must start with http:// or https://.'), { status: 400 });
  if (fields.description.length < 10 || fields.description.length > 1000) throw Object.assign(new Error('Description must be between 10 and 1000 characters.'), { status: 400 });
  if (!Number.isInteger(fields.popularity) || fields.popularity < 0 || fields.popularity > 100) throw Object.assign(new Error('Popularity must be a whole number from 0 to 100.'), { status: 400 });
  if (!Number.isInteger(fields.recommendedRank) || fields.recommendedRank < 1 || fields.recommendedRank > 1000) throw Object.assign(new Error('Recommendation order must be a whole number from 1 to 1000.'), { status: 400 });
  return fields;
}

app.get('/api/admin/places', requireAuth, requireAdmin, async (req, res) => {
  const [directory, ratings] = await Promise.all([
    Place.find().sort({ recommendedRank: 1, name: 1 }).lean(),
    Review.aggregate([{ $group: { _id: '$placeId', rating: { $avg: '$rating' }, count: { $sum: 1 } } }])
  ]);
  const byPlaceId = new Map(ratings.map((item) => [item._id, item]));
  return res.json(directory.map((place) => {
    const community = byPlaceId.get(place.id);
    return {
      ...place,
      rating: community ? Number(community.rating.toFixed(1)) : place.rating,
      reviewCount: community?.count || 0
    };
  }));
});

app.post('/api/admin/places', requireAuth, requireAdmin, async (req, res) => {
  const fields = validatedPlace(req.body);
  const place = await Place.create({ ...fields, id: randomUUID(), rating: 0 });
  return res.status(201).json(place.toJSON());
});

app.put('/api/admin/places/:placeId', requireAuth, requireAdmin, async (req, res) => {
  const fields = validatedPlace(req.body);
  const place = await Place.findOneAndUpdate(
    { id: req.params.placeId },
    { $set: fields },
    { new: true, runValidators: true }
  );
  if (!place) return res.status(404).json({ message: 'That place could not be found.' });
  return res.json(place.toJSON());
});

app.delete('/api/admin/places/:placeId', requireAuth, requireAdmin, async (req, res) => {
  const place = await Place.findOneAndDelete({ id: req.params.placeId });
  if (!place) return res.status(404).json({ message: 'That place could not be found.' });
  await Promise.all([
    Review.deleteMany({ placeId: place.id }),
    User.updateMany({ favorites: place.id }, { $pull: { favorites: place.id } })
  ]);
  return res.json({ message: 'Place deleted.' });
});

app.get('/api/admin/suggestions', requireAuth, requireAdmin, async (req, res) => {
  const suggestions = await Suggestion.find().sort({ createdAt: -1 }).limit(100).lean();
  return res.json(suggestions.map((suggestion) => ({
    id: String(suggestion._id),
    name: suggestion.name,
    email: suggestion.email,
    topic: suggestion.topic,
    message: suggestion.message,
    status: suggestion.status || 'Pending',
    createdAt: suggestion.createdAt
  })));
});

app.patch('/api/admin/suggestions/:suggestionId', requireAuth, requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.suggestionId)) return res.status(404).json({ message: 'That suggestion could not be found.' });
  const status = req.body?.status;
  if (!['Pending', 'Reviewed', 'Resolved'].includes(status)) return res.status(400).json({ message: 'Choose a valid suggestion status.' });
  const suggestion = await Suggestion.findByIdAndUpdate(req.params.suggestionId, { $set: { status } }, { new: true, runValidators: true });
  if (!suggestion) return res.status(404).json({ message: 'That suggestion could not be found.' });
  return res.json({ id: String(suggestion._id), status: suggestion.status });
});

app.get('/api/admin/reviews', requireAuth, requireAdmin, async (req, res) => {
  const reviews = await Review.find().sort({ updatedAt: -1 }).limit(200).lean();
  const placeIds = [...new Set(reviews.map((review) => review.placeId))];
  const places = await Place.find({ id: { $in: placeIds } }, { id: 1, name: 1 }).lean();
  const names = new Map(places.map((place) => [place.id, place.name]));
  return res.json(reviews.map((review) => ({
    id: String(review._id),
    placeId: review.placeId,
    placeName: names.get(review.placeId) || 'Removed place',
    name: review.name,
    rating: review.rating,
    text: review.text,
    likes: review.likedBy.length,
    createdAt: review.updatedAt
  })));
});

app.delete('/api/admin/reviews/:reviewId', requireAuth, requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.reviewId)) return res.status(404).json({ message: 'That review could not be found.' });
  const review = await Review.findByIdAndDelete(req.params.reviewId);
  if (!review) return res.status(404).json({ message: 'That review could not be found.' });
  return res.json({ message: 'Review removed.' });
});

app.use((error, req, res, next) => {
  console.error(`API error on ${req.method} ${req.path}:`, error);
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : error.name === 'ValidationError' ? 400 : 500;
  const message = status === 500
    ? 'The server could not complete that request. Please try again.'
    : error.message;
  return res.status(status).json({ message });
});

async function seedPlaces() {
  // Seed only missing records. Existing listings are admin-managed, including their images.
  await Promise.all(initialPlaces.map((place) => Place.updateOne(
    { id: place.id },
    { $setOnInsert: place },
    { upsert: true }
  )));
}

async function seedAdmin() {
  const email = typeof process.env.ADMIN_EMAIL === 'string' ? process.env.ADMIN_EMAIL.trim().toLowerCase() : '';
  const password = typeof process.env.ADMIN_PASSWORD === 'string' ? process.env.ADMIN_PASSWORD : '';
  if (!email && !password) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || Buffer.byteLength(password, 'utf8') < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Set a valid ADMIN_EMAIL and ADMIN_PASSWORD (12–72 bytes) together to provision an administrator.');
  }
  let user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    user = await User.create({
      name: 'Administrator',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin'
    });
  } else if (user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }
}

async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required. Configure it in backend/.env.');
  if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET) < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  await seedPlaces();
  await seedAdmin();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start().catch((error) => {
  console.error('Unable to start API server:', error);
  process.exitCode = 1;
});
