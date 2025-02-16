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

// Endpoint to get data for a specific tab
app.get("/data/:tab", async (req, res, next) => {
    try {
        const tabName = req.params.tab;
        const filePath = path.join(__dirname, tabName, "data.json");

        const data = await fs.promises.readFile(filePath, "utf8");
        const jsonData = JSON.parse(data);

        /*let htmlContent = `<h2>${jsonData.title}</h2>`;
        htmlContent += `<p>${jsonData.description}</p>`;
        htmlContent += `<ul>`;
        jsonData.properties.forEach(dataset => {
            htmlContent += `<li><strong>${dataset.name}</strong>: ${dataset.value}</li>`;
        });
        htmlContent += `</ul>`;
        console.log(htmlContent);
        res.send(htmlContent);*/
        /*const jsonData = {
            title: "My Page",
            description: "This is a dynamically generated page.",
            datasets: [{ name: "Temperature", value: "22°C" }, { name: "Humidity", value: "60%" }]
        };*/

        res.render("poolpump", { jsonData });
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

