
const y3sf = {
   SAVEANDSTAYCOOKIENAME: "__stayFocused__",
   COOKIEEXPIRATION: 120,
   SAVESTAYBUTTONID: 'submit-btn-savecontinue',
   NULLLASTELEMENT: {elementType: null, attribute: null, elementKey: null, scrollY: null},
   lastElement: null, // an object to store info about the last field that triggered a 'change' or 'click' event
   kmiss: 0 // blank required values reported on reload; a nod to the old days (BMDP)
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
   let elementKey = null;

   if ( !attribute) {
      if ( $element.attr('id') ) {
         attribute = 'id';
      } 
      else if ( $element.attr('name') ) {
         attribute = 'name';
      }
   }

   if ( !attribute ) return;

   elementKey = $element.attr(attribute);

   if ( !elementKey ) return; 

   y3sf.lastElement = {elementType: elementType, attribute: attribute, elementKey: elementKey, scrollY: scrollY};
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
   const $nonReservedRows = $('form#form tr[sq_id]:not([sq_id^="__"]):not([sq_id^="{"])');

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

   /** 
    * sliders are a bit of a challenge.
    * Change is detected by the 'mouseup' event on the slider handle, not the readonly input element.
    * This mostly works.
    */
   $nonReservedRows.find('table.sldrparent[role=presentation] span.ui-slider-handle').on('mouseup', function () {

      // the parent div
      y3sf.setLastElement( $(this).closest('div') );
   });
}

/*
 * save the lastElement field name to cookie when either 'Save & Stay' button is clicked.
 * --> note that the same element id is used for both 'save & stay' buttons (and link)
 */
