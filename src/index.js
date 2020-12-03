import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import * as path from 'path';

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')))

app.use(cors());
 
app.get('/', (req, res) => {
    res.render('index');
});
 
app.listen(3000, () =>
  console.log(`Example app listening on port 3000!`),
);