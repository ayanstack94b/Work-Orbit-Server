const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello WorkOrbit Server!");
});

const uri = process.env.MONGODB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const upload = multer({
      storage: multer.memoryStorage(),
    });
    const database = client.db("WorkOrbitDB");
    const jobCollection = database.collection("jobs");
    const companyCollection = database.collection("companies");

    app.post("/api/company", async (req, res) => {
      try {
        const company = req.body;

        const result = await companyCollection.insertOne(company);

        res.status(201).send(result);
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to create company",
        });
      }
    });



    app.post("/api/jobs", async (req, res) => {
      try {
        const job = req.body;

        const result = await jobCollection.insertOne(job);

        res.status(201).send(result);
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to create job",
        });
      }
    });

    // LOGO upload post method
    app.post("/api/upload-logo", upload.single("image"), async (req, res) => {
      try {
        const apiKey = process.env.IMGBB_API_KEY;

        const formData = new FormData();

        formData.append("image", req.file.buffer.toString("base64"));

        const response = await axios.post(
          `https://api.imgbb.com/1/upload?key=${apiKey}`,
          formData,
          {
            headers: formData.getHeaders(),
          },
        );

        const logoUrl = response.data.data.url;

        res.send({
          success: true,
          logoUrl,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Image upload failed",
        });
      }
    });

    app.get("/api/jobs/company/:companyId", async (req, res) => {
      try {
        const companyId = req.params.companyId;

        const jobs = await jobCollection.find({ companyId }).toArray();

        res.send(jobs);
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch jobs",
        });
      }
    });

    //  export const getCompanyJobs = async (companyId) => {
    //    const res = await fetch(`${baseURL}/api/jobs/company/${companyId}`, {
    //      cache: "no-store",
    //    });

    //    return res.json();
    //  };

    app.get("/api/company/:companyId", async (req, res) => {
      try {
        const companyId = req.params.companyId;

        const company = await companyCollection.findOne({
          companyId,
        });

        return res.status(200).json({
          success: true,
          company,
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to fetch company",
        });
      }
    });


    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
