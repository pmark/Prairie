var $chart = null,
    w = null,
    h = null,
    svg = null,
    nodeSet = null,
    linkSet = null,
    node = null,
    link = null,
    color = null,
    force = null,
    tooltip = null,
    editBox = null,
    deleteButton = null,
    titleField = null,
    descriptionField = null,
    prioritySlider = null,
    selectedItem = null,
    clickCount = 0;


// All Tomorrow's Targets -- client

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

    $chart = $("#chart");
    w = $chart.width();
    h = $chart.height();

    useTheForce();
    addPeople();
    restart();
    addControlEventHandlers();

    $('#priority-slider').slider({
        orientation:"horizontal",
        tooltip:"hide",
        handle:"round",
        min:0,
        max:100,
        value:70,                            
    })
    .on("slide", function(evt) {
        $("#target-priority").text(evt.value);
        // console.log("setting priority", evt.value, d3.select("#"+selectedItem.id));

        var c = fill({priority:evt.value});
        d3.select("#"+selectedItem.id)
            .style("fill", c)
            .style("stroke", function(d) { return d3.rgb(c).darker(0.7); })

        selectedItem.priority = evt.value;

    });

});

function useTheForce() {
    // Set up D3 force layout.

    // color = d3.scale.category20();
    color = d3.scale.linear()
        .domain([0, 50, 100]).range(["gold", "orange", "red"]);

    var gravityScale = d3.scale.linear().domain([320,1280]).range([0.5, 0.01]);

    force = d3.layout.force()
        .gravity(gravityScale(w))  // default 0.1
        .charge(-2100)  // default -30
        .linkStrength(0.08) // default 1
        .size([w, h]);

    var NODE_TYPE_CHART_CENTER = 0,
        NODE_TYPE_TARGET_CENTER = 1;

    svg = d3.select("#chart").append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    nodeSet = force.nodes();
    linkSet = force.links();

    node = svg.selectAll(".node"),
    link = svg.selectAll(".link");

    tooltip = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    // editBox = d3.select("body").append("div")
    //     .attr("class", "edit-box")
    //     .style("opacity", 0);

    // titleField = editBox.append("input")
    //     .attr("type", "text")
    //     .attr("id", "title-field")
    //     .style("opacity", 0);

    // prioritySlider = editBox.append("div")
    //     .attr("id", "priority-slider")
    //     .style("opacity", 0);

    // deleteButton = d3.select("body").append("div")   
    //     .attr("class", "delete-button")
    //     .style("opacity", 0);

    // deleteButton.append("i").attr("class", "icon-remove");

    var targetLabel = svg.select(".target-label text");

    var targetItems = [
        {name:greekLetter(0), priority:20},
        {name:greekLetter(1), priority:50},
        {name:greekLetter(2), priority:100}
    ];

    var targetCount = targetItems.length;
    var targetIndex = 0;
    var padding = 10;
    // var targetWidth = (w / (targetCount + (padding * 2)));

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
            id: "target-" + i,
            name: targetData.name,
            priority: targetData.priority,
            attractor: {x:w/2, y:h/2}
        };

        nodeSet.push(nd);
    }

    force.on("tick", function(e) {

        var k = e.alpha * .1;
        var edgePadding = 6;

        nodeSet.forEach(function(d) {
            if (d.open) {
                d.x = w/2;
                d.y = h/2;
            }
            else {
                d.x = Math.min(w-edgePadding, Math.max(edgePadding, d.x + (d.attractor.x - d.x) * k));
                d.y = Math.min(h-edgePadding, Math.max(edgePadding, d.y + (d.attractor.y - d.y) * k));                
            }
        });

        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        // node
        //     .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        node
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });

    force.start();
}

function restart() {
    link = link.data(linkSet);

    link
        .enter()
        .insert("line", "circle")
        .attr("id", linkId)
        .attr("class", "link")
        .attr("stroke-dasharray", "1, 6")
        .attr("stroke-linecap", "round")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    link
        .exit()
        .remove();

    node = node.data(nodeSet);

        // .append("g")
        // .attr("class", "node")
        // .call(force.drag);

    node.enter()
        .append("svg:circle")
        .attr("r", radius)
        .style("fill", fill)
        .attr("class", function(d) { return d.type; })
        .attr("type", function (d) { return d.type; })
        .attr("id", function (d) { return d.id; }) // use meteor's d._id maybe
        .style("stroke", function(d) { return d3.rgb(fill(d)).darker(0.7); })
        .on("click", itemWasClicked)
        .on("mouseover", function(d) {      
            tooltip.text(d.name)
                .transition()        
                .duration(150)
                .style("opacity", .9);

            setTimeout(function() {
                tooltip.style("opacity", 0);
            }, 1000);
        })
        .on("mouseout", function(d) {       
            tooltip.style("opacity", 0);   
        })
        .call(force.drag);

    node.exit().remove();

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

function linkId(d) {
    var a = d.source.id;
    var b = d.target.id;

    var lower = (a < b) ? a : b;
    var upper = (a > b) ? a : b;

    return "link-" + lower + "-" + upper;
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

        nodeSet.push(newNode);            
    }

    restart();
};

