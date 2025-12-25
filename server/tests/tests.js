// 1. just junk
let emails = [
    "johndoe@example.com",
    "janesmith@testmail.com",
    "michaelbrown@fakemail.com",
    "emilywhite@demo.org",
    "sarahjohnson@samplemail.com",
    "davidlee@placeholder.com",
    "chrisparker@mockmail.net",
    "angelaharris@tempmail.com",
    "danielmartin@test.org",
    "olivialewis@dummyemail.com"
];
let emailString = ``;
for (let email of emails) {
    emailString = emailString + `"${email}",`;
}
emailString = emailString.slice(0, -1); // slicing the last comma
// console.log(emailString);

//create csv from json
const fs = require('fs');
const path = require('path');
// Your JSON data
const data = [
    {
        "key1": "value1"
    },
    {
        "key2": "value2",
        "nested_object": {
            "nested_key": "nested_value"
        }
    },
    {
        "key3": "value3",
        "nested_array": [
            {
                "key5": "value5"
            }
        ]
    },
    {
        "key4": "value4",
        "nested_object_2": {
            "nested_key_2": "nested_value_2",
            "nested_key_3": "nested_value_3"
        }
    },
    {
        "key5": "value5",
        "nested_array_2": [
            {
                "key6": "value6"
            },
            {
                "key7": "value7"
            }
        ]
    }
];
// Flatten and organize data for vertical alignment
const organizeDataVertically = (data) => {
    const columns = [];
    let columnIndex = 0;
  
    data.forEach((item) => {
      const flattened = flattenObject(item);
  
      Object.entries(flattened).forEach(([key, value]) => {
        if (!columns[columnIndex]) columns[columnIndex] = []; // Initialize column
  
        columns[columnIndex][1] = key; // Place key in row 2
        columns[columnIndex][2] = value; // Place value in row 3
  
        columnIndex++;
      });
    });
  
    return columns;
  };
  
  // Function to flatten objects and arrays
  const flattenObject = (obj, parent = "", res = {}) => {
    for (let key in obj) {
      const propName = parent ? `${parent}.${key}` : key;
      if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
        flattenObject(obj[key], propName, res);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item, index) => {
          flattenObject(item, `${propName}[${index}]`, res);
        });
      } else {
        res[propName] = obj[key];
      }
    }
    return res;
  };
  
  // Convert organized data to CSV format
  const generateCsvContent = (columns) => {
    const numRows = Math.max(...columns.map((col) => col.length));
    const csvRows = [];
  
    for (let i = 0; i < numRows; i++) {
      const row = columns.map((col) => (col[i] !== undefined ? `"${col[i]}"` : ""));
      csvRows.push(row.join(","));
    }
  
    return csvRows.join("\n");
  };
  
  // Save CSV to a file
  const saveCsv = (csvContent, outputPath) => {
    const date = new Date().toISOString().split("T")[0];
    const fileName = `data_${date}.csv`;
    const filePath = path.join(outputPath, fileName);
    fs.writeFileSync(filePath, csvContent);
    console.log(`CSV file created: ${filePath}`);
  };
  
  // Main function to create CSV
  const createCsv = (data, outputPath) => {
    const organizedColumns = organizeDataVertically(data);
    const csvContent = generateCsvContent(organizedColumns);
    saveCsv(csvContent, outputPath);
  };
const outputPath = 'C:\\Users\\benom\\Desktop\\Outputs'; // Replace with your desired path
createCsv(data, outputPath);