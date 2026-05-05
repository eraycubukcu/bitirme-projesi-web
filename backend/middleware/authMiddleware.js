import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";

const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.split(" ")[1];
  }
  return null;
};

export const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Giriş yapmalısınız." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Yetkisiz erişim." });
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Hesap bulunamadı." });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ message: "Oturum süresi dolmuş, tekrar giriş yapın." });
  }
};

export const protectTeacher = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Giriş yapmalısınız." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "teacher") {
      return res.status(403).json({ message: "Yetkisiz erişim." });
    }

    const teacher = await Teacher.findById(decoded.id).select("-password");
    if (!teacher) {
      return res.status(401).json({ message: "Hesap bulunamadı." });
    }

    req.teacher = teacher;
    next();
  } catch {
    return res.status(401).json({ message: "Oturum süresi dolmuş, tekrar giriş yapın." });
  }
};
