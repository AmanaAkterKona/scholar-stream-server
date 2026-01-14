const express = require("express");
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 3000;

// ================= FIREBASE ADMIN =================


const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= FIREBASE TOKEN VERIFY =================
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(403).send({ message: "Forbidden" });
  }
};

// ================= MONGO =================
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kf9k4pw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1 },
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("scholar_stream_db");

    const users = db.collection("users");
    const scholarships = db.collection("scholarships");
    const applications = db.collection("applications");
    const reviews = db.collection("reviews");

    console.log("MongoDB Connected");

    // ================= ROLE MIDDLEWARE =================
    const verifyAdmin = async (req, res, next) => {
      const user = await users.findOne({ email: req.decoded.email });
      if (!user || user.role?.toLowerCase() !== "admin") {
        return res.status(403).send({ message: "Admin only" });
      }
      next();
    };

    const verifyModerator = async (req, res, next) => {
      const user = await users.findOne({ email: req.decoded.email });
      if (!user || user.role?.toLowerCase() !== "moderator") {
        return res.status(403).send({ message: "Moderator only" });
      }
      next();
    };

    const verifyAdminOrModerator = async (req, res, next) => {
      const user = await users.findOne({ email: req.decoded.email });
      const role = user?.role?.toLowerCase();
      if (!user || (role !== "admin" && role !== "moderator")) {
        return res.status(403).send({ message: "Admin or Moderator only" });
      }
      next();
    };

    // ================= USERS =================
    app.get("/users", verifyFirebaseToken, verifyAdmin, async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });




    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "student";

      const exists = await users.findOne({ email: user.email });
      if (exists) return res.send({ message: "User already exists" });

      const result = await users.insertOne(user);
      res.send(result);
    });

    app.get("/users/role", async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.send({ role: "student" });
  }

  const requester = await users.findOne({ email: req.query.email });
  const requesterRole = requester?.role?.toLowerCase();

  res.send({ role: requesterRole|| "student" });
});


    app.patch(
      "/users/role/:id",
      verifyFirebaseToken,
      verifyAdmin,
      async (req, res) => {
        const result = await users.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: { role: req.body.role.toLowerCase() } }
        );
        res.send(result);
      }
    );

    app.delete(
      "/users/:id",
      verifyFirebaseToken,
      verifyAdmin,
      async (req, res) => {
        const result = await users.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      }
    );

    // ================= SCHOLARSHIPS (WITH SEARCH & FILTER) =================
    app.get("/scholarships", async (req, res) => {
      try {
        const { search, category, country } = req.query;

        let query = {};

        if (search) {
          query.$or = [
            { scholarshipName: { $regex: search, $options: "i" } },
            { universityName: { $regex: search, $options: "i" } },
            { degree: { $regex: search, $options: "i" } },
          ];
        }

        if (category) {
          query.scholarshipCategory = {
            $regex: `^${category}$`,
            $options: "i",
          };
        }

        if (country) {
          query.universityCountry = { $regex: country, $options: "i" };
        }

        const result = await scholarships.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching scholarships:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    app.get("/scholarships/:id", async (req, res) => {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).send({ message: "Invalid ID" });

      const result = await scholarships.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    app.post(
      "/scholarships",
      verifyFirebaseToken,
      verifyAdmin,
      async (req, res) => {
        const result = await scholarships.insertOne(req.body);
        res.send(result);
      }
    );

    app.patch(
      "/scholarships/:id",
      verifyFirebaseToken,
      verifyAdmin,
      async (req, res) => {
        const result = await scholarships.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: req.body }
        );
        res.send(result);
      }
    );

    app.delete(
      "/scholarships/:id",
      verifyFirebaseToken,
      verifyAdmin,
      async (req, res) => {
        const result = await scholarships.deleteOne({
          _id: new ObjectId(req.params.id),
        });
        res.send(result);
      }
    );

    // ================= APPLICATIONS =================

    app.post("/applications", verifyFirebaseToken, async (req, res) => {
      req.body.applicationStatus = "pending";
      req.body.applicationDate = new Date();
      const result = await applications.insertOne(req.body);
      res.send(result);
    });

    app.get(
      "/applications",
      verifyFirebaseToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await applications.find().toArray();
        res.send(result);
      }
    );

    app.get(
      "/applications/user/:email",
      verifyFirebaseToken,
      async (req, res) => {
        if (req.decoded.email !== req.params.email)
          return res.status(403).send({ message: "Forbidden" });

        const result = await applications
          .find({ userEmail: req.params.email })
          .toArray();
        res.send(result);
      }
    );

    app.patch(
      "/applications/:id",
      verifyFirebaseToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await applications.updateOne(
          { _id: new ObjectId(req.params.id) },
          { $set: req.body }
        );
        res.send(result);
      }
    );

    app.patch(
      "/applications/update/:id",
      verifyFirebaseToken,
      async (req, res) => {
        try {
          const id = req.params.id;
          const query = { _id: new ObjectId(id) };
          const application = await applications.findOne(query);

          if (!application)
            return res.status(404).send({ message: "Application not found" });

          if (application.userEmail !== req.decoded.email) {
            return res.status(403).send({ message: "Unauthorized access" });
          }
          if (application.applicationStatus !== "pending") {
            return res
              .status(400)
              .send({ message: "Only pending applications can be edited" });
          }

          const result = await applications.updateOne(query, {
            $set: req.body,
          });
          res.send(result);
        } catch (error) {
          res.status(500).send({ message: "Error updating application" });
        }
      }
    );

    app.delete("/applications/:id", verifyFirebaseToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const application = await applications.findOne(query);

        if (!application)
          return res.status(404).send({ message: "Application not found" });

        if (application.userEmail !== req.decoded.email) {
          return res.status(403).send({ message: "Unauthorized access" });
        }

        const result = await applications.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error deleting application" });
      }
    });

    // ================= REVIEWS =================
    //  ADD REVIEW (Student)
