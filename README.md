# Backend - SSC Bethigal

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   Copy `.env.example` to `.env` and update values:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ssc_bethigal
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5500
   ```

3. **Import customer data:**
   ```bash
   npm run import-data
   ```

4. **Start server:**
   ```bash
   npm start
   ```

## Scripts

- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run import-data` - Import customers from CSV

## API Endpoints

See main `README.md` or `API_EXAMPLES.md` for detailed API documentation.

