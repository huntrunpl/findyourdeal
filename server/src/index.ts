import express from "express";
import bodyParser from "body-parser";
import botRouter from "./routes/bot";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Podłączenie routera bota (webhook Telegram)
app.use("/bot", botRouter);

// Endpoint zdrowotny (np. dla Caddy /health)
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Główna strona API
app.get("/", (req, res) => {
  res.json({ message: "FindYourDeal API działa" });
});

app.listen(port, () => {
  console.log(`API działa na porcie ${port}`);
});
