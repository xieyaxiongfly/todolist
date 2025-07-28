# 🚀 Installation Guide - Modern Todo List App

This step-by-step guide will help you set up and deploy your own instance of the Modern Todo List App with Notion integration.

## 📋 Prerequisites

Before you begin, make sure you have:
- ✅ A GitHub account
- ✅ A Netlify account (sign up at [netlify.com](https://netlify.com) - it's free)
- ✅ A Notion account (sign up at [notion.so](https://notion.so) - it's free)
- ✅ Basic familiarity with Git/GitHub

**Estimated Setup Time:** 15-20 minutes

---

## 🎯 Step 1: Fork the Repository

1. **Go to the repository:**
   - Visit: `https://github.com/xieyaxiongfly/todolist`

2. **Fork the repository:**
   - Click the "Fork" button in the top-right corner
   - Choose your GitHub account as the destination
   - Wait for the fork to complete

3. **Clone your fork (optional for local development):**
   ```bash
   git clone https://github.com/YOUR_USERNAME/todolist.git
   cd todolist
   ```

---

## 🔗 Step 2: Create Notion Integration

### 2.1 Create Integration
1. **Open Notion Integrations page:**
   - Go to: [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Click "**+ New integration**"

2. **Configure your integration:**
   ```
   Name: Todo App (or any name you prefer)
   Logo: (optional)
   Associated workspace: Select your workspace
   ```

3. **Save and copy the token:**
   - Click "**Submit**"
   - Copy the "**Internal Integration Token**" (starts with `secret_`)
   - ⚠️ **Keep this token secure - you'll need it later**

### 2.2 Create Notion Database
1. **Create a new Notion page:**
   - In Notion, click "**+ New page**"
   - Title it "**Todo Database**" (or your preference)

2. **Add a database:**
   - Type `/database` and select "**Table - Full page**"
   - Your database should have these properties:

   | Property Name | Type | Options | Required |
   |---------------|------|---------|----------|
   | **Name** | Title | - | ✅ Yes |
   | **Status** | Select | To Do, In Progress, Done, Blocked | ✅ Recommended |
   | **Due Date** | Date | - | ❌ Optional |
   | **Priority** | Select | High, Medium, Low | ❌ Optional |
   | **Description** | Text | - | ❌ Optional |

3. **Add custom properties (optional):**
   - You can add any other properties you need
   - The app will automatically detect and support them

### 2.3 Share Database with Integration
1. **Share the database:**
   - On your database page, click "**Share**" in the top-right
   - Click "**Invite**"
   - Type and select your integration name (e.g., "Todo App")
   - Click "**Invite**"

2. **Get the Database ID:**
   - Copy the URL of your database page
   - Extract the Database ID from the URL:
   ```
   https://www.notion.so/YOUR_USERNAME/DATABASE_ID?v=VIEW_ID
                                    ↑
                              This is your Database ID
   ```
   - Example: If URL is `https://www.notion.so/john/a1b2c3d4e5f6g7h8?v=123456`
   - Database ID is: `a1b2c3d4e5f6g7h8`

---

## 🌐 Step 3: Deploy to Netlify

### 3.1 Connect Repository
1. **Go to Netlify:**
   - Visit: [https://app.netlify.com](https://app.netlify.com)
   - Log in with your GitHub account

2. **Create new site:**
   - Click "**New site from Git**"
   - Choose "**GitHub**"
   - Authorize Netlify to access your repositories

3. **Select your repository:**
   - Find and select your forked `todolist` repository
   - Click on it

4. **Configure build settings:**
   - **Branch to deploy:** `main`
   - **Build command:** (leave empty - handled by netlify.toml)
   - **Publish directory:** (leave empty - handled by netlify.toml)
   - Click "**Deploy site**"

### 3.2 Configure Environment Variables
1. **After deployment, go to Site settings:**
   - Click "**Site settings**" in your site dashboard
   - Navigate to "**Environment variables**" in the left sidebar

2. **Add your Notion credentials:**
   - Click "**Add variable**"
   - Add these two variables:

   | Key | Value |
   |-----|-------|
   | `NOTION_API_KEY` | Your integration token (starts with `secret_`) |
   | `NOTION_DATABASE_ID` | Your database ID from Step 2.3 |

3. **Redeploy the site:**
   - Go to "**Deploys**" tab
   - Click "**Trigger deploy**" → "**Deploy site**"
   - Wait for deployment to complete (usually 1-2 minutes)

---

## 🎉 Step 4: Test Your App

1. **Access your app:**
   - Your app URL will be something like: `https://amazing-app-123456.netlify.app`
   - You can find the URL in your Netlify site dashboard

2. **Test basic functionality:**
   - ✅ **Add a task:** Click "➕ Add Task" in the sidebar
   - ✅ **View task details:** Click on any task to see details
   - ✅ **Edit a task:** In task details, click "✏️ Edit Task"
   - ✅ **Check Notion sync:** Verify tasks appear in your Notion database

3. **Customize your app:**
   - ✅ **Change background:** Click ⚙️ → Choose a gradient theme
   - ✅ **Test search:** Use the search bar in the sidebar
   - ✅ **Try different views:** Today, All Tasks, Completed, etc.

---

## 🛠️ Step 5: Local Development (Optional)

If you want to develop locally:

### 5.1 Setup
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Navigate to your project
cd todolist

# Create environment file
cat > .env << EOF
NOTION_API_KEY=secret_your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
EOF
```

### 5.2 Run Development Server
```bash
# Start local development server
netlify dev

# Your app will be available at:
# http://localhost:8888
```

### 5.3 Make Changes
1. Edit files (HTML, CSS, JavaScript)
2. Changes will auto-reload in your browser
3. Test serverless functions locally
4. Commit and push changes to trigger automatic deployment

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 🚫 "Tasks not loading" or "Failed to fetch todos"
**Possible causes:**
- Environment variables not set correctly
- Integration doesn't have access to database
- Database ID is incorrect

**Solutions:**
1. **Check environment variables:**
   - Go to Netlify → Site settings → Environment variables
   - Verify `NOTION_API_KEY` and `NOTION_DATABASE_ID` are correct
   - Redeploy after making changes

2. **Verify database access:**
   - Go to your Notion database → Share
   - Ensure your integration is invited and has access
   - Database should show "Shared with [Integration Name]"

3. **Double-check Database ID:**
   - Copy the database URL again
   - Extract the ID carefully (it's a 32-character string)

#### 🚫 "Database schema not detected"
**Solutions:**
- Ensure your database has at least a "Name" (Title) property
- Verify the integration has "Read content" permission
- Try creating a simple task manually in Notion first

#### 🚫 Local development not working
**Solutions:**
```bash
# Ensure Netlify CLI is installed and updated
npm install -g netlify-cli@latest

# Check if .env file exists and has correct format
cat .env

# Use netlify dev, not regular HTTP servers
netlify dev
```

#### 🚫 Functions not working locally
**Solutions:**
```bash
# Test functions separately
netlify functions:serve

# Check function logs
netlify dev --debug
```

---

## 🎨 Customization Tips

### Adding Custom Notion Properties
1. **Go to your Notion database**
2. **Add a new property** (column)
3. **Choose the type:** Text, Select, Date, Number, etc.
4. **Redeploy your app** - it will automatically detect the new property

### Supported Property Types
- ✅ **Title** → Text input
- ✅ **Text** → Text input  
- ✅ **Select** → Dropdown menu
- ✅ **Multi-select** → Multiple selection
- ✅ **Date** → Date picker
- ✅ **Checkbox** → Toggle switch
- ✅ **Number** → Number input
- ✅ **URL** → URL input with validation
- ✅ **Email** → Email input with validation
- ⚠️ **People** → Text input (read-only)
- ⚠️ **Files** → Not supported for uploads

### Custom Styling
1. **Fork the repository**
2. **Edit `styles.css`** for visual changes
3. **Modify gradients** in the CSS background classes
4. **Commit and push** - Netlify will auto-deploy

---

## 📞 Getting Help

### If you encounter issues:

1. **Check browser console:**
   - Press F12 → Console tab
   - Look for error messages
   - Include these in any support requests

2. **Verify setup:**
   - ✅ Integration token starts with `secret_`
   - ✅ Database ID is 32 characters long
   - ✅ Integration has access to database
   - ✅ Environment variables are set in Netlify

3. **Common solutions:**
   - Wait 5-10 minutes after setting environment variables
   - Try redeploying your Netlify site
   - Check that your Notion database has the required properties

4. **Still need help?**
   - Create an issue on GitHub with:
     - Steps you followed
     - Error messages (without sensitive tokens)
     - Screenshots if helpful

---

## 🎊 Success!

Once everything is working, you should have:
- ✅ A modern, responsive todo app
- ✅ Real-time sync with Notion
- ✅ Beautiful glassmorphism interface
- ✅ Task editing and management
- ✅ Custom background themes
- ✅ Automatic deployment on code changes

**Your todo app is now live and ready to use!**

---

## 🔄 Updating Your App

To get future updates from the original repository:

```bash
# Add upstream remote (one time setup)
git remote add upstream https://github.com/xieyaxiongfly/todolist.git

# Fetch and merge updates
git fetch upstream
git merge upstream/main

# Push updates to your fork
git push origin main
```

---

**📚 Need more help?** Check the main [README.md](README.md) for additional documentation and troubleshooting tips.