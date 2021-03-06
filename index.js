var user={
　　　　username:'doctor',
　　　　password:'1234',
     id:'user1',
     type:0
 }
var user1={
　　　　username:'patient',
　　　　password:'1234',
     id:'user2',
     type:1
 }

var express = require('express');
var fs = require("fs");
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var formidable = require('formidable');

// Init App
var app = express();


app.use(bodyParser.urlencoded({extended: true}))
app.use(cookieParser());


// Set Static Folder
app.use("/styles",express.static(__dirname + "/public"));
app.use("/pictures",express.static(__dirname ));

// View Engine
app.set('views', __dirname +'/views');
app.set('view engine', 'ejs');

// Express Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true,
    cookie: {maxAge: 1800000}
  }));


app.listen(3000, function() {
  console.log('listening on 3000')
})



//login and logout
app.get('/', (req, res) => {
  res.render('login');
})

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
})
app.post('/login', (req, res) => {
　　if(req.body.username==user.username&&req.body.password==user.password){
　　　　req.session.user = user;
      res.redirect('/doctor');
    }
   else if(req.body.username==user1.username&&req.body.password==user1.password){
       req.session.user = user1;
       res.redirect('/patient');     
   }
   else{
　　　　req.session.error = "wrong username or password";
       res.redirect('/');     
　　}
})




//Doctor's patient list
app.get('/doctor', function (req, res) {

　　if(req.session.user && req.session.user.type == 0){
     fs.readFile( __dirname + '/user.json', 'utf8', function (err, data) {
      var users = JSON.parse( data );
      var dat = [];
      for(var key in users){
        dat.push(users[key]);
      }
      res.render('list', { data: dat });
      });
 　　}else{
　　　　req.session.error = "wrong username or password";
　　　　res.redirect('/');
　　}

})

//Search patient by name
app.post('/search', function (req, res) {
　　if(req.session.user && req.session.user.type == 0){
     fs.readFile( __dirname + '/user.json', 'utf8', function (err, data) {
      var users = JSON.parse( data );
      var route = '/doctor';
      for(var key in users){
        if(users[key].name==req.body.search){
           route = '/appointment/'+parseInt(users[key].id);
        }
      }
      res.redirect(route);
      });
 　　}else{
　　　　req.session.error = "wrong username or password";
　　　　res.redirect('/');
　　}

})


//Doctor's appointment with every patient
app.get('/appointment/:id', function (req, res) {
　　if(req.session.user && (req.session.user.type == 0 || req.session.user.id == "user"+req.params.id ) ){   
      var Folder = __dirname + "/files/user" + req.params.id;
      var filesname = [];
      fs.readdir(Folder, (err, files) => {
        files.forEach(file => {
         filesname.push(file);
        });
      })     


     fs.readFile( __dirname + '/user.json', 'utf8', function (err, data) {
        var users = JSON.parse( data );
        var user = users["user" + req.params.id] 
        res.render('appointment', { data: user, files:filesname});
     });
    }
    else{
　　　　req.session.error = "wrong username or password";
　　　　res.redirect('/');
　　}


})

//Doctor's new appointment
app.post('/appointment/:id', function (req, res) {
   // First read existing users.
   fs.readFile( __dirname + '/user.json', 'utf8', function (err, data) {
       data = JSON.parse( data );
       var user = data["user" + req.params.id];
       user["appointment"].push(req.body);
       data["user" + req.params.id] = user;
       res.redirect('/appointment/'+req.params.id);
       fs.writeFile(__dirname + '/user.json', JSON.stringify(data) , function(err) {
        if(err) {
          return console.log(err);
        }
        console.log("The file was saved!");
       }); 
   });
})

// update appointment(both for doction and patient)
app.post('/appointment/:id/:index', function (req, res) {
   fs.readFile( __dirname + '/user.json', 'utf8', function (err, data) {
      data = JSON.parse( data );
      var user = data["user" + req.params.id] 
      user["appointment"][req.params.index] = req.body
      data["user" + req.params.id] = user

      res.redirect('/appointment/'+req.params.id);

      fs.writeFile(__dirname + '/user.json', JSON.stringify(data) , function(err) {
        if(err) {
          return console.log(err);
        }
        console.log("The file was saved!");
       }); 
   });

})



//get patient's information and appointment history 
app.get('/patient', (req, res) => {
　　if(req.session.user && req.session.user.type == 1){
      var Folder = __dirname + "/files/"+ req.session.user.id;
      var filesname = [];
      fs.readdir(Folder, (err, files) => {
        files.forEach(file => {
         filesname.push(file);
        });
      })   

      fs.readFile( __dirname + '/user.json', 'utf8', function (err, data) {
          var users = JSON.parse( data );
          var user = users[req.session.user.id];
          res.render('patient', { data: user, files:filesname });
       });　
      　
    }else{
　　　　req.session.error = "Please login first"
　　　　res.redirect('/');
　　}

})

// update Patient information
app.post('/updateinfo', function (req, res) {
   // First read existing users.
   fs.readFile( __dirname + '/user.json', 'utf8', function (err, data) {
       data = JSON.parse( data ); 
       var appointment = data[req.session.user.id]["appointment"];
       data[req.session.user.id] = req.body;
       data[req.session.user.id]["appointment"] = appointment;
       fs.writeFile(__dirname + '/user.json', JSON.stringify(data) , function(err) {
       	if(err) {
       		return console.log(err);
       	}
       	console.log("The file was saved!");
       }); 
　　　　res.redirect('/patient');

   });
})


//Patients’ new appointment
app.post('/appointment', function (req, res) {
   // First read existing users.
   fs.readFile( __dirname + '/user.json', 'utf8', function (err, data) {
       data = JSON.parse( data );
       var user = data[req.session.user.id];
       user["appointment"].push(req.body);
       data[req.session.user.id] = user;
       fs.writeFile(__dirname + '/user.json', JSON.stringify(data) , function(err) {
       	if(err) {
       		return console.log(err);
       	}
       	console.log("The file was saved!");
       }); 
   });
   　res.redirect('/patient');

})


//Files
app.post('/attachfile', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.filetoupload.path;
      var newpath = __dirname + "/files/"+ req.session.user.id+ "/";
      if (!fs.existsSync(newpath)){
         fs.mkdirSync(newpath);
      }
      var newpath = newpath+files.filetoupload.name;

      fs.copyFile(oldpath, newpath, function (err) {
        if (err) throw err;
   　　　res.redirect('/patient');
      });
 });
})

//doctor upload Files for patient
app.post('/attachfile/:id', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.filetoupload.path;
      var newpath = __dirname + "/files/user"+ req.params.id+ "/";
      if (!fs.existsSync(newpath)){
         fs.mkdirSync(newpath);
      }
      var newpath = newpath+files.filetoupload.name;
      fs.copyFile(oldpath, newpath, function (err) {
        if (err) throw err;
   　　　res.redirect('/appointment/'+req.params.id);
      });
 });
})
//delete attached Files 
app.get('/attachfile/:id/:filename', function (req, res) {
  var filepath = __dirname + "/files/user"+ req.params.id+"/"+req.params.filename;
  fs.unlink(filepath, function (err) {
    if (err) throw err;
　　　res.redirect('/appointment/'+req.params.id);
  });
})



