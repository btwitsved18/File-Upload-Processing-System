# File-Upload-Processing-System

Basic File Structure:-

file-upload-backend/
── db/
   ── database.js
   ── upload.db
── node_modules
── queues/
   ── connection.js
   ── uploadQueue.js
── routes/
   ── upload.js
── uploads/
── workers/
   ── uploadWorker.js
── app.js 
── package-lock.json
── package.json




Install Dependencies:-
npm install

Install Redis

Start the Server:-
node app.js


Start the Worker:-
node workers/uploadWorker.js



For API endpoints refer to the postman collection
