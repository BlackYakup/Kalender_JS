const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3001;
const FRONTEND_ORIGIN = "http://localhost:5500";

app.use(
    cors({
        origin: FRONTEND_ORIGIN,
    })
);

app.use(express.json());

const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function pad2(n) {
    return String(n).padStart(2, "0");
}

app.get("/api/ping", (req, res) => {
    res.json({ ok: true, message: "Backend läuft :D" });
});

app.get("/api/history", async (req, res) => {
    try {
        const mm = pad2(req.query.mm);
        const dd = pad2(req.query.dd);
        const lang = (req.query.lang || "de").toLowerCase();

        if (!mm || !dd || mm === "un" || dd === "un") {
            return res.status(400).json({
                ok: false,
                error: "Bitte mm und dd als Query-Parameter angeben, z.B. ?mm=02&dd=14",
            });
        }

        const cacheKey = `${lang}-${mm}-${dd}`;
        const cached = cache.get(cacheKey);

        if (cached && cached.expiresAt > Date.now()) {
            return res.json({ ok:true, source: "cache", ...cache.data});
        }

        const url = `https://api.wikimedia.org/feed/v1/wikipedia/${lang}/onthisday/events/${mm}/${dd}`;
        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).json({
                ok: false,
                error: `Wikimedia Fehler: HTTP ${response.status}`,
            });
        }

        const json = await response.json();
        const events = (json.events || []);
        const payload = {
            mm,
            dd,
            lang,
            events,
        };

        cache.set(cacheKey, {
            data: payload,
            expiresAt: Date.now() + CACHE_TTL_MS,
        });

        res.json({ ok: true, source: "wikipedia", ...payload });
    } catch (err) {
        res.status(500).json({
            ok: false,
            error: "Serverfehler",
            details: String(err),
        });
    }
});

app.listen(PORT, () => {
    console.log(`:D Backend läuft auf http://localhost:${PORT}`);
});