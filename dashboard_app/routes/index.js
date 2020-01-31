var express = require('express');
var router = express.Router();
var ObjectId = require('mongodb').ObjectId;
const { check, validationResult } = require('express-validator');
var bodyParser = require("body-parser");
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var hbs = require('express-handlebars');
let userloggedin=false;

/* GET home page. */
router.get('/',function(req,res,next)
{
     if(userloggedin)
     {
        next();
     }else{
            res.redirect('/signin')
           }
},
 function(req, res, next) {
  res.render('index', { layout: 'layout_dashboard', title: 'Welcome' });
});
/* GET Signin page. */
router.get('/signin', function(req, res, next) {
  res.render('signin', { title: 'Signinpage' });
});


router.get('/signup', function(req, res) {
  res.render('signup');
})

/* Get Email login */
router.post('/signin', [ check('email', 'Email is required').isEmail(),
check('password', 'Enter your correct password').isLength({ min: 5 }).custom((val, { req, loc, path }) => {
              if (val !== req.body.email && val !== req.body.password) {
                  throw new Error("Enter your valid email and password");
              } else {
                  return val;
              }
          }),
],

function (req, res) {
  const errors = validationResult(req);
  console.log(JSON.stringify(errors))
  if (!errors.isEmpty()) {
    var messages = [];
    errors.errors.forEach(function (err) {
      console.log(JSON.stringify(err))
      messages.push(err.msg)
    })

    res.render('signin', { errors: true, messages: messages, err:messages})
  } else {
    // read the values and save it in the DB
    let email = req.body.email;
    let password = req.body.password;

    MongoClient.connect(url, {useUnifiedTopology: true},function (err, db) {
      if (err) throw err;
      var dbo = db.db('dashboard');
      dbo.collection('Signup').findOne({email: email}, function (err, data) {
        console.log("find one Id =",data);
        if(data.email == email && data.password == password) {
          res.render('index',  
          {
          layout :'layout_dashboard',
          success: true
         })
        }
        else{
          res.render('signin', 
          {
          layout :'layout_dashboard',
          success: true,
          data:err
         })
        
          }
        db.close();
      })
    });

  }
})



 /* start :Signup page */


router.post('/signup',[
  check('name').not().isEmpty().withMessage('Name is required'),
  check('email', 'Email is required').isEmail(),
  check('password', 'Password is required').isLength({min:5}),
  check('repeatpassword', 'enter your password again').isLength({ min: 5 }).custom((val, { req, loc, path }) => {
        if (val !== req.body.password && val !== req.body.repeatpassword) {
                    throw new Error("Passwords don't match");
                } else {
                    return val;
                }
            }),

],
 function (req, res) {
    const errors = validationResult(req);
    console.log(JSON.stringify(errors))
    if (!errors.isEmpty()) {
      var messages = [];
      errors.errors.forEach(function (err) {
        console.log(JSON.stringify(err))
        messages.push(err.msg)
      })

      res.render('signup', { errors: true, messages: messages})
    } else {
      // read the values and save it in the DB
      let name = req.body.name;
      let email = req.body.email;
      let password = req.body.password;
      let repeatpassword = req.body.repeatpassword;
      MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db('dashboard');
        let signup = { name,email,password,repeatpassword };
        dbo.collection('Signup').insertOne(signup, function (err, signupObj) {
          if (err) throw err;
          console.log("one document instered. Id =" + signupObj._id);
          db.close();
        })
      });
      res.render('signup', { success: true });
    }
  })

/* End :Signup page */

/* list Project page */
    router.get('/projects', function(req, res, next) {
      MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        let dbo = db.db("portfolio");
        let d = new Date();
        dbo.collection('projects').find({}).limit(20).toArray(function (err, data) {
          if (err) throw err;
          console.log(JSON.stringify(data));
          db.close();
          res.render('projects', { projects: data ,layout:'layout_projects'})
        })
      });
    });

    /* Project details */
   router.get('/projects/:id', function (req, res) {
    let id = req.params.id;
    console.log("here your getting clicked")
    //  once you got the project id
    // make the database call to check if it exists
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      let dbo = db.db("portfolio");
      console.log("myid2", id);
  
      dbo.collection('projects').findOne({ "_id": ObjectId(id) }, function (err, data) {
        if (err) throw err;
        console.log(JSON.stringify(data))
        db.close();
        res.render('details', { layout :'layout_projectsdetail',data: data });
      })
    })
    });
    /*  End project */
    
  /* create projects */
  router.get('/createproject', function(req, res, next) {
    res.render('createproject',{ layout :'layout_createproject'});
  });
  /* submit create projects */
  router.post('/createproject', function(req, res, next) {
    let title = req.body.title;
    let image = req.body.image;
    let description = req.body.description;
    let project ={title,image,description};
    console.log("create project is getting clicked")
     /* write the data in DB */
     MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db('portfolio');
      let d = new Date();
      dbo.collection('projects').insertOne(project, function (err, project) {
        if (err) throw err;
        console.log(JSON.stringify('project'));
        db.close();
        // redirect the project list page
         res.redirect('/projects')

      })
    });
  });

