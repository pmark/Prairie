// Prairie -- client

var $chart = null,
    w = null,
    h = null,
    svg = null,
    nodeSet = [],
    // linkSet = null,
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
    dragging = false,
    nodeLinksSubscription = null,
    activitiesSubscription = null,
    clickTimer = null,
    touchDown = false,
    CLICK_TIMEOUT_MS = 190,
    PERSON_NODE_RADIUS = 25,
    PERSON_NODE_CLIP_RADIUS = PERSON_NODE_RADIUS-2;


activitiesSubscription = Meteor.subscribe("activities", function() {
    
    var cursor = Activities.find({});
    var displayDelayInterval = 1000 / cursor.count();
    var cursor = Activities.find({});
    var nodesToAdd = 0;
    var ease = d3.ease("cubic-out");

    cursor.observeChanges({
        // _suppress_initial: true,

        added: function(id, fields) {
            // console.log("***added", id, fields);

            if ($("#" + activityElementIdForItemId(id)).length > 0) {
                updateActivity(id, fields);
            }
            else {
                fields._id = id;

                setTimeout(function() {
                    addActivity(fields);
                    restart();
                    nodesToAdd--;
                }, ease(nodesToAdd / cursor.count()) * (nodesToAdd++) * displayDelayInterval);
            }
        },
        changed: function(id, fields) {
            // console.log("***changed", id, fields);
            updateActivity(id, fields);
            restart();
        },
        removed: function(id) {
            // console.log("***removed", id);
            nodeWasRemoved(id);
        }
    });

    Meteor.subscribe("all_user_data", directorySubscriptionReady);

});    

function nodeWasRemoved(nodeId) {
    var ni;
    if ((ni = indexOfNodeItem({_id:nodeId})) != -1) {
        nodeSet.splice(ni, 1);
        restart();
    }
    else {
        console.log("couldn't find ", nodeId);
    }
}

function directorySubscriptionReady() {
    addPeople();
    restart();

    setTimeout(function() {
        // Delay links purely for effect.
        nodeLinksSubscription = Meteor.subscribe("node_links", nodeLinksSubscriptionReady);
    }, 2000);


    var cursor = Meteor.users.find({});

    cursor.observeChanges({
        _suppress_initial: true,

        added: function(id, fields) {
            var u = Meteor.users.findOne(id);
            // console.log("***added user", id, fields, u);
            addPeople([u])
            restart();
        },
        changed: function(id, fields) {
            var u = Meteor.users.findOne(id);
            // console.log("***changed user", id, fields, u);
            var personId = personElementIdForItemId(id);
            var d = findNodeById(personId);

            if (!d) {
                console.log("Can't find", personId);
                return;
            }

            if (u.profile) {
                d.title = u.profile.initials || "???";
                d.iconURL = u.profile.iconURL;

                var d3Element = d3.select("#" + personId);
                d3Element.select("text").text(function(d) { return d.title; });
                d3Element.select("image").attr("xlink:href", function(d) { return d.iconURL; })
            }

        },
        removed: function(id) {
            // console.log("***removed user", id);

            var ni;
            if ((ni = indexOfNodeItem({_id:id})) != -1) {
                nodeSet.splice(ni, 1);
                restart();
            }
        }
    });

};

function nodeLinksSubscriptionReady() {
    var cursor = NodeLinks.find({});
    var totalLinkCount = cursor.count();
    var displayDelayInterval = 5000;
    var linksToConnect = 0;
    var ease = d3.ease("linear");

    cursor.observeChanges({

        added: function(id, fields) {

            var d = NodeLinks.findOne(id);

            if (d) {
                if (d.source && d.target) {
                    var newLink = {
                        _id: id,
                        source: findNodeById(d.source.id),
                        target: findNodeById(d.target.id)
                    };
                    
                    try {
                        newLink.weight = 100 - Math.max(
                            parseInt(newLink.source.priority)||0,
                            parseInt(newLink.target.priority)||0);
                    } 
                    catch(e) {
                        newLink.weight = 100;
                    }

                    linksToConnect++;
                    var delay = (ease(linksToConnect / totalLinkCount) * displayDelayInterval);

                    setTimeout(function() {
                        addNodeLink(newLink);
                        restart();
                        linksToConnect--;

                        if (linksToConnect < 1) {
                            displayDelayInterval = 0;
                        }
                        // console.log("***added link:", newLink);
                    }, delay);
                }
            }
        },

        removed: function(id) {
            // console.log("***should remove link", id);

            var li;
            if ((li = indexOfNodeLinkItem({_id:id})) != -1) {
                linkSet.splice(li, 1);
                restart();
            }
        }
    });
}



