/*
* JS file for meteor publications
* All collections must be published in order to be avaliable to the user
* Once a collection is published with a set of restricting parameters, the subset of data is sent to the user, where the user must be subscribed in the router.js file in order to gain access
* Subscriptions are handled in ../lib/router.js
*/
import {console_log_conditional} from "/helpers/logging"

import {getUserGroupEnvs} from "../helpers/groups";

Meteor.publish('groups', function (groupId) {
  if (!this.userId) {
    return this.ready();
  }

  if (typeof groupId === 'undefined') {
    return Groups.find(
      {
        "members.userId": this.userId
      }
    )
  }
  else {
    return Groups.find(
      {
        "members.userId": this.userId,
        _id: groupId
      }
    )
  }
});

Meteor.publish('environments', function () {
  if (!this.userId) {
    return this.ready();
  }

  return Environments.find({userId: this.userId});
});

Meteor.publish('environment', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  return Environments.find({userId: this.userId, _id: envId});
});

Meteor.publish('groupEnvironments', function () {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  return Environments.find(
    {_id: {$in: [...env_ids]}}
  );
});

Meteor.publish('groupEnvironment', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  if (env_ids.has(envId)) {
    return Environments.find(
      {_id: envId}
    );
  }
  return this.ready()
});

Meteor.publish('groupObservations', function () {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  return Observations.find(
    {envId: {$in: [...env_ids]}}
  );
});

Meteor.publish('groupEnvObservations', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  if (env_ids.has(envId)) {
    return Observations.find(
      {envId: envId}
    );
  }
  return this.ready()
});

Meteor.publish('groupObservation', function (obsId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  return Observations.find(
    {envId: {$in: [...env_ids]}, _id: obsId}
  );
});

Meteor.publishComposite('observations', function () {
  if (!this.userId) {
    return this.ready();
  }

  return {
    find() {
      return Environments.find({userId: this.userId}, {fields: {_id: 1}})
    },
    children: [{
      find(env) {
        return Observations.find({envId: env._id});
      }
    }]
  }
})


Meteor.publish('ownObservations', function () {
  if (!this.userId) {
    return this.ready();
  }

  return Observations.find({userId: this.userId});
});


Meteor.publish('envObservations', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  // need to check ownership on the parent (environment), not the observation
  let env_ids = Environments.find({userId: this.userId}, {fields: {_id: 1}}).fetch().map(e => e._id)
  if (!!env_ids.find(id => id === envId)) {
    return Observations.find({
      envId: envId
    });
  }
  return this.ready()
});

Meteor.publish('observation', function (obsId) {
  if (!this.userId) {
    return this.ready();
  }

  if (typeof obsId === 'undefined') {
    return this.ready();
  }

  let envIds = Environments.find({userId: this.userId}, {fields: {_id: 1}}).fetch().map(e => e._id);
  return Observations.find({envId: {$in: envIds}, _id: obsId});
});

// Meteor.publish('observation', function(obsId) {
//   if (!this.userId) {
//     return this.ready();
//   }
//
//   if (typeof obsId === 'undefined') {
//     return this.ready();
//   }
//
//   return Observations.find({userId: this.userId, _id: obsId});
// });

Meteor.publish('ownSubjects', function () {
  if (!this.userId) {
    return this.ready();
  }

  return Subjects.find({userId: this.userId});
});


Meteor.publishComposite('subjects', function () {
  if (!this.userId) {
    return this.ready();
  }

  return {
    find() {
      console_log_conditional('looking for uid', this.userId);
      return Environments.find({userId: this.userId}, {fields: {_id: 1}})
    },
    children: [{
      find(env) {
        return Subjects.find({envId: env._id});
      }
    }]
  }
})


Meteor.publish('groupSubjects', function () {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready();
  }

  return Subjects.find(
    {envId: {$in: [...env_ids]}}
  );
});


Meteor.publish('envSubjects', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  if (typeof envId === 'undefined') {
    return this.ready();
  }
  let env_ids = Environments.find({userId: this.userId}).fetch().map(e => e._id);
  if (!!env_ids.find(id => id === envId)) {
    return Subjects.find({
      envId: envId
    });
  }
  return this.ready();
});

// Meteor.publish('envSubjects', function(envId) {
//   if (!this.userId) {
//     return this.ready();
//   }
//
//   if (typeof envId === 'undefined') {
//     return this.ready();
//   }
//   return Subjects.find({userId: this.userId, envId: envId});
// });

Meteor.publish('groupEnvSubjects', function (envId) {
  if (!this.userId) {
    return this.ready();
  }
  if (typeof envId === 'undefined') {
    return this.ready()
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.has(envId)) {
    return Subjects.find(
      {envId: envId}
    );
  }
  return this.ready()
});