/*  start : update project */

router.post('/projects/:id',  function(req, res, next) {
  let id = req.params.id;
  console.log("hii projects how are you??????")

  let title = req.body.title;
  let images = req.body.images;
  let description = req.body.description;
  let project = {title, images, description};
  let updatedProject = {$set: project};

  MongoClient.connect(url, function(err, db){
    if (err) throw err;
    let dbo = db.db("portfolio");
    dbo.collection('projects').updateOne({_id: new ObjectId(id)}, updatedProject, function(err, p){
      if (err) throw err;
      console.log(JSON.stringify(p));
      db.close();
      res.redirect('/projects')
    })
  });
});

 /* End : Update project */ 


/* Delete projects*/
router.get('/projects/:id/delete', function(req, res, next) {
  let id = req.params.id

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db('portfolio');
    let d = new Date();
    dbo.collection('projects').remove({_id: new ObjectId(id)}, function (err, p) {
      if (err) throw err;
      console.log(JSON.stringify(p));
      db.close();
      // redirect the project list page
      res.redirect('/projects');
    })
    });
});

/* End Project */


/* Start : Blog page */
router.get('/blog', function(req, res, next) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("portfolio");
    let d = new Date();
    dbo.collection('post').find().toArray(function (err, post) {
      if (err) throw err;
      console.log(JSON.stringify(post));
      db.close();
      res.render('blog', {layout:'layout_blog', post: post });
    })
  });
});

/* Blog Details page */


router.get('/blog/:id', function (req, res) {
  let id = req.params.id;
  //  once you got the project id
  // make the database call to check if it exists
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    let dbo = db.db("portfolio");
    console.log("myid2", id);
    dbo.collection('post').findOne({ "_id": ObjectId(id) }, function (err, data) {
      if (err) throw err;
      console.log(JSON.stringify(data))
      db.close();
      res.render('blogdetails', { layout :'layout_blogdetail',data: data });
    })
  })
  });

    /* create  new blog */
    router.get('/createblog', function(req, res, next) {
      res.render('createblog',{ layout :'layout_createblog'});
    });
    /* submit create blog */
    router.post('/createblog', function(req, res, next) {
      let title = req.body.title;
      let image = req.body.image;
      let description = req.body.description;
      let project ={title,image,description};
       /* write the data in DB */
       MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db('portfolio');
        let d = new Date();
        dbo.collection('post').insertOne(project, function (err, project) {
          if (err) throw err;
          console.log(JSON.stringify('post'));
          db.close();
          // redirect the project list page
           res.redirect('/blog');
  
        })
      });
    });

/*  start : update blog */

router.post('/blog/:id',  function(req, res, next) {
  let id = req.params.id;
  console.log("hii blog how are you??????")

  let title = req.body.title;
  let image = req.body.image;
  let description = req.body.description;
  let project = {title, image, description};
  let updatedProject = {$set: project};

  MongoClient.connect(url, function(err, db){
    if (err) throw err;
    let dbo = db.db("portfolio");
    dbo.collection('post').updateOne({_id: new ObjectId(id)}, updatedProject, function(err, p){
      if (err) throw err;
      console.log(JSON.stringify(p));
      db.close();
      res.redirect('/blog')
    })
  });
});

 /* End : Update blog */ 

 /* start: Delete blog */

router.get('/blog/:id/delete', function(req, res, next) {
  let id = req.params.id

  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db('portfolio');
    let d = new Date();
    dbo.collection('post').remove({_id: new ObjectId(id)}, function (err, p) {
      if (err) throw err;
      console.log(JSON.stringify(p));
      db.close();
      // redirect the project list page
      res.redirect('/blog');
    })
    });
});

/* End: Delete blog */

/* End: Blog page */

/* Start logout */
router.get('/logout',function(req,res,next){
  res.redirect('/signin');
});

/* End logout */

/* Start contact page */

/* Retrive the data from data base */
router.get('/contacts',  function(req, res, next) {
  MongoClient.connect(url, function(err, db){
    if (err) throw err;
    let dbo = db.db("portfolio");
    let d = new Date();
    // get the projects
    dbo.collection('contact').find({}).toArray(function(err, contact){
        if (err) throw err;
        console.log(JSON.stringify(contact));
        db.close();
        // get the posts
        res.render('contacts', {layout:'layout_contact', contact:contact})
    })
  });
});

/* End contact page */

/* Start Newsletter page */

/* Retrive the data from data base */
router.get('/subscribers',  function(req, res, next) {
  MongoClient.connect(url, function(err, db){
    if (err) throw err;
    let dbo = db.db("portfolio");
    let d = new Date();
    // get the projects
    dbo.collection('newsletter').find({}).toArray(function(err, news){
        if (err) throw err;
        console.log(JSON.stringify(news));
        db.close();
        // get the posts
        res.render('subscribers', {layout:'layout_newsletter', newsletter : news})
    })
  });
});

/* End Newsletter page */

module.exports = router;
