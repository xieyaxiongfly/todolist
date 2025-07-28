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
    // Get database information to understand the schema
    const response = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}`, {
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

    const databaseInfo = await response.json();
    
    // Transform properties into form field definitions
    const formFields = [];
    
    Object.entries(databaseInfo.properties).forEach(([propertyName, propertyConfig]) => {
      const field = {
        name: propertyName,
        type: propertyConfig.type,
        required: propertyConfig.type === 'title', // Title fields are usually required
        config: propertyConfig
      };

      // Add specific configuration for each field type
      switch (propertyConfig.type) {
        case 'title':
          field.inputType = 'text';
          field.placeholder = 'Enter task title...';
          break;
          
        case 'rich_text':
          field.inputType = 'textarea';
          field.placeholder = 'Enter description...';
          break;
          
        case 'number':
          field.inputType = 'number';
          field.placeholder = 'Enter number...';
          break;
          
        case 'select':
          field.inputType = 'select';
          field.options = propertyConfig.select?.options || [];
          break;
          
        case 'multi_select':
          field.inputType = 'multi_select';
          field.options = propertyConfig.multi_select?.options || [];
          break;
          
        case 'date':
          field.inputType = 'date';
          break;
          
        case 'checkbox':
          field.inputType = 'checkbox';
          break;
          
        case 'url':
          field.inputType = 'url';
          field.placeholder = 'https://example.com';
          break;
          
        case 'email':
          field.inputType = 'email';
          field.placeholder = 'user@example.com';
          break;
          
        case 'phone_number':
          field.inputType = 'tel';
          field.placeholder = '+1 (555) 123-4567';
          break;
          
        case 'people':
          field.inputType = 'text';
          field.placeholder = 'Enter person names...';
          field.help = 'Note: People fields are read-only in this interface';
          break;
          
        case 'files':
          field.inputType = 'text';
          field.placeholder = 'File URLs...';
          field.help = 'Note: File uploads are not supported in this interface';
          break;
          
        default:
          field.inputType = 'text';
          field.help = `Unsupported field type: ${propertyConfig.type}`;
      }

      formFields.push(field);
    });

    // Sort fields to put title first, then others
    formFields.sort((a, b) => {
      if (a.type === 'title') return -1;
      if (b.type === 'title') return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        databaseTitle: databaseInfo.title?.[0]?.plain_text || 'Database',
        fields: formFields
      })
    };

  } catch (error) {
    console.error('Error fetching database schema:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch database schema: ' + error.message })
    };
  }
};