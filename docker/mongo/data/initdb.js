db = db.getSiblingDB('agir');

// -----------------------------------------------------------------------
// Create Annual Programs
// -----------------------------------------------------------------------
db.createCollection('annual_program');

db.annual_program.insertMany([
    {
        "executorId": "executor1",
        "year": 2021,
        "description": "Programmation annuelle pour executor1",
        "budgetCap": 2000,
        "sharedRoles": [
          "string"
        ],
        "status": "new"
      },
]);

// -----------------------------------------------------------------------