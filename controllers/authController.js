const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role, // ✅ add role here
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};
// const sendTokenResponse = (user, statusCode, res) => {
//   const token = signToken(user);

//   res.cookie("token", token, {
//     httpOnly: true,
//     secure: true,          // required for HTTPS
//     sameSite: "none",      // required for cross-domain cookies
//     path: "/",
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });

//   res.status(statusCode).json({
//     success: true,
//     token, // optional but recommended
//     data: {
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     },
//   });
// };

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user);

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,                 // HTTPS only in production
    sameSite: isProduction ? "none" : "lax",
    domain: isProduction ? ".onrender.com" : "localhost",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
};
exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const user = await User.create({ name, email, mobile, password });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/", // must match login cookie path
  });

  res.json({ success: true });
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};