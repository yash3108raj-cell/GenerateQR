const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.static("public"));

const qrStore = new Map();

app.get("/generate", (req, res) => {
  const amount = req.query.amount;
  const time = req.query.time;
  const upi = req.query.upi;

  const token = crypto.randomBytes(6).toString("hex");

  qrStore.set(token, {
    amount,
    upi,
    expiresAt: Date.now() + time * 60 * 1000,
    used: false
  });

  const baseUrl = req.protocol + "://" + req.get("host");

  res.send(`${baseUrl}/scan/${token}`);
});

app.get("/scan/:token", (req, res) => {
  const data = qrStore.get(req.params.token);

  if (!data) return res.send("Invalid QR");
  if (data.used) return res.send("QR Already Used");
  if (Date.now() > data.expiresAt) return res.send("QR Expired");

  data.used = true;

  const upiUrl = `upi://pay?pa=${data.upi}&am=${data.amount}&cu=INR`;

  res.send(`
    <html>
    <body style="font-family:sans-serif;text-align:center;margin-top:40px">
      <h2>Pay with UPI</h2>

      <a href="${upiUrl}" 
         style="padding:15px 25px;background:#0f9d58;color:white;
         text-decoration:none;border-radius:8px;font-size:18px">
         Open UPI App
      </a>

      <script>
        setTimeout(() => {
          window.location.href = "${upiUrl}";
        }, 500);
      </script>
    </body>
    </html>
  `);
});
app.listen(3000,"0.0.0.0", () => {
  console.log("Server running");
});
