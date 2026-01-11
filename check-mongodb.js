/**
 * Simple MongoDB connection check
 */
require("dotenv").config();
const mongoose = require("mongoose");

async function checkMongoDB() {
  try {
    console.log("🔍 Checking MongoDB connection...");
    console.log(
      `📍 Connecting to: ${
        process.env.MONGODB_URI || "mongodb://localhost:27017/cms_db"
      }`
    );

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/cms_db",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
      }
    );

    console.log("✅ MongoDB connection successful!");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(
      `🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`
    );

    // Check if collections exist
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(`📁 Collections found: ${collections.length}`);

    if (collections.length === 0) {
      console.log(
        '⚠️  No collections found. Run "npm run seed" to create sample data.'
      );
    } else {
      console.log("📋 Available collections:");
      collections.forEach((col) => console.log(`   - ${col.name}`));
    }

    await mongoose.disconnect();
    console.log("✅ MongoDB check complete!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(`   Error: ${error.message}`);
    console.error("\n🔧 Troubleshooting:");
    console.error("   1. Make sure MongoDB is running");
    console.error("   2. Check if port 27017 is available");
    console.error("   3. Verify MongoDB is installed");
    console.error("   4. Try: mongod --version");
    process.exit(1);
  }
}

checkMongoDB();
