'use strict';

require('dotenv').config();
var expect = require('chai').expect;
var { MongoClient } = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

var theTime = function(){
  return new Date();
}

class Issue {
  constructor(data){
    this.issue_title = data.issue_title;
    this.issue_text = data.issue_text;
    this.created_by = data.created_by;
    this.assigned_to = data.assigned_to || '';
    this.status_text = data.status_text || '';
    this.created_on = new Date();
    this.updated_on = this.created_on;
    this.open = true;
  }
}

async function connection (callback){
  var URI = process.env.MONGO_URI;
  var client = new MongoClient(URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try{
    await client.connect();
    await callback(client)
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      let data = req.query,
          dataKeys = Object.keys(data);
          dataKeys.shift();
      let searchObj = {};
          dataKeys.forEach(key => {
            searchObj[key] = data[key];
          });

      connection(async function(client){
        let cursor = await client.db(project).collection('issues').find(searchObj)
        .sort({created_on: -1});

        let results = await cursor.toArray();

        res.send(results);
        console.log(results.length + " match(es) was/were found."); 
      
      });
      
    })
    
    .post(function (req, res){
      var project = req.params.project;
      let data = req.body;

      if(!data.issue_title || !data.issue_text || !data.created_by){
        res.json({"error": "missing required field."});
        console.log('A POST request was submitted without a required field at ' + theTime());
      } else {
        
        let newIssue = new Issue(req.body);

        connection(async function(client){
          let result = await client.db(project).collection('issues').insertOne(newIssue);
          newIssue._id=result.insertedId;
          res.json(newIssue);
          console.log("A new issue was posted at " + newIssue.created_on);
        }); 
      }
    })
    
    .put(function (req, res){
      var project = req.params.project;
      let data = req.body;
      let searchId = req.body._id;
      let updateObj = {};

      if (!searchId) {
        console.error("No ID sent with PUT request.");
        res.end();
        return new Error("No ID sent with PUT request.");
      }

      //check if all fields were empty (except ID)
      if(Object.values(data).filter(value => value!=='').length === 1){
        res.json({
          "error": "no updated field sent"
        });
        console.log('An update request was sent without any field to update.')
      } else {

        //create an update object using only the filled in fields
        Object.keys(data).forEach(key => {
          if (key === '_id') return null;
          else if (data[key]) updateObj[key] = data[key];
        })
        updateObj.updated_on = new Date();

        //connect and update the requested ID
        connection(async function(client){
          let result = await client.db(project).collection('issues').updateOne({_id: new ObjectId(searchId)}, { $set: updateObj })

          //make sure something actually changed
          if (result.modifiedCount === 0) {
            res.send({"status": "could not update "+ searchId});
            console.log("Could not update the selected ID");
          }
          else {
            res.send({"status": "successfully updated "+ searchId});
            console.log("Updated the selected ID");
          }
        });
      }
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      let searchId = req.body._id;

      if (!searchId) {
        console.error("No ID sent with DELETE request.");
        res.send({"error": "_id error"});
        return new Error("No ID sent with DELETE request.");
      }
      
      connection(async function(client){
        let result = await client.db(project).collection('issues').deleteOne({_id: new ObjectId(searchId)});

        if(result.deletedCount === 1){
          res.send({"status": "deleted " + searchId});
          console.log('DELETE operation successful.');
        } else {
          res.send({"status": "could not delete " + searchId});
          console.log('DELETE operation could not be performed.');
        }
      });
    });
    
};
