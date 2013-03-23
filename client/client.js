// All Tomorrow's Areas -- client

Meteor.subscribe("directory");
Meteor.subscribe("areas");

// If no area selected, select one.
Meteor.startup(function () {
  Deps.autorun(function () {
    // if (! Session.get("selected")) {
    //   var area = Areas.findOne();
    //   if (area)
    //     Session.set("selected", area._id);
    // }

  });
});

///////////////////////////////////////////////////////////////////////////////
// Area details sidebar

Template.details.area = function () {
  return Areas.findOne(Session.get("selected"));
};

Template.details.anyAreas = function () {
  return Areas.find().count() > 0;
};

Template.details.creatorName = function () {
  var owner = Meteor.users.findOne(this.owner);
  if (owner._id === Meteor.userId())
    return "me";
  return displayName(owner);
};

Template.details.canRemove = function () {
  return this.owner === Meteor.userId() && attending(this) === 0;
};

Template.details.maybeChosen = function (what) {
  var myRsvp = _.find(this.rsvps, function (r) {
    return r.user === Meteor.userId();
  }) || {};

  return what == myRsvp.rsvp ? "chosen btn-inverse" : "";
};

Template.details.events({
  'click .rsvp_yes': function () {
    Meteor.call("rsvp", Session.get("selected"), "yes");
    return false;
  },
  'click .rsvp_maybe': function () {
    Meteor.call("rsvp", Session.get("selected"), "maybe");
    return false;
  },
  'click .rsvp_no': function () {
    Meteor.call("rsvp", Session.get("selected"), "no");
    return false;
  },
  'click .invite': function () {
    openInviteDialog();
    return false;
  },
  'click .remove': function () {
    Areas.remove(this._id);
    return false;
  }
});

///////////////////////////////////////////////////////////////////////////////
// Area attendance widget

Template.attendance.rsvpName = function () {
  var user = Meteor.users.findOne(this.user);
  return displayName(user);
};

Template.attendance.outstandingInvitations = function () {
  var area = Areas.findOne(this._id);
  return Meteor.users.find({$and: [
    {_id: {$in: area.invited}}, // they're invited
    {_id: {$nin: _.pluck(area.rsvps, 'user')}} // but haven't RSVP'd
  ]});
};

Template.attendance.invitationName = function () {
  return displayName(this);
};

Template.attendance.rsvpIs = function (what) {
  return this.rsvp === what;
};

Template.attendance.nobody = function () {
  return ! this.public && (this.rsvps.length + this.invited.length === 0);
};

Template.attendance.canInvite = function () {
  return ! this.public && this.owner === Meteor.userId();
};

///////////////////////////////////////////////////////////////////////////////
// Map display

// Use jquery to get the position clicked relative to the map element.
var coordsRelativeToElement = function (element, event) {
  var offset = $(element).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  return { x: x, y: y };
};

Template.teamAreaZone.events({
  'mousedown circle, mousedown text': function (event, template) {
    Session.set("selected", event.currentTarget.id);
  },
  'dblclick .team-area-zone': function (event, template) {
    if (! Meteor.userId()) // must be logged in to create events
      return;
    var coords = coordsRelativeToElement(event.currentTarget, event);
    openCreateDialog(coords.x / 500, coords.y / 500);
  }
});

Template.teamAreaZone.rendered = function () {
  var self = this;
  self.node = self.find("svg");

  if (! self.handle) {
    self.handle = Deps.autorun(function () {
      var selected = Session.get('selected');
      var selectedArea = selected && Areas.findOne(selected);
      var radius = function (area) {
        return 10 + Math.sqrt(attending(area)) * 10;
      };

      // Draw a circle for each area
      var updateCircles = function (group) {
        group.attr("id", function (area) { return area._id; })
        .attr("cx", function (area) { return area.x * 500; })
        .attr("cy", function (area) { return area.y * 500; })
        .attr("r", radius)
        .attr("class", function (area) {
          return area.public ? "public" : "private";
        })
        .style('opacity', function (area) {
          return selected === area._id ? 1 : 0.6;
        });
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Areas.find().fetch(), function (area) { return area._id; });

      updateCircles(circles.enter().append("circle"));
      updateCircles(circles.transition().duration(250).ease("cubic-out"));
      circles.exit().transition().duration(250).attr("r", 0).remove();

      // Label each with the current attendance count
      var updateLabels = function (group) {
        group.attr("id", function (area) { return area._id; })
        .text(function (area) {return attending(area) || '';})
        .attr("x", function (area) { return area.x * 500; })
        .attr("y", function (area) { return area.y * 500 + radius(area)/2 })
        .style('font-size', function (area) {
          return radius(area) * 1.25 + "px";
        });
      };

      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Areas.find().fetch(), function (area) { return area._id; });

      updateLabels(labels.enter().append("text"));
      updateLabels(labels.transition().duration(250).ease("cubic-out"));
      labels.exit().remove();

      // Draw a dashed circle around the currently selected area, if any
      var callout = d3.select(self.node).select("circle.callout")
        .transition().duration(250).ease("cubic-out");
      if (selectedArea)
        callout.attr("cx", selectedArea.x * 500)
        .attr("cy", selectedArea.y * 500)
        .attr("r", radius(selectedArea) + 10)
        .attr("class", "callout")
        .attr("display", '');
      else
        callout.attr("display", 'none');
    });
  }
};