y3sf.addSaveStayButtonListeners = function() {
   
   $(`a#${y3sf.SAVESTAYBUTTONID}, button#${y3sf.SAVESTAYBUTTONID}`)
      .off('click', y3sf.saveLastElementCookie)
      .on('click' , y3sf.saveLastElementCookie)
   ;
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

   let object = y3sf.NULLLASTELEMENT;

   if ( y3sf.lastElement && y3sf.lastElement.elementType && y3sf.lastElement.attribute && y3sf.lastElement.elementKey ) {

      object = {
         elementType: y3sf.lastElement.elementType,
         attribute: y3sf.lastElement.attribute, 
         elementKey: y3sf.lastElement.elementKey, 
         scrollY: y3sf.lastElement.scrollY
      };
   }
   else {

      // no data entry detected, so at least save the current scroll position
      object.scrollY = window.scrollY;
   }

   object.timestamp = new Date().getTime();

   //alert('Saving last element:' + JSON.stringify(object));

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
      if (diffSeconds > y3sf.COOKIEEXPIRATION) {
         
         y3sf.destroyLastElementCookie();
         return null;
      }

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
 * Close the required fields dialog
 */
y3sf.closeReqPopup = function() {

   const $reqPopup = $('div#reqPopup');

   // if the reqPopup is not rendered in the DOM, return true, as it is not an issue
   if ( !$reqPopup.length ) return true;

   if ( $reqPopup.length && $reqPopup.hasClass("ui-dialog-content") && $reqPopup.dialog("isOpen") ) { 

      y3sf.kmiss = $reqPopup.find('span[data-mlm-field-label]').length; // seems the best way to tally the missing fields
      
      $reqPopup.dialog("close");

      console.warn(`StayFocused notice: ${y3sf.kmiss} required but missing field value(s) reported.`);

      return true; // rendered in the DOM, initialized and closed
   }

   return false; // rendered in the DOM but not initialized (yet)
}

/**
 * Detect and close the 'required fields' dialog, or die trying
 * 
 * @param {*} maxInterval 
 * @returns 
 */
y3sf.closeTheRequiredFieldsDialog = function( maxInterval ) {

   maxInterval = maxInterval || 200;

   return new Promise(function(resolve, reject) {

      let attempts = 0;
      const interval = 10; // 10ms
      const maxAttempts = parseInt(maxInterval / interval);

      /**
       * this process must be delayed to accommodate n initial 10ms delay in setting the focus on the first field
       * ( DataEntry.js approx line 50 )
       */
      setTimeout(function() {
  
         const intervalId = setInterval(function() {

            attempts++;
            try {
               if (y3sf.closeReqPopup()) {
      
                  clearInterval(intervalId);

                  resolve(true);
               } else if (attempts >= maxAttempts) {
      
                  clearInterval(intervalId);
                  resolve(false);
               }
            } catch (error) {

               clearInterval(intervalId);
               reject(error);
            }
          }, interval); 
      }, 50); 
   });
}

y3sf.reportStatus = function() {

   if ( Y3SF_SETTING_HIDESTATUS ) return;

   const $editMsg = $('[data-rc-lang=data_entry_507]').eq(0);

   if ( !$editMsg.length ) return;

   $editMsg.append(`<br /><span id='y3sf-stayfocused-status' class='y3sf-report-item'><i class="fas fa-microscope"></i>&nbsp;Stay focused! is active.</span>`);
}

y3sf.reportMissingFields = function() {

   if ( !y3sf.kmiss ) return;

   const $statusMsg = $('#y3sf-stayfocused-status');

   if ( !$statusMsg.length ) return;

   $statusMsg.after(`<span id='y3sf-stayfocused-kmiss' class='y3sf-report-item'>${y3sf.kmiss} required but missing field value(s) reported.</span>`);
}

/**
 * SCROLL TO AND MARK THE LAST FIELD
 */
y3sf.getFocused = function() {

   /**
    * We know the cookie was saved. We also need to know if any data were entered prior to Save&Stay.
    */
   const dataEntry = ( y3sf.lastElement && y3sf.lastElement.elementType && y3sf.lastElement.attribute && y3sf.lastElement.elementKey );

   // scroll to where we left off
   window.scrollTo({behavior: 'instant', top: y3sf.lastElement.scrollY, 'left': 0});

   // return if no data entry detected
   if ( !dataEntry ) {
      
      y3sf.destroyLastElementCookie();
      return;
   }

   const $lastElement = $(`${y3sf.lastElement.elementType}[${y3sf.lastElement.attribute}="${y3sf.lastElement.elementKey}"]`);

   // something's awry
   if ( !$lastElement.length ) {

      console.error('StayFocused: could not find last element:', y3sf.lastElement);
      y3sf.destroyLastElementCookie();
      return;
   }

   // a slider container is a table, not a td
   const $lastElementContainer = ( $lastElement.hasClass('slider') ) ? $lastElement.closest('table') : $lastElement.closest('td');

   let lastElementTitle = "StayFocused: This is where you left off.";

   // the background color of the 'Save & Stay' button is used for the border color of the last element container
   const submitButtonColor = $(`#${y3sf.SAVESTAYBUTTONID}`).css('background-color');

   $lastElementContainer
      .prop('title', lastElementTitle)
      .css({
      'border-right': `5px solid ${submitButtonColor}`,
      'border-bottom': `5px solid ${submitButtonColor}`
   });

   /**
    * It is possible for the 'scrollY' property to set to the location of the 'Save&Submit' button, not the field.
    * This happens when the user exits a text field by scrolling to and clicking one of the 'Save&Submit' buttons, 
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

   if ( y3sf.lastElement ) { // it did! yay!

      /** 
       * Watch out for and whack the 'required fields' dialog. 
       * In order to ensure a clean removal of the dialog, we need to wait for it to be fully initialized, at which point the
       * element.dialog('close') method will be called.
       * If the dialog DOM element is not rendered, the promise will resolve immediately.
       * If the dialog DOM element is rendered but not yet initialized as a jQuery dialog, the promise will keep trying and resolve after 3 seconds.
       * This very long latency seems to be required for the dialog to be fully initialized on a small-screen device.
       */
      y3sf.closeTheRequiredFieldsDialog( 3000 )
         .then( function( result ) {

            if ( !result ) console.error("StayFocused error: timeout reached before the 'required fields' dialog could be detected and closed.");
         })
         .catch( function( error ) {

            console.error('StayFocused error:', error);
         })
         .finally( function() {

            y3sf.reportStatus();
            y3sf.reportMissingFields();
            y3sf.getFocused();
         });
   }
   else {

      // report the status of StayFocused! after a 50ms delay
      setTimeout( y3sf.reportStatus, 50 );
   }
});

