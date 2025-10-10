import { Router } from "express";
import { sendSMS } from "../config/twilio";

const router = Router();

// army-id and phone number then otp
// verify otp and create the ppk keys and the seed phrase keys and send them to the user and using the phrase the ppk are encoded and svent in the db
// for login just send the otp and verify it and then we have the keys and we decrypt them and send them to the user using the seed phrase which only the user knows

// Registration endpoint
router.post("/register", async (req, res) => {
  const { armyId, phoneNumber } = req.body;

  // Validate input
  if (!armyId || !phoneNumber) {
    return res
      .status(400)
      .json({ message: "Army ID and phone number are required" });
  }
  await sendSMS("123456", phoneNumber);
  res.status(200).json({ message: "OTP sent to phone number" });
});

// OTP Verification endpoint
router.post("/verify-otp", async (req, res) => {
  const { armyId, phoneNumber, otp } = req.body;

  // Validate input
  if (!armyId || !phoneNumber || !otp) {
    return res
      .status(400)
      .json({ message: "Army ID, phone number, and OTP are required" });
  }
  // Here you would verify the OTP and create user keys
  res.status(200).json({ message: "OTP verified and user registered" });
});

export { router as authRouter };
