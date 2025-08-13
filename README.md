# Signedwork - Professional Networking Platform

A comprehensive professional networking platform that enables users to manage their career profiles, track employment history, and showcase professional achievements with advanced session management and secure authentication.

## Features

### Employee Registration
- First name, Last name
- Email, Phone with country code
- Password with strength validation

### Company Registration  
- Organization name, Address, Pincode
- CIN/PAN number, Email
- Company size, Establishment year
- Password with strength validation

### Security Features
- Password hashing with bcrypt
- Session-based authentication
- Input validation with Zod
- Email uniqueness checks

## Tech Stack

**Frontend:**
- React with TypeScript
- Vite (build tool)
- shadcn/ui components
- Tailwind CSS
- TanStack Query
- React Hook Form with Zod validation

**Backend:**
- Express.js with TypeScript
- PostgreSQL with Neon serverless driver
- Drizzle ORM
- Session management with express-session
- Password hashing with bcrypt

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Set up a PostgreSQL database
   - Add your `DATABASE_URL` to environment variables
   - Run database migrations:
   ```bash
   npm run db:push
   ```

3. **Environment Variables**
   Create a `.env` file with:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret_key
   ```

4. **Development**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5000`

5. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
├── server/                # Backend Express app
│   ├── db.ts              # Database connection
│   ├── storage.ts         # Data access layer
│   ├── routes.ts          # API routes
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and validation
└── package.json
```

## API Endpoints

- `POST /api/auth/register/employee` - Employee registration
- `POST /api/auth/register/company` - Company registration
- `POST /api/auth/login` - Login (both account types)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

## Usage

1. Visit the homepage to choose account type
2. Register as either an employee or company
3. Login with your credentials
4. Access your dashboard with profile information

## License

MIT License