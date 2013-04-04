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
        }
    });

    // Set up D3 force layout.
    var $chart = $("#chart");

    var w = $chart.width(),
        h = $chart.height(),
        color = d3.scale.category10();

    var force = d3.layout.force()
        .gravity(0.2)  // default 0.1
        .charge(-2000)  // default -30
        .linkStrength(0.25) // default 1
        // .gravity(.25)  // .25
        // .charge(-2500)  // -2500
        // .linkStrength(0.25)
        .size([w, h]);

    var NODE_TYPE_CHART_CENTER = 0,
        NODE_TYPE_TARGET_CENTER = 1;

    var svg = d3.select("#chart").append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    var nodes = force.nodes(),
        links = force.links(),
        node = svg.selectAll(".node"),
        link = svg.selectAll(".link");

    var targetLabel = svg.select(".target-label text");

    var targetCursor = null; //Areas.find({});
    // var targetCount = targetCursor.count();
    var targetItems = [
        {name:greekLetter(0), priority:20},
        {name:greekLetter(1), priority:50},
        {name:greekLetter(2), priority:80}
    ];

    var targetCount = targetItems.length;
    var targetIndex = 0;
    var padding = 10;
    // var targetWidth = (w / (targetCount + (padding * 2)));
    // console.log(targetCount, " targets");

    if (targetCursor) {
        /*
        nodes.concat(targetCursor.map(function(d) {
            var nd = {
                type: NODE_TYPE_TARGET_CENTER, 
                x: w/2 - (targetCount * targetWidth/2) + (targetWidth * targetIndex++), 
                y: h/3, 
                fixed: false
            };

            // console.log(nd);
            return nd;
        }));    
        */
    }
    else {
        for (var i in targetItems) {

            var targetData = targetItems[i];
            var targetWidth = radius(targetData) + padding;

            var angle = (Math.PI * 2 / targetCount) * i;
            var distance = radius({priority:100}) * 2;  // use max radius

            var nd = {
                type: "target", 
                // x: w/2 - (targetCount * targetWidth/2) + (targetWidth * targetIndex++), 
                // y: h / 3, 
                x: w/2 + Math.cos(angle) * distance, 
                y: h/2 + Math.sin(angle) * distance, 
                fixed: false,
                id: "target-" + i,
                name: targetData.name,
                priority: targetData.priority,
                attractor: {x:w/2, y:h/2}
            };

            // console.log(nd);
            nodes.push(nd);
        }  

        // links.push({source:0, target:1});
        // links.push({source:1, target:2});
        // links.push({source:2, target:0});
    }

    function radius(target) {
        if (target.type === "person") {
            return 20;
        }
        else {
            return 20 + Math.sqrt(target.priority||50) * 5;
        }
    }

    force.on("tick", function(e) {

        var k = e.alpha * .1;

        nodes.forEach(function(d) {
            d.x += (d.attractor.x - d.x) * k;
            d.y += (d.attractor.y - d.y) * k;
        });

        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        // node
        //     .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });

    function linkId(d) {
        var a = d.source.id;
        var b = d.target.id;

        var lower = (a < b) ? a : b;
        var upper = (a > b) ? a : b;

        return "link-" + lower + "-" + upper;
    }

    function restart() {
        link = link.data(links);

        link
            .enter()
            .append("line")
            .attr("id", linkId)
            .attr("class", "link")
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        link
            .exit()
            .remove();

        node = node.data(nodes);

            // .append("g")
            // .attr("class", "node")
            // .call(force.drag);

        node.enter()
            .insert("svg:circle")
            .attr("r", radius)
            .style("fill", fill)
            .attr("class", function(d) { return d.type; })
            .attr("id", function (d) { return d.id; }) // use meteor's d._id maybe
            .on("click", itemWasClicked)
            .call(force.drag);

        // node
        //     .append("image")
        //     .attr("xlink:href", "https://github.com/favicon.ico")
        //     .attr("x", -8)
        //     .attr("y", -8)
        //     .attr("width", 16)
        //     .attr("height", 16);

        // node
        //     .append("text")
        //     .attr("dy", ".35em")
        //     .attr("text-anchor", "middle")
        //     .text(function(d) { return d.name; });

        force.start();
    }


    //   // Label each with the current attendance count
    //   var updateLabels = function (group) 
    //   {
    //     group.attr("id", function (area) { return area._id; })
    //     .text(function (area) { return area.name || ''; })
    //     .attr("x", function (area) { return area.x * 500 - radius(area)/3; })
    //     .attr("y", function (area) { return area.y * 500 + radius(area)/3.5 })
    //     .style('font-size', function (area) {
    //       return radius(area) * 1.25 + "px";
    //   });
    // };

    force.start();

    var p0;

    if (false) {
        svg.on("mousemove", function() {
            var p1 = d3.svg.mouse(this);


            var target = nodes[Math.random() * 3 | 0];

            var node = {
                priority: target.priority, x: p1[0], y: p1[1], px: (p0 || (p0 = p1))[0], py: p0[1],
                attractor: (target ? target.attractor : {x:w/3, y:h/3})
            };

            p0 = p1;

            svg.append("svg:circle")
            .data([node])
            // .attr("cx", function(d) { return d.x; })
            // .attr("cy", function(d) { return d.y; })
            .attr("r", function(d){return 5;})
            .style("fill", fill)
            .transition()
            .delay(5500)
            .attr("r", 1e-6)
            .each("end", function() { nodes.splice(3, 1); })
            .remove();

            nodes.push(node);
            force.start();
        });
    }

    function addPeople() {

        var totalPersonCount = 6;
        var personPadding = (h / totalPersonCount);

        for (var i=0; i < totalPersonCount; i++) {
            var newNode = {
                id: "person-" + i,
                type: "person",
                name:"Joe",
                // x: w,
                // y: (i * personPadding) + personPadding/2, 
                attractor:{
                    x:w/2, 
                    y:h/2 
                }
            };

            nodes.push(newNode);            
        }
    };

    var selectedItem = null;

    function findNodeById(nodeId) {
        for (var i=0; i < nodes.length; i++) {
            var n = nodes[i];

            if (n.id === nodeId) {
                return n;
            }
        }

        return null;
    }

    function indexOfLink(link) {
        var index = -1;

        links.forEach(function(l, i) {
            if ((link.source.id == l.source.id && link.target.id == l.target.id) ||
                (link.target.id == l.source.id && link.source.id == l.target.id)) {
                index = i;
                return;
            }
        })

        return index;
    }

    function itemWasClicked(d) {

        var d3Element = d3.select(this);
        var alreadySelected = (d3Element.attr("data-selected") === "1");

        // console.log(d);
        var newSelectedItem = d;

        // Deselect all items
        $("circle").attr("data-selected", "0");

        if (alreadySelected) {
            // The selected item was deselected.
            // Nothing is selected now.
            selectedItem = null;
        }
        else {
            var oldSelectedItem = selectedItem;

            if (oldSelectedItem) {

                if (oldSelectedItem.type !== newSelectedItem.type) {
                    // Connect this item to other if it's a different type

                    var newLink = {
                        source:newSelectedItem,
                        target:oldSelectedItem
                    };

                    if ((li = indexOfLink(newLink)) == -1) {
                        // Add a new link
                        links.push(newLink);
                    }
                    else {
                        // Remove the link
                        links.splice(li, 1);
                        // d3.select("#" + linkId(newLink)).remove();
                        // $("#" + linkId(newLink)).remove();
                    }

                    selectedItem = null;
                    restart();                    
                }
                else {
                    // Change selection 
                    selectedItem = newSelectedItem;
                    d3Element.attr("data-selected", "1");
                }
            }
            else {
                selectedItem = newSelectedItem;
                d3Element.attr("data-selected", "1");
            }
        }
    }
    
    function addControlEventHandlers() {

        svg.on("dblclick", function() {

            var p1 = d3.svg.mouse(this);

            var target = {
                name:greekLetter(nodes.length), 
                priority:50,
                attractor:{x:w/2, y:h/2}
            };

            var newNode = {
                type: "target",
                priority: target.priority, 
                x: p1[0], 
                y: p1[1], 
                // px: (p0 || (p0 = p1))[0], 
                // py: p0[1],
                attractor: target.attractor
            };

            nodes.push(newNode);
            restart();
        });
    };

    function fill(d) {
        return color(d.priority);
    }

    addPeople();
    restart();
    addControlEventHandlers();

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
    var area = Session.get("selected");

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

      /*
      var defaultGravity = 0.08;

      var width = 500,
        height = 500;

      var force = d3.layout.force()
        .gravity(defaultGravity)
        .distance(0)
        .charge(-46)
        .size([width, height])
        .start();

      var imgSize = 44;


      // Draw a circle for each area
      var updateCircles = function (group)
      {
        group.attr("id", function (area) {
          // console.log("update circles: ", area._id);
          return area._id; 
        })

        .attr("transform", function(d) 
        { 
          return "translate(" + d.x + "," + d.y + ")"; 
        })

        // .attr("cx", function (area) { return area.x * 500; })
        // .attr("cy", function (area) { return area.y * 500; })
        .attr("r", radius)
        .attr("class", "public")
        .style('opacity', 0.5);
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Areas.find().fetch(), function (area) { 
          return area._id; 
        });

      updateCircles(circles.enter().append("circle")        
        .attr("class", "node")
        .call(force.drag));

      updateCircles(circles.transition().duration(250).ease("cubic-out"));
      circles.exit().transition().duration(250).attr("r", 0).remove();

      force.on("tick", function() 
      {
            circles.attr("transform", function(d) 
            { 
              return "translate(" + d.x*500 + "," + d.y*500 + ")"; 
            });
      });




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
      */
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
