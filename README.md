# Smart Subscription Manager & Expense Tracker

A full-stack web application designed to help users manage their digital subscription services, track routine expenses, and calculate monthly and annual costs so they can avoid unwanted automatic billings.

## Live Demo Links
* **Frontend App (Netlify):** [https://gleaming-gecko-ae19fd.netlify.app/](https://gleaming-gecko-ae19fd.netlify.app/)
* **Backend API (Railway):** [https://smart-subscription-manager-production-8e6d.up.railway.app/](https://smart-subscription-manager-production-8e6d.up.railway.app/)

---

## Key Features
* **User Authentication:** Supports secure user registration and login, keeping track of user sessions between the frontend and Node.js backend.
* **Subscription Management (CRUD):** Allows users to Add, View, Update, and Delete subscription records, with all data saved directly to a cloud database.
* **Expense Dashboard:** Automatically calculates financial statistics on the client side, showing average monthly expenses and total cost forecasts for 2026.
* **Dynamic UI Formats:** Automatically changes display formats (month or year) based on the billing cycle selected by the user.

---

## Technologies Used

### 1. Frontend
* **HTML5 / CSS3:** Created a clean, responsive user interface that looks great on both computers and mobile phones.
* **JavaScript (ES6+):** Used `fetch()` to send and receive data from the backend API, managed local session data with `localStorage`, and updated the webpage dynamically.
* **Hosting:** Deployed online using **Netlify**.

### 2. Backend
* **Node.js & Express.js:** Built the backend server and created simple, clean API routes (`/api/auth` and `/api/subscriptions`) to handle requests.
* **Environment Variables:** Used `dotenv` to safely store private database credentials locally and securely.
* **Hosting:** Deployed online using **Railway**.

### 3. Database
* **MySQL:** Used a structured relational MySQL database hosted on the cloud to store all user and application data permanently.
* **Database Connection:** Used the `mysql2` package with connection pooling to ensure fast and stable database queries.
