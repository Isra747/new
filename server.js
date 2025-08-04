const multer = require('multer');
const sharp = require('sharp');
const dotenv = require('dotenv');
const cors =require('cors');
const express = require('express');
const mysql =require('mysql2/promise');
const mysql1 =require('mysql2');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } =require('@aws-sdk/client-s3');
const bodyParser = require('body-parser');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mqtt = require('mqtt');
const cron = require('node-cron');


const fs = require('fs');
let scheduledFeeds = [];

const JWT_SECRET = process.env.JWT_SECRET;
dotenv.config();

const app = express();
app.use(cors())
app.use(express.json());
app.use(bodyParser.json());

const db = mysql1.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
 if (err) {
 console.error('Database connection failed: ' + err.stack);
 return;
 }
 console.log('Connected to the database.');
});

const s3 = new S3Client({
 region: process.env.AWS_BUCKET_REGION,
 credentials: {
 accessKeyId: process.env.AWS_ACCESS_KEY,
 secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
 }
})
const bucket = process.env.AWS_BUCKET_NAME
const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')


const transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
 user: 'as3373413@gmail.com', 
 pass: 'tpzy ffta oaem wnhe', 
 },
});

const sendVerificationEmail = (email, verificationToken) => {
  const verificationUrl = `https://u76rpadxda.us-east-1.awsapprunner.com/api/verify-email/${verificationToken}`;

  const mailOptions = {
    from: 'PetProtect <no-reply@petprotect.com>',
    to: email,
    subject: 'Verify Your Email - PetProtect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; background-color: #fefefe;">
        <h2 style="text-align: center; color: #5C4033;">🐶 PetProtect - Email Verification</h2>
        <p style="font-size: 16px; color: #333;">Hi there,</p>
        <p style="font-size: 16px; color: #333;">Thank you for registering with <strong>PetProtect</strong>.</p>
        <p style="font-size: 16px; color: #333;">Please confirm your email address by clicking the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" target="_blank" style="
            background-color: #5C4033;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
          ">Verify Email</a>
        </div>

        <p style="font-size: 14px; color: #666;">If you didn’t sign up for PetProtect, you can safely ignore this email.</p>
        <hr style="margin-top: 40px;" />
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          © ${new Date().getFullYear()} PetProtect. All rights reserved.
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};

app.get('/api/verify-email/:token', (req, res) => {
  const { token } = req.params;
  console.log("Received token:", token);

  const checkTokenQuery = "SELECT * FROM email_verifications WHERE verificationToken = ?";
  db.query(checkTokenQuery, [token], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: red;">❌ Server Error</h2>
          <p>Something went wrong with the database.</p>
        </div>
      `);
    }

    if (results.length === 0) {
      return res.status(400).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #5C4033;">🐶 PetProtect</h2>
          <h3 style="color: red;">❌ Verification Failed</h3>
          <p style="font-size: 16px; color: #333;">This verification link is invalid or has expired.</p>
          <p style="font-size: 14px; color: #666;">Please request a new verification email.</p>
          <hr style="margin-top: 30px;" />
          <p style="font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} PetProtect</p>
        </div>
      `);
    }

    const { email, name, password } = results[0];

    const insertUserQuery = "INSERT INTO users (name, email, password, verified) VALUES (?, ?, ?, true)";
    db.query(insertUserQuery, [name, email, password], (err, result) => {
      if (err) {
        return res.status(500).send(`
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: red;">❌ Account Creation Failed</h2>
            <p>There was a problem creating your account. Maybe it's already verified.</p>
          </div>
        `);
      }

      const deleteTokenQuery = "DELETE FROM email_verifications WHERE email = ?";
      db.query(deleteTokenQuery, [email], () => {});

      res.status(200).send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #5C4033;">🐶 PetProtect</h2>
          <h3 style="color: green;">✅ Email Verified Successfully!</h3>
          <p style="font-size: 16px; color: #333;">Thanks for verifying your email.</p>
          <p style="font-size: 14px; color: #666;">You can now close this tab and continue using the app.</p>
          <hr style="margin-top: 30px;" />
          <p style="font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} PetProtect</p>
        </div>
      `);
    });
  });
});

app.post('/api/signup', (req, res) => {
 const { name, email, password } = req.body;

 if (!name || !email || !password) {
 return res.status(400).json({ message: "All fields are required" });
 }

 const checkUserQuery = "SELECT * FROM users WHERE email = ?";
 db.query(checkUserQuery, [email], (err, results) => {
 if (err) {
 console.error("Error checking user:", err);
 return res.status(500).json({ message: "Database error" });
 }
 if (results.length > 0) {
 return res.status(400).json({ message: "User already exists" });
 }


 const verificationToken = crypto.randomBytes(20).toString('hex');


 sendVerificationEmail(email, verificationToken)
 .then(() => {

 const insertTokenQuery = "INSERT INTO email_verifications (name, email, password, verificationToken) VALUES (?, ?, ?, ?)";
 db.query(insertTokenQuery, [name, email, password, verificationToken], (err, result) => {
 if (err) {
 console.error("Error storing verification token:", err);
 return res.status(500).json({ message: "Failed to store verification token" });
 }

 res.status(200).json({ message: "Verification email sent. Please verify your email" });
 });
 })
 .catch((error) => {
 console.error("Error sending email:", error);
 res.status(500).json({ message: "Failed to send verification email" });
 });
 });
});

app.get('/api/verify-email/:token', (req, res) => {
 const { token } = req.params;
 console.log("Received token:", token);

 const checkTokenQuery = "SELECT * FROM email_verifications WHERE verificationToken = ?";
 db.query(checkTokenQuery, [token], (err, results) => {
 if (err) {
 console.error("Database error:", err);
 return res.status(500).json({ message: "Database error", error: err.message });
 }

 console.log("Database results:", results);

 if (results.length === 0) {
 return res.status(400).json({ message: "Invalid or expired token" });
 }

 const { email, name, password } = results[0];

 const insertUserQuery = "INSERT INTO users (name, email, password, verified) VALUES (?, ?, ?, true)";
 db.query(insertUserQuery, [name, email, password], (err, result) => {
 if (err) {
 return res.status(500).json({ message: "Failed to create user" });
 }


 const deleteTokenQuery = "DELETE FROM email_verifications WHERE email = ?";
 db.query(deleteTokenQuery, [email], () => {});

 res.status(200).json({ message: "Email verified successfully. You can now log in." });
 });
 });
})

app.post('/api/signin', (req, res) => {
 const { email, password } = req.body;

 if (!email || !password) {
 return res.status(400).json({ message: "All fields are required" });
 }

 const checkUserQuery = "SELECT * FROM users WHERE email = ?";
 db.query(checkUserQuery, [email], (err, results) => {
 if (err) {
 console.error("Database error:", err);
 return res.status(500).json({ message: "Database error" });
 }

 if (results.length === 0) {
 return res.status(401).json({ message: "Invalid email or password" });
 }

 const user = results[0];

 if (password !== user.password) {
 return res.status(401).json({ message: "Invalid email or password" });
 }

 // Check if user has pet profiles
 const checkPetsQuery = "SELECT COUNT(*) AS petCount FROM pet WHERE user_email = ?";
 db.query(checkPetsQuery, [email], (petErr, petResults) => {
 if (petErr) {
 console.error("Error checking pet profiles:", petErr);
 return res.status(500).json({ message: "Failed to check pet profiles" });
 }

 const hasPets = petResults[0].petCount > 0;

 // Generate JWT token
 const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1d' });

 res.status(200).json({
 message: "Login successful",
 access_token: token,
 hasPets: hasPets // 🔹 Send this flag to frontend
 });
 });
 });
});

app.get('/api/motion-data/latest', (req, res) => {
  const petId = req.query.pet_id;

  if (!petId) {
    return res.status(400).json({ error: 'Missing pet_id' });
  }

  // First: check if this pet is linked to a collar
  const checkQuery = `SELECT * FROM connected_pet WHERE pet_id = ?`;
  db.query(checkQuery, [petId], (err, linkResult) => {
    if (err) {
      console.error('Error checking linked pet:', err);
      return res.status(500).json({ error: 'Database error during link check' });
    }

    if (linkResult.length === 0) {
      // Not connected to collar
      return res.status(403).json({ message: 'Pet not connected to any collar' });
    }

    // Then: fetch latest motion data
    const motionQuery = `
    SELECT 
      motion_state,
      temperature_c,
      temperature_f,
      heart_rate,
      timestamp
    FROM motion_data
    WHERE pet_id = ?
    ORDER BY id DESC
    LIMIT 1
  `;
  
  

    db.query(motionQuery, [petId], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: 'No motion data available for this pet' });
      }

      const latest = result[0];

      res.status(200).json({
        motion_state: latest.motion_state,
        temperature_c: latest.temperature_c,
        temperature_f: latest.temperature_f,
        heart_rate: latest.heart_rate,
        timestamp: latest.timestamp
      });
    });
  });
});

app.post("/api/forgot-password", (req, res) => {
 const { email } = req.body;
 if (!email) {
 return res.status(400).json({ message: "Email is required" });
 }

 const checkUserQuery = "SELECT * FROM users WHERE email = ?";
 db.query(checkUserQuery, [email], (err, results) => {
 if (err) {
 console.error("Database error:", err);
 return res.status(500).json({ message: "Database error" });
 }

 if (results.length === 0) {
 return res.status(404).json({ message: "User not found" });
 }

 // ✅ Generate 6-digit verification code
 const verificationCode = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
 const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // Code valid for 10 minutes

 console.log("Generated Code:", verificationCode); // Debugging

 // ✅ Store Code in Database
 const updateCodeQuery = "UPDATE users SET resetCode = ?, codeExpiry = ? WHERE email = ?";
 db.query(updateCodeQuery, [verificationCode, codeExpiry, email], (err) => {
 if (err) {
 console.error("Error storing reset code:", err);
 return res.status(500).json({ message: "Failed to store reset code" });
 }

 // ✅ Email Verification Code
 const mailOptions = {
 from: "PetProtect",
 to: email,
 subject: "Password Reset Code",
 html: `
 <p>You requested a password reset.</p>
 <p>Your verification code is: <strong>${verificationCode}</strong></p>
 <p>This code will expire in 10 minutes.</p>
 `,
 };

 transporter.sendMail(mailOptions, (error) => {
 if (error) {
 console.error("Error sending email:", error);
 return res.status(500).json({ message: "Failed to send reset email" });
 }

 res.status(200).json({ message: "Verification code sent to email." });
 });
 });
 });
});

app.post("/api/reset-password", (req, res) => {
 const { email, code, password } = req.body;

 if (!email || !code || !password) {
 return res.status(400).json({ message: "Email, code, and new password are required" });
 }

 console.log("Received Code:", code); // Debugging

 // ✅ Check if Code is Correct and Not Expired
 const getUserQuery = "SELECT * FROM users WHERE email = ? AND resetCode = ? AND codeExpiry > NOW()";
 db.query(getUserQuery, [email, code], (err, results) => {
 if (err) {
 console.error("Database error:", err);
 return res.status(500).json({ message: "Database error" });
 }

 if (results.length === 0) {
 console.log("Invalid or expired code"); // Debugging
 return res.status(400).json({ message: "Invalid or expired verification code" });
 }

 const user = results[0];

 // ✅ Update Password and Clear Code
 const updatePasswordQuery =
 "UPDATE users SET password = ?, resetCode = NULL, codeExpiry = NULL WHERE email = ?";
 db.query(updatePasswordQuery, [password, user.email], (err) => {
 if (err) {
 console.error("Error updating password:", err);
 return res.status(500).json({ message: "Failed to update password" });
 }

 console.log("Password reset successful for:", user.email); // Debugging
 res.status(200).json({ message: "Password reset successful. You can now log in." });
 });
 });
});

app.post("/api/verify-code", (req, res) => {
 const { email, code } = req.body;

 if (!email || !code) {
 return res.status(400).json({ message: "Email and verification code are required" });
 }

 console.log("Verifying Code:", code); // Debugging

 const verifyCodeQuery = "SELECT * FROM users WHERE email = ? AND resetCode = ? AND codeExpiry > NOW()";
 db.query(verifyCodeQuery, [email, code], (err, results) => {
 if (err) {
 console.error("Database error:", err);
 return res.status(500).json({ message: "Database error" });
 }

 if (results.length === 0) {
 console.log("Invalid or expired verification code"); // Debugging
 return res.status(400).json({ message: "Invalid or expired verification code" });
 }

 res.status(200).json({ message: "Code verified successfully." });
 });
});

const upload = multer({
 storage: multer.memoryStorage(),
 fileFilter: (req, file, cb) => {
 if (file.fieldname === 'petimage') {
 cb(null, true);
 } else {
 cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname), false);
 }
 }
});

// app.post('/api/pets', (req, res) => {
// const { name, type, gender, breed, date, weight } = req.body;
// const token = req.headers.authorization?.split(' ')[1];

// if (!token) {
// return res.status(401).json({ error: "Unauthorized: No token provided" });
// }

// try {
// const decoded = jwt.verify(token, JWT_SECRET);
// const userEmail = decoded.email; // Extract user email from token

// const formattedDate = new Date(date).toISOString().split('T')[0];

// const query = `
// INSERT INTO pet (name, type, gender, breed, date, weight, age, user_email)
// VALUES (?, ?, ?, ?, ?, ?, 
// CONCAT(
// TIMESTAMPDIFF(YEAR, ?, CURDATE()), ' years ', 
// TIMESTAMPDIFF(MONTH, ?, CURDATE()) % 12, ' months'
// ), ?)
// `;

// db.query(query, [name, type, gender, breed, formattedDate, weight, formattedDate, formattedDate, userEmail], 
// (err, result) => {
// if (err) {
// console.error('Error inserting pet data:', err);
// return res.status(500).json({ error: 'Failed to add pet' });
// }
// res.status(200).json({ message: 'Pet added successfully', petId: result.insertId });
// });

// } catch (error) {
// return res.status(401).json({ error: "Unauthorized: Invalid token" });
// }
// });

app.post('/api/pets', upload.single('petimage'), async (req, res) => {
  const { name, type, gender, breed, date, weight } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;
    const formattedDate = new Date(date).toISOString().split('T')[0];

    let imageFileName = null;
    let imageUrl = null;

    // ✅ Upload image to S3
    if (req.file) {
      imageFileName = generateFileName(); // Generate a unique file name
      const fileBuffer = await sharp(req.file.buffer)
        .resize({ width: 500, height: 500, fit: 'cover' })
        .toBuffer();

      // Upload the image to S3
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: imageFileName,
        Body: fileBuffer,
        ContentType: req.file.mimetype,
      }));

      imageUrl = `https://${bucket}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${imageFileName}`;
    }

    const query = `
      INSERT INTO pet (name, type, gender, breed, date, weight, age, user_email, petimage)
      VALUES (?, ?, ?, ?, ?, ?,
        CONCAT(
          TIMESTAMPDIFF(YEAR, ?, CURDATE()), ' years ',
          TIMESTAMPDIFF(MONTH, ?, CURDATE()) % 12, ' months'
        ), ?, ?)
    `;

    db.query(
      query,
      [name, type, gender, breed, formattedDate, weight, formattedDate, formattedDate, userEmail, imageUrl],
      (err, result) => {
        if (err) {
          console.error('Error inserting pet:', err);
          if (imageFileName) {
            s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: imageFileName })).catch(console.error);
          }
          return res.status(500).json({ error: 'Failed to add pet' });
        }

        res.status(200).json({
          message: 'Pet added successfully',
          petId: result.insertId,
          imageUrl,
        });
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
});

