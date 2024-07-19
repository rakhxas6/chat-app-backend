import jwt from "jsonwebtoken";
import { ErrorHandler } from "../utils/utility.js";
import { CHATTU_TOKEN } from "../constants/config.js";
import { adminSecretKey } from "../app.js";

const isAuthenticated = async (req, res, next) => {
  const token = req.cookies[CHATTU_TOKEN];

  console.log(token);

  if (!token) return next(new ErrorHandler("Please login to access this", 401));

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = decodedData._id;

  next();
};


const adminOnly = async (req, res, next) => {
  const token = req.cookies["chattu-admin-token"];

  console.log(token);

  if (!token)
    return next(new ErrorHandler("Only Admin can  access this route", 401));

  const secretKey = jwt.verify(token, process.env.JWT_SECRET);

  const isMatched = secretKey === adminSecretKey;

   if (!isMatched)
     return next(new ErrorHandler("Invalid Admin Secret Key", 401));

  next();
};

export { isAuthenticated,adminOnly };
