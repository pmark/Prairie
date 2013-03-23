// Prairie -- server

/*
http://docs.meteor.com/#find
collection.find(selector, [options]) Anywhere

Find the documents in a collection that match the selector.

Arguments
selector Mongo selector, or String
The query

Options
sort Sort specifier
Sort order (default: natural order)

skip Number
Number of results to skip at the beginning

limit Number
Maximum number of results to return

fields Field specifier
(Server only) Dictionary of fields to return or exclude.

reactive Boolean
(Client only) Default true; pass false to disable reactivity

transform Function
Overrides transform on the  Collection for this cursor. Pass null to disable transformation.
*/

Meteor.publish("directory", function () 
{
	return Meteor.users.find({}, {
		fields: {emails: 1, profile: 1}
	});
});

Meteor.publish("areas", function () 
{
	// Get all public areas, my areas, or areas I'm invited to.

	return Areas.find(
		{$or: [{"public": true}, {invited: this.userId}, {owner: this.userId}]});
});