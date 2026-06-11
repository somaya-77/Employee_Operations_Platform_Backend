console.log("1 - server loaded");

import dotenv from 'dotenv';
import app from './app.js';

console.log("server.ts loaded");

// Settings  environment variables
dotenv.config()

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// app.listen(Number(PORT), '0.0.0.0', () => {
//     console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
// }).on('error', (err: any) => {
//     console.error("❌ Server failed to start:", err);
// });