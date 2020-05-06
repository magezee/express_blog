/* 
    http-errors:    轻松地为Express、Koa、Connect等创建HTTP错误
    morgan:         用于node.js的HTTP请求日志记录器中间件
    session：       据存储在服务器端，当用户访问相同网站的时候，服务器端首先检查这个网页请求中是否含有一个session标志 有则在服务器端查找是否有相应的session数据以及这个数据是否过期 服务器根据结果返回相应的内容
*/

/* 
Session的工作流程
  当浏览器访问服务器并发送第一次请求时，服务器端会创建一个session对象，生成一个类似于 
  key,value的键值对，然后将key(cookie)返回到浏览器(客户)端，浏览器下次再访问时，携带key(cookie)， 
  找到对应的session(value)。 客户的信息都保存在session中
*/

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');   // 识别登录用户 



//  路由
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.set('views', path.join(__dirname, 'views'));    // 使用默认ejs文件夹的位置  _dirname 值为 c:\Users\MI\Desktop\Express_blogs\blog path.join
app.set('view engine', 'ejs');    // 设置项目使用ejs模板引擎


/*
存入session域中的验证码为undefined
发现客户端地址不一样 虽然http://localhost:3000和http://127.0.0.1:3000看似一样 但是问题都出在这里
两个客户端向服务端发送请求会被服务端当成两个客服端，所以取不到值
*/
app.use(session({   // 注意：需要在路由及设置页面之前进行配置 否则会返回 undefined
  secret: "blog",  // 作为服务端生成cookie的签名
  cookie: {maxAge: 1000 * 60 * 24 * 30},  // 设置返回到前端key的属性 默认值{path:'/', httpOnly: true, secure: false, maxAge: null} maxAge 设置cookie生成后存储在本地电脑时间单位s
  resave: false,    // 是否强制保存session 即使它没有并没有变化
  saveUninitialized: true   // 强制将未初始化的session存储 当新建了一个session且未设定属性或值时 它就处于未初始化状态 在设定一个cookie前 这对于登入验证 减轻服务端存储压力 权限控制是有帮助的
}));

app.use(logger('dev'));   // 使用日志记录中间件
app.use(express.json());  //express.json()  Express中内置的中间件功能。它使用JSON有效负载分析传入请求，并基于body-parser
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));    // 使用express默认的static中间件设置静态资源文件夹的位置


// 设置自己的路由
app.use('/', indexRouter);
app.use('/users', usersRouter);

// 捕获404并转发给 错误处理 程序
app.use(function(req, res, next) {
  next(createError(404));   // createError(404)为参数 传给了下一个路由，对应下一个路由形参 err
});

// 错误处理
app.use(function(err, req, res, next) {
  // 设置本地错误信息仅在开发环境中提供
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // 渲染错误请求页面
  res.status(err.status || 500);    // 设置返回码状态
  res.render('error');
});

app.listen(4311);

module.exports = app;
