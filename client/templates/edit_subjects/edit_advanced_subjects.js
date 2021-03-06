import {find_open_position} from "./edit_subjects";
import {console_log_conditional} from "/helpers/logging"

const partial_rows = new ReactiveVar([]);
const showStudentRows = new ReactiveVar(true);
const deletedRows = new ReactiveVar({});

Template.editSubjectsAdvanced.helpers({
  deletedClass: function (id) {
    let rows = deletedRows.get();
    return (typeof rows[id] !== 'undefined' && rows[id] === true) ? ' deleted-student' : '';
  },
  isDeleted: function (id) {
    let rows = deletedRows.get();
    return (typeof rows[id] !== 'undefined' && rows[id] === true)
  },
  isDeletedText: function (id) {
    let rows = deletedRows.get();
    return (typeof rows[id] !== 'undefined' && rows[id] === true) ? 'true' : 'false'
  },
  deleteButtonClass: function (id) {
    let rows = deletedRows.get();
    return (typeof rows[id] !== 'undefined' && rows[id] === true) ? 'undo-remove-student' : 'remove-student'
  },
  deleteButtonText: function (id) {
    let rows = deletedRows.get();
    return (typeof rows[id] !== 'undefined' && rows[id] === true) ? '+' : '-'
  },
  showStudentRows: function () {
    return showStudentRows.get()
  },
  envId: function () {
    return this.environment._id;
  },
  subjects: function () {
    return Subjects.find({envId: this.environment._id})
  },
  subject_parameters: function () {
    let subj_params = SubjectParameters.findOne({envId: this.environment._id}).parameters;
    return subj_params
  },
  className: function (text) {
    return getClassName(text);
  },
  student_rows: function () {
    let students = Subjects.find({envId: this.environment._id});
    let subj_params = SubjectParameters.findOne({envId: this.environment._id});

    let student_rows = [];

    students.forEach(function (student) {
      let columns = [];
      columns.push({
        id: 'student--name--' + student._id,
        data_student_id: student._id,
        data_field_type: 'base',
        data_field: 'name',
        data_student_type: 'existing',
        value: student.info.name,
      });
      subj_params.parameters.forEach(function (param) {
        columns.push({
          id: 'student--' + getClassName(param.label) + '--' + student._id,
          data_student_id: student._id,
          data_field_type: 'param',
          data_field: param.label,
          data_student_type: 'existing',
          value: student.info.demographics[param.label],
        })
      })

      student_rows.push({
        id: student._id,
        status: 'existing',
        data_x: student.data_x,
        deleted: false,
        data_y: student.data_y,
        columns: columns,
      })
    })

    examinePartialRows(this.environment._id);

    let local_partial_rows = partial_rows.get();
    local_partial_rows.forEach(row => student_rows.push(row));

    return student_rows;
  }
});

let examinePartialRows = function (envId) {
  let rows = partial_rows.get();
  let subj_params = SubjectParameters.findOne({envId: envId});

  if (rows.length === 0 ||
    !(rows[rows.length - 1].columns.map(field => field.value).every(value => !value || value.length === 0))) {
    addNewRow(subj_params.parameters);
  }
};

