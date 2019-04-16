/*
* JS file for environment_item.html
*/

import { createModal } from '/helpers/modals.js'
import {getSequences} from "../../../helpers/sequences";

let share_window_timeout;

Template.environmentItem.events({
  'click #enter-class': function(e) {
     e.preventDefault();
     var obsId = $(e.target).attr("data-id");
     Router.go('observatory', {_envId:this._id, _obsId: obsId});
  },
  'click .share-tab': function (e) {
      clearTimeout(share_window_timeout);
      removeAllShareDialogs();
      var envId = this._id;
      e.stopPropagation();
      e.preventDefault();
      console.log('envId', envId);


      Meteor.call('exportAllParams', envId, function(error, result){
        if (error){
          alert(error.reason);
        } else {
          // Prompt save file dialogue
          if ($.isEmptyObject(result)) {
            alert("There are no parameters created for this classroom. Add some before sharing it.");
            return;
          }

          Meteor.call('shareEnvironment', envId, function(error, result) {
            if (error) {
              alert(error)
            }
            else {
              let share_link = `${window.location.origin}/share/env/${result._id}`;
              let share_link_students = `${window.location.origin}/share/env/${result._id_with_students}`;
              let share_button = $(e.target).parents('.share-tab-wrapper');
              let platform_modifier_key = (window.navigator.userAgent.indexOf("Mac") !== -1) ? '⌘' : 'ctrl';
              share_button
                .append(`<div class="shared-env-dialog">
                <span>Press ${platform_modifier_key}+c to copy the share link, or <a href="mailto:?subject=Try%20this%20classroom%20setup%20on%20EQUIP&body=${encodeURIComponent(share_link)}">share by email</a></span>
                <input class="share-link-field" readonly value="${share_link}">
                <span>Copy this link to include the students, or <a href="mailto:?subject=Try%20this%20classroom%20setup%20on%20EQUIP&body=${encodeURIComponent(share_link_students)}">share by email</a></span>
                <input class="share-link-field-with-students" readonly value="${share_link_students}"></div>`);
              let share_link_field = $('.share-link-field', share_button);
              share_link_field.select();
              //
              // console.log( document.queryCommandSupported('copy'));
              // console.log( document.queryCommandEnabled('copy'));
              // setTimeout(function () {
              //   console.log( document.queryCommandEnabled('copy'));
              //   document.execCommand('Copy');
              //
              //   let res = document.execCommand('Copy');
              //   console.log('res', res);
              // }, 500);
              // let res = document.execCommand('Copy');
              // console.log('res', res);
              // window.getSelection().removeAllRanges();
              share_window_timeout = setTimeout(removeAllShareDialogs, 15000);
            }
          })
        }
      });
  },
  // 'click .export-tab': function (e) {
  //   e.stopPropagation();
  //   e.preventDefault();
  //   var envId = this._id;
  //   var name = this.envName
  //   Meteor.call('exportAllParams', envId, function(error, result){
  //     if (error){
  //       alert(error.reason);
  //     } else {
  //       // Prompt save file dialogue
  //       if ($.isEmptyObject(result)) {
  //         alert("There are no parameters to export. Add parameters to this environment to be able to export.");
  //         return;
  //       }
  //       var json = JSON.stringify(result);
  //       var blob = new Blob([json], {type: "application/json"});
  //       var url  = window.URL.createObjectURL(blob);
  //
  //       var a = document.createElement("a");
  //       a.href = url;
  //       a.download = '' + name + '_environment.json';
  //       a.click();
  //       window.URL.revokeObjectURL(url);
  //     }
  //   });
  // },
  // 'click .import-tab': function (e) {
  //   e.stopPropagation();
  //   e.preventDefault();
  //
  //   var envId = this._id;
  //   var element = document.createElement('div');
  //   element.innerHTML = '<input type="file">';
  //   var fileInput = element.firstChild;
  //
  //   fileInput.addEventListener('change', function() {
  //       var file = fileInput.files[0];
  //       var jsonImport = {};
  //
  //       if (file.name.match(/\.(json)$/)) {
  //           var reader = new FileReader();
  //
  //           reader.onload = function() {
  //               var contents = reader.result;
  //               jsonImport = JSON.parse(contents);
  //               if ('subject' in jsonImport) {
  //                 jsonImport['subject']['envId'] = envId;
  //
  //                 Meteor.call('importSubjParameters', jsonImport['subject'], function(error, result) {
  //                   return 0;
  //                 });
  //               } else {
  //                 alert("Incorrectly formatted JSON import. No Subject parameters.");
  //               }
  //
  //               if ('sequence' in jsonImport) {
  //                 jsonImport['sequence']['envId'] = envId;
  //                 Meteor.call('importSeqParameters', jsonImport['sequence'], function(error, result) {
  //                     return 0;
  //                   });
  //               } else {
  //                 alert("Incorrectly formatted JSON import. No Sequence parameters.");
  //               }
  //
  //
  //           };
  //           reader.readAsText(file);
  //       } else {
  //           alert("File not supported, .json files only");
  //       }
  //   });
  //   alert("Please import files that have been previously exported from EQUIP only.")
  //   fileInput.click(); // opening dialog
  //
  // },
  'click #edit-sequence-params': function(e) {
     e.preventDefault();
     Router.go('editSequenceParameters', {_envId:this._id});
  },
  'click #edit-class-params': function(e) {
     e.preventDefault();
     Router.go('editSubjectParameters', {_envId:this._id});
  },
  'click #edit-class-studs': function(e) {
     e.preventDefault();
     Router.go('editSubjects', {_envId:this._id});
  },
  'click .edit-classroom-name': function(e) {
    e.preventDefault();
    e.stopPropagation();
    editClassroomName(this._id);
  },
  'click #env-duplicate': function(e) {
    e.preventDefault();
    e.stopPropagation();
    duplicateClassroom(this);
  },
  'click .toggle-accordion': function(e) {
      var ele = e.target;
      var $ele = $(e.target);
      // Bubble up to parent element so accordion toggles correctly
      if (!$ele.is('.toggle-accordion') && !$ele.is('.environment-name') && !$ele.is('.carat')) {
        return
      }
    e.preventDefault();
    if (!$ele.is('.toggle-accordion')) {
        $ele = $ele.parents('.toggle-accordion');
      }

      $ele.next().toggleClass('show');
      $ele.next().slideToggle(350);
      $ele.find(".carat").toggleClass("carat-show");
    },
  'click .export-data-button': function (e) {
    var envId = this._id;

    if (envId) {
      var environment = Environments.findOne({"_id": envId});
      var envName = environment['envName'];
      // var sequences=Sequences.find({"envId":envId}).fetch();
      var sequences = getSequences(null, envId);

      var literalArray = []
      for (i = 0; i < sequences.length; i++) {
        new_seq = sequences[i]['info'].parameters;
        new_seq['time'] = sequences[i]['time'];
        new_seq['obsName'] = sequences[i]['obsName'];
        new_seq['envName'] = envName;
        literalArray.push(new_seq);
      }
      var csv = Papa.unparse({
        data: literalArray,
      });
      var csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
      var csvURL = null;
      //IE download API for saving files client side
      if (navigator.msSaveBlob) {
        csvURL = navigator.msSaveBlob(csvData, 'download.csv');
      } else {
        //Everything else
        csvURL = window.URL.createObjectURL(csvData);
      }
      var tempLink = document.createElement('a');
      tempLink.href = csvURL;
      tempLink.setAttribute('download', envName + '_sequence_export.csv');
      tempLink.click();
    } else {
      alert("Please select a classroom to export!")
    }
  }
});

