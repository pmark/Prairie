// All Tomorrow's Areas -- data model
// Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Areas

/*
  Each area is represented by a document in the Areas collection:
    owner: user id
    priority: Number (interval [0, 1])
    name: String, auto-assigned Greek letter
    team: Number teamId
    description: String
    link: String
    focusers: Array of objects like {user:userId, focus:[0-1]}
*/
Areas = new Meteor.Collection("areas");

Areas.allow({
  insert: function (userId, area) {
    console.log("----------Areas.allow: insert");
    return false; // no cowboy inserts -- use createArea method
  },
  
  update: function (userId, area, fields, modifier) {

    // var allowed = ["name", "description", "link", "priority"];
    // if (_.difference(fields, allowed).length)
    //   return false; // tried to write to forbidden field

    // A good improvement would be to validate the type of the new
    // value of the field (and if a string, the length.) In the
    // future Meteor will have a schema system to makes that easier.
    return true;
  },
  
  remove: function (userId, area) {
    // You can only remove areas that you created and nobody is going to.
    return true;
  }
});

var attending = function (area) {
  return (area.focusers || []).length;
  // return (_.groupBy(area.focusers, 'rsvp').yes || []).length;
};

Meteor.methods({
  // options should include: description, name, team

  createArea: function (options) 
  {
    options = options || {};
    if (! (typeof options.name === "string" && options.name.length &&
           typeof options.description === "string" &&
           options.description.length &&
           typeof options.team === "number" && options.team >= 0))
      throw new Meteor.Error(400, "Required parameter missing");
    if (options.description.length > 100)
      throw new Meteor.Error(413, "Description is too long");
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in");

    var areaData = {
      x: Math.random(),
      y: Math.random(),
      owner: this.userId,
      team: options.team,
      priority: options.priority,
      link: options.link,
      name: options.name,
      description: options.description,
      focusers: []
    };

    var b = Areas.insert(areaData);
    return b;
  },

  changePriority: function (areaId, newPriority)
  {  
    newPriority = Math.max(0.0, Math.min(1.0, newPriority));

    Areas.update(
      {
        _id: areaId
      },
      {
        $set: {"priority": newPriority}
      });
  },

  joinArea: function (areaId)
  {
    var area = Areas.findOne(areaId);

    if (! area )
      throw new Meteor.Error(404, "No such area");

    if (! this.userId )
      throw new Meteor.Error(404, "Please log in");

    console.log("Adding focuser", this.userId, "to area ", areaId);
    Areas.update(areaId, { $addToSet: { focusers: this.userId } });
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
