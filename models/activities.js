// Prairie -- data model
// Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Activities

/*
  Each activity is represented by a document in the Activities collection:
    owner: user id
    priority: Number (interval [0, 1])
    title: String, auto-assigned Greek letter
    team: Number teamId
    description: String
    link: String
    focusers: Array of objects like {user:userId, focus:[0-1]}
*/
Activities = new Meteor.Collection("activities", {idGeneration:'MONGO'});

Activities.allow({
  insert: function (userId, activity) {
    console.log("----------Activities.allow: insert", activity);
    return false;
  },
  
  update: function (userId, activity, fields, modifier) {
    console.log("----------Activities.allow: update", activity);
    return false;
  },
  
  remove: function (userId, activity) {
    return false;
  }
});


Meteor.methods({
  // options should include: description, title, team

  saveActivity: function(options) 
  {
    options = options || {};
    if (! (typeof options.title === "string" && options.title.length))// &&
           // typeof options.description === "string" && options.description.length))
           // typeof options.team === "number" && options.team >= 0))
      throw new Meteor.Error(400, "Required parameter missing");

    if (options.description.length > 1000)
      throw new Meteor.Error(413, "Description is too long");

    // if (! this.userId)
    //   throw new Meteor.Error(403, "You must be logged in");

    var activityData = {
      type: "activity",
      owner: this.userId,
      team: options.team || 1,
      priority: options.priority || 50,
      title: options.title || '?',
      description: options.description
    };

    if (options.scratch) {
      // console.log("!!!saveActivity:insert", options._id);
      if (options._id) {
          activityData._id = options._id;
      }

      Activities.insert(activityData);
    }
    else {
      // console.log("!!!saveActivity:update");
      Activities.update(options._id, {$set: activityData});
    }
  },

  removeActivity: function(activityId) {

    var a = [];
    var eid = "activity-" + activityId;

    NodeLinks.remove({$or: [{"target.id":eid}, {"source.id":eid}]});

    Activities.remove(activityId); 
  },

  removeAllActivities: function() {

    // TODO: disable this in prod!

    Activities.find().forEach(function(i) { 
      // console.log("remove", i);
      Meteor.call("removeActivity", i._id);
      // Activities.remove(i._id); 
    });
  },

  changePriority: function (activityId, newPriority)
  {  
    newPriority = Math.max(0.0, Math.min(1.0, newPriority));

    Activities.update(
      {
        _id: activityId
      },
      {
        $set: {"priority": newPriority}
      });
  },

  joinActivity: function (activityId)
  {
    var activity = Activities.findOne(activityId);

    if (! activity )
      throw new Meteor.Error(404, "No such activity");

    if (! this.userId )
      throw new Meteor.Error(404, "Please log in");

    console.log("Adding focuser", this.userId, "to activity ", activityId);
    Activities.update(activityId, { $addToSet: { focusers: this.userId } });
  }

});

///////////////////////////////////////////////////////////////////////////////
// Users

var displayName = function (user) {
  if (user.profile && user.profile.name)
    return user.profile.name;
  return user.emails[0].address;
};

var contactEmail = function (user) {
  if (user.emails && user.emails.length)
    return user.emails[0].address;
  if (user.services && user.services.facebook && user.services.facebook.email)
    return user.services.facebook.email;
  return null;
};
