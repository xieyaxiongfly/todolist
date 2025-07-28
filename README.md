# Todo List with Notion Integration

A todo list app that syncs with your Notion database using Netlify serverless functions.

## Setup Instructions

### 1. Create Notion Integration
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "Todo App")
4. Copy the API key (starts with `secret_`)

### 2. Create Notion Database
1. Create a new page in Notion
2. Add a database with these properties:
   - **Name** (Title)
   - **Done** (Checkbox)
3. Share the database with your integration
4. Copy the database ID from the URL

### 3. Deploy to Netlify
1. Push this code to GitHub
2. Connect your GitHub repo to Netlify
3. In Netlify dashboard, go to Site settings > Environment variables
4. Add these variables:
   - `NOTION_API_KEY`: Your integration API key
   - `NOTION_DATABASE_ID`: Your database ID

### 4. Local Development
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Create `.env` file with your Notion credentials:
   ```
   NOTION_API_KEY=your_api_key_here
   NOTION_DATABASE_ID=your_database_id_here
   ```
3. Run: `netlify dev`
4. Open: `http://localhost:8888`

## Features
- ✅ Add todos to Notion
- ✅ Mark todos as complete/incomplete
- ✅ Real-time sync with Notion database
- ✅ Fallback to localStorage when offline
- ✅ Responsive design

## File Structure
```
├── index.html          # Frontend
├── app.js             # Frontend logic
├── styles.css         # Styling
├── netlify.toml       # Netlify config
├── netlify/functions/ # Serverless functions
│   ├── get-todos.js   # Fetch todos from Notion
│   ├── add-todo.js    # Add todo to Notion
│   └── toggle-todo.js # Toggle todo completion
└── README.md          # This file
```