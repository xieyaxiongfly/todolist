exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    let taskId;
    
    if (event.httpMethod === 'GET') {
      taskId = event.queryStringParameters?.id;
    } else {
      const body = JSON.parse(event.body);
      taskId = body.id;
    }
    
    if (!taskId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Task ID is required' })
      };
    }

    // Fetch the specific page from Notion
    const response = await fetch(`https://api.notion.com/v1/pages/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Notion API error:', response.status, errorData);
      throw new Error(`Notion API error: ${response.status} - ${errorData}`);
    }

    const pageData = await response.json();
    
    // Transform properties into a more readable format
    const taskDetails = {
      id: pageData.id,
      created_time: pageData.created_time,
      last_edited_time: pageData.last_edited_time,
      properties: {}
    };

    // Process each property dynamically
    Object.entries(pageData.properties).forEach(([propertyName, propertyData]) => {
      taskDetails.properties[propertyName] = formatProperty(propertyData);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(taskDetails)
    };

  } catch (error) {
    console.error('Error fetching task details:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch task details: ' + error.message })
    };
  }
};

// Helper function to format different property types
function formatProperty(property) {
  const result = {
    type: property.type,
    value: null,
    displayValue: ''
  };

  switch (property.type) {
    case 'title':
      result.value = property.title;
      result.displayValue = property.title.map(t => t.plain_text).join('');
      break;
      
    case 'rich_text':
      result.value = property.rich_text;
      result.displayValue = property.rich_text.map(t => t.plain_text).join('');
      break;
      
    case 'number':
      result.value = property.number;
      result.displayValue = property.number ? property.number.toString() : '';
      break;
      
    case 'select':
      result.value = property.select;
      result.displayValue = property.select ? property.select.name : '';
      break;
      
    case 'multi_select':
      result.value = property.multi_select;
      result.displayValue = property.multi_select.map(s => s.name).join(', ');
      break;
      
    case 'date':
      result.value = property.date;
      if (property.date) {
        result.displayValue = property.date.start;
        if (property.date.end) {
          result.displayValue += ` → ${property.date.end}`;
        }
      }
      break;
      
    case 'checkbox':
      result.value = property.checkbox;
      result.displayValue = property.checkbox ? '✅ Yes' : '❌ No';
      break;
      
    case 'url':
      result.value = property.url;
      result.displayValue = property.url || '';
      break;
      
    case 'email':
      result.value = property.email;
      result.displayValue = property.email || '';
      break;
      
    case 'phone_number':
      result.value = property.phone_number;
      result.displayValue = property.phone_number || '';
      break;
      
    case 'people':
      result.value = property.people;
      result.displayValue = property.people.map(p => p.name || p.id).join(', ');
      break;
      
    case 'files':
      result.value = property.files;
      result.displayValue = property.files.map(f => f.name).join(', ');
      break;
      
    case 'created_time':
      result.value = property.created_time;
      result.displayValue = new Date(property.created_time).toLocaleString();
      break;
      
    case 'last_edited_time':
      result.value = property.last_edited_time;
      result.displayValue = new Date(property.last_edited_time).toLocaleString();
      break;
      
    case 'created_by':
      result.value = property.created_by;
      result.displayValue = property.created_by.name || property.created_by.id;
      break;
      
    case 'last_edited_by':
      result.value = property.last_edited_by;
      result.displayValue = property.last_edited_by.name || property.last_edited_by.id;
      break;
      
    default:
      result.value = property;
      result.displayValue = JSON.stringify(property);
  }

  return result;
}