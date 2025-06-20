Nexus Chat

A real-time group chat application using React, Node.js, Express and MongoDB.

Live Application -> https://kuvaka-frontend-nine.vercel.app


Frontend Setup

1. Open a new terminal and go to the frontend folder:

   cd chatroom-frontend
   

2. Install dependencies:

   npm install


3. Start the frontend:

bash
   npm run dev

   Runs on: http://localhost:5173

How It Works

Users can create or join rooms.
Each room has a unique link.
Messages are sent and received in real-time using WebSockets.
Active users, typing indicators, and participants are shown live.
Messages are stored in MongoDB and loaded on room join.

Design Decisions

 Unique room links.
 Messages stored per room.
 Emoji picker for enhanced user interaction.

Deployment Links

Frontend:[https://kuvaka-frontend-nine.vercel.app]

Backend:[https://kuvaka-backend-5jl5.onrender.com]