Template.environmentItem.events({
   'click #env-delete': function(e) {
     e.stopPropagation();
     var result = confirm("Deleting an environment will also delete all observation, subject, and sequence data. Press 'OK' to continue.");
     var envId = this._id
    if (result) {
      Meteor.call('environmentDelete', envId, function(error, result) {
        return 0;
      });
    }
  }
 });


Template.environmentItem.helpers({
    incrementIndex: function(index) {
        return index + 1;
    },
    getEnvironmentId: function() {
        return this._id;
    },
    getSubjectParameters: function() {
        var subjectParameters =  SubjectParameters.find({'children.envId': this._id}).fetch();

        if (subjectParameters.length === 0) return;

        var parsedSubjectParameters = subjectParameters[0].children;
        var labels = [];
        for (student in parsedSubjectParameters) {
            if (student.includes("label")) {
                labels.push(parsedSubjectParameters[student]);
            }
        }
        return labels.join(", ")
    },
    noSubjectParametersEntered: function() {
        let subjectParameters =  SubjectParameters.find({'children.envId': this._id}).fetch();

        if (subjectParameters.length === 0 || subjectParameters[0].children.parameterPairs === 0 ) {
            return true;
        } else {
            return false;
        }
    },
    noDiscourseParametersEntered: function() {
        let sequenceParameters = SequenceParameters.find({'children.envId': this._id}).fetch();

        if (sequenceParameters.length === 0 || sequenceParameters[0].children.parameterPairs === 0) {
            return true;
        } else {
            return false;
        }
    },
    getDiscourceParameters: function() {
        var sequenceParameters = SequenceParameters.find({'children.envId': this._id}).fetch();

        if (sequenceParameters.length === 0) return;

        var parsedDiscourseParameters = sequenceParameters[0].children;
        var labels = [];

        for (type in parsedDiscourseParameters) {
            if (type.includes("label")) {
                labels.push(parsedDiscourseParameters[type]);
            }
        }
        return labels.join(", ")
    },
    isClassValidated: function() {
        var user = Meteor.user();
        var sequenceParameters = SequenceParameters.find({'children.envId': this._id}).fetch();
        var subjectParameters =  SubjectParameters.find({'children.envId': this._id}).fetch();
        var students = Subjects.find({userId: user._id}).fetch();
        let filteredStudents = students.filter(student => student.envId === this._id)
            .map(student => student.info.name)
        var validation = true;
        var seqParamLength = sequenceParameters[0] ? sequenceParameters[0].children.parameterPairs : sequenceParameters.length;
        var subParamLength = subjectParameters[0] ? subjectParameters[0].children.parameterPairs : subjectParameters.length;
        var parameters = [seqParamLength, subParamLength, filteredStudents.length];

        parameters.forEach((p) => {
            if (p === 0) {
                validation = false;
            }
        });

        return validation;
    },
    getStudents: function() {
        var user = Meteor.user();
        if (!user) {
          return;
        }
        var students = Subjects.find({userId: user._id}).fetch();

        let filteredStudents = students.filter(student => student.envId === this._id)
            .map(student => student.info.name)

        return {
            names: filteredStudents.join(", "),
            count: filteredStudents.length
        }
    },
    noStudentsAdded: function() {
        let user = Meteor.user();
        let students = Subjects.find({userId: user._id}).fetch();

        let filteredStudents = students.filter(student => student.envId === this._id)
            .map(student => student.info.name)

        return filteredStudents.length === 0 ? true : false;
    },
    getObservations: function() {
        return Observations.find({envId:this._id}, {sort: {datefield: 1}}).fetch();
    },
    getObservationsCount: function() {
        return Observations.find({envId:this._id}, {sort: {lastModified: -1}}).count();
    },
    hasObsMade: function() {
        var obs = Observations.find({envId:this._id}, {sort: {lastModified: -1}}).fetch();
        if (obs.length === 0) {
            return true
        }
    },
    getEnvName: function() {
        return this.envName;
    }
});


