

🚀 ScholarStream API (Server-Side)
ScholarStream holo ekti scholarship management system-er backend server. Eti Node.js, Express.js, ar MongoDB diye toiri kora hoyeche. Ekhane secure authentication-er jonno Firebase Admin SDK ar payment-er jonno Stripe integration kora hoyeche.

🛠 Key Technologies
Runtime: Node.js

Framework: Express.js

Database: MongoDB

Authentication: Firebase Admin SDK (JWT Verification)

Payment Gateway: Stripe

Security: CORS, Dotenv, JSON Web Tokens

✨ Features & Functionalities
1. 🔐 Security & Middleware
Firebase Verification: Protiti secure request-er khetre Firebase token verify kora hoy.

Role-Based Access (RBAC): Admin ar Moderator-der jonno alada access control system ache.

2. 👥 User Management
Automatically user details store kora (default role: student).

Admin dashboard theke user role change ba delete korar sujog.

3. 🎓 Scholarship System
Advanced Search: Scholarship-er naam, university, ba degree diye search kora jay.

Filtering: Category ar country onujayi filter korar options.

Full CRUD: Admin scholarship add, update, ba delete korte pare.

4. 📝 Application & Review
Students scholarship-er jonno apply korte pare.

Review system jekhane student-ra rating ar comment korte pare (Publicly viewable).

5. 💳 Payment Integration
Stripe Checkout: Secure payment processing system.

Auto-Save: Payment successful hole application automatic database-e save hoye jay.

🚦 API Endpoints (Quick Overview)
Method	Endpoint	Access	Description
POST	/users	Public	Create new user
GET	/scholarships	Public	Get all scholarships (Search/Filter)
POST	/create-checkout-session	Private	Initiate Stripe payment
PATCH	/payment-success	Private	Verify & Save application after payment
GET	/applications	Admin/Mod	View all scholarship applications
DELETE	/reviews/:id	Owner/Admin	Remove a review

⚙️ Environment Variables Setup
Root directory-te ekta .env file toiri koro:

Code snippet

PORT=5000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
STRIPE_SECRET=your_stripe_secret_key
FB_SERVICE_KEY=your_firebase_service_key_in_base64
CLIENT_URL=http://localhost:5173
Note: FB_SERVICE_KEY-ta oboshshoi Base64 format-e hote hobe jeta code-e decode kora hoyeche.

🚀 How to Run Locally
Clone the Repo:

Bash

git clone https://github.com/your-username/scholar-stream-server.git
Install Packages:

Bash

npm install
Start Server:

Bash

npm start
(Or nodemon index.js for development)

