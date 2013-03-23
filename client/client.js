// All Tomorrow's Areas -- client

Meteor.subscribe("directory");
Meteor.subscribe("areas");

// If no area selected, select one.
Meteor.startup(function () 
{  
  Deps.autorun(function () 
  {
    if (! Session.get("selected")) 
    {
      var area = Areas.findOne();
    
      if (area)
        Session.set("selected", area._id);
    }
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
  // return this.owner === Meteor.userId() && attending(this) === 0;
  return true;
};

Template.details.hasLink = function () {
  return (this.link && this.link.length);
};

Template.details.link = function () {
  return this.link || '';
};

Template.details.loggedIn = function () {
  return (Meteor.userId() != null);
};

Template.details.priorityPct = function () {
  return parseInt(this.priority * 100);
};

Template.details.rendered = function () {
  $('#slider-create').slider();

  $('#slider-details').slider()
    .on('slide', function(ev) 
    {
      console.log("setting", Session.get("selected"), "priority", ev.value);

      Meteor.call('changePriority', 
        Session.get("selected"),
        parseFloat((ev.value || 0.5) / 100));

  });
};

Template.details.events({
  'click .remove': function () {
    Areas.remove(this._id);
    return false;
  },

  'click .view': function () {
    if (this.link)
    {
      window.open(this.link, "_blank")
      return false;      
    }
  }

});

///////////////////////////////////////////////////////////////////////////////
// Area attendance widget

Template.attendance.focuserName = function () {
  var user = Meteor.users.findOne(this.user);
  return displayName(user);
};

Template.attendance.nobody = function () {
  return ((this.focusers || []).length === 0);
};

Template.details.anyFocusers = function () {
  return Areas.find().count() > 0;
};

///////////////////////////////////////////////////////////////////////////////
// focus area zone display

// Use jquery to get the position clicked relative to the focus area zone element.
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
    if (! Meteor.userId())
    {
      // must be logged in to create events
      console.log("Not logged in");
      return;
    }
    var coords = coordsRelativeToElement(event.currentTarget, event);
    console.log("Coords", coords);
    openCreateDialog(coords.x / 500, coords.y / 500);
  }
});

Template.teamAreaZone.rendered = function ()
{
  var self = this;
  self.node = self.find("svg");

  if (! self.handle) 
  {
    self.handle = Deps.autorun(function () 
    {
      var selected = Session.get('selected');
      var selectedArea = selected && Areas.findOne(selected);

      var radius = function (area) 
      {
        return 30 + Math.sqrt(area.priority) * 50;
      };

      // Draw a circle for each area
      var updateCircles = function (group)
      {
        group.attr("id", function (area) {
          // console.log("update circles: ", area._id);
          return area._id; 
        })

        .attr("cx", function (area) { return area.x * 500; })
        .attr("cy", function (area) { return area.y * 500; })
        .attr("r", radius)
        .attr("class", "public")
        .style('opacity', 0.5);
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Areas.find().fetch(), function (area) { 
          return area._id; 
        });

      updateCircles(circles.enter().append("circle"));
      updateCircles(circles.transition().duration(250).ease("cubic-out"));
      circles.exit().transition().duration(250).attr("r", 0).remove();

      // Label each with the current attendance count
      var updateLabels = function (group) 
      {
        group.attr("id", function (area) { return area._id; })
        .text(function (area) { return area.name || ''; })
        .attr("x", function (area) { return area.x * 500 - radius(area)/3; })
        .attr("y", function (area) { return area.y * 500 + radius(area)/3.5 })
        .style('font-size', function (area) {
          return radius(area) * 1.25 + "px";
        });
      };

      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Areas.find().fetch(), function (area) { return area._id; });

      updateLabels(labels.enter().append("text"));
      updateLabels(labels.transition().duration(250).ease("cubic-out"));
      labels.exit().remove();


    });
  }
};

Template.teamAreaZone.destroyed = function ()
{
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

Template.teamAreaZone.areaCount = function () {
  return Areas.find().count();
};

function greekLetter(number)
{
  number = Math.max(0, Math.min(GREEK_LETTERS.length, number));
  return GREEK_LETTERS[number];
}

Template.createDialog.events(
{
  'click .save': function (event, template)
  {
    var link = template.find(".link").value;
    var description = template.find(".description").value;
    var name = greekLetter(Template.teamAreaZone.areaCount());
    // var priority = parseFloat($('#slider-create').attr("value") / 100);

    if (name.length && description.length)
    {
      Meteor.call('createArea', 
      {
        name: name,
        description: description,
        link: link,
        team: 1,
        priority: 0.5
      }, 
      function (error, area)
      {
        if (! error) {
          console.log("inserted area:", area);
          Session.set("selected", area);
        }
        else
        {
          console.log("insert error:", error);
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
