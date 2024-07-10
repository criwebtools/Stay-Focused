
const y3sf = {
   SAVEANDSTAYCOOKIENAME: "__stayFocused__",
   COOKIEEXPIRATION: 120,
   SAVESTAYBUTTONID: 'submit-btn-savecontinue',
   lastElement: {elementType: null, attribute: null, value: null, scrollY: null}
}

/**
 * A generic debouncer, to reduce the number of window.resize triggers.
 * 
 * @param {*} func 
 * @param {*} wait 
 * @returns 
 */
y3sf.debounce = function(func, wait) {
   let timeout;
   return function(...args) {
       const later = function() {
           clearTimeout(timeout);
           func.apply(this, args);
       };
       clearTimeout(timeout);
       timeout = setTimeout(later, wait);
   };
}

/**
 * THE LAST ELEMENT OBJECT
 * 
 * (1) Properties of the last field that triggered a 'change' or 'click' event,
 * required to identify the field and scroll to it. An element can be identified by
 * its 'id' or 'name' attribute.
 * 
 * (2) The vertical scroll position of the window at the time
 * 
 * @param {*} $element 
 * @param {*} attribute 
 * @returns 
 */
y3sf.setLastElement = function( $element, attribute ) {

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

   y3sf.lastElement = {elementType: elementType, attribute: attribute, value: value, scrollY: scrollY};
}


y3sf.addREDCapFieldListeners = function() {

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
      y3sf.setLastElement( $(this).closest('div') );
   });

   $nonReservedRows.find('button, img.ui-datepicker-trigger').on('click', function () {

      // the input field associated with the button/image
      y3sf.setLastElement( $(this).closest('td').find('input'), 'name' );
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

         y3sf.setLastElement( $(this), 'name' );
      }
   });

   /*
      * sliders are a bit of a challenge
      *
      */
   $nonReservedRows.find('table.sldrparent[role=presentation] span.ui-slider-handle').on('click', function () {

      // the parent div
      y3sf.setLastElement( $(this).closest('div') );
   });

   //console.log('Field listeners initialized');
}

/*
 * save the lastElement field name to cookie when either 'Save & Stay' button is clicked.
 * --> note that the same element id is used for both 'save & stay' buttons
 * also: why the 'a' tag? Maybe that was a thing 5 years ago when I wrote the code?
 */
y3sf.addSaveStayButtonListeners = function() {
   
   $(`a#${y3sf.SAVESTAYBUTTONID}, button#${y3sf.SAVESTAYBUTTONID}`)
      .off('click', y3sf.saveLastElementCookie)
      .on('click' , y3sf.saveLastElementCookie)
   ;
   
   //console.log('Save & Stay button listeners re-initialized');
}

/**
 * LOCAL STORAGE 'COOKIE'
 * 
 * LocalStorage is used to preserve the properties of the last field that triggered 
 * a 'change' or 'click' event, in a timestamped object that emulates a cookie.
 * 
 * This function, called when Save&Stay is clicked, will transfer the object 
 * stored in the variable 'lastElement' to the localStorage 'cookie'.
 */
y3sf.saveLastElementCookie = function() {

   // could be null if no field was updated
   if (!y3sf.lastElement) return;

   // could be empty... maybe
   if (!y3sf.lastElement.elementType || !y3sf.lastElement.attribute || !y3sf.lastElement.value) return;

   let object = {
      elementType: y3sf.lastElement.elementType,
      attribute: y3sf.lastElement.attribute, 
      value: y3sf.lastElement.value, 
      scrollY: y3sf.lastElement.scrollY,
      timestamp: new Date().getTime()
   };

   localStorage.setItem(y3sf.SAVEANDSTAYCOOKIENAME, JSON.stringify(object));
}

/** 
 * Get the last field that had focus from the localStorage 'cookie'.
 * Hopefully this function will fail silently...
 */
y3sf.getLastElementCookie = function() {

   try {
      let json = localStorage.getItem(y3sf.SAVEANDSTAYCOOKIENAME);

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
      if (diffSeconds > y3sf.COOKIEEXPIRATION) return null;

      return object;

   } catch (e) {

      console.error('Error in getLastElementCookie :', e);
      return null;
   }
}

/**
 * Destroy the localStorage 'cookie'.
 */
y3sf.destroyLastElementCookie = function() {
   
   localStorage.removeItem(y3sf.SAVEANDSTAYCOOKIENAME);
}

/**
 * SCROLL TO AND MARK THE LAST FIELD
 */
y3sf.getFocused = function() {
   /**
    * After reload from Save & Stay, the 'required fields missing' modal dialog
    * may render into div#reqPopup. This is not useful in the Save & Stay context.
    * 
    * Therefore, we prevent the modal dialog from rendering by
    * blowing away its parent element(!)
    */
   $('div#reqPopup').remove();

   const $lastElement = $(`${y3sf.lastElement.elementType}[${y3sf.lastElement.attribute}="${y3sf.lastElement.value}"]`);

   // a slider container is a table, not a td
   const $lastElementContainer = ( $lastElement.hasClass('slider') ) ? $lastElement.closest('table') : $lastElement.closest('td');

   const submitButtonColor = $(`#${y3sf.SAVESTAYBUTTONID}`).css('background-color');

   $lastElementContainer
      .prop('title', 'StayFocused: This is the last field you were working on.')
      .css({
      'border-right': `3px solid ${submitButtonColor}`,
      'border-bottom': `3px solid ${submitButtonColor}`
   });

   window.scrollTo({behavior: 'instant', top: y3sf.lastElement.scrollY, 'left': 0});

   /**
    * It is possible for the 'scrollY' property to set to the location of the 'Save&Submit' button, not the field.
    * This happens when the user exits the field by scrolling to and clicking one of the 'Save&Submit' buttons, 
    * without tabbing out of the field.
    * This will cause the page to scroll to the button, not the field container.
    * Therefore, we need to check if the container element is in the viewport, and if not to scroll it into view.
    */
   if ( !y3sf.isElementInViewport($lastElementContainer) ) {

      $lastElementContainer[0].scrollIntoView({behavior: 'instant', block: 'center', inline: 'nearest'});
   }

   /**
    * remove lastelement structures
    */
   y3sf.lastElement = null;
   y3sf.destroyLastElementCookie();

}

y3sf.isElementInViewport = function($el) {
   const rect = $el[0].getBoundingClientRect();
   const windowHeight = $(window).height();
   const windowWidth = $(window).width();
   
   return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth
   );
}

/**
 * A window resize will apparently destroy all 'Save & Stay' button onclick handlers, then re-install them.
 * This call ensures that the Stay Focused! listeners are re-installed only after the window has stopped resizing for at least 500msec.
 * A big bounce is okay in this context.
 */
$( window ).on('resize', y3sf.debounce( function(){ y3sf.addSaveStayButtonListeners() }, 500 ));

$( function(){

   // add listeners to form fields and the Save & Stay buttons
   y3sf.addREDCapFieldListeners();
   y3sf.addSaveStayButtonListeners();

   // did Save & Stay leave a cookie for us?
   y3sf.lastElement = y3sf.getLastElementCookie()

   if ( y3sf.lastElement ) {

      /*
         * SCROLL AND MARK BOUNDARY
         * We have to wait a bit to skip past a 10ms delay in setting the focus on the first field.
         * ( DataEntry.js approx line 50 )
         */
      setTimeout(y3sf.getFocused, 50);
   }
});