app.get('/api/pet-profile', (req, res) => {
 const token = req.headers.authorization?.split(' ')[1]; // Extract token
 if (!token) {
 return res.status(401).json({ error: 'Unauthorized' });
 }

 try {
 const decoded = jwt.verify(token, JWT_SECRET); // Decode JWT
 const userEmail = decoded.email; // Extract email from token

 console.log('User Email:', userEmail);

 const query = 'SELECT * FROM pet WHERE user_email = ?';
 db.query(query, [userEmail], (err, result) => {
 if (err) {
 console.error('Error fetching pet data:', err);
 return res.status(500).json({ error: 'Failed to fetch pet data' });
 }

 if (result.length === 0) {
 return res.status(404).json({ error: 'Pet profile not found' });
 }

 res.status(200).json(result[0]);
 });
 } catch (error) {
 return res.status(403).json({ error: 'Invalid token' });
 }
});

// app.put('/api/petsupdate/:id', (req, res) => {
//  const petId = (req.params.id); // Ensure petId is an integer
//  const { name, type, gender, breed, date, weight, age } = req.body;

//  if (!name || !type || !gender || !breed || !date || !weight || !age) {
//  return res.status(400).json({ error: 'All fields are required' });
//  }

//  // Check if pet exists before updating
//  const checkQuery = "SELECT * FROM pet WHERE id = ?";
//  db.query(checkQuery, [petId], (err, results) => {
//  if (err) {
//  console.error('Error checking pet:', err);
//  return res.status(500).json({ error: 'Database error' });
//  }

