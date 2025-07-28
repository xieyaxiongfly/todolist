exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { properties } = JSON.parse(event.body);
    
    if (!properties || typeof properties !== 'object') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Properties object is required' })
      };
    }

    // Convert form data to Notion properties format
    const notionProperties = {};
    
    Object.entries(properties).forEach(([fieldName, fieldValue]) => {
      if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
        notionProperties[fieldName] = formatPropertyForNotion(fieldName, fieldValue, properties[fieldName + '_type']);
      }
    });

    // Ensure we have at least a title
    const titleField = Object.keys(notionProperties).find(key => 
      notionProperties[key].title || notionProperties[key].type === 'title'
    );
    
    if (!titleField) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'At least one title field is required' })
      };
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: notionProperties
      })
    });

    // Helper function to format values for Notion API
    function formatPropertyForNotion(fieldName, value, type) {
      switch (type) {
        case 'title':
          return {
            title: [{ text: { content: value.toString() } }]
          };
          
        case 'rich_text':
          return {
            rich_text: [{ text: { content: value.toString() } }]
          };
          
        case 'number':
          return {
            number: parseFloat(value) || 0
          };
          
        case 'select':
          return {
            select: { name: value.toString() }
          };
          
        case 'multi_select':
          const values = Array.isArray(value) ? value : [value];
          return {
            multi_select: values.map(v => ({ name: v.toString() }))
          };
          
        case 'date':
          return {
            date: { start: value.toString() }
          };
          
        case 'checkbox':
          return {
            checkbox: Boolean(value)
          };
          
        case 'url':
          return {
            url: value.toString()
          };
          
        case 'email':
          return {
            email: value.toString()
          };
          
        case 'phone_number':
          return {
            phone_number: value.toString()
          };
          
        default:
          // For unsupported types, try rich_text
          return {
            rich_text: [{ text: { content: value.toString() } }]
          };
      }
    }

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the title for display
    const titleProperty = Object.values(data.properties).find(prop => prop.type === 'title');
    const taskTitle = titleProperty?.title?.[0]?.plain_text || 'Untitled Task';
    
    const newTodo = {
      id: data.id,
      text: taskTitle,
      completed: false,
      status: data.properties.Status?.select?.name || "To Do",
      created: true // Flag to indicate successful creation
    };

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newTodo)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to add todo' })
    };
  }
};