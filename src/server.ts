// console.log("1 - server loaded");

// import dotenv from 'dotenv';
// import app from './app.js';

// console.log("server.ts loaded");

// // Settings  environment variables
// dotenv.config()

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });





import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running locally on port ${PORT}`);
    });
}

export default app;