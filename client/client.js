// Prairie -- client

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
modalOpen = false,
mobile = null,
activitiesSubscription = null;

function updateIfSet(fieldSet, fieldName, value) {
    if (typeof(value) !== "undefined") {
        fieldSet[fieldName] = value;
    }
}

function addActivity(fields) {
    var angle = (Math.PI * 2 / nodeSet.length) * nodeSet.length;
    var distance = radius({priority:100}) * 2;

    fields.id = "activity-" + fields._id;
    fields.type = "activity";
    fields.x = w/2 + Math.cos(angle) * distance;
    fields.y = h/2 + Math.sin(angle) * distance;
    fields.attractor = {x:w/2, y:h/2};

    nodeSet.push(fields);
    console.log("Added", fields);
}

function activityElementId(activityItemId) {
    return "activity-" + activityItemId;
}

function updateActivity(activityId, fields) {
    console.log("---------updateActivity", activityId, fields);
    var elementId = activityElementId(activityId);
    var activityItem = findNodeById(elementId);

    for (var key in fields) {
        activityItem[key] = fields[key];
    }    

    var d3Element = d3.select("#" + elementId);
    d3Element.select("text").text(activityItem.title);

    // console.log("updating", elementId, d3Element.select(".node"));

    var fillColor = fill(activityItem);

    d3.select("#" + elementId + " circle").transition().duration(500)
        .attr("r", radius)
        .style("fill", fillColor)
        .style("stroke", function(d) { return d3.rgb(fillColor).darker(0.7); });
}

Meteor.subscribe("directory", function() {
    console.log("directory ready");
    addPeople();
    restart();
});

activitiesSubscription = Meteor.subscribe("activities", function() {
    console.log("activities ready");

    var cursor = Activities.find({});

    var handle = cursor.observeChanges({
        added: function(id, fields) {
            console.log("added", id);
            fields._id = id;
            addActivity(fields);
            restart();
        },
        changed: function(id, fields) {
            console.log("changed", id);
            fields._id = id;
            updateActivity(id, fields);
            restart();
        },
        removed: function(id) {
            console.log("todo: removed", id);
        }
    });

    // var activityItems = cursor.fetch();

    // for (var i in activityItems) {
    //     addActivity(activityItems[i]);
    // }

    // restart();
});

// If no activity selected, select one.
Meteor.startup(function () 
{  
    Deps.autorun(function () 
    {
        if (! Session.get("selected")) 
        {
            var activity = Activities.findOne();    
        }
    });

    window.mobileCheck = function() {
        var check = false;
        (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
        return check;
    }

    mobile = window.mobileCheck();


    $chart = $("#chart");
    w = $chart.width();
    h = $chart.height();

    document.body.addEventListener('touchmove', function(event) {
        event.preventDefault();
    }, false);

    window.onresize = function() {
        $(document.body).width(window.innerWidth).height(window.innerHeight);
        w = $chart.width();
        h = $chart.height();
        restart();
    }

    useTheForce();
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
        $("#activity-priority").text(evt.value);
        // console.log("setting priority", evt.value, d3.select("#"+selectedItem.id));

        var c = fill({priority:evt.value});
        d3.select("#"+selectedItem.id).select("circle")
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

    var gravityScale = d3.scale.linear().domain([320,1280]).range([0.38, 0.01]);

    force = d3.layout.force()
        .gravity(gravityScale(w))  // default 0.1
        .charge(-2100)  // default -30
        .linkStrength(0.06) // default 1
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

        node
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        // node
        //     .attr("cx", function(d) { return d.x; })
        //     .attr("cy", function(d) { return d.y; });
    });

    force.start();
}

var splitNodes = {};

