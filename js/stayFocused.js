(function(){

   // ECMAScript 5 or higher

   let lastFieldThatHadFocus = null;
   const SAVEANDSTAYCOOKIENAME = "__stayFocused__";
   const COOKIEEXPIRATION = 120; // seconds

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
      }, 500);

      // mark the where-we-left-off boundary
      $('tr#' + lastFieldThatHadFocus + '-tr').css('border-bottom', '4px solid dodgerblue');

   }

   function setLastFieldThatHadFocus( element ){

      lastFieldThatHadFocus = element.closest('tr[sq_id]').attr('sq_id');

      console.log('setLastFieldThatHadFocus ', lastFieldThatHadFocus);
   }

   function addListeners() {

      /*
       * IDENTIFYING DATA ENTRY ELEMENTS
       *
       * As of this writing (REDCap v14.0.31) data entry fields are rendered as fields within rows having the 'sq_id' attribute.
       * For these rows, the 'sq_id' attribute's value is the field name.
       * 
       * However, certain rows having the 'sq_id' attribute are reserved for REDCap system elements such as submit buttons (sq_id=__SUBMITBUTTONS__), the record lock checkbox (sq_id=__LOCKRECORD__), etc.
       * Also, header rows appear to have the 'sq_id' attribute set to curly braces.       
       * 
       * These rows are not data entry rows and should be excluded.
       * 
       * The $nonReservedRows jQuery object is a collection of all data entry rows having the 'sq_id' attribute for which the value does not start with '__' or '{'.
       */
      const $nonReservedRows = $('tr[sq_id]:not([sq_id^="__"]):not([sq_id^="{"])');

      /*
       * clickable elements:
       * - any button ('today', 'now' etc)
       * - any jQuery datepicker (calendar / time)
       * - file upload links (includes econsents)
       * --> note that the reset link is excluded. Only nonblank data entry qualifies.
       */

      //$('tr[sq_id] div.ui-slider, tr[sq_id] span.ui-slider-handle, tr[sq_id] button, tr[sq_id] a.fileuploadlink, tr[sq_id] img.ui-datepicker-trigger').on('click', function () {
      $nonReservedRows.find('div.ui-slider, span.ui-slider-handle, button, a.fileuploadlink, img.ui-datepicker-trigger').on('click', function () {

         setLastFieldThatHadFocus( $(this) );
      });

      /*
       * input elements, for which the 'change' event can be handled:
       * - any non-readonly <input> (excludes calculated fields)
       * - any <textarea>
       * - any <select>
       * --> only nonblank data entry is recognized
       */

      //$('tr[sq_id] input:not([readonly]), tr[sq_id] textarea, tr[sq_id] select').on('change', function () {
      $nonReservedRows.find('input:not([readonly]), textarea, select').on('change', function () {

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
          * Save the last field that had focus to the localStorage 'cookie'
          */
          saveLastFieldThatHadFocus();
      });
   }

   /*
    * LOCAL STORAGE FUNCTIONS
    * localStorage is used to preserve the name last field that had focus, in a timestamped object that emulates a cookie.
    * It is set by save&stay, and picked up after the page reload.
    */

   function  saveLastFieldThatHadFocus() {

      let object = {value: lastFieldThatHadFocus, timestamp: new Date().getTime()}
      localStorage.setItem(SAVEANDSTAYCOOKIENAME, JSON.stringify(object));
   }

   /* 
    * Get the last field that had focus from the localStorage 'cookie'.
    * Hopefully this function will fail silently...
    */
   function getLastFieldThatHadFocus () {

      try {
          let json = localStorage.getItem(SAVEANDSTAYCOOKIENAME);
  
          // Return null if no saved item
          if (!json) return null;
  
          let object;
          try {
              object = JSON.parse(json);
          } catch (e) {
              console.error('Error parsing JSON:', e);
              return null;
          }
  
          let setTimestamp = object.timestamp;
          if (!setTimestamp) {
              console.error('No timestamp found in the saved object');
              return null;
          }
  
          let nowTimestamp = new Date().getTime();
          let diffSeconds = (nowTimestamp - setTimestamp) / 1000;
  
          if (isNaN(diffSeconds)) {
              console.error('Invalid timestamp difference');
              return null;
          }
  
          console.log('getLastFieldThatHadFocus :', new Date(setTimestamp).toString(), new Date(nowTimestamp).toString(), diffSeconds);
  
          if (diffSeconds > COOKIEEXPIRATION) return null;
  
          return object.value;

      } catch (e) {

          console.error('Error in getLastFieldThatHadFocus :', e);
          return null;
      }
   }

   function removeLastFieldThatHadFocus() {
      
      localStorage.removeItem(SAVEANDSTAYCOOKIENAME);
   }
  
   $( document ).ready(function(){

      // add listeners to form fields and the Save & Stay buttons
      addListeners();

      // did Save & Stay leave a cookie for us?
      if ((lastFieldThatHadFocus = getLastFieldThatHadFocus ())) {

         // remove the cookie
         removeLastFieldThatHadFocus();

         // scroll and mark the boundary
         reFocus();
      }
   });

})();
