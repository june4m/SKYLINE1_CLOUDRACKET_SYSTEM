import express from 'express';
import cookieParser from 'cookie-parser';
import router from '~/routers/users.routers';
const app = express();
const port = 3000;

app.get('/api', router);
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`);
})
app.use(express.json());
app.use(cookieParser());