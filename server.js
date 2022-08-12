const fs = require('fs');
const bodyParser = require('body-parser');
const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');
const queryString = require('query-string');

const server = jsonServer.create();
const router = jsonServer.router('./database/data.json');
const userdb = JSON.parse(fs.readFileSync('./database/users.json', 'UTF-8'));

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(jsonServer.defaults());


const SECRET_KEY = '05132022';

const expiresIn = '1h';

// const tokenList = ''

// Create a token from a payload
function createToken(payload) {
    return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Verify the token
function verifyToken(token) {
    return jwt.verify(token, SECRET_KEY, (err, decode) =>
        decode !== undefined ? decode : err,
    );
}

// Check if the user exists in database
function isAuthenticated({ username, password }) {
    return (
        userdb.users.findIndex(
            (user) => user.username === username && user.password === password,
        ) !== -1
    );
}


// Login to one of the users from ./users.json
server.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (isAuthenticated({ username, password }) === false) {
        const status = 401;
        const message = 'Incorrect username or password';
        res.status(status).json({ status, message });
        return;
    }
    const access_token = createToken({ username, password });
    const refreshToken  = createToken({ username, password });
    // tokenList[refreshToken] = refreshToken;
    res.status(200).json({ userId: username, accessToken: access_token, refreshToken: refreshToken });
});

server.post('/auth/token', (req, res) => {
    // const postData = req.body
    const { username, password, refreshToken } = req.body;
    if(refreshToken) {
        const token = createToken({ username, password });
        const response = {
            accessToken: token
        }
        res.status(200).json(response);      
    } else {
        res.status(404).send('Invalid request')
    }
})


router.render = (req, res) => {
    const headers = res.getHeaders();
    const totalCount = headers['x-total-count'];
    if(req.originalMethod === 'GET' && totalCount){
        const queryParams = queryString.parse(req._parsedOriginalUrl.query);
        const result = {
          data: res.locals.data,
          pagination:{
            _page: Number.parseInt(queryParams._page) || 1,
            _limit: Number.parseInt(queryParams._limit) || 10,
            _totalRows: Number.parseInt(totalCount)
          }
        }
      return res.json(result)
      }
      res.json(res.locals.data)
}

server.use(/^(?!\/auth).*$/, (req, res, next) => {
    if (
        req.headers.authorization === undefined ||
        req.headers.authorization.split(' ')[0] !== 'Bearer'
    ) {
        const status = 401;
        const message = 'Error in authorization format';
        res.status(status).json({ status, message });
        return;
    }
    try {
        let verifyTokenResult;
        verifyTokenResult = verifyToken(
            req.headers.authorization.split(' ')[1],
        );

        if (verifyTokenResult instanceof Error) {
            const status = 401;
            const message = 'Access token not provided';
            res.status(status).json({ status, message });
            return;
        }
        next();
    } catch (err) {
        const status = 401;
        const message = 'Error access_token is revoked';
        res.status(status).json({ status, message });
    }
});



server.use(router);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log('The Authorization API server is running!');
});
