/* InteractJS Start */

Template.editSpec.rendered = function() {

interact('.draggable')
  .draggable({
    onmove: window.dragMoveListener,
	// enable inertial throwing
       inertia: true,
       // keep the element within the area of it's parent
       // enable autoScroll
       autoScroll: true,

       // call this function on every dragmove event
       onmove: dragMoveListener,
       // call this function on every dragend event
       onend: function (event) {
         var textEl = event.target.querySelector('p');

         textEl && (textEl.textContent =
           'moved a distance of '
           + (Math.sqrt(event.dx * event.dx +
                        event.dy * event.dy)|0) + 'px');
       }
  })
  .resizable({
    preserveAspectRatio: true,
    edges: { left: true, right: true, bottom: true, top: true }
  })
  .on('resizemove', function (event) {
    // update the element's style
    $('.subject').each(function(index){
      this.style.width  = event.rect.width + 'px';
      this.style.height = event.rect.height + 'px';
      });
  });

  function dragMoveListener (event) {
    var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    // translate the element
    target.style.webkitTransform =
    target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';

    // update the posiion attributes
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
  }

  // this is used later in the resizing and gesture demos
  window.dragMoveListener = dragMoveListener;
}

/* InteractJS End */
Template.editSpec.events({
  'click .esGoBack': function(e) {
    Router.go('observationList', {_envId:Router.current().params._envId});
  },

  'click #moveSubjects': function(e) {
    $.each( $('.subjects'), function(i, subjects) {
       $('.subject', subjects).each(function() {
          $(".subject").addClass("draggable");
       });
     })
    $("#moveSubjects").remove();
    $("#control_bar").append('<button type="button" id=saveSubjects class="btn btn-warning">Save Subject Locations</button>')
  },

   'click #saveSubjects': function(e) {
     $.each( $('.subjects'), function(i, subjects) {
        $('.subject', subjects).each(function() {
           $(".subject").removeClass("draggable");
           width=$(this).css('width');
           width=width.substring(0,width.length-2);
           height=$(this).css('height');
           height=height.substring(0,height.length-2);
           var subjectPositionSize = {
             subjXPos: $(this).attr('data-x'), //FOR EXAMPLE: $('#subjXPos').val() On some hidden field
             subjYPos: $(this).attr('data-y'),  //FOR EXAMPLE: $('#subjYPos').val() On some hidden field
             subjXSize: width,
             subjYSize: height,
             _id: this.id
           };

           Meteor.call('subjectPositionUpdate', subjectPositionSize, function(error, result) {
             return 0;
           });

        });
      })
     $("#saveSubjects").remove();
     $("#control_bar").append('<button type="button" id=moveSubjects class="btn btn-warning">Move Subjects</button>')

   },


  'click #createNewSubject': function(e) {
   $('#createSubjPopup').modal({
     keyboard: true,
     show: true
   });
   $('#createSubjPopup').on('shown.bs.modal', function () {
      $('#subjectName').focus();
   })
 },

  'click #saveName': function(e) {

   var subject = {
     subjName: $('#subjectName').val(),
     subjAge: $('#subjectAge').val(),
     subjGender: $('#subjectGender').val(),
     subjRace: $('#SubjectRace').val(),
     subjXPos: '',
     subjYPos: '',
     subjXSize: '',
     subjYsize: '',
     envId: this._id
   };

   Meteor.call('subjectInsert', subject, function(error, result) {
     return 0;
   });

   $('#createSubjPopup').modal('hide');
   $('#subjectName').val('');
   $('#subjectAge').val('');
   $('#subjectGender').val('');
   $('#SubjectRace').val('');
 }
});

Template.editSpec.helpers({
  subject: function() {
    return Subjects.find({envId: this._id});
  }
});