Meteor.publish('ownSequences', function () {
  if (!this.userId) {
    return this.ready();
  }

  return Sequences.find({userId: this.userId});
});


Meteor.publishComposite('sequences', function () {
  if (!this.userId) {
    return this.ready();
  }

  return {
    find() {
      return Environments.find({userId: this.userId}, {fields: {_id: 1}})
    },
    children: [{
      find(env) {
        return Sequences.find({envId: env._id});
      }
    }]
  }
})

Meteor.publish('envSequences', function (envId) {
  if (!this.userId) {
    return this.ready();
  }
  console_log_conditional('subscribe envSequences', 'before env_ids');
  let env_ids = Environments.find({userId: this.userId}).fetch().map(e => e._id);
  console_log_conditional('subscribe envSequences', 'after env_ids');
  if (!!env_ids.find(id => id === envId)) {
    console_log_conditional('subscribe envSequences', 'some env_ids found, looking for sequences');
    return Sequences.find({envId: envId});
  }
  console_log_conditional('subscribe envSequences', 'no env_ids found, this.ready()');
  return this.ready()
});

Meteor.publish('obsSequences', function (obsId) {
  if (!this.userId) {
    return this.ready();
  }
  console_log_conditional('subscribe obsSequences', 'before env_ids');
  let env_ids = Environments.find({userId: this.userId}, {fields: {_id: 1}}).fetch().map(e => e._id);
  console_log_conditional('subscribe obsSequences', 'after env_ids');
  console_log_conditional('subscribe obsSequences', 'about to find sequences');
  let seqs = Sequences.find({envId: {$in: env_ids}, obsId: obsId});
  console_log_conditional('subscribe obsSequences', 'found sequences, returning');
  return seqs
});

// Meteor.publish('obsSequences', function(obsId) {
//   if (!this.userId) {
//     return this.ready();
//   }
//
//   return Sequences.find({userId: this.userId});
// });


Meteor.publish('groupEnvSequences', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  if (env_ids.has(envId)) {
    return Sequences.find({envId: envId});
  }
  return this.ready()
});

Meteor.publish('groupObsSequences', function (obsId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  return Sequences.find({obsId: obsId, envId: {$in: [...env_ids]}});
});

Meteor.publish('groupSequences', function () {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  return Sequences.find({envId: {$in: [...env_ids]}});
});

Meteor.publish('ownSubjectParameters', function () {
  if (!this.userId) {
    return this.ready();
  }

  return SubjectParameters.find({userId: this.userId});
});

Meteor.publishComposite('subjectParameters', function () {
  if (!this.userId) {
    return this.ready();
  }

  return {
    find() {
      return Environments.find({userId: this.userId}, {fields: {_id: 1}})
    },
    children: [{
      find(env) {
        return SubjectParameters.find({'envId': env._id});
      }
    }]
  }
})


Meteor.publish('envSubjectParameters', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = Environments.find({userId: this.userId}, {fields: {_id: 1}}).fetch().map(e => e._id);
  if (!!env_ids.find(id => id === envId)) {
    return SubjectParameters.find({'envId': envId});
  }
  return this.ready()
});

// Meteor.publish('envSubjectParameters', function(envId) {
//   if (!this.userId) {
//     return this.ready();
//   }
//
//   return SubjectParameters.find({userId: this.userId, 'envId': envId});
// });

Meteor.publish('groupEnvSubjectParameters', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  if (env_ids.has(envId)) {
    return SubjectParameters.find({'envId': envId});
  }
  return this.ready()
});


Meteor.publish('groupSubjectParameters', function () {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  return SubjectParameters.find({'envId': {$in: [...env_ids]}});
});


Meteor.publish('ownSequenceParameters', function () {
  if (!this.userId) {
    return this.ready();
  }

  return SequenceParameters.find({userId: this.userId});
});


Meteor.publishComposite('sequenceParameters', function () {
  if (!this.userId) {
    return this.ready();
  }

  return {
    find() {
      return Environments.find({userId: this.userId}, {fields: {_id: 1}})
    },
    children: [{
      find(env) {
        return SequenceParameters.find({envId: env._id});
      }
    }]
  }
})

Meteor.publish('envSequenceParameters', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = Environments.find({userId: this.userId}, {fields: {_id: 1}}).fetch().map(e => e._id);
  if (!!env_ids.find(id => id === envId)) {
    return SequenceParameters.find({envId: envId});
  }
  return this.ready()
});
//
// Meteor.publish('envSequenceParameters', function(envId) {
//   if (!this.userId) {
//     return this.ready();
//   }
//
//   return SequenceParameters.find({userId: this.userId, 'envId': envId});
// });

Meteor.publish('groupEnvSequenceParameters', function (envId) {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  if (env_ids.has(envId)) {
    return SequenceParameters.find({'envId': envId});
  }
  return this.ready()
});

