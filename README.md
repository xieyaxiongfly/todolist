# 📋 Modern Todo List App

A beautiful, modern todo list application with Notion integration, featuring a todolist.com-inspired interface with glassmorphism effects, real-time sync, and comprehensive task management capabilities.

![Todo App Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7) ![Notion](https://img.shields.io/badge/Database-Notion-000000)

## ✨ Features

### 🎨 **Modern Design**
- **Glassmorphism UI** with backdrop blur effects
- **6 gradient themes** (Blue Purple, Pink, Ocean, Mint, Sunset, Default)
- **Responsive design** optimized for desktop, tablet, and mobile
- **Professional typography** with gradient text effects
- **Smooth animations** and hover effects

### 📱 **Interface**
- **Two-column layout** inspired by todolist.com
- **Smart navigation** with task counters (Today, Upcoming, All Tasks, Completed)
- **Real-time search** across all tasks
- **Multiple view modes** for different workflows
- **Compact add task panel** (600px width)

### ⚙️ **Functionality**
- **Full CRUD operations** - Create, Read, Update, Delete tasks
- **Inline task editing** directly in details modal
- **Dynamic form generation** based on Notion database schema
- **Instant task details** with caching for performance
- **Background customization** with image upload support
- **Offline fallback** to localStorage when API unavailable

### 🔗 **Notion Integration**
- **Real-time sync** with Notion database
- **Automatic schema detection** for custom database properties
- **Support for all Notion field types** (text, select, checkbox, date, etc.)
- **Secure API** through Netlify serverless functions

## 🚀 Quick Start

### Prerequisites
- GitHub account
- Netlify account (free)
- Notion account (free)

### 1. Fork & Deploy

1. **Fork this repository** to your GitHub account
2. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose your forked repository
   - Deploy settings are handled by `netlify.toml`

### 2. Setup Notion Integration

1. **Create Notion Integration:**
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Name: "Todo App" (or your preference)
   - Copy the **Internal Integration Token** (starts with `secret_`)

2. **Create Notion Database:**
   ```
   Create a new Notion page → Add a database with these properties:
   ├── Name (Title) - Required
   ├── Status (Select) - Options: To Do, In Progress, Done, Blocked
   ├── Due Date (Date) - Optional
   ├── Priority (Select) - Optional
   ├── Description (Text) - Optional
   └── [Add any custom properties you need]
   ```

3. **Share Database with Integration:**
   - Click "Share" on your database page
   - Invite your integration by name
   - Copy the **Database ID** from URL: 
     ```
     https://notion.so/[username]/DATABASE_ID?v=...
     ```

### 3. Configure Environment Variables

In your Netlify dashboard:
1. Go to **Site settings** → **Environment variables**
2. Add these variables:
   ```
   NOTION_API_KEY = secret_your_integration_token_here
   NOTION_DATABASE_ID = your_database_id_here
   ```
3. **Redeploy** your site for changes to take effect

### 4. Access Your App

Your app will be available at: `https://your-site-name.netlify.app`

## 🛠️ Local Development

### Setup
```bash
# Clone your fork
git clone https://github.com/your-username/todolist.git
cd todolist

# Install Netlify CLI
npm install -g netlify-cli

# Create environment file
cat > .env << EOF
NOTION_API_KEY=secret_your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
EOF
```

### Run Development Server
```bash
# Start local development server
netlify dev

# Your app will be available at:
# http://localhost:8888
```

### Development Commands
```bash
# Test serverless functions locally
netlify functions:serve

# Build for production
netlify build

# Deploy to production
netlify deploy --prod
```

## 📁 Project Structure

```
todolist/
├── 📄 index.html              # Main HTML structure
├── 🎨 styles.css              # Modern CSS with glassmorphism
├── ⚡ app.js                  # Frontend JavaScript logic
├── ⚙️ netlify.toml            # Netlify configuration
├── 📁 netlify/functions/      # Serverless API functions
│   ├── 📥 get-todos.js        # Fetch tasks from Notion
│   ├── ➕ add-todo.js         # Create new tasks
│   ├── 🔄 update-status.js    # Update task status
│   ├── ✏️ update-task.js      # Edit task properties (for inline editing)
│   ├── 🗑️ delete-todo.js      # Delete tasks
│   ├── 📋 get-database-schema.js # Auto-detect database schema
│   └── 📖 get-task-details.js # Fetch detailed task information
├── 📖 README.md               # This comprehensive guide
└── 📖 INSTALLATION.md         # Step-by-step installation guide
```

## 🎯 Usage Guide

### Navigation
- **Today**: Tasks due today or without dates
- **Upcoming**: Future tasks (customizable logic)
- **All Tasks**: Board view with all tasks organized by status
- **Completed**: Finished tasks
- **By Status**: Filter by To Do, In Progress, or Blocked

### Task Management
1. **Add Task**: Click "➕ Add Task" in sidebar
2. **View Details**: Click any task to see full details
3. **Edit Task**: In details modal, click "✏️ Edit Task"
4. **Delete Task**: Use delete button in task actions
5. **Search**: Use search bar in sidebar for instant filtering

### Customization
- **Backgrounds**: Click ⚙️ in sidebar → Choose from 6 gradients or upload custom image
- **Custom Fields**: Add any properties to your Notion database - they'll appear automatically

## 🔧 Advanced Configuration

### Custom Notion Properties
The app automatically detects and supports:
- **Text fields** → Text inputs
- **Select/Multi-select** → Dropdown menus
- **Checkboxes** → Toggle switches
- **Dates** → Date pickers
- **Numbers** → Number inputs
- **URLs** → URL inputs with validation
- **Email** → Email inputs with validation

### API Endpoints
All endpoints are automatically available at `/.netlify/functions/`:
- `GET /get-todos` - Fetch all tasks
- `POST /add-todo` - Create new task
- `POST /update-status` - Update task status
- `POST /update-task` - Update task properties
- `POST /delete-todo` - Delete task
- `GET /get-database-schema` - Get database structure
- `POST /get-task-details` - Get detailed task info

## 🐛 Troubleshooting

### Common Issues

**Tasks not loading?**
- Check environment variables in Netlify dashboard
- Verify Notion integration has access to your database
- Check browser console for API errors

**Database schema not detected?**
- Ensure your Notion database has at least a "Name" (Title) property
- Verify the database ID is correct
- Check that integration has read access

**Local development not working?**
- Install Netlify CLI: `npm install -g netlify-cli`
- Ensure `.env` file exists with correct credentials
- Use `netlify dev` instead of regular HTTP server

### Support
- Check browser console for detailed error messages
- Verify all environment variables are set correctly
- Ensure Notion integration has proper permissions

## 📚 References & Citations

This project was built with inspiration and guidance from:

1. **Notion API Documentation**
   - [Notion Developers](https://developers.notion.com/)
   - [Database Integration Guide](https://developers.notion.com/docs/working-with-databases)

2. **Netlify Functions Documentation**
   - [Netlify Functions](https://docs.netlify.com/functions/overview/)
   - [Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)

3. **Design Inspiration**
   - [todolist.com](https://todolist.com) - Interface design inspiration
   - [Glassmorphism Design](https://uxdesign.cc/glassmorphism-in-user-interfaces-1f39bb1308c9) - Modern UI effects

4. **Technical Resources**
   - [MDN Web Docs](https://developer.mozilla.org/) - Web API references
   - [CSS Tricks](https://css-tricks.com/) - Modern CSS techniques
   - [Web.dev](https://web.dev/) - Performance and accessibility best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🏗️ Built With

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Netlify Functions (Node.js)
- **Database**: Notion API
- **Hosting**: Netlify
- **Design**: Glassmorphism, CSS Gradients, Responsive Design

---

**⭐ Star this repo if you found it helpful!**

*Made with ❤️ for better productivity*