(function(){

   // ECMAScript 5 or higher

   var lastFieldThatHadFocus = null;
   var SAVEANDSTAYCOOKIENAME = "__stayFocused__";

   function reFocus(){

      /*

       Brutal but effective:

       After reload from Save & Stay, the 'required fields missing' modal dialog
       may render into div#reqPopup. This is not useful in the Save & Stay context.

       Therefore, we prevent the modal dialog from rendering by
       blowing away its parent element(!)

       */

      $('div#reqPopup').remove();

      // scroll to the target field's parent element
      $([document.documentElement, document.body]).animate({
         scrollTop: $('tr#' + lastFieldThatHadFocus + '-tr').offset().top
      }, 1000);

      // mark the where-we-left-off boundary
      $('tr#' + lastFieldThatHadFocus + '-tr').css('border-bottom', '4px solid dodgerblue');

   }

   function setLastFieldThatHadFocus( element ){

      lastFieldThatHadFocus = element.closest('tr[sq_id]').attr('sq_id');

      //console.log('stayFocused(click): ', lastFieldThatHadFocus);

   }

   function addListeners() {

      /*
       * clickable elements:
       * - any button ('today', 'now' etc)
       * - any jQuery datepicker (calendar / time)
       * - file upload links (includes econsents)
       * --> note that the reset link is excluded. Only nonblank data entry qualifies.
       */
      $('tr[sq_id] div.ui-slider, tr[sq_id] span.ui-slider-handle, tr[sq_id] button, tr[sq_id] a.fileuploadlink, tr[sq_id] img.ui-datepicker-trigger').on('click', function () {

         setLastFieldThatHadFocus( $(this) );

      });

      /*
       * input elements, for which the 'change' event can be handled:
       * - any non-readonly <input> (excludes calculated fields)
       * - any <textarea>
       * - any <select>
       * --> only nonblank data entry is recognized
       */
      $('tr[sq_id] input:not([readonly]), tr[sq_id] textarea, tr[sq_id] select').on('change', function () {

         if ( $(this).val() ) {
            setLastFieldThatHadFocus($(this));
         }

      });

      /*
       * save the lastFieldThatHadFocus field name to cookie when either 'Save & Stay' button is clicked.
       * --> note that the same element id is used for both 'save & stay' elements
       */
      $('a#submit-btn-savecontinue, button#submit-btn-savecontinue').on('click', function() {

         /*
          * The cookie should be erased directly upon page reload.
          * Just in case, we give it a 2 minute lifespan to allow for a REALLY long reload.
          */
         setCookie(SAVEANDSTAYCOOKIENAME, lastFieldThatHadFocus, 120);

      });
   }

   // Cookies, SO-style

   function setCookie( cookieName, value, seconds ) {
      seconds = seconds || 3600; // default one hour retention
      var date = new Date();
      date.setTime(date.getTime() + (seconds*1000));
      document.cookie = cookieName + "=" + (value || "") + "; expires=" + date.toUTCString() + "; path=/";
   }

   function getCookie( cookieName ) {
      var nameEQ = cookieName + "=";
      var ca = document.cookie.split(';');
      // look for our cookie
      for(var i=0;i < ca.length;i++) {
         var c = ca[i].trim();
         if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
      }
      console.log('stayFocused(no cookie):', document.cookie);
      return null;
   }

   function eraseCookie( cookieName ) {
      document.cookie = cookieName +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
   }

   $( document ).ready(function(){

      // add listeners to form fields and the Save & Stay buttons
      addListeners();

      // did Save & Stay leave a cookie?
      if ( (lastFieldThatHadFocus = getCookie( SAVEANDSTAYCOOKIENAME )) ){

         // make sure it can't cause any mischief on subsequent form loads
         eraseCookie( SAVEANDSTAYCOOKIENAME );

         // scroll and mark the boundary
         reFocus();

      }

   });

})();