function findNodeById(nodeId) {
    for (var i=0; i < nodeSet.length; i++) {
        var n = nodes[i];

        if (n.id === nodeId) {
            return n;
        }
    }

    return null;
}

function indexOfNode(node) {
    var index = -1;

    nodeSet.forEach(function(n, i) {
        if (n.id === node.id) {
            index = i;
        }
    });

    return index;
}

function indexOfLink(link) {
    var index = -1;

    linkSet.forEach(function(l, i) {
        if ((link.source.id == l.source.id && link.target.id == l.target.id) ||
            (link.target.id == l.source.id && link.source.id == l.target.id)) {
            index = i;
        }
    })

    return index;
}

function setItemOpen(d, open) {
    var d3Element = d3.select("#"+d.id);

    if (d.open) {
        // close
        setElementHidden(allOtherElements(d3Element), false, 250);
        d.open = false;
        d3Element
        .attr("data-open", "0")
        .transition().duration(500)
        .attr("r", radius(d));                

        $(".edit-box").hide();

    }
    else {
        // open
        setElementHidden(allOtherElements(d3Element), true, 250);
        d.open = true;
        d3Element
        .attr("data-open", "1")
        .transition().duration(500)
        .attr("r", Math.min(w, h)*0.45)
        .each("end", function() {
            $(".edit-box").fadeIn(250);
            $("#target-title").focus();
        });
    }
    restart();
}

function itemWasClicked(d) {

    clickCount++;

    var d3Element = d3.select(this);
    var alreadySelected = (d3Element.attr("data-selected") === "1");

    // console.log(d);
    var newSelectedItem = d;

    if (alreadySelected) {

        if (d.type === "target")
        {
            setItemOpen(d, !d.open);
        }
        else {
            setElementSelected(node, false);
            setElementInvalid(node, false);
            selectedItem = null;
        }
    }
    else {
        // Deselect all items
        setElementSelected(node, false);
        setElementInvalid(node, false);

        var oldSelectedItem = selectedItem;
        var changeSelection = false;

        if (oldSelectedItem) {

            if (oldSelectedItem.type !== newSelectedItem.type) {
                // Connect this item to other if it's a different type

                var newLink = {
                    source:newSelectedItem,
                    target:oldSelectedItem
                };

                var li = indexOfLink(newLink)
                console.log("li", li);

                if (li == -1) {
                    // Add a new link
                    linkSet.push(newLink);
                    flashElement(d3Element);
                }
                else {
                    // Remove the link
                    linkSet.splice(li, 1);
                }

                selectedItem = null;
                restart();                    
            }
            else {
                changeSelection = true;
            }
        }
        else {
            changeSelection = true;
        }

        if (changeSelection) {
            // Change selection 
            selectedItem = newSelectedItem;
            setElementSelected(d3Element, true);
            setElementSelected(allElementsLinkedToElement(d3Element), true, false);                
            setElementInvalid(otherSameElements(d3Element), true);
        }
    }

    setTimeout(function() { clickCount--;}, 500);
}

function allElementsLinkedToElement(element) {
    var a = [];

    linkSet.forEach(function(l) {
        if (l.target.id === element.attr("id")) {
            a.push("#" + l.source.id);
        } else if (l.source.id === element.attr("id")) {
            a.push("#" + l.target.id);
        }
    });

    if (a.length > 0)
        return d3.selectAll(a.join(","));
    else
        return null;
}

function allDifferentElementsNotLinkedToElement(element) {
    var a = [];

    nodeSet.forEach(function(n) {

        if (n.id !== element.attr("id") && n.type !== element.attr("type")) {
            a.push("#" + n.id);
        } 
    });

    if (a.length > 0)
        return d3.selectAll(a.join(","));
    else
        return null;
}

function otherSameElements(element) {
    var a = [];

    nodeSet.forEach(function(n) {

        if (n.id !== element.attr("id") && n.type === element.attr("type")) {
            a.push("#" + n.id);
        } 
    });

    if (a.length > 0)
        return d3.selectAll(a.join(","));
    else
        return null;
}

