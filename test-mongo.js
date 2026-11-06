import mongoose from 'mongoose';

async function testConnection() {
  const uri = "mongodb+srv://n8n_support:varma@cluster0.zgvb1qm.mongodb.net/ai_ticketing?retryWrites=true&w=majority";
  try {
    await mongoose.connect(uri);
    console.log("Successfully connected to MongoDB!");
    process.exit(0);
  } catch (error) {
    console.error("Connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
