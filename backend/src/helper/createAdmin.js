const mongoose = require("mongoose");
const User = require("../models/userModel");
const { mongodbURL } = require("../secret");

async function makeAdmin() {
  const args = process.argv.slice(2);
  const [email, password, name = "System Admin"] = args;
  if (!email || !password || password.length < 12) {
    console.error("Usage: npm run make:admin -- <email> <password (12+ chars)> [name]");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongodbURL);
    console.log("Connected to MongoDB.");

    let user = await User.findOne({ email });

    if (user) {
      user.role = "admin";
      await user.save();
      console.log(`\n Successfully updated existing user "${email}" to role: "admin"!`);
    } else {
      user = await User.create({
        name,
        email,
        password,
        role: "admin",
        address: "Hospital HQ, Dhaka",
        phone: "01700000000",
      });
      console.log(`\n Successfully created new Admin user:`);
    }

    console.log("------------------------------------------");
    console.log(`Email:    ${email}`);
    console.log(`Role:     admin`);
    console.log("------------------------------------------");
    console.log("You can now log in at http://localhost:5173/login with these credentials.\n");
  } catch (error) {
    console.error("Error creating/updating admin:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();
