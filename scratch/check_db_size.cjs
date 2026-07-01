const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'c:/Users/jahan/Downloads/user-portal-main (5)/user-portal-main/server/.env' });

async function run() {
  console.log("Connecting using URI:", process.env.MONGO_URI);
  const client = new MongoClient(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });

  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db('fix-hunger');
    const users = await db.collection('users').find({}).toArray();
    console.log("Users in Database:");
    for (const u of users) {
      console.log(`- Email: ${u.email}, Role: ${u.role}, IsActive: ${u.isActive}, Name: ${u.name}`);
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.close();
  }
}

run();