Template.editSubjectsAdvanced.events({
  'click .remove-student': function (e, template) {
    let target = $(e.target);
    let row = target.parents('tr');
    if (row.attr('data-row-status') === 'new') {
      let new_rows = partial_rows.get();
      let row_to_remove = new_rows.findIndex(r => r.id === row.attr('data-student-id'))
      new_rows.splice(row_to_remove, 1);
      partial_rows.set(new_rows);
      setTimeout(function () {
        checkTableValues(SubjectParameters.findOne({envId: template.data.environment._id}).parameters)
      }, 500)
    }
    else {
      let del_rows = deletedRows.get();
      del_rows[row.attr('data-student-id')] = true;
      deletedRows.set(del_rows);
    }

  },
  'click .undo-remove-student': function (e) {
    let row = $(e.target).parents('tr');
    let del_rows = deletedRows.get();
    del_rows[row.attr('data-student-id')] = false;
    deletedRows.set(del_rows);
  },
  'focusout input[data-student-type="new"]': function (e, template) {
    let target = $(e.target);
    let rows = partial_rows.get();
    let row = rows.find(row => row.id === target.attr('data-student-id'));
    let column = row.columns.find(column => column.id === target.attr('id'));
    column.value = target.val();
    partial_rows.set(rows);
  },
  'focusout .student-data-input': function (e, template) {
    let target = $(e.target);
    if (checkTableValues(SubjectParameters.findOne({envId: template.data.environment._id}).parameters)) {
      target.removeClass('invalid-param-value')
    }
    else {
      target.addClass('invalid-param-value')
    }
  },
  'keyup .student-data-input': function (e, template) {
    if (e.keyCode === 13) {
      let target = $(e.target);
      let new_target;
      if (e.shiftKey) {
        new_target = target.parents('tr').prev().find('input[data-field="' + target.attr('data-field') + '"][data-field-type="' + target.attr('data-field-type') + '"]')
      }
      else {
        new_target = target.parents('tr').next().find('input[data-field="' + target.attr('data-field') + '"][data-field-type="' + target.attr('data-field-type') + '"]')
      }
      new_target.focus();
    }
  },
  'click .delete-all-students': function (e, template) {
    $('.remove-student').click();
  },
  'click .undelete-all-students': function (e, template) {
    $('.undo-remove-student').click();
  },
  'paste .student-data-input': function (e, template) {
    let target = $(e.target);
    let data = e.originalEvent.clipboardData.getData('text');
    // console_log_conditional('e.clipboardData.types', e.originalEvent.clipboardData.types);
    // e.originalEvent.clipboardData.types.forEach(function(type) {
    //   console_log_conditional('version', type, e.originalEvent.clipboardData.getData(type));
    // });
    if (!data.match(/\t.*[\n\r]/g)) {
      console_log_conditional('no tabular data found on paste');
      return;
    }
    let rows = data.split(/(\r\n|[\n\r])/g);
    let params = SubjectParameters.findOne({envId: template.data.environment._id}).parameters
    let param_names = params.map(param => param.label);
    param_names.push('name');
    let headers = {};

    if (rows[0].split(/\t/g).some(header => !!param_names.find(name => name.toLowerCase() === header.toLowerCase()))) {
      if (!rows[0].split(/\t/g).every(header => !!param_names.find(name => name.toLowerCase() === header.toLowerCase()))) {
        alert("Some of the data you pasted was able to match to existing columns, but not all. The following headers did not match: " +
          rows[0].split(/\t/g).filter(col => !param_names.find(name => name.toLowerCase() === col.toLowerCase())).join(', ')
          + '.\nThe data in those columns were not imported.')
      }
      let header_row_items = rows[0].split(/\t/g)
      header_row_items.forEach(function (header_item, index) {
        if (!!param_names.find(name => name.toLowerCase() === header_item.toLowerCase())) {
          headers[index] = header_item;
        }
        else {
          console_log_conditional("didn't find any headers in item", header_item);
        }
      })
    }
    else {
      console_log_conditional('No headers found.')
    }

    let structured_data = rows.map(function (row) {
      console_log_conditional('row', row);
      return row.split(/\t/g);
    })

    if (Object.keys(headers).length > 0) {
      structured_data = structured_data.slice(1, structured_data.length);
    }

    if (Object.keys(headers).length === 0) {
      alert('Pasting tabular data without headers not supported');
      return;
    }

    structured_data.forEach(function (row) {
      if (Object.keys(headers).length > 0) {
        let new_row_data = {};
        Object.keys(headers).forEach(function (index) {
          new_row_data[headers[index]] = row[index]
        })
        console_log_conditional('new row data', new_row_data);
        addNewRow(params, new_row_data);
      }
      else {
        // later, we can add support for just pasting tabular data.
      }
    });

    e.preventDefault();
    if (target.attr('data-student-type') === 'new') {
      target.parents('tr').find('.remove-student').click();
    }
    setTimeout(function () {
      if (!checkTableValues(params)) {
        alert('Errors found in pasted data. Please review your input for any highlighted issues.');
      }
    }, 500)
  },
  'click .save-all-students': function (e, template) {
    let params = SubjectParameters.findOne({envId: template.data.environment._id}).parameters;
    if (!checkTableValues(params)) {
      alert('Errors found, not saving. Please review your input for any highlighted issues.');
      return;
    }
    saveStudentsTable(template.data.environment._id, params)
  },
  'click .check-all-students': function (e, template) {
    let params = SubjectParameters.findOne({envId: template.data.environment._id}).parameters;
    checkTableValues(params);
    if (!checkTableValues(params)) {
      alert('Errors found. Please review your input for any highlighted issues.');
    }
    else {
      alert('All good!')
    }
  }
});


