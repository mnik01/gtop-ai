const fs = require('fs');

const filename = './tune3.jsonl';

fs.readFile(filename, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const lines = data.split('\n').filter(line => line.trim() !== '');
  const content = lines.join('\n');

  fs.writeFile(filename, content, 'utf8', err => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Empty lines removed successfully.');
  });
});
