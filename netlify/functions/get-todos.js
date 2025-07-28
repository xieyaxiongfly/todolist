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
    
    // Transform Notion data to our format with full details
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

      // Process all properties for instant access
      const processedProperties = {};
      Object.entries(page.properties).forEach(([propertyName, propertyData]) => {
        processedProperties[propertyName] = formatProperty(propertyData);
      });

      return {
        id: page.id,
        text: page.properties.Name?.title?.[0]?.plain_text || 'Untitled',
        completed: completed,
        status: page.properties.Status?.select?.name || (completed ? 'Done' : 'To Do'),
        // Include full details for instant access
        fullDetails: {
          id: page.id,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          properties: processedProperties
        }
      };
    });

    // Helper function to format different property types (same as get-task-details.js)
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