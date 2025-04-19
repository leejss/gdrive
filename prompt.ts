import inquirer from 'inquirer';

async function foo() {
  return inquirer.prompt([
    {
      type: 'input',
      name: 'clientId',
      message: 'Enter your client ID:',
    },
    {
      type: 'input',
      name: 'clientSecret',
      message: 'Enter your client secret:',
    },
    {
      type: 'input',
      name: 'defaultFolderId',
      message: 'Enter your default folder ID:',
    },
  ]);
}

foo().then(answers => {
  console.log(answers);
});
