const fs = require('fs');
const path = require('path');

const collectionPath = path.join(__dirname, '../CanvasLMS_Postman_Collection.json');
const collectionData = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionData);

const newItems = [
  {
    "name": "Courses",
    "item": [
      {
        "name": "Get All Courses",
        "request": {
          "method": "GET",
          "header": [
            { "key": "Authorization", "value": "Bearer {{token}}" }
          ],
          "url": {
            "raw": "{{baseUrl}}/courses",
            "host": ["{{baseUrl}}"],
            "path": ["courses"]
          }
        }
      },
      {
        "name": "Get Course by ID",
        "request": {
          "method": "GET",
          "header": [
            { "key": "Authorization", "value": "Bearer {{token}}" }
          ],
          "url": {
            "raw": "{{baseUrl}}/courses/c1",
            "host": ["{{baseUrl}}"],
            "path": ["courses", "c1"]
          }
        }
      }
    ]
  },
  {
    "name": "Notifications",
    "item": [
      {
        "name": "Get Notifications",
        "request": {
          "method": "GET",
          "header": [
            { "key": "Authorization", "value": "Bearer {{token}}" }
          ],
          "url": {
            "raw": "{{baseUrl}}/notifications",
            "host": ["{{baseUrl}}"],
            "path": ["notifications"]
          }
        }
      }
    ]
  },
  {
    "name": "Rewards",
    "item": [
      {
        "name": "Get User Points",
        "request": {
          "method": "GET",
          "header": [
            { "key": "Authorization", "value": "Bearer {{token}}" }
          ],
          "url": {
            "raw": "{{baseUrl}}/rewards/points",
            "host": ["{{baseUrl}}"],
            "path": ["rewards", "points"]
          }
        }
      }
    ]
  }
];

collection.item.push(...newItems);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Postman collection updated successfully.');