Template.teamAreaZone.destroyed = function () {
  this.handle && this.handle.stop();
};



///////////////////////////////////////////////////////////////////////////////
// Map display

// Use jquery to get the position clicked relative to the map element.
var coordsRelativeToElement = function (element, event) {
  var offset = $(element).offset();
  var x = event.pageX - offset.left;
  var y = event.pageY - offset.top;
  return { x: x, y: y };
};

Template.map.events({
  'mousedown circle, mousedown text': function (event, template) {
    Session.set("selected", event.currentTarget.id);
  },
  'dblclick .map': function (event, template) {
    if (! Meteor.userId()) // must be logged in to create events
      return;
    var coords = coordsRelativeToElement(event.currentTarget, event);
    openCreateDialog(coords.x / 500, coords.y / 500);
  }
});

Template.map.rendered = function () {
  var self = this;
  self.node = self.find("svg");

  if (! self.handle) {
    self.handle = Deps.autorun(function () {
      var selected = Session.get('selected');
      var selectedArea = selected && Areas.findOne(selected);
      var radius = function (area) {
        return 10 + Math.sqrt(attending(area)) * 10;
      };

      // Draw a circle for each area
      var updateCircles = function (group) {
        group.attr("id", function (area) { return area._id; })
        .attr("cx", function (area) { return area.x * 500; })
        .attr("cy", function (area) { return area.y * 500; })
        .attr("r", radius)
        .attr("class", function (area) {
          return area.public ? "public" : "private";
        })
        .style('opacity', function (area) {
          return selected === area._id ? 1 : 0.6;
        });
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Areas.find().fetch(), function (area) { return area._id; });

      updateCircles(circles.enter().append("circle"));
      updateCircles(circles.transition().duration(250).ease("cubic-out"));
      circles.exit().transition().duration(250).attr("r", 0).remove();

      // Label each with the current attendance count
      var updateLabels = function (group) {
        group.attr("id", function (area) { return area._id; })
        .text(function (area) {return attending(area) || '';})
        .attr("x", function (area) { return area.x * 500; })
        .attr("y", function (area) { return area.y * 500 + radius(area)/2 })
        .style('font-size', function (area) {
          return radius(area) * 1.25 + "px";
        });
      };

      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Areas.find().fetch(), function (area) { return area._id; });

      updateLabels(labels.enter().append("text"));
      updateLabels(labels.transition().duration(250).ease("cubic-out"));
      labels.exit().remove();

      // Draw a dashed circle around the currently selected area, if any
      var callout = d3.select(self.node).select("circle.callout")
        .transition().duration(250).ease("cubic-out");
      if (selectedArea)
        callout.attr("cx", selectedArea.x * 500)
        .attr("cy", selectedArea.y * 500)
        .attr("r", radius(selectedArea) + 10)
        .attr("class", "callout")
        .attr("display", '');
      else
        callout.attr("display", 'none');
    });
  }
};

Template.map.destroyed = function () {
  this.handle && this.handle.stop();
};

///////////////////////////////////////////////////////////////////////////////
// Create Area dialog

var openCreateDialog = function (x, y) {
  Session.set("createCoords", {x: x, y: y});
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
};

Template.page.showCreateDialog = function () {
  return Session.get("showCreateDialog");
};

var GREEK_LETTERS = ["α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ","ν","ξ","ο","π","ρ","ς","σ","τ","υ","φ","χ","ψ","ω"];
function greekLetter(number)
{
  number = Math.min(0, Math.max(GREEK_LETTERS.length, number));
  return GREEK_LETTERS[number];
}

Template.createDialog.events(
{
  'click .save': function (event, template)
  {
    var link = template.find(".link").value;
    var description = template.find(".description").value;
    var name = greekLetter(0);

    if (name.length && description.length)
    {
      Meteor.call('createArea', 
      {
        name: name,
        description: description,
        link: link,
        team: 1,
        priority: 1.0
      }, 
      function (error, area)
      {
        if (! error) {
          Session.set("selected", area);
          if (! public && Meteor.users.find().count() > 1)
            openInviteDialog();
        }
      });

      Session.set("showCreateDialog", false);
    } 
    else
    {
      Session.set("createError",
                  "Do elaborate a bit, please.");
    }
  },

  'click .cancel': function ()
  {
    Session.set("showCreateDialog", false);
  }

});

Template.createDialog.error = function () 
{
  return Session.get("createError");
};

///////////////////////////////////////////////////////////////////////////////
// Invite dialog

var openInviteDialog = function () {
  Session.set("showInviteDialog", true);
};

Template.page.showInviteDialog = function () {
  return Session.get("showInviteDialog");
};

Template.inviteDialog.events({
  'click .invite': function (event, template) {
    Meteor.call('invite', Session.get("selected"), this._id);
  },
  'click .done': function (event, template) {
    Session.set("showInviteDialog", false);
    return false;
  }
});

Template.inviteDialog.uninvited = function () {
  var area = Areas.findOne(Session.get("selected"));
  if (! area)
    return []; // area hasn't loaded yet
  return Meteor.users.find({$nor: [{_id: {$in: area.invited}},
                                   {_id: area.owner}]});
};

Template.inviteDialog.displayName = function () {
  return displayName(this);
};