Meteor.publish('groupSequenceParameters', function () {
  if (!this.userId) {
    return this.ready();
  }

  let env_ids = getUserGroupEnvs(this.userId);

  if (env_ids.length === 0) {
    return this.ready()
  }

  return SequenceParameters.find({'envId': {$in: [...env_ids]}});
});

Meteor.publish('shared_environments', function (shareId) {
  // these are public
  return SharedEnvironments.find({_id: shareId});
});


Meteor.publish('allEnvs', function () {
  if (Roles.userIsInRole(this.userId, ['admin'], 'site')) {
    return Environments.find();
  }
  else {
    // return [];
    //
    return this.ready()
  }

  // this.stop();
  return;
});
Meteor.publish('allObs', function () {
  if (Roles.userIsInRole(this.userId, ['admin'], 'site')) {
    return Observations.find();
  }
  else {
    return this.ready();
    // return [];
  }

  // this.stop();
  return;
});

Meteor.publish('allSeqs', function () {
  if (Roles.userIsInRole(this.userId, ['admin'], 'site')) {
    return Sequences.find();
  }
  else {
    // return [];

    return this.ready()
  }

  // this.stop();
  return;
});

Meteor.publish('allSubjectsAndParams', function () {
  if (Roles.userIsInRole(this.userId, ['admin'], 'site')) {
    return [
      SequenceParameters.find(),
      SubjectParameters.find(),
      Subjects.find(),
    ]
  }
  else {
    // return [];

    return this.ready()
  }

  // this.stop();
  return;
});


Meteor.publish("autocompleteUsers", function (selector, options) {
  let results = Meteor.users.find({_id: ''}, options);

  let min_search_string_length = 6;
  if (selector && typeof selector['$or'] !== 'undefined' && selector['$or'][0].username.toString().length >= min_search_string_length) {
    results = Meteor.users.find(selector, options);
  }

  Autocomplete.publishCursor(results, this);
  return this.ready();
});

Meteor.publish("autocompleteEnvironments", function (selector, options) {
  if (selector && typeof selector['$or'] !== 'undefined') {
    selector['userId'] = this.userId;
  }
  else {
    selector = {userId: this.userId};
  }


  let results = Environments.find(selector, options);

  Autocomplete.publishCursor(results, this);
  return this.ready();
});


Meteor.publish('users', function () {
  if (Roles.userIsInRole(this.userId, ['admin'], 'site')) {
    return Meteor.users.find();
  }
  else {
    return this.ready()
  }
});

Meteor.publish('allUsers', function () {
  if (!this.userId) {
    return this.ready();
  }

  return Meteor.users.find({}, {

    // todo: in the future, should this only publish relevant users to the group
    // you're part of, and a search for users requires some sort of input?
    fields: {
      username: 1,
      _id: 1
    }

  });
});
//
// Meteor.publish('groupUsers', function(groupId) {
//   if (!this.userId) {
//     return this.ready();
//   }
//
//   let group = Groups.findOne({_id: groupId});
//
//   if (!group) {
//     return this.ready();
//   }
//   let userIds = group.members.map(mem => mem.userId);
//
//   return Meteor.users.find({_id: {$in: userIds}}, {
//     fields: {
//       username: 1,
//       _id: 1
//     }
//
//   });
// });

Meteor.publishComposite('groupUsers', function (groupId) {
  if (!this.userId) {
    return this.ready();
  }

  return {
    find() {
      return Groups.find({_id: groupId, "members.userId": this.userId}, {fields: {members: 1}});
    },
    children: [{
      find(group) {
        let userIds = group.members.map(mem => mem.userId);

        return Meteor.users.find({_id: {$in: userIds}}, {
          fields: {
            username: 1,
            _id: 1
          }
        });
      }
    }]
  }
})

//
// Meteor.publish('groupEnvs', function(groupId) {
//   if (!this.userId) {
//     return this.ready();
//   }
//
//   let group = Groups.findOne({_id: groupId});
//
//   if (!group) {
//     return this.ready();
//   }
//
//   return Environments.find({_id: {$in: envIds}});
// });

Meteor.publishComposite('groupEnvs', function (groupId) {
  if (!this.userId) {
    return this.ready();
  }

  return {
    find() {
      return Groups.find({
        _id: groupId,
        $or: [{"members.userId": this.userId}, {showForAllUsers: true}]
      }, {fields: {environments: 1}});
    },
    children: [{
      find(group) {
        let envIds = group.environments.map(env => env.envId);

        return Environments.find({_id: {$in: envIds}});
        // todo: only publish necessary fields here
      }
    }]
  }
})


//
// Meteor.publish('Meteor.users', function() {
//
//
//   return Meteor.users.find(selector, options);
//
// });


Meteor.publish('research_content', function () {
  return ResearchContent.find({});
});


Meteor.publish('press_content', function () {
  return PressContent.find({});
});
