(function(){

   const SAVEANDSTAYCOOKIENAME = "__stayFocused__";
   const COOKIEEXPIRATION = 120; // seconds
   const SAVESTAYBUTTONID = 'submit-btn-savecontinue';
   let lastFieldThatHadFocus = {elementType: null, attribute: null, value: null, scrollY: null};

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
       * - slider elements
       * - any jQuery datepicker (calendar / time)
       * - file upload links (includes econsents)
       * --> note that the reset link is excluded. Only nonblank data entry qualifies.
       */

      $nonReservedRows.find('a.fileuploadlink').on('click', function () {

         // the parent div
         setLastFieldThatHadFocus( $(this).closest('div') );
      });

      $nonReservedRows.find('button, img.ui-datepicker-trigger').on('click', function () {

         // the input field associated with the button/image
         setLastFieldThatHadFocus( $(this).closest('td').find('input'), 'name' );
      });

      /*
       * input elements, for which the 'change' event can be handled:
       * - any non-readonly <input> (excludes calculated fields)
       * - any <textarea>
       * - any <select>
       * --> only nonblank data entry is recognized
       */
      $nonReservedRows.find('input, textarea, select').on('change', function () {

         if ( $(this).val() ) {

            setLastFieldThatHadFocus( $(this), 'name' );
         }
      });

      /*
       * sliders are a bit of a challenge
       *
       */
      $nonReservedRows.find('table.sldrparent[role=presentation] span.ui-slider-handle').on('click', function () {

         // the parent div
         setLastFieldThatHadFocus( $(this).closest('div') );
      });

      /*
       * save the lastFieldThatHadFocus field name to cookie when either 'Save & Stay' button is clicked.
       * --> note that the same element id is used for both 'save & stay' buttons
       * also: why the 'a' tag? Maybe that was a thing 5 years ago when I wrote the code?
       */
      $(`a#${SAVESTAYBUTTONID}, button#${SAVESTAYBUTTONID}`).on('click', function() {

         /*
          * Save the last field that had focus to the localStorage 'cookie'
          */
          saveLastFieldThatHadFocus();
      });
   }

   function setLastFieldThatHadFocus( $element, attribute ) {

      attribute = attribute || '';

      const elementType = $element.prop('tagName').toLowerCase();
      const scrollY = window.scrollY;
      let value = null;

      if ( !attribute) {
         if ( $element.attr('id') ) {
            attribute = 'id';
            value = $element.attr('id');
         } 
         else if ( $element.attr('name') ) {
            attribute = 'name';
            value = $element.attr('name');
         }
      }

      if ( !attribute ) return;

      value = $element.attr(attribute);

      if ( !value ) return;

      lastFieldThatHadFocus = {elementType: elementType, attribute: attribute, value: value, scrollY: scrollY};

      console.log('setLastFieldThatHadFocus ', lastFieldThatHadFocus);
   }

   /*
    * LOCAL STORAGE 'COOKIE' FUNCTIONS
    * localStorage is used to preserve the name last field that had focus, in a timestamped object that emulates a cookie.
    * It is set by save&stay, and picked up after the page reload.
    */
   function  saveLastFieldThatHadFocus() {

      console.log('saveLastFieldThatHadFocus: ', lastFieldThatHadFocus);

      if (!lastFieldThatHadFocus.attribute || !lastFieldThatHadFocus.value) return;

      let object = {
         elementType: lastFieldThatHadFocus.elementType,
         attribute: lastFieldThatHadFocus.attribute, 
         value: lastFieldThatHadFocus.value, 
         timestamp: new Date().getTime(),
         scrollY: lastFieldThatHadFocus.scrollY
      };

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

         let thenTimestamp = parseInt(object.timestamp);
         if (!thenTimestamp) {
            console.error('No timestamp found in the saved object');
            return null;
         }

         let nowTimestamp = new Date().getTime();
         let diffSeconds = (nowTimestamp - thenTimestamp) / 1000;

         if (isNaN(diffSeconds)) {
            console.error('Invalid timestamp difference');
            return null;
         }

         // stale cookies shouldn't happen, but life finds a way
         if (diffSeconds > COOKIEEXPIRATION) return null;

         return object;

      } catch (e) {

         console.error('Error in getLastFieldThatHadFocus :', e);
         return null;
      }
   }

   function removeLastFieldThatHadFocus() {
      
      localStorage.removeItem(SAVEANDSTAYCOOKIENAME);
   }

   function isElementInViewport($el) {
      const rect = $el[0].getBoundingClientRect();
      return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || $(window).height()) &&
      rect.right <= (window.innerWidth || $(window).width())
      );
   }


   function getFocused() {
      /*

       Brutal but effective:

       After reload from Save & Stay, the 'required fields missing' modal dialog
       may render into div#reqPopup. This is not useful in the Save & Stay context.

       Therefore, we prevent the modal dialog from rendering by
       blowing away its parent element(!)

       */

      $('div#reqPopup').remove();

      const $lastFieldItem = $(`${lastFieldThatHadFocus.elementType}[${lastFieldThatHadFocus.attribute}="${lastFieldThatHadFocus.value}"]`);
 
      const $lastFieldItemContainer = ( $lastFieldItem.hasClass('slider') ) ? $lastFieldItem.closest('table') : $lastFieldItem.closest('td');

      const submitButtonColor = $(`#${SAVESTAYBUTTONID}`).css('background-color');

      console.log('getFocused :', lastFieldThatHadFocus, $lastFieldItem, $lastFieldItemContainer, submitButtonColor);

      $lastFieldItemContainer.css('border', `4px solid ${submitButtonColor}`);

      window.scrollTo({behavior: 'instant', top: lastFieldThatHadFocus.scrollY, 'left': 0});

      // we still need to check if the element is in the viewport, and if not to scroll it into view
      if ( !isElementInViewport($lastFieldItemContainer) ) {

         $lastFieldItemContainer[0].scrollIntoView({behavior: 'instant', block: 'center', inline: 'nearest'});
      }
   }
  
   $( function(){

      // add listeners to form fields and the Save & Stay buttons
      
      addListeners();

      // did Save & Stay leave a cookie for us?

      lastFieldThatHadFocus = getLastFieldThatHadFocus()

      console.log('onload: lastFieldThatHadFocus=', lastFieldThatHadFocus);

      if ( lastFieldThatHadFocus ) {

         // remove the 'cookie'

         removeLastFieldThatHadFocus();

         /*
          * SCROLL AND MARK BOUNDARY
          * We need to wait for the page to render before scrolling to the field.
          * We also have to wait a bit to skip past a 10ms delay in setting the focus on the first field.
          * ( DataEntry.js approx line 50 )
          */
         setTimeout(getFocused, 50);
      }
   });

})();