var shouldRefreshUserInfo = false;
// If no activity selected, select one.
Meteor.startup(function () 
{
    Deps.autorun(function () {       

        if (Meteor.userId() === null) {
            // console.log("Not logged in");
        }
        else {
            // console.log("User is logged in", Meteor.userId());

            Meteor.call("refreshUserInfo", Meteor.userId(), function(err, result) {
                // console.log("------------------ refreshed user info", err, result);
            });            
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

/////////////////////////////////

function newObjectId() {
    return (new Meteor.Collection.ObjectID()._str);
}

function activityElementIdForItemId(activityItemId) {
    activityItemId = activityItemId || newObjectId();
    return "activity-" + activityItemId;
}

function personElementIdForItemId(personItemId) {
    personItemId = personItemId || newObjectId();
    return "person-" + personItemId;
}

function nodeLinkElementIdForItemId(nodeLinkId) {
    nodeLinkId = nodeLinkId || newObjectId();
    return "link-" + nodeLinkId;
}

function updateActivity(activityId, fields) {
    var elementId = activityElementIdForItemId(activityId);
    var activityItem = findNodeById(elementId);

    for (var key in fields) {
        activityItem[key] = fields[key];
    }

    var fillColor = fill(activityItem);
    var dc = d3.rgb(fillColor).darker(0.7);
    var textShadow = "0 -1px rgba(" + dc.r + "," + dc.g + "," + dc.b + " ,1.0)";

    d3.select("#" + elementId + " text")
        .style("text-shadow", function(d) { return textShadow; })
        .text(activityItem.title);

    d3.select("#" + elementId + " circle").transition().duration(500)
        .attr("r", radius)
        .style("fill", fillColor)
        .style("stroke", function(d) { return d3.rgb(fillColor).darker(0.4); });
}

var totalActivitiesCount = 0;
function addActivity(fields) {

    fields.id = activityElementIdForItemId(fields._id);

    if ($("#" + fields.id)[0] != null) {
        return;
    }

    var totalActivityCount = Activities.find().count();
    var angle = ((Math.PI * 2) / (nodeSet.length+1) * totalActivityCount) % Math.PI*2;

    fields.type = "activity";
    fields.x = w/2 + Math.cos(angle) * w/2;
    fields.y = h/2 + Math.sin(angle) * h/2;
    fields.attractor = {x:w/2, y:h/2};

    nodeSet.push(fields);
}

/////////////////////////////////

function addNodeLink(fields) {

    if ($("#" + fields.id).length > 0) {
        return;
    }

    if (!fields.source) {
        console.log("link", fields._id, "is missing a source");
        return;
    }

    if (!fields.target) {
        console.log("link", fields._id, "is missing a target", fields);
        return;
    }

    linkSet.push(fields);
}

/////////////////////////////////

function tricolor(priority) {
    var c = [d3.rgb(5,175,220), "#FF9911", "#FF2300"];

    var i = 0;
    if (priority > 33) {
        i = 1;

        if (priority > 66) {
            i = 2;
        }
    }

    return c[i];
}

function useTheForce() {
    // Set up D3 force layout.

    force = d3.layout.force()
        .charge(function(d) {
            var r = radius(d);
            return -r * r * 2.0;
        })
        .linkStrength(0.6) // default 1
        .linkDistance(function(d) {
            var r = radius({priority:d.weight});
            return Math.sqrt(4*r*r) + Math.random()*20 + 5;
        })
        .size([w, h]);

    var NODE_TYPE_CHART_CENTER = 0,
        NODE_TYPE_TARGET_CENTER = 1;

    svg = d3.select("#chart").append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    var defs = svg.append("defs");


    defs.append("rect")
        .attr("id", "rect")
        .attr("x", -PERSON_NODE_CLIP_RADIUS)
        .attr("y", -PERSON_NODE_CLIP_RADIUS)
        .attr("width", PERSON_NODE_CLIP_RADIUS*2)
        .attr("height", PERSON_NODE_CLIP_RADIUS*2)
        .attr("rx", PERSON_NODE_CLIP_RADIUS);

    defs.append("clipPath")
        .attr("id", "clip")
        .append("use")
        .attr("xlink:href", "#rect")

    nodeSet = force.nodes();
    linkSet = force.links();

    node = svg.selectAll(".node"),
    link = svg.selectAll(".link");

    // tooltip = d3.select("body").append("div")   
    //     .attr("class", "tooltip")               
    //     .style("opacity", 0);

    force.on("tick", function(e) {

        var k = e.alpha * .1;

        nodeSet.forEach(function(d) {
            var edgePadding = radius(d) * 0.66;
            d.x = Math.min(w-edgePadding, Math.max(edgePadding, d.x + (d.attractor.x - d.x) * k));
            d.y = Math.min(h-edgePadding, Math.max(edgePadding, d.y + (d.attractor.y - d.y) * k));                
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

function restart() {

    var k = Math.sqrt(nodeSet.length / (Math.min(w,900) * Math.min(h,700)));
    // force.charge(-10 / k).gravity(70 * k)
    force.gravity(30 * k)

    link = link.data(linkSet);

    link
        .enter()
        .insert("line", ".node")
        .attr("id", function(d) { return d._id; })
        .attr("class", "link")
        .style("stroke-dasharray", "9 3 1 3")
        // .style("stroke-linecap", "round")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    link
        .exit()
        .remove();


    node = node.data(nodeSet, function(d) { return d.id; });

    node.exit().transition().duration(450)
        .style("opacity", 0)
        .ease("circle")
        .attr("transform", function(d) {
            return "translate(" + 
                parseInt(Math.random()*(w*0.66) + (w*0.33)) + "," + 
                parseInt(Math.random() > 0.5 ? -100 : h+100) + ")";
        })
        .remove();

    var g = node.enter().append("svg:g")
        .attr("class", function(d) { return "node " + d.type; })
        .attr("id", function (d) { return d.id; }) // use meteor's d._id maybe
        .on("touchstart", function(d) {
            touchDown = true;
            itemWasClicked(d);
        })
        .on("mouseup", function(d) {
            touchDown = false;
        })
        .on("mousemove", function(d) {
            dragging = true;
        })
        .on("mousedown", function(d) { 
            touchDown = true;

            if (!mobile) {
                itemWasClicked(d);
            }
        })
        .call(force.drag);
        // .each(function(d, b) {
        //     if (d.type === "person") {
        //         var r = radius(d);

        //         d3.select("#"+d.id)
        //             // .append("image")
        //             // .attr("xlink:href", "/images/pma.png")
        //             .append("img")
        //             .attr("src", "/images/pma.png")
        //             .attr("x", -r)
        //             .attr("y", -r)
        //             .attr("width", 2*r)
        //             .attr("height", 2*r);
        //     }
        //     console.log("ended:", this);
        // });


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

    g.append("svg:image")
        .attr("xlink:href", function(d) { return d.type=="person" ? d.iconURL : null; })
        .attr("x", -PERSON_NODE_RADIUS)
        .attr("y", -PERSON_NODE_RADIUS)
        .attr("width", PERSON_NODE_RADIUS*2)
        .attr("height", PERSON_NODE_RADIUS*2)
        .attr("clip-path", "url(#clip)");

    g.append("svg:circle")
        .style("fill", function(d) { 
            return (d.type=="person" ? "none" : fill(d));
        })
        .style("stroke", function(d) { 
            return d3.rgb(fill(d)).darker(1.0);
        })
        .attr("r", function(d) { return (d.type=="person" ? radius(d) : 10);})
        .transition().duration(2000)
        .attr("r", radius);

    g.append("svg:text")
        .text(function(d) { return d.title; })
        .style("width", function(d) { return radius(d) * 1.8})
        .style("text-shadow", function(d) { 
            var dc = d3.rgb(fill(d)).darker(1.0);
            return "0 1px rgb(" + dc.r + "," + dc.g + "," + dc.b + ")";
        })
        .style("text-anchor", "middle")
        .attr("x", 0)
        .attr("y", function(d) { 
            return (d.type=="person" ? 37 : 5);
        });
    
    force.start();
}

function linkId(d) {
    var a = d.source.id;
    var b = d.target.id;

    var lower = (a < b) ? a : b;
    var upper = (a > b) ? a : b;

    return "link-" + lower + "-" + upper;
}


var totalPeopleAdded = 0;
function addPeople(userSet) {

    function pushUserNodes(result) {
        // console.log("userNodes result:", result);
        var totalPersonCount = Meteor.users.find().count();
        var angle = (Math.PI * 2) / (totalPeopleAdded++);

        result.forEach(function(u,i) {

            if ($("#person-" + u._id).length === 0) {
                u.x = w/2 + Math.cos(angle) * w/2;
                u.y = h/2 + Math.sin(angle) * h/2;
                u.attractor = {x:w/2, y:h/2 };

                nodeSet.push(u);
            }
        });

        restart();
    };

    Meteor.call("userNodes", userSet, function(err, result) {
        if (err) {
            console.log("userNodes err:", err);
        }

        if (!result) {
            console.log("No users");
            return;
        }

        pushUserNodes(result);
    });
}

function findNodeById(nodeId) {
    for (var i in nodeSet) {

        var n = nodeSet[i];

        if (n.id === nodeId) {
            return n;
        }
    }

    return null;
}

function indexOfNodeItem(item) {
    var index = -1;

    nodeSet.forEach(function(n, i) {
        if (n._id === item._id) {
            index = i;
            return;
        }
    });

    return index;
}

function indexOfNodeLinkItem(item) {
    var index = -1;

    linkSet.forEach(function(n, i) {
        if (n._id === item._id) {
            index = i;
            return;
        }
    });

    return index;
}

function indexOfLink(link) {
    var index = -1;

    linkSet.forEach(function(l, i) {
        // Compare "id" which is a DOM element ID that includes the element type and record ID.

        if ((link.source.id == l.source.id && link.target.id == l.target.id) ||
            (link.target.id == l.source.id && link.source.id == l.target.id)) {
            index = i;
        }
    });

    return index;
}

function setItemOpen(d, open) {

    var d3Element = d3.select("#"+d.id);

    if (d.open) {
        // close
        setElementHidden(allOtherElements(d3Element), false, 250);
        d.open = false;
        d.fixed = false;

        d3Element.attr("data-open", "0");

        d3Element.select("circle")
            .transition().duration(450)
            .attr("transform", function(d) {
                return "translate(" + 0 + "," + 0 + ")";
            })
            .attr("r", radius(d))
            .each("end", function(d) {
                d3Element.select("circle").attr("transform", null);
                d3Element.select("text").transition().duration(250).style("opacity", "1.0");
                d3.selectAll(".link").transition().duration(250).style("opacity", "1.0");
            });

        $(".edit-box").hide();
        modalOpen = false;
    }
    else {
        // open
        setElementSelected(node, false, true);
        setElementInvalid(node, false);
        setElementHidden(allOtherElements(d3Element), true, 250);

        modalOpen = true;
        d.open = true;
        d.fixed = true;
        d3Element.attr("data-open", "1");
        d3Element.select("text").transition().duration(250).style("opacity", "0.0");
        d3.selectAll(".link").transition().duration(150).style("opacity", "0.0");


        d3Element.select("circle")
            .transition().duration(450)
            .style("stroke-width", "2")
            .style("stroke-dasharray", "none")
            .attr("transform", function(d) { 
                return "translate(" + (w/2-d.x) + "," + (h/2-d.y) + ")";
            })
            .attr("r", Math.min(w, h)*0.45)
            .each("end", function() {
                $("#activity-title").val(d.title);
                $("#activity-description").val(d.description);
                $("#activity-priority").text(d.priority);
                $("#priority-slider").slider("setValue", d.priority);
                $("#priority-slider").val(d.priority);

                var top = Math.max(0, h/2 - parseInt($(".edit-box").css("height"))/2) + 10;
                $(".edit-box").css("top", top);
                $(".edit-box").fadeIn(250);
                $("#activity-title").focus();
            });
    }

    restart();
}

function clearSelection(preserveSelectedItem) {
    setElementSelected(node, false, true);
    setElementInvalid(node, false);

    if (!preserveSelectedItem) {
        unfixAndNullOutSelectedItem();
    }
}

function toggleLink(source, target) {
    
    var nodeLink = {
        source:source,
        target:target
    };

    var li = indexOfLink(nodeLink)

    if (li == -1) {
        // Add a new link

        flashElement(d3.select("#"+target.id));

        nodeLink._id = newObjectId();

        Meteor.call("createLink", nodeLink, function(error) {
            if (error) {
                alert("Error: " + error.reason + " " + error.details);
            }
        });

        // console.log(linkSet.length, "adding", nodeLink._id);
        // linkSet.push(nodeLink);
    }
    else {
        // Remove the link

        // console.log("link to remove at index", li, linkSet[li]._id);

        Meteor.call("removeLink", linkSet[li]._id, function(error) {
            if (error) {
                alert("Error: " + error.reason + " " + error.details);
            }
        });
    }

    restart();
}

function itemWasClicked(d) {

    if (modalOpen) {
        return;
    }

    var e = d3.event,
        // t2 = e.timeStamp,
        // t1 = d.lastTouch || t2,
        // dt = (t2 - t1),
        fingers = e.originalEvent ? e.originalEvent.touches.length : 0;

    // d.lastTouch = t2;
    d.clickCount = d.clickCount || 0;
    d.clickCount++;

    svg.on("dblclick", null);

    clearTimeout(clickTimer);

    clickTimer = setTimeout(function() {
        var cc = d.clickCount;
        d.clickCount = 0;

        svg.on("dblclick", svgDoubleClickHandler);

        if (touchDown) {
            return;
        }

        if (cc == 1) {
            // Single click
            var d3Element = d3.select("#" + d.id);

            if (!d3Element) {
                console.log("Element", d, "went away");
                return;
            }

            var alreadySelected = (d3Element.attr("data-selected") === "1");
            var newSelectedItem = d;

            if (alreadySelected) {
                clearSelection();
            }
            else {
                var oldSelectedItem = selectedItem;
                var changeSelection = false;
                clearSelection();

                if (oldSelectedItem) {
                    if (oldSelectedItem.type !== newSelectedItem.type) {
                        toggleLink(oldSelectedItem, newSelectedItem);
                        unfixAndNullOutSelectedItem();
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
                    selectedItem.fixed = true;
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

    }, CLICK_TIMEOUT_MS);
}

function unfixAndNullOutSelectedItem() {
    if (selectedItem) {
        selectedItem.fixed = false;
    }

    selectedItem = null;
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

function allNodeElements() {
    return svg.selectAll(".node");
}

function setElementHidden(element, hide, duration) {
    if (!element || element.length == 0) {
        return;
    }

    element.classed("invisible", hide);

    // if (duration == null) {
    //     duration = 250;
    // }

    // element
    //   .transition().duration(duration)
    //   .style("opacity", (hide ? "0" : ""));
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
                .style("stroke", function(d) { return d3.rgb(fill(d)).darker(0.6); })
                .style("stroke-dasharray", "15 4");
        }
        else {
            // Select the tapped element
            element
                .transition().duration(250)
                .style("stroke-width", "4")
                .style("stroke", function(d) { return d3.rgb(fill(d)).darker(0.8); })
                .style("stroke-dasharray", "none");
        }
    }
    else {
        // Deselect
        element
            .transition().duration(250)
            .style("stroke", function(d) { return d3.rgb(fill(d)).darker(0.5); })
            .style("stroke-width", "2")
            .style("stroke-dasharray", "none");
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

function saveActivityCallback(error, activityId) {
    if (error) {
        unfixAndNullOutSelectedItem();
        alert("Error: " + error.reason + " " + error.details);
    }
    else {
        delete(selectedItem.scratch);
        setItemOpen(selectedItem, false);
        unfixAndNullOutSelectedItem();
    }
}

function svgDoubleClickHandler() {
    if (modalOpen) {
        return;
    }

    console.log("svg:dblclick");

    var p1 = d3.event;
    var _id = newObjectId();

    var newNode = {
        scratch:true,
        id:activityElementIdForItemId(_id),
        _id:_id,
        type:"activity",
        priority:50,
        title:greekLetter(nodeSet.length),
        attractor:{x:w/2, y:h/2},
        x:p1[0], 
        y:p1[1]
    };

    nodeSet.push(newNode);
    restart();

    clearSelection();
    selectedItem = newNode;
    setItemOpen(selectedItem, true);
}

function addControlEventHandlers() {

    svg.on("dblclick", svgDoubleClickHandler);

    // .on("mousemove", function(e) {
    //     tooltip
    //     .style("left", (d3.event.pageX - 30) + "px")
    //     .style("top", (d3.event.pageY + 28) + "px");

    // });

    $(".remove-button").click(function() {
        $(".edit-box").fadeOut(250);
        setItemOpen(selectedItem, false);

        if (selectedItem.scratch) {
            nodeWasRemoved(selectedItem._id);
            unfixAndNullOutSelectedItem();
        }
        else {
            Meteor.call("removeActivity", selectedItem._id, function(error) {
                unfixAndNullOutSelectedItem();

                if (error) {
                    alert("Error: " + error.reason + " " + error.details);
                }
            });
        }

    });

    $(".ok-button").click(function() {
        selectedItem.title = $("#activity-title").val();
        selectedItem.priority = $("#priority-slider").val();
        selectedItem.description = $("#activity-description").val();

        selectedItem._id = selectedItem._id || newObjectId();

        var activityItem = {
            _id: selectedItem._id,
            scratch: selectedItem.scratch,
            title: selectedItem.title,
            description: selectedItem.description,
            priority: selectedItem.priority,
            team: 1
        };

        Meteor.call('saveActivity', activityItem, saveActivityCallback); 
    });

} // end addControlEventHandlers

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}

function radius(d) {
    var screenWidthScale = d3.scale.linear().domain([320, 1280]).range([25,35]);
    var TARGET_RADIUS_MAX = screenWidthScale(Math.min(1280, w));
    var TARGET_RADIUS_MIN = TARGET_RADIUS_MAX / 2;

    if (d.type === "person") {
        // return Math.max(20, TARGET_RADIUS_MIN * 0.8);
        return PERSON_NODE_RADIUS;
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
        return "#555";  // "#DCD9C8";
    }
    return tricolor(d.priority);
}

var GREEK_LETTERS = ["α","β","γ","δ","ε","ζ","η","θ","ι","κ","λ","μ","ν","ξ","ο","π","ρ","ς","σ","τ","υ","φ","χ","ψ","ω"];

function greekLetter(number)
{
  number = Math.max(0, Math.min(GREEK_LETTERS.length, number));
  return GREEK_LETTERS[number];
}


/////////////////////////////

Accounts.ui.config({
    requestPermissions: {
        // github: ['user', 'repo:status', 'public_repo']
    },
    requestOfflineToken: {
        google: true
    }
});

Template.page.rendered = function() {
    $(".login-close-text").addClass("icon-remove");
};
