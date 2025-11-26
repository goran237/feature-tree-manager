# Deployment Guide for Render

This guide will help you deploy the Feature Tree Manager to Render's free tier.

## Prerequisites

1. A GitHub account
2. Your code pushed to a GitHub repository
3. A Render account (sign up at [render.com](https://render.com))

## Deployment Steps

### 1. Push Your Code to GitHub

If you haven't already, push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy on Render

1. **Sign in to Render**: Go to [dashboard.render.com](https://dashboard.render.com) and sign in

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository

3. **Configure the Service**:
   - **Name**: `feature-tree-manager` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free"

4. **Environment Variables** (optional):
   - `NODE_ENV`: `production`

5. **Click "Create Web Service"**

6. **Wait for Deployment**:
   - Render will automatically:
     - Install dependencies
     - Build your React app
     - Start your Express server
   - This takes about 5-10 minutes on first deploy

### 3. Access Your App

Once deployed, Render will provide you with a URL like:
```
https://feature-tree-manager.onrender.com
```

Your app will be live at this URL!

## Important Notes

### Free Tier Limitations

- **Sleep Mode**: Free tier services spin down after 15 minutes of inactivity
- **First Request**: After sleeping, the first request takes ~30 seconds to wake up the service
- **Database**: SQLite database file persists on Render's disk storage

### Database Persistence

The SQLite database (`features.db`) is stored on Render's persistent disk, so your data will persist between deployments and restarts.

### Updating Your App

Simply push changes to your GitHub repository, and Render will automatically:
1. Detect the changes
2. Rebuild your app
3. Deploy the new version

## Troubleshooting

### Build Fails

- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### App Not Loading

- Check the service logs in Render dashboard
- Verify the start command is correct: `npm start`
- Ensure port is set correctly (Render sets `PORT` automatically)

### Database Issues

- SQLite should work on Render's free tier
- Database file is created automatically on first run
- Check logs if database errors occur

## Local Testing Before Deployment

Test the production build locally:

```bash
# Build the frontend
npm run build

# Start the server (serves both API and frontend)
npm start
```

Visit `http://localhost:3000` to test.

## Support

- Render Docs: [render.com/docs](https://render.com/docs)
- Render Community: [community.render.com](https://community.render.com)

