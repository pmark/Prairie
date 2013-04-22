// NodeLink model
NodeLinks = new Meteor.Collection("node_links", {idGeneration:'MONGO'});

NodeLinks.allow({
	insert: function (userId, nodeLink) {
		return false;
	},

	update: function (userId, nodeLink, fields, modifier) {
		return false;
	},

	remove: function (userId, nodeLink) {
		return false;
	}
});

Meteor.methods({

	createLink: function(link) {
	    var newLink = {
	    	_id: link._id,
	    	source: {id: link.source.id},
			target: {id: link.target.id}
	    };

		NodeLinks.insert(newLink);
	},

	removeLink: function(linkId) {
		NodeLinks.remove(linkId);
	},

	removeAllNodeLinks: function() {
	    NodeLinks.find().forEach(function(i) { 
	      NodeLinks.remove(i._id); 
	    });
	}

});