function restart() {

    link = link.data(linkSet);

    link
    .enter()
    .insert("line", ".node")
    .attr("id", linkId)
    .attr("class", "link")
    .style("stroke-dasharray", "9 3 1 3")
    .style("stroke-linecap", "round")
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

    link
    .exit()
    .remove();


    // splitNodes = {};

    // nodeSet.map(function(d) {
    //     splitNodes[d.type] ? null : splitNodes[d.type] = [];
    //     splitNodes[d.type].push(d);
    // });

    // var targets = svg.selectAll(".target").data(splitNodes["target"]);
    // // var people = svg.selectAll(".person").data(splitNodes["person"]);

    // console.log("targets: ", splitNodes["target"]);
    // console.log("nodes: ", nodeSet);

    node = node.data(nodeSet);

    var g = node.enter()
        .append("svg:g")
        .attr("class", function(d) { return "node " + d.type; })
        .attr("type", function (d) { return d.type; })
        .attr("id", function (d) { return d.id; }) // use meteor's d._id maybe
        .on("touchstart", itemWasClicked)
        .on("mousedown", function(d) { 
            if (!mobile) {
                itemWasClicked(d);
            }
        })
        .call(force.drag);


        /*.on("click touchstart", function(d) {


            var e = d3.event;
            try {
                var t2 = e.timeStamp,
                    t1 = $(this).data('lastTouch') || t2,
                    dt = t2 - t1,
                    fingers = e.originalEvent ? e.originalEvent.touches.length : 0;

                $(this).data('lastTouch', t2);

                if (!dt || dt > 500 || fingers > 1) return;

                e.preventDefault(); 
            }
            catch (ex) {
                alert("Error: " + ex);
            }

        }) 
        */



        // .on("mouseover", function(d) {      
        //     tooltip.text(d.title)
        //         .transition()        
        //         .duration(150)
        //         .style("opacity", .9);

        //     setTimeout(function() {
        //         tooltip.style("opacity", 0);
        //     }, 1000);
        // })
        // .on("mouseout", function(d) {       
        //     tooltip.style("opacity", 0);   
        // })


    ///////////////
        // .each(function(d, b) {
        //     if (d.type === "person") {
        //         d3.select("#"+d.id)
        //             .append("image")
        //             .attr("xlink:href", "https://github.com/favicon.ico")
        //             .attr("x", -8)
        //             .attr("y", -8)
        //             .attr("width", 16)
        //             .attr("height", 16);
        //     }
        //     console.log("ended:", this);
        // });

    g.append("svg:circle")
        .attr("r", radius)
        .style("fill", fill)
        .style("stroke", function(d) { return d3.rgb(fill(d)).darker(0.7); });

    g.append("svg:text")
        .text(function(d) { return d.title; })
        .style("width", function(d) { return radius(d) * 1.8})
        .style("text-anchor", "middle")
                .attr("x", 0) // function(d) { return -radius(d) * 0.9})
        .attr("y", 5);

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
    //     .text(function(d) { return d.title; });

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
            title:"Joe",
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
    for (var i in nodeSet) {

        var n = nodeSet[i];

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

    // console.log("setItemOpen:", open, d);

    var d3Element = d3.select("#"+d.id);

    if (d.open) {
        // close
        setElementHidden(allOtherElements(d3Element), false, 250);
        d.open = false;

        d3Element.attr("data-open", "0");

        d3Element.select("text").transition().duration(500).style("opacity", "1.0");
        d3.selectAll(".link").transition().duration(500).style("opacity", "1.0");

        d3Element.select("circle")
        .transition().duration(500)
        .attr("r", radius(d));

        $(".edit-box").hide();
        modalOpen = false;
    }
    else {
        // open
        // setElementHidden(allOtherElements(d3Element), true, 250);

        modalOpen = true;
        d.open = true;
        d3Element.attr("data-open", "1");

        d3Element.select("text").transition().duration(500).style("opacity", "0.0");
        d3.selectAll(".link").transition().duration(500).style("opacity", "0.1");

        d3Element.select("circle")
        .transition().duration(500)
        .attr("r", Math.min(w, h)*0.45)
        .each("end", function() {
            $("#activity-title").val(d.title);
            $("#activity-description").val(d.description);
            $("#activity-priority").text(d.priority);
            $("#priority-slider").slider("setValue", d.priority);
            $(".edit-box").fadeIn(250);
            $("#activity-title").focus();
        });
    }

    restart();
}

function itemWasClicked(d) {

    if (modalOpen) {
        return;
    }

    var e = d3.event,
    t2 = e.timeStamp,
    t1 = d.lastTouch || t2,
    dt = t2 - t1,
    fingers = e.originalEvent ? e.originalEvent.touches.length : 0;

    d.lastTouch = t2;

    // if (fingers > 1) 
    //     return;

    if (!dt || dt > 500 ) {
        // Single click
        var d3Element = d3.select("#" + d.id);

        var alreadySelected = (d3Element.attr("data-selected") === "1");
        var newSelectedItem = d;

        if (alreadySelected) {
            setElementSelected(node, false);
            setElementInvalid(node, false);
            selectedItem = null;
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
    }
    else {
        console.log("activity:dblclick");

        // Double
        if (d.type === "activity") {
            selectedItem = d;
            setItemOpen(d, !d.open);
        }
    }
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

    if (element && element.length) {
        nodeSet.forEach(function(n) {

            try {
                if (n.id !== element.attr("id") && n.type === element.attr("type")) {
                    a.push("#" + n.id);
                }                 
            }
            catch (e) {
                console.log("e", e);
            }
        });        
    }

    if (a.length > 0)
        return d3.selectAll(a.join(","));
    else
        return null;
}

function allOtherElements(element) {
    var a = [];

    if (element && element.length) {        
        nodeSet.forEach(function(n) {

            // console.log("el", element, "n:", n.id);

            try {
                if (n.id !== element.attr("id")) {
                    a.push("#" + n.id);
                }                 
            }
            catch (e) {
                console.log("Error selecting:", e);
            }
        });
    }

    if (a.length > 0)
    {
        return d3.selectAll(a.join(","));
    }
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

    element = element.select("circle");

    if (selected) {
        if (extendedSelection) {
            // This element is linked to the selected node.
            element
                .style("stroke-dasharray", "1 1")
                .transition().duration(250)
                .style("stroke-width", "3")
                .style("stroke-dasharray", "15 4");
        }
        else {
            // Select the tapped element
            element
                .transition().duration(250)
                .style("stroke-width", "4")
                .style("stroke-dasharray", "none");
        }
    }
    else {
        // Deselect
        element
            .transition().duration(250)
            .style("stroke-width", "2")
            .style("stroke-dasharray", "none");
            // .each("end", function() {
            //     element.style("stroke-dasharray", "none")
            // });
    }
}


function flashElement(element) {
    element = element.select("circle");

    var wold = element.style("stroke-width");
    var oold = element.style("opacity");

    element
    .style("stroke-dasharray", "8 4 1 10")
    .style("stroke-width", "10")
    .style("opacity", "0.2")
    .transition().duration(600).ease("cubic-out")
    .style("opacity", oold)
    .style("stroke-width", wold)
    .style("stroke-dasharray", "1 0")
    .each("end", function() {
        element.style("stroke-dasharray", "none")
    });
}

function addControlEventHandlers() {

    svg.on("dblclick", function() {

        if (modalOpen) {
            return;
        }

        console.log("svg:dblclick");

        var p1 = d3.event;

        var newNode = {
            scratch:true,
            id: "activity-" + nodeSet.length,
            type: "activity",
            priority:50,
            title:greekLetter(nodeSet.length),
            attractor:{x:w/2, y:h/2},
            x: p1[0], 
            y: p1[1]
        };

        nodeSet.push(newNode);
        restart();

        selectedItem = newNode;
        var d3Element = d3.select("#"+selectedItem.id);
        // setElementSelected(d3Element, true);
        setItemOpen(selectedItem, true);
        setElementInvalid(allOtherElements(d3Element), true);

    }); // end dblclick

    // .on("mousemove", function(e) {
    //     tooltip
    //     .style("left", (d3.event.pageX - 30) + "px")
    //     .style("top", (d3.event.pageY + 28) + "px");

    // });

    $(".remove-button").click(function() {
        setItemOpen(selectedItem, false);

        // TODO: Fix this. the node isn't removing properly.
        // TODO: Remove links

        var ni;
        if ((ni = indexOfNode(selectedItem)) != -1) {
            // console.log(nodeSet.length, 'nodes');
            var d = nodeSet.splice(ni, 1)[0];
            // console.log(nodeSet.length, 'nodes');
            // console.log("removed index", ni, d.id);
            // d3.select(d.id);
            restart();
        }
    });

    $(".ok-button").click(function() {
    console.log("SAVE:", selectedItem.id);

    var originalElementId = selectedItem.id;

    selectedItem.title = $("#activity-title").val();
    selectedItem.priority = $("#priority-slider").val();
    selectedItem.description = $("#activity-description").val();

    if (true || selectedItem.scratch) {


        var activityItem = {
            id: selectedItem._id,
            scratch: selectedItem.scratch,
            title: selectedItem.title,
            description: selectedItem.description,
            priority: selectedItem.priority,
            team: 1
        };

        console.log("ABOUT TO SAVE:", activityItem);


        Meteor.call('saveActivity', activityItem, 
        function (error, activityId) {
            if (error) {
                alert("Error: " + error.reason + " " + error.details);
            }
            else {
                setItemOpen(selectedItem, false);
                selectedItem = null;
                return;



                activityId = activityId || selectedItem._id;
                console.log("DID SAVE:", activityId, "::::::", selectedItem);
                var $element;

                if (selectedItem.scratch) {
                    newElementId = "activity-" + activityId;
                    console.log("changing scratch id from ", originalElementId, "to", newElementId);
                    $element = $("#" + originalElementId);
                    $element.attr("id", newElementId);
                    selectedItem.id = newElementId;
                    delete(selectedItem.scratch);
                }
                else {
                    $element = $("#" + originalElementId);
                }

                setItemOpen(selectedItem, false);
                $element.attr("data-selected", "0");
                selectedItem = null;
            }
        });
    }
    else {
            // Updating an exiting activity

            console.log("TODO: update")
            setItemOpen(selectedItem, false);
            selectedItem = null;
        }

    }); // end ok-button click

} // end addControlEventHandlers

function radius(d) {
    var screenWidthScale = d3.scale.linear().domain([320, 1280]).range([44,100]);
    var TARGET_RADIUS_MAX = screenWidthScale(w);
    var TARGET_RADIUS_MIN = TARGET_RADIUS_MAX / 2;

    if (d.type === "person") {
        return Math.max(20, TARGET_RADIUS_MIN * 0.8);
    }
    else {
        var radiusScale = d3.scale.linear()
            .domain([0,100])  // input
            .range([TARGET_RADIUS_MIN, TARGET_RADIUS_MAX]);  // output
        return radiusScale(d.priority);
    }
}

function fill(d) {
    if (d.priority == null) {
        return d3.rgb(250, 250, 250);
    }
    return color(d.priority);
}


///////////////////////////////////////////////////////////////////////////////
// Activity details sidebar

Template.details.activity = function () {
  return Activities.findOne(Session.get("selected"));
};

Template.details.anyActivities = function () {
  return Activities.find().count() > 0;
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
    var activity = Session.get("selected");

    $('#slider-create').slider();

    $('#slider-details').slider()
    .on('slide', function(ev) 
    {
      // console.log("setting", Session.get("selected"), "priority", ev.value);

      Meteor.call('changePriority', 
        Session.get("selected"),
        parseFloat((ev.value || 0.5) / 100));

  });
};

Template.details.events({
  'click .remove': function () {
    Activities.remove(this._id);
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
// Activity attendance widget

Template.attendance.focuserName = function () {
  var user = Meteor.users.findOne(this.user);
  return displayName(user);
};

Template.attendance.nobody = function () {
  return ((this.focusers || []).length === 0);
};

Template.details.anyFocusers = function () {
  return Activities.find().count() > 0;
};

///////////////////////////////////////////////////////////////////////////////
// focus activity zone display

// Use jquery to get the position clicked relative to the focus activity zone element.
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
'dblclick .team-activity-zone': function (event, template) {
    if (! Meteor.userId())
    {
      // must be logged in to create events
      // console.log("Not logged in");
      return;
  }
  var coords = coordsRelativeToElement(event.currentTarget, event);
    // console.log("Coords", coords);
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
      var selectedArea = selected && Activities.findOne(selected);

      var radius = function (activity) 
      {
        return 30 + Math.sqrt(activity.priority) * 50;
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


      // Draw a circle for each activity
      var updateCircles = function (group)
      {
        group.attr("id", function (activity) {
          // console.log("update circles: ", activity._id);
          return activity._id; 
        })

        .attr("transform", function(d) 
        { 
          return "translate(" + d.x + "," + d.y + ")"; 
        })

        // .attr("cx", function (activity) { return activity.x * 500; })
        // .attr("cy", function (activity) { return activity.y * 500; })
        .attr("r", radius)
        .attr("class", "public")
        .style('opacity', 0.5);
      };

      var circles = d3.select(self.node).select(".circles").selectAll("circle")
        .data(Activities.find().fetch(), function (activity) { 
          return activity._id; 
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
        group.attr("id", function (activity) { return activity._id; })
        .text(function (activity) { return activity.title || ''; })
        .attr("x", function (activity) { return activity.x * 500 - radius(activity)/3; })
        .attr("y", function (activity) { return activity.y * 500 + radius(activity)/3.5 })
        .style('font-size', function (activity) {
          return radius(activity) * 1.25 + "px";
        });
      };

      var labels = d3.select(self.node).select(".labels").selectAll("text")
        .data(Activities.find().fetch(), function (activity) { return activity._id; });

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
// Create Activity dialog

var openCreateDialog = function (x, y) {
  Session.set("createCoords", {x: x, y: y});
  Session.set("createError", null);
  Session.set("showCreateDialog", true);
};

Template.page.showCreateDialog = function () {
  return Session.get("showCreateDialog");
};

var GREEK_LETTERS = ["α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ","ν","ξ","ο","π","ρ","ς","σ","τ","υ","φ","χ","ψ","ω"];

Template.teamAreaZone.activityCount = function () {
  return Activities.find().count();
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
    var title = greekLetter(Template.teamAreaZone.activityCount());
    // var priority = parseFloat($('#slider-create').attr("value") / 100);

    if (title.length && description.length)
    {
      Meteor.call('createArea', 
      {
        title: title,
        description: description,
        link: link,
        team: 1,
        priority: 0.5
    }, 
    function (error, activity)
    {
        if (! error) {
          console.log("inserted activity:", activity);
          Session.set("selected", activity);
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