function allOtherElements(element) {
    var a = [];

    nodeSet.forEach(function(n) {

        if (n.id !== element.attr("id")) {
            a.push("#" + n.id);
        } 
    });

    if (a.length > 0)
        return d3.selectAll(a.join(","));
    else
        return null;
}

function setElementHidden(element, hide, duration) {
    if (!element || element.length == 0) {
        return;
    }

    if (duration == null) {
        duration = 250;
    }

    element
        .transition().duration(duration)
        .style("opacity", (hide ? "0" : "1"));
}

function setElementInvalid(element, invalid) {
    if (!element || element.length == 0) {
        return;
    }

    element
        .attr("data-invalid", (invalid ? "1" : "0"))
}

function setElementHighlighted(element, highlighted) {
    if (!element || element.length == 0) {
        return;
    }

    element
        .attr("data-highlighted", (highlighted ? "1" : "0"))
}

function setElementSelected(element, selected, setData) {
    if (!element || element.length == 0) {
        return;
    }

    if (setData == null) {
        setData = true;
    }

    var extendedSelection = !setData;

    if (setData) {
        element.attr("data-selected", (selected ? "1" : "0"));
    }

    if (selected) {
        if (extendedSelection) {
            
            // This element is linked to the selected node.
            
            element
                .transition().duration(250)
                .style("stroke-width", "4")
                .attr("stroke-dasharray", "20,5");
                // .style("opacity", 0.5)
                // .style("stroke", d3.rgb(255, 255, 255));
        }
        else {
            element
                .transition().duration(250)
                .style("stroke-width", "6")
                .attr("stroke-dasharray", "1,0");
        }
    }
    else {
        element
            .transition().duration(250)
            .style("stroke-width", "2")
            .attr("stroke-dasharray", "1,0");
    }
}
    
function flashElement(element) {
    var wold = element.style("stroke-width");
    var oold = element.style("opacity");

    element
        .attr("stroke-dasharray", "8,4")
        .style("stroke-width", "15")
        .style("opacity", "0.1")
        .transition().duration(600).ease("cubic-out")
        .style("opacity", oold)
        .style("stroke-width", wold)
        .attr("stroke-dasharray", "1,0");
}

function addControlEventHandlers() {

    svg
    // .on("click", function() {

    //     // TODO: figure out how to not interfere with normal node selection.
    //     // Deselect all items
    //     // setElementSelected(node, false);
    //     // setElementInvalid(node, false);

    // })
    .on("dblclick", function() {

        if (clickCount > 0) {
            return;            
        }

        var p1 = d3.svg.mouse(this);

        var newNode = {
            id: "target-" + nodeSet.length,
            type: "target",
            priority:Math.random()*100,
            name:greekLetter(nodeSet.length),
            attractor:{x:w/2, y:h/2},
            x: p1[0], 
            y: p1[1]
        };

        nodeSet.push(newNode);
        restart();

        // TODO: clean this up
        selectedItem = newNode;
        var d3Element = d3.select("#"+selectedItem.id);
        setElementSelected(d3Element, true);
        setElementInvalid(otherSameElements(d3Element), true);
        setItemOpen(selectedItem, true);

    })
    .on("mousemove", function(e) {
        tooltip
            .style("left", (d3.event.pageX - 30) + "px")
            .style("top", (d3.event.pageY + 28) + "px");

    });

    $(".remove-button").click(function() {
        setItemOpen(selectedItem, false);

        var ni;
        if ((ni = indexOfNode(selectedItem)) != -1) {
            console.log(nodeSet.length, 'nodes');
            var d = nodeSet.splice(ni, 1)[0];
            console.log(nodeSet.length, 'nodes');
            console.log("removed index", ni, d.id);
            // d3.select(d.id);
            restart();
        }
    })

    $(".ok-button").click(function() {
        setItemOpen(selectedItem, false);
    })
};

function radius(target) {
    var screenWidthScale = d3.scale.linear().domain([320, 1280]).range([35,90]);
    var TARGET_RADIUS_MAX = screenWidthScale(w);
    var TARGET_RADIUS_MIN = TARGET_RADIUS_MAX / 2;

    if (target.type === "person") {
        return TARGET_RADIUS_MIN * 0.6;
    }
    else {
        var radiusScale = d3.scale.linear()
                            .domain([0,100])  // input
                            .range([TARGET_RADIUS_MIN, TARGET_RADIUS_MAX]);  // output

        return radiusScale(target.priority);
    }
}

function fill(d) {
    if (d.priority == null) {
        return d3.rgb(250, 250, 250);
    }

    return color(d.priority);
}



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