let saveStudentsTable = function (envId, params) {

  let students_info = []
  $('tr.student-row').each(function (idx) {
    let $row = $(this);
    // Don't save completely empty rows.
    let row_empty = true;
    $row.find('input').each(function () {
      if ($(this).val()) {
        row_empty = false;
      }
    })
    if (row_empty) {
      return;
    }

    // create demos obj.
    let demos = {};
    params.forEach(function (param) {
      demos[param.label] = $row.find('input[data-field="' + param.label + '"][data-field-type="param"]').val();
    })


    students_info.push({
      _id: $row.attr('data-student-id'),
      status: $row.attr('data-row-status'),
      deleted: ($row.attr('data-deleted') === 'true'),
      data_x: $row.attr('data-x'),
      data_y: $row.attr('data-y'),
      envId: envId,
      info: {
        name: $row.find('input[data-field="name"][data-field-type="base"]').val(),
        demographics: demos
      }
    })
  });

  students_info.forEach(function (student) {
    if (student.deleted) {
      Meteor.call('subjectDelete', student._id);
    }
    else if (student.status === 'existing') {
      let update_student = {
        id: student._id,
        info: student.info
      };
      Meteor.call('subjectUpdate', update_student);
    }
    else if (student.status === 'new') {
      let new_pos = find_open_position(students_info);
      // setting on the student obj so the next
      // new student will see it when looking for a spot.
      student.data_x = new_pos.x;
      student.data_y = new_pos.y;
      let new_student = {
        envId: student.envId,
        data_x: String(student.data_x),
        data_y: String(student.data_y),
        info: student.info
      };
      Meteor.call('subjectInsert', new_student);
    }
  });

  // todo: force rerender some other way.
  refreshTableContent();
  partial_rows.set([]);
  // setTimeout(function() {document.location.reload()}, 2000);
}

let addNewRow = function (params, values) {
  if (typeof values === 'undefined') {
    values = {};
  }
  let rows = partial_rows.get();
  let new_row_id = 0;

  rows.forEach(function (row) {
    if (row.new_row_number >= new_row_id) {
      new_row_id = row.new_row_number + 1;
    }
  });

  let new_row_columns = [{
    id: 'student--name--new-row-' + new_row_id,
    data_student_id: 'new-row--' + new_row_id,
    data_field_type: 'base',
    data_field: 'name',
    data_student_type: 'new',
    value: (typeof values['name'] !== 'undefined') ? values.name : ((typeof values['Name'] !== 'undefined') ? values.Name : ''),
  }]
  params.forEach(function (param) {
    new_row_columns.push({
      id: 'student--' + getClassName(param.label) + '--new-row-' + new_row_id,
      data_student_id: 'new-row--' + new_row_id,
      data_field_type: 'param',
      data_field: param.label,
      data_student_type: 'new',
      value: (typeof values[param.label] !== 'undefined') ? values[param.label] : '',
    });
  });

  rows.push({
    new_row_number: new_row_id,
    id: 'new-row--' + new_row_id,
    data_x: '0',
    data_y: '0',
    deleted: false,
    status: 'new',
    columns: new_row_columns,
  });
  partial_rows.set(rows);
}


let getClassName = function (text) {
  return text.toLowerCase().replace(' ', '-')
}

let checkCellValue = function (cell, parameters) {
  if (cell.attr('data-field-type') === 'base' && cell.attr('data-field') === 'name') {
    return true;
  }
  let options = parameters.find(param => param.label === cell.attr('data-field')).options
  return !!options.find(opt => opt === cell.val())
};


// run this on each paste
// also check for duplicate names? do we allow dupe names right now?
// todo: also need to do validation of this input on the server side when we save.
let checkTableValues = function (parameters) {
  let table_passes = true;
  $('tr.student-row').each(function (idx) {
    let $row = $(this);
    // Don't check completely empty rows, they won't be saved anyway.
    let row_empty = true;
    $row.find('input').each(function () {
      if ($(this).val()) {
        row_empty = false;
      }
    });
    if (row_empty) {
      $row.find('input').removeClass('invalid-param-value');
      return;
    }
    $row.find('input').each(function () {
      let $input = $(this);
      if (checkCellValue($input, parameters)) {
        $input.removeClass('invalid-param-value')
      }
      else {
        if (!($row.attr('data-deleted') === 'true')) {
          table_passes = false;
        }
        $input.addClass('invalid-param-value')
      }
    })
  });
  return table_passes;
}
//
//
// students_list.map(function(student) {
//   let demos = {};
//   Object.keys(student.info).forEach(function(param) {
//     if (param === 'name') {
//       return;
//     }
//     demos[param] = student.info[param];
//   })
//   student.info = {
//     name: student.info.name,
//     demographics: demos
//   }
//   return student;
// })

let refreshTableContent = function () {
  showStudentRows.set(false);
  showStudentRows.set(true);
}
