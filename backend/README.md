# Angeles Discovery API

The API uses MongoDB for account credentials, saved places, and reviews. Copy
`.env.example` to `.env`, set `MONGODB_URI`, and replace `JWT_SECRET` with a
private random value of at least 32 characters. Keep `.env` out of version
control.

Install dependencies with `npm install`, then start the API with `node server.js`.
The Vue app expects the API at `http://localhost:5000`; set
`VITE_API_URL` in the frontend environment if it is hosted elsewhere.

Accounts use bcrypt-hashed passwords and bearer tokens. A visitor can save
places and post one editable review per place after signing in.

To provision the first administrator, set both `ADMIN_EMAIL` and
`ADMIN_PASSWORD` in the private backend `.env` file and restart the API. The
password must be 12–72 bytes. On startup, a new account is created for that
email, or an existing account with that email is promoted to administrator;
the existing account's password is not changed. Remove these bootstrap values
after provisioning. Administrators can then sign in and manage listings and
community suggestions at `/admin`. The API independently checks the account's
admin role on every administrative request.

`FRONTEND_ORIGIN` may contain a comma-separated list of deployed frontend
origins. Local Vite origins at `localhost:5173` and `127.0.0.1:5173` are allowed
for development.
