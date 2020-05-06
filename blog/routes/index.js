var crypto = require('crypto');   // 加密数据模块
var mysql = require('./../database');
var express = require('express');
var router = express.Router();
var fs = require('fs');

// 首页
router.get('/', function(req, res, next) {
  var page = req.query.page || 1;   // 处理文章分页 规定每页最多显示八篇文章 保证page=0的时候也能为1
  console.log(page);
  var start = (page -1) * 8;
  var end = page * 8;
  var queryCount = 'SELECT COUNT(*) AS articleNum FROM article';    // 统计文章个数 整合在 articleNum表中
  var queryArticle = 'SELECT * FROM article ORDER BY articleID DESC LIMIT ' + start + ',' + end;    // 每页渲染文章数
  
  mysql.query(queryArticle,function(err,rows,fields){
    if(err){
      console.log(err);
      return;
    }
    var articles = rows;    // 获取文章信息
  
    articles.forEach(function(ele){   // 用于同一时间格式 不然直接输出为国际时间格式 Wed Nov 06 2019 00:00:00 GMT+0800 (GMT+08:00) 
      var year = ele.articleTime.getFullYear();   // 年
      if(ele.articleTime.getMonth() + 1 > 10){    // 月
        var month = ele.articleTime.getMonth();
      }
      else{
        var month = '0' + (ele.articleTime.getMonth() + 1);
      }
      if(ele.articleTime.getDate() > 10){   // 日
        var date = ele.articleTime.getDate();
      }
      else{
        var date = '0' + ele.articleTime.getDate();
      }
      ele.articleTime = year + '-' + month + '-' + date;    // 输出
    });
   

    mysql.query(queryCount,function(err,rows,fields){
      if(err){
        console.log(err);
        return;
      }
      var articleNum = rows[0].articleNum; // 拿到文章总页数
      var pageNum = Math.ceil(articleNum / 8);    // 返回一个整数 该整数刚好大于或等于其结果
      res.render('index',{articles:articles, user:req.session.user, pageNum:pageNum, page:page});
    });  
  });
});



// 文章内容页
router.get('/articles/:articleID',function(req,res,next){   
  var articleID = req.params.articleID;    // 如果有route/user/：name，那么req.params.name 可拿到{"name":value}的value值
  // req.params包含路由参数（在URL的路径部分） 而req.query包含URL的查询参数（在URL的？后的参数）
  var query = 'SELECT * FROM article WHERE articleID=' + mysql.escape(articleID);
  mysql.query(query,function(err,rows,fields){
    if(err){
      console.log(err);
      return;
    }
    var query = 'UPDATE article SET articleClick = articleClick +1 WHERE articleID=' + mysql.escape(articleID);
    var article = rows[0];
    mysql.query(query,function(err,rows,fields){
      if(err){
        console.log(err);
        return;
      }
    
      var year = article.articleTime.getFullYear();
      if(article.articleTime.getMonth() + 1 > 10){    
        var month = article.articleTime.getMonth();
      }
      else{
        var month = '0' + (article.articleTime.getMonth() + 1);
      }
      if(article.articleTime.getDate() > 10){   
        var date = article.articleTime.getDate();
      }
      else{
        var date = '0' + article.articleTime.getDate();
      }
      article.articleTime = year + '-' + month +  '-' + date;
      res.render('article',{article:article,user:req.session.user,});
    })
  })
    
})



// 写文章页
router.get('/edit',function(req,res,next){
  var user = req.session.user;
  if(!user){    // 如果没有登入则不能写文章
    res.redirect('/login');
    return;
  }

  res.render('edit',{user:req.session.user});
 
})

router.post('/edit',function(req,res,next){
  var title = req.body.title;   // 填入表单的文章标题
  var content = req.body.content;   // 填入表单的文章内容
  var author = req.session.user.authorName;   // 从session获取登入后的用户信息
  var query = 'INSERT article SET articleTitle=' + mysql.escape(title) +  ',articleAuthor=' + mysql.escape(author) +  ',articleContent =' + mysql.escape(content) + ',articleTime = CURDATE()';
  mysql.query(query,function(err,rows,fields){
    if(err){
      console.log(err);
      return;
    }
    
    res.redirect('/');
    
    
  })
})



// 文章修改页
router.get('/modify/:articleID',function(req,res,next){
  var articleID = req.params.articleID;
  var user = req.session.user;
  var query = 'SELECT * FROM article WHERE articleID=' + mysql.escape(articleID);
  if(!user){
    res.redirect('/login');
    return;
  }
  mysql.query(query,function(err,rows,fields){
    if(err){
      console.log(err);
      return;
    }
    var article = rows[0];
    var title = article.articleTitle;
    var content = article.articleContent;
    console.log(title,content);
    res.render('modify',{user:user,title:title,content:content})
  })
})

router.post('/modify/:articleID',function(req,res,next){
  var articleID = req.params.articleID;
  var user = req.session.user;
  var title = req.body.title;
  var content = req.body.content;
  var query = 'UPDATE article SET articleTitle=' + mysql.escape(title) + ',articleContent=' + mysql.escape(content) + 'WHERE articleID=' + mysql.escape(articleID);
  mysql.query(query,function(err,rows,fields){
    if(err){
      console.log(err);
    }
    res.redirect('/');
  })
})



// 文章删除页
router.get('/delete/:articleID',function(req,res,next){
  var articleID = req.params.articleID;
  var user = req.session.user;
  var query = 'DELETE FROM article WHERE articleID=' + mysql.escape(articleID);
  if(!user){
    res.redirect('/login');
    return;
  }
  mysql.query(query,function(err,rows,fields){
    res.redirect('/');
  })
})


// 登入页
router.get('/login',function(req,res,next){   
  res.render('login',{message:''});
})



// 密码加密
router.post('/login',function(req,res,next){
  var name = req.body.name;
  var password = req.body.password;
  var hash = crypto.createHash('md5');    // 设计的数据库是通过md5加密后储存的 所以输入的数据也需要md5加密才能比对
  hash.update(password);
  password = hash.digest('hex');

  var str = "name:" + name + "\t" + "passwrd:" + password + '\n';
  fs.appendFile('./postStr.txt', str, function(err){
    if(err){
        console.log(err);
        return;
    }
} )

  var query = 'SELECT *FROM author WHERE authorName=' + mysql.escape(name) + 'AND authorPassword=' + mysql.escape(password);
  // mysql.escape() 转义防止sql注入 将传入sql的参数进行编码 而不是直接字符串拼接
  mysql.query(query,function(err,row,fields){
    if(err){
      console.log(err);
      return;
    }
    var user = row[0];  // 查询的第一个结果
    if(!user){   // 如果输入的数据在数据库中查不到 说明输入错误
        res.render('login',{message:'用户密码错误'});
        return;
    }
    req.session.user = user;
    console.log(req.session.user);
    res.redirect('/');
    
    
  })
})


//登出博客
router.get('/logout',function(req,res,next){
  req.session.user = null;
  res.redirect('/');
})



module.exports = router;