function removeAllShareDialogs() {
  $('.shared-env-dialog').fadeOut({complete: $(this).remove()});
}

function editClassroomName(envId) {
  console.log('envId', envId);
  let context = $('.environment[data-env-id="' + envId + '"]');

  var env_name = $('.environment-name', context);
  var env_name_wrapper = $('.environment-name-wrapper', context);
  var currently_editing = !!(env_name.hasClass('editing'));
  var save_button = $('.edit-classroom-name.button', context);

  if (!currently_editing) {
    env_name_wrapper.prepend($('<input>', {
      class: 'edit-env-name inherit-font-size',
      value: env_name.html()
    }));

    env_name.addClass('editing');
    env_name.hide();
    save_button.show();

    $('.edit-env-name', context).on('keyup', function(e) {
      if (e.keyCode === 13) {
        save_button.click()
      }
    })
  }
  else {
    var new_env_name = $('.edit-env-name', context);
    var new_name = new_env_name.val();

    // set new name here.

    var args = {
      'envId': envId,
      'envName': new_name,
    };

    Meteor.call('environmentRename', args, function(error, result) {
      var message;
      if (result) {
        message = $('<span/>', {
          class: 'name-save-result tag is-success inline-block success-message',
          text: 'Saved'
        });

        env_name.html(new_name);
      }
      else {
        message = $('<span/>', {
          class: 'name-save-result tag is-warning inline-block error-message',
          text: 'Failed to save. Try again later'
        })
      }
      env_name_wrapper.append(message);

      setTimeout(function() {
        message.remove();
      }, 3000);

      return 0;
    });

    save_button.hide();
    new_env_name.remove();
    env_name.removeClass('editing');
    env_name.show();
  }

  save_button.removeClass('is-loading');
}

