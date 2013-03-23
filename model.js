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
  
  changePriority: function (areaId, newPriority) {
    
    newPriority = Math.max(0.0, Math.min(1.0, newPriority));

    Areas.update(
      {
        _id: areaId, 
        "priority": newPriority
      },
      {
        $set: {"rsvps.$.rsvp": rsvp}
      });
  },

  remove: function (userId, area) {
    // You can only remove areas that you created and nobody is going to.
    return area.owner === userId && attending(area) === 0;
  }
});

var attending = function (area) {
  return (_.groupBy(area.rsvps, 'rsvp').yes || []).length;
};

Meteor.methods({
  // options should include: description, link, name, team
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

    return Areas.insert({
      owner: this.userId,
      team: options.team,
      priority: options.priority,
      link: options.link,
      name: options.name,
      description: options.description,
      focusers: []
    });
  },

  rsvp: function (areaId, rsvp) {
    if (! this.userId)
      throw new Meteor.Error(403, "You must be logged in to RSVP");
    if (! _.contains(['yes', 'no', 'maybe'], rsvp))
      throw new Meteor.Error(400, "Invalid RSVP");
    var area = Areas.findOne(areaId);
    if (! area)
      throw new Meteor.Error(404, "No such area");
    if (! area.public && area.owner !== this.userId &&
        !_.contains(area.invited, this.userId))
      // private, but let's not tell this to the user
      throw new Meteor.Error(403, "No such area");

    var rsvpIndex = _.indexOf(_.pluck(area.rsvps, 'user'), this.userId);
    if (rsvpIndex !== -1) {
      // update existing rsvp entry

      if (Meteor.isServer) {
        // update the appropriate rsvp entry with $
        Areas.update(
          {_id: areaId, "rsvps.user": this.userId},
          {$set: {"rsvps.$.rsvp": rsvp}});
      } else {
        // minimongo doesn't yet support $ in modifier. as a temporary
        // workaround, make a modifier that uses an index. this is
        // safe on the client since there's only one thread.
        var modifier = {$set: {}};
        modifier.$set["rsvps." + rsvpIndex + ".rsvp"] = rsvp;
        Areas.update(areaId, modifier);
      }

      // Possible improvement: send email to the other people that are
      // coming to the area.
    } else {
      // add new rsvp entry
      Areas.update(areaId,
                     {$push: {rsvps: {user: this.userId, rsvp: rsvp}}});
    }
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
