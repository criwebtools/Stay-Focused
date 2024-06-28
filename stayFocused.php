<?php

namespace Yale\stayFocused;

class StayFocused extends \ExternalModules\AbstractExternalModule {

   public function redcap_data_entry_form($project_id, $record, $instrument, $event_id, $group_id, $repeat_instance = 1) {

      ?><script src="<?= $this->getUrl('js/stayFocused.js') ?>"></script><?php
   }
}