function duplicateClassroom(orig_env) {
  let context = $('.environment[data-env-id="' + orig_env._id + '"]');

  let modal = createModal('Duplicate Classroom', '', 'duplicate-classroom-modal', true);

  let modal_content = modal.find('.modal-card-body');

  let form_el = $('<div/>', {class: 'field'});
  form_el.append($('<label/>', {
    class: "label",
    text: "New Classroom Name",
    for: 'new-env-name',
  }));
  form_el.append($('<input/>', {
    id: "new-env-name",
    class: 'input',
    value: 'Duplicate of ' + orig_env.envName,
  }));

  modal_content.append(form_el);

  modal_content.append($('<p/>', {
    text: "Please select the box if you would like to copy the students from your previous classroom. Note: discourse parameters and demographics are automatically copied, and may be edited before creating observations if desired.",
    class: 'is-vertical-spaced'
  }));

  form_el = $('<label>/', {
    class: "form-label checkbox spaced-checkbox",
    text: " Students",
    for: 'copy-students',
  }).prepend($('<input/>', {
    id: "copy-students",
    type: 'checkbox',
    checked: true
  }));

  modal_content.append(form_el);

  const students_checkbox = modal_content.find('#copy-students');
  // const parameters_checkbox = modal_content.find('#copy-parameters');
  //
  // parameters_checkbox.on('change', function() {
  //   const value = $(this).is(":checked");
  //   students_checkbox.attr('disabled', !value);
  //   if (students_checkbox) {
  //     students_checkbox.attr('checked', false);
  //   }
  // });

  const modal_footer = modal.find('.modal-card-foot');

  modal_footer.prepend($('<a/>', {
    class: 'button is-primary',
    id: 'submit-duplicate-form',
    text: 'Duplicate Classroom'
  }));

  $('#submit-duplicate-form').on('click', function(e) {
    const import_students = students_checkbox.is(':checked');

    const new_env_name = $('#new-env-name').val();

    const import_values = {
      sourceEnvId: orig_env._id,
      import_students: import_students,
      // import_parameters: import_parameters,
      envName: new_env_name,
    };

    Meteor.call('environmentDuplicate', import_values, function(error, result) {
      if (error && error.error === 'duplicate_error') {
        showDuplicationWarning(error.reason)
      }
    });
    modal.remove();

  });

  function showDuplicationWarning(message) {
    $('.obs-dash-list').append('<div class="duplication-warning notification is-warning">' + message + '</div>');
    setTimeout(function() {
      $('.duplication-warning').remove()
    }, 5000);
  }
}