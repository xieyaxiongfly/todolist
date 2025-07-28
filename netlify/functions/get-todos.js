exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Notion data to our format
    const todos = data.results.map(page => {
      // Check for both 'Status' and 'Done' properties for backwards compatibility
      let completed = false;
      
      if (page.properties.Status?.select?.name) {
        // If Status is a select property, check if it's "Done" or "Completed"
        const status = page.properties.Status.select.name.toLowerCase();
        completed = status === 'done' || status === 'completed';
      } else if (page.properties.Status?.checkbox !== undefined) {
        // If Status is a checkbox
        completed = page.properties.Status.checkbox;
      } else if (page.properties.Done?.checkbox !== undefined) {
        // Fallback to Done checkbox
        completed = page.properties.Done.checkbox;
      }

      return {
        id: page.id,
        text: page.properties.Name?.title?.[0]?.plain_text || 'Untitled',
        completed: completed,
        status: page.properties.Status?.select?.name || (completed ? 'Done' : 'To Do')
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(todos)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch todos' })
    };
  }
};