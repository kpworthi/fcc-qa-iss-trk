/*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
    suite('POST /api/issues/{project} => object with issue data', function() {
      
      test('Every field filled in', function(done) {
       chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'In QA'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          
          assert.equal(res.body.issue_title, 'Title');
          assert.equal(res.body.issue_text, 'text');
          assert.equal(res.body.created_by, 'Functional Test - Every field filled in');
          assert.equal(res.body.assigned_to, 'Chai and Mocha');
          assert.equal(res.body.status_text, 'In QA');
          assert.property(res.body, 'created_on');
          assert.equal(res.body.updated_on, res.body.created_on);
          assert.equal(res.body.open, true);
          assert.property(res.body, '_id');
          
          done();
        });
      });
      
      test('Required fields filled in', function(done) {
       chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Sample Title',
          issue_text: 'Sample text.',
          created_by: 'Functional Test - Requireds filled'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          
          assert.equal(res.body.issue_title, 'Sample Title');
          assert.equal(res.body.issue_text, 'Sample text.');
          assert.equal(res.body.created_by, 'Functional Test - Requireds filled');
          assert.equal(res.body.assigned_to, '');
          assert.equal(res.body.status_text, '');
          assert.property(res.body, 'created_on');
          assert.equal(res.body.updated_on, res.body.created_on);
          assert.equal(res.body.open, true);
          assert.property(res.body, '_id');
          
          done();
        });
      });
      
      test('Missing required fields', function(done) {
       chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Sample Title',
          issue_text: 'Sample text.'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          
          assert.deepEqual(res.body, {"error": "missing required field."});
          
          done();
        });
      });
      
    });
    
    suite('PUT /api/issues/{project} => text', function() {
      
      test('No body', function(done) {
        let testId= '5f7e1073e5e85303a316a1c6';
        chai.request(server)
          .put('/api/issues/test')
          .send({_id: testId})
          .end(function(err, res){
            assert.equal(res.status, 200);
            
            assert.equal(res.body.error, 'no updated field sent');
            
            done();
          });
      });
      
      test('One field to update', function(done) {
        let testId= '5f7e1073e5e85303a316a1c6';

        chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: testId,
          assigned_to: 'Timography'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.status, `successfully updated ${testId}`);
          done();
        });
      });
      
      test('Multiple fields to update', function(done) {
        let testId= '5f7e1073e5e85303a316a1c6';

        chai.request(server)
        .put('/api/issues/test')
        .send({
          _id: testId,
          assigned_to: 'Heckamole',
          status_text: 'Something updated!'
        })
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.equal(res.body.status, `successfully updated ${testId}`);
          done();
        });
      });
      
    });
    
    suite('GET /api/issues/{project} => Array of objects with issue data', function() {
      
      test('No filter', function(done) {
        chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end(function(err, res){
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          done();
        });
      });
      
      test('One filter', function(done) {
        chai.request(server)
          .get('/api/issues/test')
          .query({open: true})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(Object.keys(res.body[0]).length, 9);
            done();
          });
      });
      
      test('Multiple filters', function(done) {
        chai.request(server)
          .get('/api/issues/test')
          .query({open: true, issue_title: 'Sample Title'})
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.equal(Object.keys(res.body[0]).length, 9);
            done();
          });
      });
      
    });
    
    suite('DELETE /api/issues/{project} => text', function() {
      
      test('No _id', function(done) {
        chai.request(server)
          .delete('/api/issues/test')
          .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.body.error, '_id error');
            done();
          });
      });
      
      test('Valid _id', function(done) {
        let testId = '';

        //create a new issue and get ID
        chai.request(server)
          .post('/api/issues/test')
          .send({
            issue_title: 'Sample Title',
            issue_text: 'Sample text.',
            created_by: 'Functional Test - Requireds filled'
          })
          .end(function(err, res){
            testId = res.body._id;

            chai.request(server)
              .delete('/api/issues/test')
              .send({_id: testId})
              .end(function(err, res){
                assert.equal(res.status, 200);
                assert.equal(res.body.status, `deleted ${testId}`);
                done();
              });
          });

      });
      
    });

});
