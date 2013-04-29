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

Meteor.methods({

	refreshUserInfo: function(uid) {

		if (!uid) {
			console.log("refreshUserInfo error: no user ID given");
			return;
		}
		
		var u = Meteor.users.findOne(uid);

		if (u && u.services) {
			var minutesSinceLastRefresh = (u.profile ? minutesSince(u.profile.lastRefreshAt) : Infinity);

			if (minutesSinceLastRefresh < 60) {
				return;
			}
			else {
				console.log("\n\nTime to update user", uid, u);
			}

			if (u.services.github) {

				var res = Meteor.http.get("https://api.github.com/users/" + 
					u.services.github.username, {
      				headers: {"User-Agent": "Prairie/0.1"}}).data;

				if (res) {
					console.log("Response from api.github.com", res.length);
					url = res.avatar_url;

					console.log("------------updating user with github info.");

					u.profile = u.profile || {};
					u.profile.name = res.name;
					u.profile.initials = initials(res.name);
					u.profile.iconURL = url;

					Meteor.users.update(u._id, {
						$set: {
							"profile.iconURL": u.profile.iconURL,
							"profile.name": u.profile.name,
							"profile.initials": u.profile.initials,
							"profile.lastRefreshAt": timestamp()
						}
					}, function(err, r) {
						if (err) {
							console.log("error refreshing user:", err);
						}
						else {
							console.log("refreshed user:", u.profile);
						}
					});
				}
				else {
					console.log("Invalid response from https://api.github.com/users/" + u.services.github.username);
				}
			}
		}
	}
});

Meteor.publish("activities", function () {
	return Activities.find({team:1});

	// TODO: Get areas for this team only.
	// return Areas.find(
	// 	{ team: this.team});
});

Meteor.publish("node_links", function () {
	return NodeLinks.find({});
});

Meteor.publish("all_user_data", function () {
	return Meteor.users.find({});
	// return Meteor.users.find({}, {fields: {'nested.things': 1}});
});

Meteor.publish("prairies", function () {
	if (Meteor.userId() === null) {
		// TODO: Select the demo prairie
	}
	else {
		// TODO: Select queries this user belongs to.
		return Prairies.find({$in: {"userIds": Meteor.userId()}});
	}
});

////////////////////////////////////

Accounts.onCreateUser(function(options, user) {
    console.log("User was created", options, user);

	return user;
});