//  if (results.length === 0) {
//  return res.status(404).json({ error: 'Pet not found' });
//  }

//  // If pet exists, update it
//  const updateQuery = `
//  UPDATE pet
//  SET name = ?, type = ?, gender = ?, breed = ?, date = ?, weight = ?, age = ?
//  WHERE id = ?
//  `;

//  db.query(updateQuery, [name, type, gender, breed, date, weight, age, petId], (err, result) => {
//  if (err) {
//  console.error('Error updating pet data:', err);
//  return res.status(500).json({ error: 'Failed to update pet profile' });
//  }

//  res.status(200).json({ message: 'Pet profile updated successfully' });
//  });
//  });
// });

app.put('/api/petsupdate/:id', upload.single('petimage'), async (req, res) => {
  const petId = req.params.id;  // Ensure petId is an integer
  const { name, type, gender, breed, date, weight, age } = req.body;

  // Validate required fields
  if (!name || !type || !gender || !breed || !date || !weight || !age) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if pet exists before updating
  const checkQuery = "SELECT * FROM pet WHERE id = ?";
  db.query(checkQuery, [petId], async (err, results) => {
    if (err) {
      console.error('Error checking pet:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Handle image upload if present
    let imageFileName = null;
    let imageUrl = null;

    if (req.file) {
      // Generate a unique image filename
      imageFileName = `pet_${petId}_${Date.now()}.jpg`;

      // Resize and upload the image to S3
      const fileBuffer = await sharp(req.file.buffer)
        .resize({ width: 500, height: 500, fit: 'cover' })
        .toBuffer();

      // Upload image to S3
      try {
        const uploadParams = {
          Bucket: bucket, // Replace with your S3 bucket name
          Key: imageFileName,
          Body: fileBuffer,
          ContentType: req.file.mimetype,
        };
        await s3.send(new PutObjectCommand(uploadParams));

        // Set image URL (assuming it's publicly accessible via S3)
        imageUrl = `https://${bucket}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${imageFileName}`;
      } catch (uploadErr) {
        console.error('Error uploading image to S3:', uploadErr);
        return res.status(500).json({ error: 'Failed to upload image to S3' });
      }
    }

    // If pet exists, update it
    const updateQuery = `
      UPDATE pet
      SET name = ?, type = ?, gender = ?, breed = ?, date = ?, weight = ?, age = ?, petimage = ?
      WHERE id = ?
    `;

    // Update pet data including image URL if provided
    db.query(updateQuery, [name, type, gender, breed, date, weight, age, imageUrl || null, petId], (err, result) => {
      if (err) {
        console.error('Error updating pet data:', err);
        return res.status(500).json({ error: 'Failed to update pet profile' });
      }

      res.status(200).json({ message: 'Pet profile updated successfully' });
    });
  });
});

app.get('/api/pets', (req, res) => {
 const token = req.headers.authorization?.split(' ')[1]; 

 if (!token) {
 return res.status(401).json({ error: 'Unauthorized' });
 }

 try {
 const decoded = jwt.verify(token, JWT_SECRET); 
 const userEmail = decoded.email; 

 console.log('Fetching pets for:', userEmail);

 const query = 'SELECT * FROM pet WHERE user_email = ?';
 db.query(query, [userEmail], (err, results) => {
 if (err) {
 console.error('Error fetching pet data:', err);
 return res.status(500).json({ error: 'Failed to fetch pet data' });
 }
 
 console.log("Query Results:", results); 
 if (results.length === 0) {
 return res.status(404).json({ error: 'No pets found' });
 }
 
 res.status(200).json(results);
 });
 } catch (error) {
 return res.status(403).json({ error: 'Invalid token' });
 }
});

app.get('/api/user/:email', (req, res) => {
 const sql = 'SELECT name, email, password FROM users WHERE email = ?';
 db.query(sql, [req.params.email], (err, result) => {
 if (err) return res.status(500).json({ error: err.message });
 if (result.length === 0) return res.status(404).json({ message: 'User not found' });
 res.json(result[0]);
 });
});

app.put('/api/userupdate/:email', (req, res) => {
 const { name, password } = req.body;
 const sql = 'UPDATE users SET name = ?, password = ? WHERE email = ?';
 db.query(sql, [name, password, req.params.email], (err, result) => {
 if (err) return res.status(500).json({ error: err.message });
 res.json({ message: 'Profile updated successfully' });
 });
});

app.delete('/api/petdelete/:id', (req, res) => {
 const petId = req.params.id;
 const token = req.headers.authorization?.split(' ')[1];

 if (!token) {
 return res.status(401).json({ error: "Unauthorized: No token provided" });
 }

 try {
 const decoded = jwt.verify(token, JWT_SECRET);
 const userEmail = decoded.email;

 const deleteQuery = "DELETE FROM pet WHERE id = ? AND user_email = ?";
 db.query(deleteQuery, [petId, userEmail], (err, result) => {
 if (err) {
 console.error("Error deleting pet:", err);
 return res.status(500).json({ error: "Failed to delete pet" });
 }
 if (result.affectedRows === 0) {
 return res.status(404).json({ error: "Pet not found or unauthorized" });
 }
 res.status(200).json({ message: "Pet profile deleted successfully" });
 });
 } catch (error) {
 return res.status(401).json({ error: "Unauthorized: Invalid token" });
 }
});

app.get('/api/pet-profile/:id', (req, res) => {
 const petId = req.params.id;
 const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

 if (!token) {
 return res.status(401).json({ error: "Unauthorized: No token provided" });
 }

 try {
 const decoded = jwt.verify(token, JWT_SECRET); // Verify token
 const userEmail = decoded.email; // Get email from token

 // SQL query to fetch pet data based on petId and user_email
 const selectQuery = "SELECT * FROM pet WHERE id = ? AND user_email = ?";
 
 db.query(selectQuery, [petId, userEmail], (err, result) => {
 if (err) {
 console.error("Error fetching pet data:", err);
 return res.status(500).json({ error: "Failed to fetch pet data" });
 }
 if (result.length === 0) {
 return res.status(404).json({ error: "Pet not found or unauthorized" });
 }
 
 // Return the pet data
 res.status(200).json(result[0]); // Send first result as JSON
 });

 } catch (error) {
 return res.status(401).json({ error: "Unauthorized: Invalid token" });
 }
});

app.post('/api/feeding-schedule', (req, res) => {
 const { petId, morning, afternoon, night } = req.body;
 const token = req.headers.authorization?.split(' ')[1];

 if (!token) return res.status(401).json({ error: 'Unauthorized' });

 try {
 const decoded = jwt.verify(token, JWT_SECRET);
 const userEmail = decoded.email;

 const query = `
 INSERT INTO feeding_schedule (pet_id, morning, afternoon, night, user_email)
 VALUES (?, ?, ?, ?, ?)
 ON DUPLICATE KEY UPDATE 
 morning = VALUES(morning),
 afternoon = VALUES(afternoon),
 night = VALUES(night)
 `;

 db.query(query, [petId, morning, afternoon, night, userEmail], (err, result) => {
 if (err) {
 console.error('Error saving feeding schedule:', err);
 return res.status(500).json({ error: 'Database error' });
 }

 // ✅ MQTT Publish for all three times
 try {
 const times = [morning, afternoon, night];
 times.forEach((time) => {
 const cmd = `set ${convertTo24Hour(time)}`;
 client.publish('feeder/control', cmd);
 console.log('[MQTT] Published:', cmd);
 });

 res.status(200).json({ message: 'Schedule saved and MQTT commands sent' });
 } catch (mqttErr) {
 console.error('MQTT error:', mqttErr);
 return res.status(500).json({ error: 'MQTT publish failed', detail: mqttErr.message });
 }
 });
 } catch (err) {
 console.error('JWT verification failed:', err);
 res.status(401).json({ error: 'Invalid token' });
 }
});

// PUT: Update feeding schedule by petId
// app.put('/api/feeding-schedule/:petId', (req, res) => {
// const petId = req.params.petId;
// const token = req.headers.authorization?.split(' ')[1];
// const { morning, afternoon, night } = req.body;

// if (!token) return res.status(401).json({ error: 'Unauthorized' });

// try {
// const decoded = jwt.verify(token, JWT_SECRET);
// const userEmail = decoded.email;

// const updateQuery = `
// UPDATE feeding_schedule 
// SET morning = ?, afternoon = ?, night = ?
// WHERE pet_id = ? AND user_email = ?
// `;

// db.query(updateQuery, [morning, afternoon, night, petId, userEmail], (err, result) => {
// if (err) {
// console.error('DB Update Error:', err);
// return res.status(500).json({ error: 'Database error' });
// }

// if (result.affectedRows === 0) {
// return res.status(404).json({ error: 'Schedule not found for update' });
// }

// res.json({ message: 'Schedule updated successfully' });
// });
// } catch (err) {
// return res.status(401).json({ error: 'Invalid token' });
// }
// });

app.get('/api/feeding-schedule/:petId', (req, res) => {
  const petId = req.params.petId;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;

    const query = 'SELECT * FROM feeding_schedule WHERE pet_id = ? AND user_email = ? LIMIT 1';
    db.query(query, [petId, userEmail], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (results.length === 0) {
        // ✅ Return default empty schedule instead of null
        return res.json({
          schedule: {
            morning: '',
            afternoon: '',
            night: '',
            pet_id: petId,
            user_email: userEmail,
            message: 'No schedule set yet'
          }
        });
      }

      res.json({ schedule: results[0] });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/motion-data/history', (req, res) => {
  const petId = req.query.pet_id;
  const limit = parseInt(req.query.limit) || 10;

  if (!petId) {
    return res.status(400).json({ error: 'Missing pet_id' });
  }

  const query = `
    SELECT 
      id,
      motion_state,
      timestamp
    FROM motion_data
    WHERE pet_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  db.query(query, [petId, limit], (err, results) => {
    if (err) {
      console.error('❌ Error fetching motion history:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const history = results.reverse(); // Return in chronological order
    res.json(history);
  });
});


app.get('/api/motion-data/summary-today', (req, res) => {
  const petId = req.query.pet_id;

  if (!petId) {
    return res.status(400).json({ error: 'Missing pet_id' });
  }

  const summaryQuery = `
    SELECT 
      SUM(CASE WHEN motion_state = 'STABLE' THEN 1 ELSE 0 END) AS calm_count,
      SUM(CASE WHEN motion_state = 'MOVING' THEN 1 ELSE 0 END) AS active_count,
      SUM(CASE WHEN motion_state = 'HIT/CRASH' THEN 1 ELSE 0 END) AS hit_count
    FROM motion_data
    WHERE DATE(timestamp) = CURDATE() AND pet_id = ?
  `;

  db.query(summaryQuery, [petId], (err, result) => {
    if (err) {
      console.error('❌ Error fetching motion summary:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const { calm_count, active_count, hit_count } = result[0] || {};
    const minutesPerEntry = 1;

    res.json({
      calmDuration: (calm_count || 0) * minutesPerEntry,
      activeDuration: (active_count || 0) * minutesPerEntry,
      suddenMoves: hit_count || 0
    });
  });
});


app.get('/api/temperature-data/history', (req, res) => {
  const petId = req.query.pet_id;
  const limit = parseInt(req.query.limit) || 10;

  if (!petId) {
    return res.status(400).json({ error: 'Missing pet_id' });
  }

  // ✅ Directly fetch temperature history for the pet
  const query = `
    SELECT temperature_f, timestamp,
      CASE 
        WHEN temperature_f < 98.0 THEN 'Normal'
        WHEN temperature_f >= 98.0 AND temperature_f < 101.0 THEN 'Elevated'
        ELSE 'High'
      END AS status
    FROM motion_data
    WHERE temperature_f IS NOT NULL AND pet_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  db.query(query, [petId, limit], (err, results) => {
    if (err) {
      console.error('Error fetching temperature data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results.reverse()); // Return oldest → newest
  });
});


app.get('/heart-rate', (req, res) => {
  const petId = req.query.pet_id;

  if (!petId) {
    return res.status(400).json({ error: 'Missing pet_id' });
  }

  // ✅ Directly fetch the last 20 heart rate readings
  const sql = `
    SELECT 
      id,
      heart_rate AS bpm,
      timestamp,
      CASE 
        WHEN heart_rate >= 100 THEN 'High'
        WHEN heart_rate >= 85 THEN 'Elevated'
        ELSE 'Normal'
      END AS status
    FROM motion_data
    WHERE heart_rate IS NOT NULL AND pet_id = ?
    ORDER BY timestamp DESC
    LIMIT 20
  `;

  db.query(sql, [petId], (err, results) => {
    if (err) {
      console.error('❌ Failed to fetch heart rate data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      console.warn(`ℹ️ No heart rate data found for pet_id ${petId}`);
      return res.status(204).json([]); // No content
    }

    const formatted = results.map(row => ({
      id: row.id,
      bpm: row.bpm,
      time: new Date(row.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: row.status,
    }));

    res.json(formatted.reverse()); // chronological order
  });
});

app.get('/api/pets/:petId/vaccine-statuses', (req, res) => {
 const { petId } = req.params;

 const query = `SELECT vaccine_key, status FROM vaccine_status WHERE pet_id = ?`;

 db.query(query, [petId], (err, results) => {
 if (err) return res.status(500).json({ error: "Failed to fetch statuses" });
 const statusMap = {};
 results.forEach(row => {
 statusMap[row.vaccine_key] = row.status;
 });
 res.status(200).json(statusMap);
 });
});

app.patch('/api/vaccine-status', (req, res) => {
 const { petId, vaccineKey, status } = req.body;
 if (!petId || !vaccineKey || !status) {
 return res.status(400).json({ error: "Missing fields" });
 }

 const query = `
 INSERT INTO vaccine_status (pet_id, vaccine_key, status)
 VALUES (?, ?, ?)
 ON DUPLICATE KEY UPDATE status = VALUES(status)
 `;

 db.query(query, [petId, vaccineKey, status], (err) => {
 if (err) return res.status(500).json({ error: "Failed to update status" });
 res.status(200).json({ message: "Status updated" });
 });
});

const caPath = './certs/AmazonRootCA1.pem';
const certPath = './certs/device-cert.pem'; // Replace with the actual path to your device certificate
const keyPath = './certs/device-private-key.pem'; // Replace with the actual path to your device private key

const client = mqtt.connect('mqtts://a4b2hmymuctm4-ats.iot.eu-north-1.amazonaws.com', {
 clientId: 'mqtt-client-laptop-O', // Unique client ID
 port: 8883, // Secure MQTT port
 ca: fs.readFileSync(caPath), // Root certificate
 cert: fs.readFileSync(certPath), // Device certificate
 key: fs.readFileSync(keyPath), // Device private key
 keepalive: 60, // sends pingreq every 60 seconds to keep the connection alive
});

client.on('connect', () => {
 console.log('Successfully connected to MQTT broker');
});

client.on('error', (err) => {
 console.error('MQTT connection error:', err);
});

client.on('close', () => {
 console.log('MQTT connection closed');
});



app.post('/api/servo', (req, res) => {
 console.log('[🔥 Servo API] Triggered');
 client.publish('feeder/control', 'on');
 res.status(200).json({ message: 'Servo triggered successfully' });
});

let latestWeight = null;
let mqttWeightReceived = false;
let mqttLastReceivedAt = null; // ⏱️ Add this

client.on('message', (topic, message) => {
  if (topic === 'feeder/weight') {
    const data = JSON.parse(message.toString());
    latestWeight = data.weight;
    mqttWeightReceived = true;
    mqttLastReceivedAt = Date.now(); // ✅ Save timestamp

    console.log('[✅ MQTT] Received Weight:', data.weight);
    console.log('[✅ MQTT] Updated latestWeight:', latestWeight);
  }
});



client.subscribe('feeder/weight', (err) => {
  if (err) {
  console.error('Error subscribing to topic:', err);
  } else {
  console.log('Subscribed to feeder/weight');
  }
 });
 app.get('/api/weight-latest', (req, res) => {
  console.log('[📡 Fetch] Sending latest weight:', latestWeight);

  const now = Date.now();
  const isFresh = mqttLastReceivedAt && (now - mqttLastReceivedAt < 15000); // 15 seconds freshness

  if (latestWeight !== null) {
    res.json({
      weight: latestWeight,
      receivedViaMQTT: mqttWeightReceived,
      isFresh: isFresh  // ✅ Add freshness indicator
    });
  } else {
    res.status(404).json({ error: "No weight data yet" });
  }
});



app.post('/api/send-schedule', (req, res) => {
  const { morning, afternoon, night } = req.body;

  if (!morning || !afternoon || !night) {
    return res.status(400).json({ error: 'Missing one or more times' });
  }

  const times = [morning, afternoon, night];

  try {
    // 🟡 Store schedule for status tracking
    scheduledFeeds = times.map((time) => ({
      time: convertTo24Hour(time), // e.g., "08:00"
      status: 'Upcoming',
      triggered: false,
    }));

    // ✅ Publish schedule to MQTT
    times.forEach((time) => {
      const cmd = `set ${convertTo24Hour(time)}`;
      mqttClient.publish('feeder/control', cmd);
      console.log('Published via MQTT:', cmd);
    });

    res.send({ status: 'MQTT schedule sent successfully' });
  } catch (err) {
    console.error('❌ Failed to send schedule via MQTT:', err);
    res.status(500).json({ error: 'Failed to send schedule via MQTT', detail: err.message });
  }
});

cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  console.log(`🕐 [Cron] Checking feeds at: ${currentTime}`);

  scheduledFeeds.forEach(async (feed) => {
    console.log(`🔍 Checking feed: ${feed.time}, Triggered: ${feed.triggered}`);

    if (feed.time === currentTime && !feed.triggered) {
      console.log(`⏰ It's time to feed: ${feed.time}`);

      const previousWeight = latestWeight;
      console.log(`⚖️ Previous weight: ${previousWeight}`);

      mqttClient.publish('feeder/control', 'on');
      console.log('📡 Published "on" to feeder/control');

      // Wait for ESP32 to dispense food and update weight
      await new Promise(resolve => setTimeout(resolve, 7000));

      const newWeight = latestWeight;
      console.log(`⚖️ New weight after feeding: ${newWeight}`);

      if (
        previousWeight !== null &&
        newWeight !== null &&
        Math.abs(newWeight - previousWeight) > 5
      ) {
        feed.status = 'Completed';
      } else {
        feed.status = 'Failed';
      }

      feed.triggered = true;
      console.log(`📊 Feeding at ${feed.time}: ${feed.status}`);
    }
  });
});

app.get('/api/schedule-status', (req, res) => {
  res.json(scheduledFeeds);
});


function convertTo24Hour(input) {
 const time = input.trim().toUpperCase();

 // Handle 12-hour format: "4:30 PM"
 const match12 = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/);
 if (match12) {
 let [_, hour, minute, period] = match12;
 hour = parseInt(hour);
 if (period === 'PM' && hour < 12) hour += 12;
 if (period === 'AM' && hour === 12) hour = 0;
 return `${String(hour).padStart(2, '0')}:${minute}`;
 }

 // Handle 24-hour format: "16:30"
 const match24 = time.match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/);
 if (match24) {
 return `${String(match24[1]).padStart(2, '0')}:${match24[2]}`;
 }

 throw new Error(`Invalid time format: "${input}"`);
}

app.post('/api/manual-set', (req, res) => {
 const { command } = req.body;
 if (!command || !command.startsWith('set ')) {
 return res.status(400).json({ error: 'Invalid command format' });
 }

 client.publish('feeder/control', command);
 console.log('Manual set command published:', command);
 res.json({ status: 'Command sent via MQTT' });
});

app.post('/notifications', (req, res) => {
  const { title, body, data, pet_id } = req.body;

  console.log('📥 Received notification:', req.body);

  if (!title || !body || !pet_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const query = `
    INSERT INTO notifications (title, body, data, pet_id, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  db.query(query, [title, body, JSON.stringify(data || {}), pet_id], (err, result) => {
    if (err) {
      console.error('❌ Error saving notification:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ message: 'Notification saved', id: result.insertId });
  });
});

app.get('/notifications', (req, res) => {
  const { pet_id } = req.query;

  console.log('📥 Fetching notifications for pet_id:', pet_id);

  if (!pet_id) {
    return res.status(400).json({ message: 'Missing pet_id' });
  }

  const query = `
    SELECT * FROM notifications
    WHERE pet_id = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [Number(pet_id)], (err, results) => {
    if (err) {
      console.error('❌ Error fetching notifications:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    console.log(`✅ Found ${results.length} notifications for pet_id ${pet_id}`);
    res.json(results);
  });
});

app.post('/api/delete-notifications', (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No notification IDs provided' });
  }

  const placeholders = ids.map(() => '?').join(',');
  const sql = `DELETE FROM notifications WHERE id IN (${placeholders})`;

  console.log('Executing:', sql);
  console.log('With IDs:', ids);

  db.query(sql, ids, (err, results) => {
    if (err) {
      console.error('Error deleting notifications:', err);
      return res.status(500).json({ error: 'Failed to delete notifications' });
    }

    res.status(200).json({ message: 'Notifications deleted successfully' });
  });
});

app.post('/api/link-collar', (req, res) => {
  const { device_id, pet_id } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;

    // ✅ First, check if this device is already linked to another pet
    const checkQuery = `SELECT pet_id FROM connected_pet WHERE device_id = ?`;

    db.query(checkQuery, [device_id], (checkErr, checkResult) => {
      if (checkErr) {
        console.error('❌ DB Error (link-collar check):', checkErr);
        return res.status(500).json({ error: 'Database error' });
      }

      // If device is already linked to another pet
      if (checkResult.length > 0 && checkResult[0].pet_id !== pet_id) {
        return res.status(409).json({
          error: 'This collar is already linked to another pet. Please disconnect it first or purchase another collar.'
        });
      }

      // ✅ Proceed to insert or update
      const insertQuery = `
        INSERT INTO connected_pet (device_id, pet_id, user_email)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          pet_id = VALUES(pet_id),
          user_email = VALUES(user_email)
      `;

      db.query(insertQuery, [device_id, pet_id, userEmail], (err, result) => {
        if (err) {
          console.error('❌ DB Error (set-connected-pet):', err);
          return res.status(500).json({ error: 'Database error' });
        }

        console.log(`✅ Linked device ${device_id} → pet ${pet_id} for ${userEmail}`);
        res.status(200).json({ message: 'Pet linked to device successfully' });
      });
    });

  } catch (err) {
    console.error('❌ JWT Verification Failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

const expoPushTokens = {};

app.post('/api/save-push-token', (req, res) => {
  const { token, user_email } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Missing push token' });
  }
  // Optionally associate with user_email if provided
  if (user_email) {
    expoPushTokens[user_email] = token;
  } else {
    expoPushTokens[token] = token;
  }
  res.status(200).json({ message: 'Push token saved' });
});

app.post('/api/send-push-alert', async (req, res) => {
  const { token, title, body, data, user_email } = req.body;
  if (!token || !title || !body) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const expoPushEndpoint = 'https://exp.host/--/api/v2/push/send';
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  };
  try {
    const response = await fetch(expoPushEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const result = await response.json();
    res.status(200).json({ message: 'Push sent', result });
  } catch (e) {
    console.error('Expo push error:', e);
    res.status(500).json({ message: 'Failed to send push', error: e.message });
  }
});

app.delete('/api/unlink-collar', (req, res) => {
  const { device_id, pet_id } = req.body; // ✅ Also receive pet_id
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;

    const query = `
      DELETE FROM connected_pet 
      WHERE device_id = ? AND pet_id = ? AND user_email = ?
    `;

    db.query(query, [device_id, pet_id, userEmail], (err, result) => {
      if (err) {
        console.error('❌ DB Error (unlink-collar):', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Collar is not connected' });
      }

      console.log(`🟠 Unlinked device ${device_id} from pet ${pet_id} for ${userEmail}`);
      res.status(200).json({ message: 'Collar unlinked successfully' });
    });
  } catch (err) {
    console.error('❌ JWT Verification Failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/link-dispenser', (req, res) => {
  const { device_id, pet_id } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;

    // ✅ First, check if this device is already linked to another pet
    const checkQuery = `SELECT pet_id FROM connected_dispenser WHERE device_id = ?`;

    db.query(checkQuery, [device_id], (checkErr, checkResult) => {
      if (checkErr) {
        console.error('❌ DB Error (link-collar check):', checkErr);
        return res.status(500).json({ error: 'Database error' });
      }

      // If device is already linked to another pet
      if (checkResult.length > 0 && checkResult[0].pet_id !== pet_id) {
        return res.status(409).json({
          error: 'This dispenser is already linked to another pet. Please disconnect it first or purchase another dispenser.'
        });
      }

      // ✅ Proceed to insert or update
      const insertQuery = `
        INSERT INTO connected_dispenser (device_id, pet_id, user_email)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          pet_id = VALUES(pet_id),
          user_email = VALUES(user_email)
      `;

      db.query(insertQuery, [device_id, pet_id, userEmail], (err, result) => {
        if (err) {
          console.error('❌ DB Error (set-connected-pet):', err);
          return res.status(500).json({ error: 'Database error' });
        }

        console.log(`✅ Linked device ${device_id} → pet ${pet_id} for ${userEmail}`);
        res.status(200).json({ message: 'Pet linked to device successfully' });
      });
    });

  } catch (err) {
    console.error('❌ JWT Verification Failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.delete('/api/unlink-dispenser', (req, res) => {
  const { device_id, pet_id } = req.body; // ✅ Also receive pet_id
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;

    const query = `
      DELETE FROM connected_dispenser 
      WHERE device_id = ? AND pet_id = ? AND user_email = ?
    `;

    db.query(query, [device_id, pet_id, userEmail], (err, result) => {
      if (err) {
        console.error('❌ DB Error (unlink-dispenser):', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Dispenser is not connected' });
      }

      console.log(`🟠 Unlinked device ${device_id} from pet ${pet_id} for ${userEmail}`);
      res.status(200).json({ message: 'Dispenser unlinked successfully' });
    });
  } catch (err) {
    console.error('❌ JWT Verification Failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
}); 
  // ✅ Add this to check current dispenser-pet connection
app.get('/api/dispenser-for-pet/:petId', (req, res) => {
  const { petId } = req.params;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userEmail = decoded.email;

    const query = `
      SELECT device_id, pet_id FROM connected_dispenser
      WHERE pet_id = ? AND user_email = ?
    `;

    db.query(query, [petId, userEmail], (err, results) => {
      if (err) {
        console.error('❌ DB Error (dispenser-for-pet):', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: 'No dispenser linked to this pet', device_id: null });
      }

      res.status(200).json({
        message: 'Dispenser found',
        device_id: results[0].device_id,
        pet_id: results[0].pet_id
      });
    });
  } catch (err) {
    console.error('❌ JWT Verification Failed:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
});


const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});