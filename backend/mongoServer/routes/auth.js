const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  // console.log('Register request received:', req.body); // 로그 추가

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    if (password.trim() === ''){
      return res.status(400).json({ msg: 'Not Allow Blank' });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const now = new Date();
    const createdAt = now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    // Create new user
    user = new User({ name, email, password: hashedPassword, createdAt :createdAt });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    // console.error('Error during registration:', err); // 에러 로그 추가
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // console.log('Login request received:', req.body); // 로그 추가

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    res.status(200).json({ msg: 'Logged in successfully' });
  } catch (err) {
    // console.error('Error during login:', err); // 에러 로그 추가
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.post('/change_password', async (req, res) => {
  const { email, before_password, after_password } = req.body;
  // console.log('Login request received:', req.body); // 로그 추가

  try {
    // Check if user data
    const user = await User.findOne({ email });
    // Check password
    const isMatch = await bcrypt.compare(before_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(after_password, salt);

    await User.updateOne({email: email}, {$set:{password: hashedPassword}})
    res.status(200).json({ msg: 'Change successfully' });
  } catch (err) {
    // console.error('Error during login:', err); // 에러 로그 추가
    res.status(500).json({ error: err.message });
  }
});

// 내 정보 보기 ======================================================================================================================
router.get("/my_inf", async(req,res) => {
    try {
        const board = await User.findOne({email : req.query.email});
        res.json({ list : board });
    } catch (error) {
        res.json({ message: false });
    }
});
 // 아이디 삭제 ======================================================================================================================
 router.delete("/delete", async(req,res) => {
  try {
     await User.deleteOne({ email : req.query.email })
     res.json({ message: true });
  } catch (error) {
     res.json({ message: false });
  }
});

module.exports = router;