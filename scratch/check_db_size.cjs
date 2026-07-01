const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/jahan/Downloads/user-portal-main (5)/user-portal-main/server/.env' });

async function run() {
  console.log("Connecting to MongoDB using URI:", process.env.MONGO_URI);
  const start = Date.now();
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log(`Connected in ${Date.now() - start}ms`);

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`Collection: ${coll.name} - Documents: ${count}`);
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
