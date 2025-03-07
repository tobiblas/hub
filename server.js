const express = require('express');
const cors = require('cors');
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Folder for templates

app.post("/save-config", async (req, res, next) => {
    try {
        const configData = req.body;
        const filePath = path.join(__dirname, "properties", "config.txt");
        await fs.promises.writeFile(filePath, JSON.stringify(configData, null, 2), "utf8");
        res.redirect("/data/config"); // Redirect back to the config page
    } catch (err) {
        next(err); // Pass the error to the global error handler
    }
});

// Endpoint to get data for a specific tab
app.get("/data/:tab", async (req, res, next) => {
    async function renderPoolPump(res) {
        const filePath = path.join(__dirname, "poolpump", "data.json");
        const data = await fs.promises.readFile(filePath, "utf8");
        const jsonData = JSON.parse(data);
        res.render("poolpump", {jsonData});
    }

    async function renderThermostat(res) {
        const filePath = path.join(__dirname, "thermostat", "data.json");
        const data = await fs.promises.readFile(filePath, "utf8");
        const jsonData = JSON.parse(data);
        res.render("thermostat", {jsonData});
    }

    async function renderConfig(res) {
        const filePath = path.join(__dirname, "properties", "config.txt");
        const data = await fs.promises.readFile(filePath, "utf8");
        const jsonData = JSON.parse(data);
        res.render("config", {jsonData});
    }

    async function renderPoolLights(res) {
        const filePath = path.join(__dirname, "poollights", "data.json");
        const data = await fs.promises.readFile(filePath, "utf8");
        const jsonData = JSON.parse(data);
        res.render("poollights", {jsonData});
    }

    try {
        const tabName = req.params.tab;

        if (tabName === "thermostat") {
            await renderThermostat(res);
        } else if (tabName === "poolpump") {
            await renderPoolPump(res);
        } else if (tabName === "config") {
            await renderConfig(res);
        } else if (tabName === "poollights") {
            await renderPoolLights(res);
        }
    } catch (err) {
        next(err); // Pass the error to the global error handler
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unexpected error:', err); // Log the error for debugging
    res.status(500).json({ error: "Something went wrong." });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