app.get("/reviews/public", async (req, res) => {
  const result = await reviews
    .find(
      {},
      {
        projection: {
          userName: 1,
          userImage: 1,
          ratingPoint: 1,
          reviewComment: 1,
          universityName: 1,
          reviewDate: 1,
        },
      }
    )
    .sort({ reviewDate: -1 })
    .limit(6)
    .toArray();

  res.send(result);
});



    app.post("/reviews", verifyFirebaseToken, async (req, res) => {
      const reviewData = req.body;

      const finalReview = {
        ...reviewData,
        userEmail: req.decoded.email,
        reviewDate: new Date(),
      };

      const result = await reviews.insertOne(finalReview);
      res.send(result);
    });

    // 📥 GET ALL REVIEWS (Admin / Moderator)
    app.get(
      "/reviews",
      verifyFirebaseToken,
      verifyAdminOrModerator,
      async (req, res) => {
        const result = await reviews.find().sort({ reviewDate: -1 }).toArray();
        res.send(result);
      }
    );

    // 📥 GET REVIEWS BY SCHOLARSHIP (Public)
    app.get("/reviews/:scholarshipId", async (req, res) => {
      const result = await reviews
        .find({ scholarshipId: req.params.scholarshipId })
        .toArray();
      res.send(result);
    });

    // 📥 GET MY REVIEWS (Student)
    app.get("/reviews/user/:email", verifyFirebaseToken, async (req, res) => {
      if (req.decoded.email !== req.params.email)
        return res.status(403).send({ message: "Forbidden" });
      const result = await reviews
        .find({ userEmail: req.params.email })
        .sort({ reviewDate: -1 })
        .toArray();
      res.send(result);
    });

    // ✏️ UPDATE REVIEW (Owner / Admin / Moderator)
    app.patch("/reviews/:id", verifyFirebaseToken, async (req, res) => {
      const review = await reviews.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (!review) return res.status(404).send({ message: "Review not found" });

      const user = await users.findOne({ email: req.decoded.email });
      const role = user?.role?.toLowerCase();

      if (
        review.userEmail !== req.decoded.email &&
        role !== "admin" &&
        role !== "moderator"
      ) {
        return res.status(403).send({ message: "Forbidden" });
      }

      const result = await reviews.updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            ratingPoint: req.body.ratingPoint,
            reviewComment: req.body.reviewComment,
          },
        }
      );
      res.send(result);
    });

    // 🗑️ DELETE REVIEW (Owner / Admin / Moderator)
    app.delete("/reviews/:id", verifyFirebaseToken, async (req, res) => {
      const review = await reviews.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (!review) return res.status(404).send({ message: "Review not found" });

      const user = await users.findOne({ email: req.decoded.email });
      const role = user?.role?.toLowerCase();

      if (
        review.userEmail !== req.decoded.email &&
        role !== "admin" &&
        role !== "moderator"
      ) {
        return res.status(403).send({ message: "Forbidden" });
      }

      const result = await reviews.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // ================= STRIPE CHECKOUT =================
    
    app.post(
      "/create-checkout-session",
      verifyFirebaseToken,
      async (req, res) => {
        const {
          scholarshipName,
          universityName,
          amount,

          applicationFees,
          userEmail,
          scholarshipId,
          universityCity,
          universityCountry,
          subjectCategory,
        } = req.body;

        try {
          const session = await stripe.checkout.sessions.create({
            // ... (line_items, success_url, cancel_url অপরিবর্তিত) ...
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  product_data: {
                    name: scholarshipName,
                    description: universityName,
                  },
                  unit_amount: amount * 100,
                },
                quantity: 1,
              },
            ],
            success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/payment-failed`,

            metadata: {
              userEmail,
              scholarshipId,
              universityCity,
              universityCountry,
              subjectCategory,
              universityName,
              applicationFees: applicationFees
                ? applicationFees.toString()
                : "0",
            },
          });

          res.send({ url: session.url });
        } catch (error) {
          console.error("Stripe Checkout Session Error:", error.message);
          res
            .status(500)
            .send({ message: "Failed to create checkout session" });
        }
      }
    );
    // ================= PAYMENT SUCCESS (FINAL FIX) =================
    app.patch("/payment-success", verifyFirebaseToken, async (req, res) => {
      try {
        const sessionId = req.query.session_id;
        if (!sessionId) {
          return res.status(400).send({ message: "Session ID missing" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["line_items"],
        });

        if (session.payment_status !== "paid") {
          return res.status(400).send({ message: "Payment not completed" });
        } // 🔒 Prevent duplicate insert

        const alreadyExists = await applications.findOne({
          transactionId: session.payment_intent,
        });

        if (alreadyExists) {
          return res.send({ success: true, message: "Already saved" });
        }

        const applicationData = {
          scholarshipId: session.metadata.scholarshipId,
          universityName: session.metadata.universityName,
          universityCity: session.metadata.universityCity,
          universityCountry: session.metadata.universityCountry,
          subjectCategory: session.metadata.subjectCategory,

          userEmail: session.metadata.userEmail,
          applicationFees: session.metadata.applicationFees
            ? parseFloat(session.metadata.applicationFees)
            : session.amount_total / 100,

          paymentStatus: "paid",
          applicationStatus: "pending",
          transactionId: session.payment_intent,
          appliedAt: new Date(),
        };

        const result = await applications.insertOne(applicationData);
        if (result.acknowledged) {
          console.log("Application saved successfully:", result.insertedId);
        } else {
          console.log("Application insertion failed.");
        }

        res.send({ success: true });
      } catch (error) {
        console.error("Payment processing error:", error);
        res.status(500).send({ message: "Payment processing failed" });
      }
    });
  } finally {
  }
}

run();

app.get("/", (req, res) => {
  res.send("ScholarStream API Running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
