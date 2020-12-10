import express from 'express';
import * as path from 'path';

const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});
 
app.listen(3000, () =>
  console.log(`Example app listening on port 3000!`),
);