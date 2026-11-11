const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const { isEnabled } = require('./services/ai');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    console.error('Check MONGO_URI in backend/.env and that MongoDB is running.');
    process.exit(1);
  }
  app.listen(port, () => {
    console.log(`TechNeeds NXT API listening on http://localhost:${port}`);
    console.log(`AI narrative: ${isEnabled() ? 'enabled' : 'disabled (computed insights only)'}`);
  });
}

start();
