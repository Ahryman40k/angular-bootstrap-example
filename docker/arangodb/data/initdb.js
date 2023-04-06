db._createDatabase('agir', null, [{ username: 'dev', passwd: 'dev', active: true }]);
db._useDatabase('agir');


console.log('create executors');
db._createDocumentCollection('executors', {} );

db.executors.save({"name": "executor-01", "key": "ex01" })
db.executors.save({"name": "executor-02", "key": "ex02" })
db.executors.save({"name": "executor-03", "key": "ex03" })

var annual_program_schema = {
  rule: {
    properties: {
      executorId: { type: 'string' },
      year: { type: 'number' },
      description: { type: 'string' },
    },
  },
  level: 'strict',
  message: 'Looks, you failed !!',
};

console.log('annual_programs');
db._createDocumentCollection('annual_programs', { schema: annual_program_schema });

db.annual_programs.save({
  "executorId": "ex01",
  year: 2023,
  description: "Automatically added" 
})

