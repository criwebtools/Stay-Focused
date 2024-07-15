<?php

namespace Yale\StayFocused;

class StayFocused extends \ExternalModules\AbstractExternalModule {

   public function redcap_data_entry_form($project_id, $record, $instrument, $event_id, $group_id, $repeat_instance = 1) {

      ?>
      <style>
         .y3sf-report-item {
            font-size: 0.9em;
            font-weight: 600;
            opacity: 0.6;
            margin-right: 5px;
            color: inherit;
            text-wrap: nowrap;
         }
      </style>

      <script>

         const Y3SF_SETTING_HIDESTATUS =  <?= $this->getProjectSetting('y3sf-hide-status-message') ? 'true' : 'false' ?>;

      </script>

      <script src="<?= $this->getUrl('js/stayFocused.js') ?>"></script>

      <?php
   }
}
