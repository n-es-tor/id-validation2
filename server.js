const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const TRUORA_API_KEY = process.env.TRUORA_API_KEY;
const TRUORA_API_URL = "https://api.validations.truora.com/v1/validations";

// **Step 1: Start ID Validation**
app.post("/validate-id", async (req, res) => {
    try {
        console.log("Starting ID validation request...");

        const response = await axios.post(
            TRUORA_API_URL,
            {
                country: "MX",
                type: "document-validation",
                document_type: "national-id",
                user_authorized: true,
            },
            {
                headers: {
                    "Truora-API-Key": TRUORA_API_KEY,
                    "Content-Type": "application/x-www-form-urlencoded", 
                }
            }
        );

        console.log("Validation started successfully:", response.data);
        res.json(response.data);
    } catch (error) {
        console.error("Error starting validation:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || "Failed to start validation" });
    }
});

app.put("/proxy-upload", async (req, res) => {
    try {
        const { uploadUrl, file } = req.body;
        const imageBuffer = Buffer.from(file, 'base64');

        const truoraResponse = await axios.put(uploadUrl, imageBuffer, {
            headers: { "Content-Type": "image/png" },
            redirect: "follow",
        });

        res.status(truoraResponse.status).send(truoraResponse.data);
    } catch (error) {
        console.error("Proxy Upload Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : "Proxy upload failed" });
    }
});

// **Step 3: Get Validation Result**
app.get("/validation-result/:id", async (req, res) => {
    try {
        const validationId = req.params.id;
        if (!validationId) {
            return res.status(400).json({ error: "Validation ID is required" });
        }

        const url = `${TRUORA_API_URL}/${validationId}?show_details=true`;
        console.log(`Fetching validation result from: ${url}`);

        const response = await axios.get(url, {
            headers: { "Truora-API-Key": TRUORA_API_KEY }
        });

        console.log("Validation result retrieved:", response.data);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching validation result:", error.response?.data || error.message);
        res.status(500).json({ error: error.response?.data || "Failed to fetch validation result" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));