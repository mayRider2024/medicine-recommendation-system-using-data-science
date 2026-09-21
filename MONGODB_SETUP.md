# MongoDB Atlas Setup Guide

## Step 1: Get Your MongoDB Connection String

1. **Log in to MongoDB Atlas**
   - Go to https://cloud.mongodb.com/
   - Sign in with your account

2. **Select or Create a Cluster**
   - If you don't have a cluster, create a free M0 cluster
   - Choose a cloud provider and region close to your location

3. **Get Connection String**
   - Click on "Connect" button on your cluster
   - Choose "Connect your application"
   - Select **Driver**: Python and **Version**: 3.12 or later
   - Copy the connection string (it looks like this):
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

4. **Configure Database Access**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a username and strong password
   - Grant "Read and write to any database" privileges
   - Click "Add User"

5. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your specific IP addresses
   - Click "Confirm"

## Step 2: Update Your Backend .env File

1. Open `/backend/.env` file

2. Replace the placeholder MongoDB URL with your actual connection string:
   ```env
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/medicine_recommendation?retryWrites=true&w=majority
   ```

   **Important**: 
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add `/medicine_recommendation` after `.net/` to specify the database name

3. Update the SECRET_KEY to a secure random string:
   ```env
   SECRET_KEY=your-super-secure-random-secret-key-here-change-this
   ```
   
   You can generate a secure key with:
   ```bash
   openssl rand -hex 32
   ```

## Step 3: Example .env Configuration

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ENVIRONMENT=development
DATABASE_URL=sqlite:///./medicines.db
API_PORT=8000

# MongoDB Atlas Connection
MONGODB_URL=mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/medicine_recommendation?retryWrites=true&w=majority

# JWT Secret Key
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
```

## Step 4: Database Collections

The application will automatically create these collections in MongoDB:

1. **patients** - Stores patient registration and profile data
   - email (unique)
   - hashed_password
   - full_name, phone, date_of_birth, gender
   - blood_group, address, city, state, pincode
   - emergency contacts
   - allergies, chronic_conditions, current_medications
   - created_at, updated_at

2. **medical_history** - Stores all patient diagnosis sessions
   - patient_id (reference to patients)
   - symptoms (list)
   - patient_inputs (all voice/text inputs with timestamps)
   - diagnosis (disease info, confidence, recommendations)
   - prescription (medicines, dosages, wellness tips)
   - language
   - created_at, updated_at

## Step 5: Verify Connection

After updating the .env file, restart your backend server:

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m uvicorn app.main:main --reload
```

Check the logs - you should see:
```
INFO:     Connecting to MongoDB...
INFO:     Successfully connected to MongoDB!
INFO:     Database indexes created successfully
```

## Troubleshooting

**Connection Timeout Error:**
- Check if your IP is whitelisted in Network Access
- Verify your username and password are correct
- Ensure you're using the correct connection string format

**Authentication Failed:**
- Double-check your database username and password
- Make sure there are no special characters that need URL encoding
- Password special characters should be URL-encoded (e.g., @ becomes %40)

**Database Access Error:**
- Verify user has proper permissions (Read and write to any database)
- Check if the database name is specified in the connection string

## Security Best Practices

1. **Never commit .env file to git** - It's already in .gitignore
2. **Use strong passwords** for MongoDB users
3. **Restrict IP access** in production (don't use 0.0.0.0/0)
4. **Change SECRET_KEY** to a strong random value
5. **Use environment-specific connection strings** for dev/staging/production
