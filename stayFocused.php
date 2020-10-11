<?php

namespace Yale\stayFocused;

class stayFocused extends \ExternalModules\AbstractExternalModule {

   function redcap_data_entry_form($project_id, $record, $instrument, $event_id, $group_id, $repeat_instance = 1) {

      ?><script src="<?= $this->getUrl('js/stayFocused.js') ?>"></script><?php

   } // redcap_data_entry_form

} // class