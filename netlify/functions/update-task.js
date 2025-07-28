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
    const { id, properties } = JSON.parse(event.body);
    
    if (!id || !properties) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Task ID and properties are required' })
      };
    }

    // Convert form data to Notion properties format
    const notionProperties = {};
    
    Object.entries(properties).forEach(([fieldName, fieldValue]) => {
      // Skip type fields (they end with '_type')
      if (fieldName.endsWith('_type')) return;
      
      const fieldType = properties[fieldName + '_type'];
      
      if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
        notionProperties[fieldName] = formatPropertyForNotion(fieldName, fieldValue, fieldType);
      }
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

    const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        properties: notionProperties
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Notion API error:', response.status, errorData);
      throw new Error(`Notion API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    // Extract the title for display
    const titleProperty = Object.values(data.properties).find(prop => prop.type === 'title');
    const taskTitle = titleProperty?.title?.[0]?.plain_text || 'Untitled Task';
    
    const updatedTodo = {
      id: data.id,
      text: taskTitle,
      status: data.properties.Status?.select?.name || "To Do",
      completed: data.properties.Status?.select?.name === 'Done',
      updated: true // Flag to indicate successful update
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedTodo)
    };

  } catch (error) {
    console.error('Error updating task:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to update task',
        details: error.message
      })
    };
  }
};