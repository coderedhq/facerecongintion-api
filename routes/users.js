var express = require('express');
var router = express.Router();

var path = require('path');
var formidable = require('formidable');
var mkdirp = require('mkdirp');
var shell = require('../utils/shellHelper');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/add-user', function(req, res, next) {
  var form = new formidable.IncomingForm();

  form.multiples = true;

  form.on('field', function(name, value) {
    if (name == "uid") {
      form.uploadDir = path.join(__dirname, '/data/users/' + value);
      mkdirp(form.uploadDir, function(err) {
        if (err) console.error(err)
        else console.log('pow!')
      });
    }
  })

  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  form.on('end', function() {
    res.end('success');
  });

  form.parse(req);

})

router.post('/train-model', function(req, res, next) {
  shell.series([
    'for N in {1..8}; do ../../util/align-dlib.py ./data/users/ align outerEyesAndNose ./data/algined-data/ --size 96 & done'
    '../../batch-represent/main.lua -outDir ./data/feature/ -data ./data/aligned-data/',
    '../../demos/classifier.py train ./data/features/'
  ], function(err){
    if (err) {
      res.end('error');
    }
    res.end('success');
  });
});

router.post('/identify', function(req, res, next) {
  var form = new formidable.IncomingForm();

  form.on('file', function(field, file) {
    shell.exec('../../demos/classifier.py infer ./models/user.pkl ' + file.path + ' > ' + file.path + '.pred', function(err) {
      if(err) {
        res.end('error')
      } else {
        fs.readFile(file.path + '.pred', "utf8", function(err, data){
          if(err) throw err;
          res.send(data);
        });
        res.end('success')
      }
    })
  });

  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  form.parse(req);
})

module.exports = router;
