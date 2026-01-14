

🚀 ScholarStream API (Server-Side)
ScholarStream is the backend server for a comprehensive scholarship management system. It is built using Node.js, Express.js, and MongoDB, featuring secure authentication via Firebase Admin SDK and payment processing through Stripe.

🛠 Key Technologies
Runtime: Node.js

Framework: Express.js

Database: MongoDB

Authentication: Firebase Admin SDK (JWT Verification)

Payment Gateway: Stripe

Security: CORS, Dotenv, JSON Web Tokens (JWT)

✨ Features & Functionalities
1. 🔐 Security & Middleware
Firebase Verification: Every secure request is validated using Firebase ID tokens to ensure user authenticity.

Role-Based Access Control (RBAC): Dedicated access levels for Admin, Moderator, and Student to protect sensitive endpoints.

2. 👥 User Management
Auto-Registration: Automatically stores user details in the database upon their first login (default role: student).

Administrative Control: Admins can manage user roles (promote to Moderator/Admin) or remove users via the dashboard.

3. 🎓 Scholarship System
Advanced Search: Search scholarships by name, university, or degree.

Dynamic Filtering: Filter results based on scholarship category and university country.

Full CRUD: Admins have full control to Create, Read, Update, and Delete scholarship listings.

4. 📝 Application & Review
Scholarship Applications: Students can apply for scholarships after completing the required fee payment.

Review System: Allows students to leave ratings and comments on scholarships, which are viewable by the public.

5. 💳 Payment Integration
Stripe Checkout: A secure, industry-standard payment processing system.

Automated Workflow: Upon successful payment, the application data is automatically validated and saved to the database.

🚦 API Endpoints (Quick Overview)MethodEndpointAccessDescriptionPOST/usersPublicRegisters or updates user infoGET/scholarshipsPublicFetches all scholarships (Supports Search/Filter)POST/create-checkout-sessionPrivateInitializes a Stripe payment sessionPATCH/payment-successPrivateVerifies transaction and saves the applicationGET/applicationsAdmin/ModRetrieves all scholarship applicationsDELETE/reviews/:idOwner/AdminDeletes a specific review


⚙️ Environment Variables Setup
Create a .env file in the root directory and add the following:

Code snippet

PORT=5000
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
STRIPE_SECRET=your_stripe_secret_key
FB_SERVICE_KEY=your_firebase_service_key_in_base64
CLIENT_URL=http://localhost:5173
Note: The FB_SERVICE_KEY must be a Base64 encoded string of your Firebase Service Account JSON file for secure decoding in the server.

🚀 How to Run Locally
Clone the Repository:

Bash

git clone https://github.com/your-username/scholar-stream-server.git
Install Dependencies:

Bash

npm install
Start the Server:

Bash

npm start
